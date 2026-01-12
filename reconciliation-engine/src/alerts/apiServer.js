// REST API server for frontend

const express = require('express');

class ApiServer {
  constructor(reconciler, stateStore, port = 3001) {
    console.log('ApiServer constructor called with port:', port);
    this.reconciler = reconciler;
    this.stateStore = stateStore;
    this.port = port;
    this.app = express();
    this.server = null;
    this.faultConfig = { enabled: false, type: 'NONE', target: null };

    this.setupRoutes();
  }

  setupRoutes() {
    this.app.use(express.json());

    // CORS middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Health check endpoint for Docker
    this.app.get('/api/health', (req, res) => {
      res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'reconciliation-engine'
      });
    });

    // Get recent transactions
    this.app.get('/api/transactions/recent', (req, res) => {
      try {
        const limit = parseInt(req.query.limit) || 50;
        const transactions = this.stateStore.getRecentTransactions(limit);

        const summaries = transactions.map(tx => ({
          id: tx.transactionId,
          transactionId: tx.transactionId,
          status: tx.status,
          severity: tx.severity || 'LOW',
          summary: tx.summary || `Transaction ${tx.transactionId}`,
          createdAt: tx.createdAt || new Date().toISOString(),
          anomalies: tx.anomalies || [],
          timeline: tx.timeline || {
            firstSeenAt: tx.firstSeenAt || new Date().toISOString(),
            lastUpdatedAt: tx.lastUpdatedAt || new Date().toISOString()
          }
        }));

        res.json(summaries);
      } catch (error) {
        console.error('Error getting recent transactions:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Get transaction stats
    this.app.get('/api/transactions/stats', (req, res) => {
      try {
        const stats = this.stateStore.getStats();

        res.json({
          total: stats.total || 0,
          matched: stats.matched || 0,
          mismatched: stats.mismatched || 0,
          missing: stats.missing || 0,
          bySeverity: stats.bySeverity || {},
          recentActivity: stats.recentActivity || []
        });
      } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
    // Fault injection endpoints
    this.app.post('/api/faults/inject', (req, res) => {
      try {
        const { type, target, duration = 30000 } = req.body; // duration in ms, default 30s

        if (!type || !target) {
          return res.status(400).json({ error: 'Missing type or target parameter' });
        }

        // Store fault configuration (in a real system, this would be persisted)
        this.faultConfig = {
          type: type.toUpperCase(),
          target: target.toUpperCase(),
          enabled: true,
          expiresAt: Date.now() + duration
        };

        console.log(`Fault injection activated: ${type} on ${target} for ${duration}ms`);

        res.json({
          success: true,
          message: `Fault ${type} injected on ${target}`,
          config: this.faultConfig
        });
      } catch (error) {
        console.error('Error injecting fault:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    this.app.post('/api/faults/clear', (req, res) => {
      try {
        this.faultConfig = { enabled: false, type: 'NONE', target: null };
        console.log('All faults cleared');
        res.json({ success: true, message: 'All faults cleared' });
      } catch (error) {
        console.error('Error clearing faults:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    this.app.get('/api/faults/status', (req, res) => {
      try {
        const activeFaults = this.faultConfig && this.faultConfig.enabled ? [this.faultConfig] : [];
        res.json({ activeFaults });
      } catch (error) {
        console.error('Error getting fault status:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Analytics endpoints
    // this.app.get('/api/test', (req, res) => {
    //   console.log('Test route called');
    //   res.json({ message: 'Test endpoint working' });
    // });

    this.app.get('/api/analytics/mismatches', (req, res) => {
      try {
        const stats = this.stateStore.getStats();
        const recentActivity = stats.recentActivity || [];

        // Convert to chart format
        const chartData = recentActivity.map(item => ({
          time: new Date(item.timestamp).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
          }),
          count: item.count
        }));

        res.json(chartData);
      } catch (error) {
        console.error('Error getting mismatch analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    this.app.get('/api/analytics/anomalies', (req, res) => {
      try {
        const stats = this.stateStore.getStats();

        const anomalyData = [
          { name: "Missing", value: stats.missing || 0 },
          { name: "Amount Mismatch", value: stats.mismatched || 0 },
          { name: "Matched", value: stats.matched || 0 },
        ];

        res.json(anomalyData);
      } catch (error) {
        console.error('Error getting anomaly analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    this.app.get('/api/analytics/latency', (req, res) => {
      try {
        // Mock latency distribution for now - in a real system this would be measured
        const latencyDistribution = [
          { range: "0-25ms", count: Math.floor(Math.random() * 50) + 200 },
          { range: "25-50ms", count: Math.floor(Math.random() * 50) + 150 },
          { range: "50-100ms", count: Math.floor(Math.random() * 50) + 100 },
          { range: "100-250ms", count: Math.floor(Math.random() * 50) + 50 },
          { range: "250-500ms", count: Math.floor(Math.random() * 20) + 20 },
          { range: "500ms+", count: Math.floor(Math.random() * 10) + 5 },
        ];

        res.json(latencyDistribution);
      } catch (error) {
        console.error('Error getting latency analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
    // Get transaction by ID
    this.app.get('/api/transactions/:id', (req, res) => {
      try {
        const transaction = this.stateStore.getTransaction(req.params.id);
        if (!transaction) {
          return res.status(404).json({ error: 'Transaction not found' });
        }

        const summary = {
          id: transaction.transactionId,
          transactionId: transaction.transactionId,
          status: transaction.status,
          severity: transaction.severity || 'LOW',
          summary: transaction.summary || `Transaction ${transaction.transactionId}`,
          createdAt: transaction.createdAt || new Date().toISOString(),
          anomalies: transaction.anomalies || [],
          timeline: transaction.timeline || {
            firstSeenAt: transaction.firstSeenAt || new Date().toISOString(),
            lastUpdatedAt: transaction.lastUpdatedAt || new Date().toISOString()
          }
        };

        res.json(summary);
      } catch (error) {
        console.error('Error getting transaction:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Get system metrics
    this.app.get('/api/metrics', (req, res) => {
      try {
        const metrics = this.stateStore.getMetrics();

        const systemMetrics = {
          totalTransactions: metrics.totalTransactions || 0,
          matchedTransactions: metrics.matchedTransactions || 0,
          mismatchedTransactions: metrics.mismatchedTransactions || 0,
          missingTransactions: metrics.missingTransactions || 0,
          averageLatency: metrics.averageLatency || 0,
          systemHealth: metrics.systemHealth || 'healthy'
        };

        res.json(systemMetrics);
      } catch (error) {
        console.error('Error getting metrics:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Search transactions
    this.app.get('/api/transactions/search', (req, res) => {
      try {
        const { status, severity, startDate, endDate, limit = 50 } = req.query;
        const results = this.stateStore.searchTransactions({
          status,
          severity,
          startDate,
          endDate,
          limit: parseInt(limit)
        });

        const summaries = results.map(tx => ({
          id: tx.transactionId,
          transactionId: tx.transactionId,
          status: tx.status,
          severity: tx.severity || 'LOW',
          summary: tx.summary || `Transaction ${tx.transactionId}`,
          createdAt: tx.createdAt || new Date().toISOString(),
          anomalies: tx.anomalies || [],
          timeline: tx.timeline || {
            firstSeenAt: tx.firstSeenAt || new Date().toISOString(),
            lastUpdatedAt: tx.lastUpdatedAt || new Date().toISOString()
          }
        }));

        res.json(summaries);
      } catch (error) {
        console.error('Error searching transactions:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

  }

  start() {
    this.server = this.app.listen(this.port, () => {
      console.log(`API server started on port ${this.port}`);
    });
  }
}

module.exports = ApiServer;