// Main index - Boot / Orchestrator

const StateStore = require('./reconciliation/stateStore');
const Classifier = require('./reconciliation/classifier');
const Reconciler = require('./reconciliation/reconciler');
const TimeoutScanner = require('./reconciliation/timeoutScanner');

const CoreConsumer = require('./consumers/coreConsumer');
const GatewayConsumer = require('./consumers/gatewayConsumer');

const KafkaProducer = require('./alerts/kafkaProducer');
const WebSocketEmitter = require('./alerts/websocketEmitter');
const ApiServer = require('./alerts/apiServer');

const SnapshotStore = require('./persistence/snapshotStore');

async function main() {
  console.log('Starting Reconciliation Engine...');

  // Initialize components
  const stateStore = new StateStore();
  const classifier = new Classifier();
  const kafkaProducer = new KafkaProducer();
  const websocketEmitter = new WebSocketEmitter();

  // Initialize reconciler with dependencies
  const reconciler = new Reconciler(stateStore, classifier, kafkaProducer, websocketEmitter);

  // Initialize API server
  const apiServer = new ApiServer(reconciler, stateStore);

  // Initialize consumers
  const coreConsumer = new CoreConsumer(reconciler);
  const gatewayConsumer = new GatewayConsumer(reconciler);

  // Initialize timeout scanner
  const timeoutScanner = new TimeoutScanner(stateStore, reconciler);

  // Initialize snapshot store
  const snapshotStore = new SnapshotStore(stateStore);

  // Load snapshot on startup
  await snapshotStore.loadSnapshot();

  // Connect producers and emitters
  await kafkaProducer.connect();
  websocketEmitter.start();
  apiServer.start();

  // Start periodic snapshot saving
  snapshotStore.startPeriodicSave();

  // Start consumers
  await coreConsumer.start();
  await gatewayConsumer.start();

  // Start timeout scanner
  timeoutScanner.start();

  console.log('Reconciliation Engine started successfully');

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down Reconciliation Engine...');

    // Stop scanner
    timeoutScanner.stop();

    // Stop consumers
    await coreConsumer.stop();
    await gatewayConsumer.stop();

    // Disconnect producers
    await kafkaProducer.disconnect();

    // Stop websocket
    websocketEmitter.stop();
    apiServer.stop();

    // Save final snapshot
    await snapshotStore.saveSnapshot();
    snapshotStore.stopPeriodicSave();

    console.log('Reconciliation Engine shut down gracefully');
    process.exit(0);
  };

  // Handle shutdown signals
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch((error) => {
  console.error('Failed to start Reconciliation Engine:', error);
  process.exit(1);
});