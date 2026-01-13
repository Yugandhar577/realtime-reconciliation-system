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
      this.finalize(transactionId, entry, classification);
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

  finalize(transactionId, entry, classification) {
    const result = this.buildResult(transactionId, entry, classification);

    // Store completed transaction for API access
    this.stateStore.addCompletedTransaction(result);

    // Emit to Kafka
    this.kafkaProducer.publishAlert(result);

    // Emit to WebSocket
    this.websocketEmitter.emitEvent(result);

    // Clean up entry
    this.stateStore.delete(transactionId);
  }

  buildResult(transactionId, entry, classification) {
    const timeline = this.buildTimeline(entry);

    return {
      transactionId: transactionId,
      // Keep `classification` for backwards compatibility (used by WebSocket events),
      // and also expose `status` which the API and frontend expect.
      classification: classification.status,
      status: classification.status,
      severity: classification.severity,
      summary: `Transaction ${classification.status} with anomalies: ${classification.anomalies.join(', ')}`,
      cbsEventId: entry.cbsEvent?.eventId,
      gatewayEventId: entry.gatewayEvent?.eventId,
      timeline,
      createdAt: new Date().toISOString(),
      anomalies: classification.anomalies,
      recommendedAction: classification.recommendedAction,
      // Enrich result with account/event level details useful for reporting
      amountCBS: entry.cbsEvent?.amount ?? null,
      amountGateway: entry.gatewayEvent?.amount ?? null,
      currency: entry.cbsEvent?.currency || entry.gatewayEvent?.currency || null,
      cbsStatus: entry.cbsEvent?.status || null,
      gatewayStatus: entry.gatewayEvent?.status || null,
      // timeDeltaMs: difference between CBS processedAt and Gateway respondedAt if available
      timeDeltaMs: (() => {
        try {
          const a = timeline.processedAt ? Date.parse(timeline.processedAt) : null;
          const b = timeline.respondedAt ? Date.parse(timeline.respondedAt) : null;
          if (a && b && !isNaN(a) && !isNaN(b)) return Math.abs(a - b);
        } catch (e) {
          return null;
        }
        return null;
      })()
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

    // Safely convert timestamps to ISO strings
    const firstSeenDate = new Date(entry.firstSeenAt);
    timeline.firstSeenAt = isNaN(firstSeenDate.getTime()) ? new Date().toISOString() : firstSeenDate.toISOString();

    const lastUpdatedDate = new Date(entry.lastUpdatedAt);
    timeline.lastUpdatedAt = isNaN(lastUpdatedDate.getTime()) ? new Date().toISOString() : lastUpdatedDate.toISOString();

    return timeline;
  }
}

module.exports = Reconciler;