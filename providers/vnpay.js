'use strict';

var dateFormat = require('dateformat');
var md5 = require('md5');
var Log = require('timestamp-log');
var queryString = require('qs');
var log = new Log(process.env.LOG_LEVEL);

const successCodes = ['00'];
const pendingCodes = ['01', '02', '03', '04'];

var sortObject = function (object) {
    var sorted = {},
        key, a = [];

    for (key in object) {
        if (object.hasOwnProperty(key)) {
            a.push(key);
        }
    }

    a.sort();

    for (key = 0; key < a.length; key++) {
        sorted[a[key]] = object[a[key]];
    }
    return sorted;
};

var getVNPUrl = function (referenceId, bankCode, totalAmount) {
    var date = new Date();
    var createDate = dateFormat(date, 'yyyymmddHHMMss');

    var queryObj = {
        vnp_Version: '2',
        vnp_Command: 'pay',
        vnp_TmnCode: process.env.PAYMENT_SERVICE_TMN_CODE,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: referenceId,
        vnp_OrderInfo: 'Nap vi',
        vnp_OrderType: '250000', // Bill payment
        vnp_Amount: totalAmount * 100,
        vnp_ReturnUrl: process.env.PAYMENT_SERVICE_RETURN_URL,
        vnp_IpAddr: '127.0.0.1',
        vnp_CreateDate: createDate,
        vnp_BankCode: bankCode
    };

    queryObj = sortObject(queryObj);

    var signData = process.env.PAYMENT_SERVICE_SECURE_HASH_KEY + queryString.stringify(queryObj, { encode: false });
    var secureHash = md5(signData);

    queryObj['vnp_SecureHashType'] = 'MD5';
    queryObj['vnp_SecureHash'] = secureHash;

    return process.env.PAYMENT_SERVICE_URI + '?' + queryString.stringify(queryObj, { encode: true });
};

/**
 * Operations on /kafka/collection-handler
 */
module.exports = {

    sendPaymentRequest: function (referenceId, bankCode, totalAmount, callback) {
        var vnpUrl = getVNPUrl(referenceId, bankCode, totalAmount);

        callback(null, {
            return_code: 'SUCCESS',
            redirect_url: vnpUrl,
            transaction_id: referenceId
        });
    },

    checksum: function (response, callback) {
        var secureHash = response['vnp_SecureHash'];

        delete response['vnp_SecureHash'];
        delete response['vnp_SecureHashType'];

        response = sortObject(response);

        var secretKey = process.env.PAYMENT_SERVICE_SECURE_HASH_KEY;
        var signData = secretKey + queryString.stringify(response, { encode: false });
        var checkSum = md5(signData);

        if(secureHash === checkSum){
            var statusCode = 'FAIL';
            if (successCodes.indexOf(response['vnp_ResponseCode']) >= 0) {
                statusCode = 'SUCCESS';
            } else {
                if (pendingCodes.indexOf(response['vnp_ResponseCode']) >= 0) {
                    statusCode = 'PENDING';
                }
            }

            response['transaction_id'] = response['vnp_TxnRef'];
            response['return_code'] = statusCode;

            callback(null, response);
        } else {
            callback({
                'code': 'error-payment-checksum',
                'message': 'Fail checksum.'
            });
        }
    }
};