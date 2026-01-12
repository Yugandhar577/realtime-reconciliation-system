// Kafka producer for alerts

const { Kafka } = require('kafkajs');
const { brokers, clientId, topics } = require('../config/kafka');

class KafkaProducer {
  constructor() {
    this.kafka = new Kafka({ brokers, clientId });
    this.producer = this.kafka.producer();
    this.connected = false;
  }

  async connect() {
    if (this.connected) return;

    try {
      await this.producer.connect();
      this.connected = true;
      console.log('Kafka producer connected');
    } catch (error) {
      console.error('Error connecting Kafka producer:', error);
      throw error;
    }
  }

  async publishAlert(reconResult) {
    if (!this.connected) {
      await this.connect();
    }

    try {
      await this.producer.send({
        topic: topics.reconciliationAlerts,
        messages: [{
          key: reconResult.transactionId,
          value: JSON.stringify(reconResult)
        }]
      });

      console.log(`Alert published for transaction ${reconResult.transactionId}`);
    } catch (error) {
      console.error('Error publishing alert:', error);
      // Retry logic could be added here
    }
  }

  async disconnect() {
    if (this.connected) {
      await this.producer.disconnect();
      this.connected = false;
      console.log('Kafka producer disconnected');
    }
  }
}

module.exports = KafkaProducer;