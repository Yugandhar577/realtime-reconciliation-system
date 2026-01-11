// Kafka config

const brokers = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'];
const clientId = 'reconciliation-engine';
const groupId = 'reconciler-group';

const topics = {
  coreTransactions: 'corebank.transactions',
  gatewayTransactions: 'gateway.transactions',
  reconciliationAlerts: 'reconciliation-alerts'
};

module.exports = {
  brokers,
  clientId,
  groupId,
  topics
};