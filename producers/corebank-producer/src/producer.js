const { Kafka } = require('kafkajs');
const config = require('./config');
const { injectFault } = require('./faultInjector');

const kafka = new Kafka(config.kafka);
const producer = kafka.producer();

function buildCorebankEvent(baseTransaction) {
	const tx = baseTransaction || {};
	const txId = tx.transactionId;
	const amount = Number(tx.amount || 0);
	const currency = tx.currency || 'INR';

	const balanceBefore = typeof tx.balanceBefore === 'number' ? tx.balanceBefore : 100000.0;
	// default processed values
	const status = 'SUCCESS';
	const failureReason = null;

	const event = {
		eventId: `CBS_EVT_${Date.now()}`,
		transactionId: txId,
		source: 'CBS',
		eventType: tx.eventType || 'DEBIT',
		senderAccountId: tx.sender && (tx.sender.accountId || tx.senderAccountId),
		receiverAccountId: tx.receiver && (tx.receiver.accountId || tx.receiverAccountId),
		amount,
		currency,
		status,
		failureReason,
		ledgerRef: `LEDGER_${txId}`,
		balanceBefore,
		balanceAfter: Math.round((balanceBefore - amount) * 100) / 100,
		processedAt: new Date().toISOString(),
	};

	return event;
}

async function produceTransaction(baseTransaction) {
	const event = buildCorebankEvent(baseTransaction);

	// Apply deterministic CBS faults
	const mutated = injectFault(baseTransaction, event, 'CBS');

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