const { Kafka } = require('kafkajs');
const config = require('./config');
const { injectFault } = require('./faultInjector');

const kafka = new Kafka(config.kafka);
const producer = kafka.producer();

function buildGatewayEvent(baseTransaction) {
	const tx = baseTransaction || {};
	const txId = tx.transactionId;
	const amount = Number(tx.amount || 0);
	const currency = tx.currency || 'INR';

	const receivedAt = new Date().toISOString();
	const respondedAt = new Date(Date.now() + 200).toISOString();

	const event = {
		eventId: `GTW_EVT_${Date.now()}`,
		transactionId: txId,
		source: 'GATEWAY',
		eventType: tx.eventType || 'REQUEST_RECEIVED',
		senderBank: (tx.sender && (tx.sender.bankCode || tx.sender.bank)) || tx.senderBank,
		receiverBank: (tx.receiver && (tx.receiver.bankCode || tx.receiver.bank)) || tx.receiverBank,
		amount,
		currency,
		status: 'SUCCESS',
		failureReason: null,
		networkRef: `${(tx.paymentMethod || 'NET').toUpperCase()}_REF_${txId}`,
		retryCount: 0,
		receivedAt,
		respondedAt,
	};

	return event;
}

async function produceTransaction(baseTransaction) {
	const event = buildGatewayEvent(baseTransaction);

	// Apply deterministic gateway faults
	const mutated = injectFault(baseTransaction, event, 'GATEWAY');

	await producer.connect();
	await producer.send({
		topic: config.topic,
		messages: [
			{ key: mutated.transactionId, value: JSON.stringify(mutated) }
		]
	});

	await producer.disconnect();
	return mutated;
}

module.exports = { produceTransaction };