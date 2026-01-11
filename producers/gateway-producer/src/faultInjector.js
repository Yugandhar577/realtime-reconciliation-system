// Deterministic fault injector for gateway and corebank producers
function injectFault(baseTransaction = {}, eventPayload = {}, producerType) {
	const cfg = (baseTransaction.faultConfig) || { enabled: false, type: 'NONE', target: null };
	if (!cfg.enabled) return eventPayload;
	if (cfg.target !== producerType) return eventPayload;

	const type = (cfg.type || 'NONE').toUpperCase();

	switch (type) {
		case 'GATEWAY_TIMEOUT':
			if (producerType === 'GATEWAY') {
				eventPayload.status = 'TIMEOUT';
				eventPayload.failureReason = eventPayload.failureReason || null;
			}
			break;

		case 'CBS_FAILURE':
			if (producerType === 'CBS') {
				eventPayload.status = 'FAILED';
				eventPayload.failureReason = 'INSUFFICIENT_FUNDS';
			}
			break;

		case 'AMOUNT_MISMATCH':
			if (producerType === 'GATEWAY') {
				const original = Number(eventPayload.amount || 0);
				const modified = Math.round((original * 1.01) * 100) / 100;
				eventPayload.amount = modified;
			}
			break;

		case 'NONE':
		default:
			break;
	}

	return eventPayload;
}

module.exports = { injectFault };