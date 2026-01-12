// Main reconciliation engine

const StateStore = require('./stateStore');
const Classifier = require('./classifier');

class Reconciler {
  constructor(stateStore, classifier, kafkaProducer, websocketEmitter) {
    this.stateStore = stateStore;
    this.classifier = classifier;
    this.kafkaProducer = kafkaProducer;
    this.websocketEmitter = websocketEmitter;
  }

  handleEvent(event) {
    const { transactionId, eventId, source } = event;

    // Idempotency check
    if (this.stateStore.isEventProcessed(eventId)) {
      console.log(`Duplicate event ignored: ${eventId}`);
      return;
    }

    this.stateStore.markEventProcessed(eventId);

    // Get or create entry
    let entry = this.stateStore.get(transactionId);
    if (!entry) {
      entry = this.stateStore.upsert(transactionId, {});
    }

    // Update entry
    entry = this.mergeEvent(entry, event);
    this.stateStore.set(transactionId, entry);

    // Check if we can finalize
    const derivedState = this.stateStore.getDerivedState(transactionId);
    const shouldFinalize = this.shouldFinalize(derivedState);

    if (shouldFinalize) {
      const classification = this.classifier.evaluate(entry);
      this.finalize(entry, classification);
    }
  }

  mergeEvent(entry, event) {
    const updated = { ...entry };

    if (event.source === 'CBS') {
      updated.cbsEvent = event;
    } else if (event.source === 'GATEWAY') {
      updated.gatewayEvent = event;
    }

    updated.seenEventIds.add(event.eventId);
    updated.seenSources.add(event.source);
    updated.lastUpdatedAt = Date.now();

    return updated;
  }

  shouldFinalize(derivedState) {
    // Finalize if both sides are present
    if (derivedState.hasCBS && derivedState.hasGateway) {
      return true;
    }

    // Or if timeout has been reached (handled by timeoutScanner)
    return false;
  }

  finalize(entry, classification) {
    const result = this.buildResult(entry, classification);

    // Emit to Kafka
    this.kafkaProducer.publishAlert(result);

    // Emit to WebSocket
    this.websocketEmitter.emitEvent(result);

    // Clean up entry
    this.stateStore.delete(entry.transactionId || entry.txId);
  }

  buildResult(entry, classification) {
    const timeline = this.buildTimeline(entry);

    return {
      transactionId: entry.transactionId || entry.txId,
      classification: classification.status,
      severity: classification.severity,
      summary: `Transaction ${classification.status} with anomalies: ${classification.anomalies.join(', ')}`,
      cbsEventId: entry.cbsEvent?.eventId,
      gatewayEventId: entry.gatewayEvent?.eventId,
      timeline,
      createdAt: new Date().toISOString(),
      anomalies: classification.anomalies,
      recommendedAction: classification.recommendedAction
    };
  }

  buildTimeline(entry) {
    const timeline = {};

    if (entry.cbsEvent) {
      timeline.processedAt = entry.cbsEvent.processedAt;
    }

    if (entry.gatewayEvent) {
      timeline.receivedAt = entry.gatewayEvent.receivedAt;
      timeline.respondedAt = entry.gatewayEvent.respondedAt;
    }

    timeline.firstSeenAt = new Date(entry.firstSeenAt).toISOString();
    timeline.lastUpdatedAt = new Date(entry.lastUpdatedAt).toISOString();

    return timeline;
  }
}

module.exports = Reconciler;