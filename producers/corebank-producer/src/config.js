// Kafka + topic configuration for corebank producer
module.exports = {
	kafka: {
		clientId: process.env.KAFKA_CLIENT_ID || 'corebank-producer',
		brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
	},
	topic: process.env.COREBANK_TOPIC || 'corebank.transactions',
};