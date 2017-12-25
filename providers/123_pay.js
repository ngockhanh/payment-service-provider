'use trick'

var requestPromise = require('request-promise');
var Log = require('timestamp-log');
var log = new Log(process.env.LOG_LEVEL);
var sha1 = require('sha1');
var md5 = require('md5');

const successCode = 1;
const pendingCode = 0;
const rejectCode = -100;

var createOrder = function (transactionId, bankCode, totalAmount) {
    var orderData = {
        mTransactionID: transactionId,
        merchantCode: process.env.PAYMENT_SERVICE_MERCHANT_CODE,
        bankCode: bankCode,
        totalAmount: totalAmount,
        clientIP: '127.0.0.1',
        custName: 'OnOnPay',
        custAddress: '',
        custGender: 'U',
        custDOB: '',
        custPhone: '',
        custMail: '',
        description: 'Nap tien vao tai khoan OnOnPay',
        cancelURL: '',
        redirectURL: process.env.PAYMENT_SERVICE_RETURN_URL,
        errorURL: '',
        passcode: process.env.PAYMENT_SERVICE_PASSCODE
    };

    orderData['checksum'] = getCheckSum(orderData);

    return orderData;
};

var getCheckSum = function (object, whichHash = sha1) {
    var keyValues = Object.values(object);
    keyValues.push(process.env.PAYMENT_SERVICE_SECURE_HASH_KEY);

    return whichHash(keyValues.join(''));
};

var sendRequest = function (transactionId, bankCode, totalAmount) {
    var payload = createOrder(transactionId, bankCode, totalAmount);

    return requestPromise({
        uri: process.env.PAYMENT_SERVICE_URI,
        method: 'POST',
        body: payload,
        json: true
    });
};

module.exports = {
    sendPaymentRequest: function (transactionId, bankCode, totalAmount, callback) {
        sendRequest(transactionId, bankCode, totalAmount)
            .then(function (res) {
                log.debug(res);
                if (res.length > 0 && res[0] === '1') {
                    var checkSumKey = [res[0], res[1], res[2], process.env.PAYMENT_SERVICE_SECURE_HASH_KEY].join('');

                    if (sha1(checkSumKey) === res[3]) {
                        callback(null, {
                            return_code: res[0] == successCode ? 'SUCCESS' : 'FAIL',
                            redirect_url: res[2],
                            transaction_id: res[1]
                        });
                    } else {
                        callback({
                            code: 'error-send-payment-request',
                            message: '123_PAY: Checksum fail'
                        });
                    }
                } else {
                    callback({
                        code: 'error-send-payment-request',
                        message: '123_PAY: ' + res[1].toString()
                    });
                }

            })
            .catch(function (err) {
                callback({
                    code: 'error-send-payment-request',
                    message: '123_PAY: ' + err.toString()
                });
            });

    },

    checksum: function (response, callback) {
        var object = {
            status: response.status,
            time: response.time,
            transaction_id: response.transactionId
        };

        var checkSum = getCheckSum(object, md5);

        if (checkSum === response.ticket) {
            var statusCode = 'FAIL';

            if (response.status === successCode) {
                statusCode = 'SUCCESS';
            }

            if (response.status === pendingCode) {
                statusCode = 'PENDING';
            }

            if (response.status === rejectCode) {
                statusCode = 'REJECT';
            }

            response['return_code'] = statusCode;
            response['transaction_id'] = response.transactionId;

            callback(null, response);

        } else {
            callback({
                'code': 'error-payment-checkSum',
                'message': 'Fail checksum.'
            });
        }
    }
};