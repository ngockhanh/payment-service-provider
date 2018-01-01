/*
 CollectorHandler.js simulates a small CollectorHandler generating telemetry.
*/
const Log = require('timestamp-log');
const log = new Log(process.env.LOG_LEVEL);
const database = require('./connectors/cassandra');
const paymentProvider = require('./providers/' + process.env.PAYMENT_SERVICE_PROVIDER.toLowerCase());

function CollectorHandler() {
    this.listeners = [];
    this.consumer = {
        commit: function (callback) {
            callback(null, {});
        }
    };
}

/**
 * Takes a measurement of CollectorHandler state, stores in history, and notifies listeners.
 */
CollectorHandler.prototype.sendPaymentRequestToServiceProvider = function (object, callback) {
    if (process.env.PAYMENT_SERVICE_ENABLED === 'YES' && object) {
        paymentProvider.createPayment(object.reference_id, object.bank_code, object.total_amount, callback);
    } else {
        database.updatePayment(object.reference_id, object.request_id, 'FAIL', object.request_id, process.env.PAYMENT_SERVICE_PROVIDER + ' service is disabled');
    }
};

CollectorHandler.prototype.sendPaymentResultToServiceProvider = function (object, callback) {
    paymentProvider.checkSum(object, callback);
};

module.exports = function () {
    return new CollectorHandler();
};