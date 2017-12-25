/*
 CollectorHandler.js simulates a small CollectorHandler generating telemetry.
*/
const Log = require('timestamp-log');
const log = new Log(process.env.LOG_LEVEL);
const database = require('./connectors/mysql');
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
    if (process.env.MESSAGE_SERVICE_ENABLED === 'YES' && object) {
        log.debug('paymentRequest:', object);
        paymentProvider.sendPaymentRequest(object.ex_trace, object.bank_code, object.total_amount,  function (err, response) {
            if (!err) {
                var inStatusId = response.return_code == 'SUCCESS' ? 3 : 4;
                database.updatePaymentLog(object.in_trace, inStatusId, '', {});

                callback(null, {
                    in_status_id: inStatusId,
                    url: response.redirect_url,
                    trace: object.in_trace
                });

                log.debug('sendPaymentRequest:', response);
            } else {
                database.updatePaymentLog(object.in_trace, 4, '', {});

                callback({
                    code: 'error-create-payment-log',
                    message: err.message.toString()
                });

                log.debug('sendPaymentRequest:', err);
            }
        });
    } else {
        database.updatePaymentLog(object.reference_id, 3, {});
        log.debug('sendPaymentRequest:', response);
    }
};

CollectorHandler.prototype.sendPaymentResultToServiceProvider = function (object, callback) {
    if (process.env.MESSAGE_SERVICE_ENABLED === 'YES' && object) {
        log.debug('checksumRequest:', object);
        paymentProvider.checksum(object, function (err, response) {
            if (!err) {
                var inStatusId = response.return_code == 'SUCCESS' ? 1 : (response.return_code == 'PENDING' ? 3 : (response.return_code == 'REJECT' ? 5 : 4));
                var transactionId = response.transaction_id;

                delete response['return_code'];
                delete response['transaction_id'];

                database.updatePaymentLog(transactionId, inStatusId, JSON.stringify(response), {});

                callback(null, {
                    in_status_id: inStatusId,
                    ex_trace: transactionId
                });

                log.debug('sendPaymentRequest:', response);
            } else {
                database.updatePaymentLog(object.in_trace, 4, '', {});

                callback({
                    code: 'error-create-payment-log',
                    message: err.message.toString()
                });

                log.debug('sendPaymentRequest:', err);
            }
        });
    } else {
        database.updatePaymentLog(object.reference_id, 3, {});

        log.debug('sendPaymentRequest:', response);
    }
};

module.exports = function () {
    return new CollectorHandler();
};