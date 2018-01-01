'use strict';
const Log = require('timestamp-log');
const log = new Log(process.env.LOG_LEVEL);
const database = require('./cassandra');
const queryStr = require('qs');
const CollectorHandler = require('../collector-handler');

module.exports = {
    sendPaymentRequest: function (requestId, bankCode, totalAmount, redirectUrl, callback) {
        database.createPayment(requestId, 'INIT', bankCode, totalAmount, redirectUrl, function (err, result) {
            var collectorHandler = new CollectorHandler();
            collectorHandler.sendPaymentRequestToServiceProvider({
                request_id: requestId,
                reference_id: result.id,
                bank_code: bankCode,
                total_amount: totalAmount
            }, function (err, res) {
                if (!err) {
                    database.updatePayment(result.id, requestId, 'PENDING', res.message);
                    res['request_id'] = requestId;

                    callback(null, res);
                } else {
                    database.updatePayment(result.id, requestId, 'FAIL', err.message);
                    err['request_id'] = requestId;

                    callback(err);
                }
            });
        });

    },

    receivePaymentResult: function (returnResult, callback) {
        var collectorHandler = new CollectorHandler();

        collectorHandler.sendPaymentResultToServiceProvider(returnResult, function (err, result) {
            var referenceId = err ? err.reference_id : result.reference_id;

            database.getPaymentByRequestId(referenceId, null, function (e, data) {
                if (!e) {
                    if (!err) {
                        database.updatePayment(referenceId, data.request_id, result.status, result.message);

                        callback(null, {
                            redirect_url: data.redirect_url + '?' + queryStr.stringify({
                                status: result.status,
                                request_id: data.request_id,
                                reference_id: referenceId
                            })
                        });
                    } else {
                        database.updatePayment(referenceId, data.request_id, 'FAIL', err.message);

                        callback(null, {
                            redirect_url: data.redirect_url + '?' + queryStr.stringify({
                                status: 'FAIL',
                                request_id: data.request_id,
                                message: err.message,
                                reference_id: referenceId
                            })
                        });
                    }

                } else {
                    log.error('receivePaymentResult', 'FAIL', 'Not found payment');
                }
            });
        });
    },

    checkPaymentTrans: function (referenceId, requestId, callback) {
        database.getPaymentByRequestId(referenceId, requestId, function (e, data) {
            if (!e) {
                callback(null, {
                    reference_id: referenceId,
                    request_id: requestId,
                    status: data.status
                });
            } else {
                callback({
                    reference_id: referenceId,
                    request_id: requestId,
                    status: 'FALI',
                    message: 'Payment not found'
                });

                log.error('checkPaymentTrans', e);
            }
        });
    }
};