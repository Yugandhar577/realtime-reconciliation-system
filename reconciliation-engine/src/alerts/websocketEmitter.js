// WebSocket emitter for UI live updates

const WebSocket = require('ws');

class WebSocketEmitter {
  constructor(port = 8080) {
    this.port = port;
    this.wss = null;
    this.clients = new Set();
  }

  start() {
    this.wss = new WebSocket.Server({ port: this.port });

    this.wss.on('connection', (ws) => {
      console.log('WebSocket client connected');
      this.clients.add(ws);

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    console.log(`WebSocket server started on port ${this.port}`);

    // Optional: broadcast stats every 30 seconds
    setInterval(() => {
      this.broadcastStats();
    }, 30000);
  }

  emitEvent(reconResult) {
    if (!this.wss) return;

    // For compatibility with older clients, emit as { type, data }
    const wrapped = { type: 'reconciliation-event', data: reconResult };
    const message = JSON.stringify(wrapped);
    // Also log the emitted payload shape for frontend debugging
    try {
      console.log('Emitting reconciliation-event via WebSocket:', JSON.stringify(reconResult));
    } catch (e) {
      console.log('Emitting reconciliation-event (unable to stringify reconResult)');
    }

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  broadcastStats() {
    // This could be enhanced to send actual stats
    const stats = {
      type: 'stats',
      data: {
        activeConnections: this.clients.size,
        timestamp: new Date().toISOString()
      }
    };

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(stats));
      }
    });
  }

  stop() {
    if (this.wss) {
      this.wss.close();
      console.log('WebSocket server stopped');
    }
  }
}

module.exports = WebSocketEmitter;