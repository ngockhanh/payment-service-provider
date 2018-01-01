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
    createPayment: function (referenceId, bankCode, totalAmount, callback) {
        sendRequest(referenceId, bankCode, totalAmount)
            .then(function (res) {
                log.debug(res);
                if (res.length > 0 && res[0] === '1') {
                    var checkSumKey = [res[0], res[1], res[2], process.env.PAYMENT_SERVICE_SECURE_HASH_KEY].join('');

                    if (sha1(checkSumKey) === res[3]) {
                        callback(null, {
                            reference_id: referenceId,
                            redirect_url: res[2],
                            status: res[0] == successCode ? 'SUCCESS' : 'FAIL',
                            message: '123_PAY:' + JSON.stringify(res)
                        });
                    } else {
                        callback({
                            reference_id: referenceId,
                            redirect_url: '',
                            status: 'FAIL',
                            message: '123_PAY: Checksum fail'
                        });
                    }
                } else {
                    callback({
                        reference_id: referenceId,
                        redirect_url: '',
                        status: 'FAIL',
                        message: '123_PAY: ' + res[1].toString()
                    });
                }

            })
            .catch(function (err) {
                callback({
                    reference_id: referenceId,
                    redirect_url: '',
                    status: 'FAIL',
                    message: '123_PAY: ' + err.toString()
                });
            });

    },

    checkSum: function (response, callback) {
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

            callback(null, {
                reference_id: response.transactionId,
                status: statusCode,
                message: response
            });

        } else {
            callback({
                reference_id: response.transactionId,
                status: 'FAIL',
                message: '123_PAY: Fail checksum.'
            });
        }
    }
};