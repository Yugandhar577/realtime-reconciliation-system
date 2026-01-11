// Kafka + topic configuration for gateway producer
module.exports = {
	kafka: {
		clientId: process.env.KAFKA_CLIENT_ID || 'gateway-producer',
		brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
	},
	topic: process.env.GATEWAY_TOPIC || 'gateway.transactions',
};