// CBS topic consumer

const { Kafka } = require('kafkajs');
const { brokers, clientId, groupId, topics } = require('../config/kafka');

class CoreConsumer {
  constructor(reconciler) {
    this.reconciler = reconciler;
    this.kafka = new Kafka({ brokers, clientId });
    this.consumer = this.kafka.consumer({ groupId });
  }

  async start() {
    try {
      await this.consumer.connect();
      await this.consumer.subscribe({ topic: topics.coreTransactions, fromBeginning: false });

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const event = JSON.parse(message.value.toString());

            // Basic validation
            if (!event.transactionId || !event.eventId || !event.processedAt) {
              console.error('Invalid CBS event:', event);
              return;
            }

            // Normalize data
            const normalizedEvent = {
              ...event,
              source: 'CBS'
            };

            // Handle event
            this.reconciler.handleEvent(normalizedEvent);

            // Commit offset
            await this.consumer.commitOffsets([{
              topic,
              partition,
              offset: (parseInt(message.offset) + 1).toString()
            }]);

          } catch (error) {
            console.error('Error processing CBS message:', error);
          }
        }
      });

      console.log('Core consumer started');
    } catch (error) {
      console.error('Error starting core consumer:', error);
      // Reconnect logic could be added here
    }
  }

  async stop() {
    await this.consumer.disconnect();
    console.log('Core consumer stopped');
  }
}

module.exports = CoreConsumer;