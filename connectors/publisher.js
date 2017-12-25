'use strict';
const Log = require('timestamp-log');
const log = new Log(process.env.LOG_LEVEL);
const database = require('./mysql');
const CollectorHandler = require('../collector-handler');

module.exports = {
    sendPaymenRequest: function (bank_code, total_amount, callback) {
        database.createPaymentLog(bank_code, total_amount, function (err, result) {
            if (!err) {
                var payLoad = [{
                    topic: process.env.KAFKA_MESSAGES_TOPIC,
                    messages: JSON.stringify({
                        trace: result.in_trace,
                        in_status_id: result.in_status_id,
                        amount: result.amount
                    })
                }];

                log.debug('PaymentServiceCollector:', 'STARTED!', result.in_trace);
                var collectorHandler = new CollectorHandler();
                collectorHandler.sendPaymentRequestToServiceProvider({
                    ex_trace: result.ex_trace,
                    in_trace: result.in_trace,
                    bank_code: result.bank_code,
                    total_amount: result.amount
                }, function (err, requestResult) {
                    if (!err) {
                        callback(null, requestResult);

                        log.debug(requestResult);
                    } else {
                        callback({
                            code: 'error-send-payment-request',
                            message: err.message.toString()
                        });
                    }
                });
            } else {
                callback({
                    code: 'error-create-payment-log',
                    message: err.message.toString()
                });
            }
        });
    },

    receivePaymentResult: function (params, callback) {
        log.debug('PaymentServiceCollector:', 'STARTED!');
        var collectorHandler = new CollectorHandler();

        collectorHandler.sendPaymentResultToServiceProvider(params, function (err, data) {
            if (err) {
                callback({
                    code: 'error-checksum-request',
                    message: err.message.toString()
                });
            } else {
                callback(null, data);

                log.debug(data);
            }
        });
    }
};