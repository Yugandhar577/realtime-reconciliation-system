#!/usr/bin/env node
/**
 * Deterministic base transaction generator.
 * Emits a new transaction at a fixed interval and sends the same baseTransaction
 * to both gateway and corebank producers in realtime.
 *
 * Usage: node scripts/txGenerator.js [--interval=1000] [--count=0]
 * --interval ms between messages (default 1000). --count 0 means run indefinitely.
 */

const path = require('path');

const gateway = require(path.join(__dirname, '..', 'producers', 'gateway-producer', 'src', 'producer'));
const cbs = require(path.join(__dirname, '..', 'producers', 'corebank-producer', 'src', 'producer'));

const argv = require('minimist')(process.argv.slice(2));
const intervalMs = Number(argv.interval || 1000);
const maxCount = Number(argv.count || 0);

const faultSequence = [
  { enabled: false, type: 'NONE', target: null },
  { enabled: true, type: 'AMOUNT_MISMATCH', target: 'GATEWAY' },
  { enabled: true, type: 'CBS_FAILURE', target: 'CBS' },
  { enabled: true, type: 'GATEWAY_TIMEOUT', target: 'GATEWAY' },
];

let seq = 1;

function buildBaseTransaction(seqIndex) {
  const txId = `TXN_${new Date().toISOString().slice(0,10).replace(/-/g,'')}_${String(seqIndex).padStart(6, '0')}`;
  const amount = 1000 + (seqIndex * 10);

  const paymentMethods = ['UPI', 'IMPS'];
  const banks = [
    { code: 'HDFC', name: 'HDFC Bank' },
    { code: 'ICICI', name: 'ICICI Bank' }
  ];

  // possible event types (mix of gateway and CBS stages)
  const eventTypes = ['REQUEST_RECEIVED', 'RESPONSE_SENT', 'DEBIT', 'REVERSAL', 'AUTHORIZATION'];
  const eventType = argv.eventType || eventTypes[Math.floor(Math.random() * eventTypes.length)];

  const pm = paymentMethods[(seqIndex - 1) % paymentMethods.length];
  const sBank = banks[0];
  const rBank = banks[1];

  const base = {
    transactionId: txId,
    paymentMethod: pm,
    eventType,
    amount,
    currency: 'INR',
    sender: { accountId: `ACC${String(seqIndex).padStart(5, '0')}`, bankCode: sBank.code, bank: sBank.name },
    receiver: { accountId: `ACC${String(seqIndex + 9000).padStart(5, '0')}`, bankCode: rBank.code, bank: rBank.name },
    initiatedAt: new Date().toISOString(),
    faultConfig: faultSequence[(seqIndex - 1) % faultSequence.length]
  };

  return base;
}

async function sendOne(baseTransaction) {
  try {
    // Send to both producers in parallel but keep them independent
    const [g, c] = await Promise.all([
      gateway.produceTransaction(baseTransaction),
      cbs.produceTransaction(baseTransaction)
    ]);

    console.log('Published tx:', baseTransaction.transactionId, 'gateway:', g.status, 'cbs:', c.status);
  } catch (err) {
    console.error('Error publishing transaction', baseTransaction.transactionId, err && err.message);
  }
}

async function run() {
  console.log(`Starting txGenerator interval=${intervalMs}ms count=${maxCount || 'infinite'}`);

  while (maxCount === 0 || seq <= maxCount) {
    const base = buildBaseTransaction(seq);
    await sendOne(base);
    seq += 1;
    // wait for interval
    await new Promise((res) => setTimeout(res, intervalMs));
  }

  console.log('txGenerator finished');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
