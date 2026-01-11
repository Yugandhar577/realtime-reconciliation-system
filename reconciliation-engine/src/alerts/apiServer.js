// REST API server for frontend

const express = require('express');

class ApiServer {
  constructor(reconciler, stateStore, port = 3001) {
    this.reconciler = reconciler;
    this.stateStore = stateStore;
    this.port = port;
    this.app = express();
    this.server = null;

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
  }

  start() {
    this.server = this.app.listen(this.port, () => {
      console.log(`API server started on port ${this.port}`);
    });
  }

  stop() {
    if (this.server) {
      this.server.close(() => {
        console.log('API server stopped');
      });
    }
  }
}

module.exports = ApiServer;