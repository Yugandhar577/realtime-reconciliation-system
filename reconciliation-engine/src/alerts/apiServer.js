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

  // Serialize a completed/pending transaction to the API response shape,
  // passing through all enriched fields the reconciler computes.
  toSummary(tx) {
    return {
      id: tx.transactionId,
      transactionId: tx.transactionId,
      status: tx.status || tx.classification || 'UNKNOWN',
      severity: tx.severity || 'LOW',
      summary: tx.summary || `Transaction ${tx.transactionId}`,
      createdAt: tx.createdAt || new Date().toISOString(),
      anomalies: tx.anomalies || [],
      timeline: tx.timeline || {
        firstSeenAt: tx.firstSeenAt || new Date().toISOString(),
        lastUpdatedAt: tx.lastUpdatedAt || new Date().toISOString()
      },
      amountCBS: tx.amountCBS ?? null,
      amountGateway: tx.amountGateway ?? null,
      currency: tx.currency ?? null,
      cbsStatus: tx.cbsStatus ?? null,
      gatewayStatus: tx.gatewayStatus ?? null,
      timeDeltaMs: tx.timeDeltaMs ?? null,
      recommendedAction: tx.recommendedAction || 'NONE',
    };
  }

  setupRoutes() {
    this.app.use(express.json());

    // CORS — restrict to configured origin in production, allow all in development
    const allowedOrigin = process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? null : '*');
    this.app.use((req, res, next) => {
      const origin = req.headers.origin;
      if (allowedOrigin === '*' || origin === allowedOrigin) {
        res.header('Access-Control-Allow-Origin', allowedOrigin === '*' ? '*' : origin);
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
      }
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
        res.json(transactions.map(tx => this.toSummary(tx)));
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
    const VALID_FAULT_TYPES = new Set(['GATEWAY_TIMEOUT', 'CBS_FAILURE', 'AMOUNT_MISMATCH', 'NONE']);
    const VALID_TARGETS = new Set(['CBS', 'GATEWAY']);

    this.app.post('/api/faults/inject', (req, res) => {
      try {
        const { type, target, duration = 30000 } = req.body;

        if (!type || !target) {
          return res.status(400).json({ error: 'Missing type or target parameter' });
        }
        if (!VALID_FAULT_TYPES.has(type.toUpperCase())) {
          return res.status(400).json({ error: `Invalid fault type. Allowed: ${[...VALID_FAULT_TYPES].join(', ')}` });
        }
        if (!VALID_TARGETS.has(target.toUpperCase())) {
          return res.status(400).json({ error: `Invalid target. Allowed: ${[...VALID_TARGETS].join(', ')}` });
        }
        const durationMs = Math.min(Math.max(parseInt(duration) || 30000, 1000), 300000); // clamp 1s–5min

        this.faultConfig = {
          type: type.toUpperCase(),
          target: target.toUpperCase(),
          enabled: true,
          expiresAt: Date.now() + durationMs
        };

        console.log(`Fault injection activated: ${type} on ${target} for ${durationMs}ms`);

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
        const buckets = [
          { range: '0-25ms',    min: 0,   max: 25   },
          { range: '25-50ms',   min: 25,  max: 50   },
          { range: '50-100ms',  min: 50,  max: 100  },
          { range: '100-250ms', min: 100, max: 250  },
          { range: '250-500ms', min: 250, max: 500  },
          { range: '500ms+',    min: 500, max: Infinity },
        ].map(b => ({ range: b.range, count: 0, min: b.min, max: b.max }));

        for (const tx of this.stateStore.completedTransactions) {
          if (tx.timeDeltaMs == null || isNaN(tx.timeDeltaMs)) continue;
          const bucket = buckets.find(b => tx.timeDeltaMs >= b.min && tx.timeDeltaMs < b.max);
          if (bucket) bucket.count++;
        }

        res.json(buckets.map(({ range, count }) => ({ range, count })));
      } catch (error) {
        console.error('Error getting latency analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Download CSV report of recent transactions
    this.app.get('/api/transactions/report', (req, res) => {
      try {
        const limit = parseInt(req.query.limit) || 500;
        const transactions = this.stateStore.getRecentTransactions(limit);

        // CSV header
        const columns = [
          'transactionId',
          'status',
          'classification',
          'anomalies',
          'severity',
          'amountCBS',
          'amountGateway',
          'currency',
          'cbsStatus',
          'gatewayStatus',
          'timeDeltaMs',
          'createdAt'
        ];

        const escape = (val) => {
          if (val === null || val === undefined) return '';
          let s = String(val);
          // Prefix formula-triggering characters to prevent CSV injection in Excel/Sheets
          if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
          return '"' + s.replace(/"/g, '""') + '"';
        };

        const lines = [columns.join(',')];

        for (const tx of transactions) {
          const anomalies = Array.isArray(tx.anomalies) ? tx.anomalies.join('|') : (tx.anomalies || '');
          const row = [
            escape(tx.transactionId),
            escape(tx.status || tx.classification || ''),
            escape(tx.classification || tx.status || ''),
            escape(anomalies),
            escape(tx.severity || ''),
            escape(tx.amountCBS ?? ''),
            escape(tx.amountGateway ?? ''),
            escape(tx.currency ?? ''),
            escape(tx.cbsStatus ?? ''),
            escape(tx.gatewayStatus ?? ''),
            escape(tx.timeDeltaMs ?? ''),
            escape(tx.createdAt || '')
          ];

          lines.push(row.join(','));
        }

        const csv = lines.join('\n');

        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const filename = `reconciliation_report_${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}.csv`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
      } catch (error) {
        console.error('Error generating transactions report:', error);
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
        res.json(this.toSummary(transaction));
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

        const summaries = results.map(tx => this.toSummary(tx));

        res.json(summaries);
      } catch (error) {
        console.error('Error searching transactions:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // (report route moved earlier to avoid conflict with '/api/transactions/:id')

  }

  start() {
    this.server = this.app.listen(this.port, () => {
      console.log(`API server started on port ${this.port}`);
    });
  }
}

module.exports = ApiServer;