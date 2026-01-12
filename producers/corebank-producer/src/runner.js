#!/usr/bin/env node
/**
 * Continuous transaction generator for corebank producer
 * This script runs indefinitely, generating transactions at regular intervals
 */

const { produceTransaction } = require('./producer');

const INTERVAL_MS = parseInt(process.env.TRANSACTION_INTERVAL || '2000');
let sequenceNumber = 1;

function generateTransaction() {
    const txId = `TXN_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${String(sequenceNumber).padStart(6, '0')}`;
    const amount = 1000 + (sequenceNumber * 10);

    const faultTypes = [
        { enabled: false, type: 'NONE', target: null },
        { enabled: true, type: 'AMOUNT_MISMATCH', target: 'GATEWAY' },
        { enabled: true, type: 'CBS_FAILURE', target: 'CBS' },
        { enabled: true, type: 'GATEWAY_TIMEOUT', target: 'GATEWAY' },
    ];

    const transaction = {
        transactionId: txId,
        paymentMethod: sequenceNumber % 2 === 0 ? 'UPI' : 'IMPS',
        eventType: 'DEBIT',
        amount,
        currency: 'INR',
        sender: {
            accountId: `ACC${String(sequenceNumber).padStart(5, '0')}`,
            bankCode: 'HDFC',
            bank: 'HDFC Bank'
        },
        receiver: {
            accountId: `ACC${String(sequenceNumber + 9000).padStart(5, '0')}`,
            bankCode: 'ICICI',
            bank: 'ICICI Bank'
        },
        initiatedAt: new Date().toISOString(),
        faultConfig: faultTypes[(sequenceNumber - 1) % faultTypes.length]
    };

    return transaction;
}

async function run() {
    console.log(`Corebank Producer starting... (interval: ${INTERVAL_MS}ms)`);

    while (true) {
        try {
            const transaction = generateTransaction();
            const result = await produceTransaction(transaction);
            console.log(`✓ Published transaction ${transaction.transactionId} - Status: ${result.status}`);
            sequenceNumber++;
        } catch (error) {
            console.error(`✗ Error publishing transaction:`, error.message);
        }

        // Wait for the specified interval
        await new Promise(resolve => setTimeout(resolve, INTERVAL_MS));
    }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

// Start the continuous generator
run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
