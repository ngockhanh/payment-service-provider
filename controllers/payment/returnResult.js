'use strict';
var dataProvider = require('../../models/payment/returnResult.js');
/**
 * Operations on /payment/returnResult
 */
module.exports = {
    /**
     * summary: 
     * description: CheckSum payment result
     * parameters: 
     * produces: application/json
     * responses: 200, default
     */
    get: function checkSumPaymentResult(req, res, next) {
        /**
         * Get the data for response 200
         * For response `default` status 200 is used.
         */
        var status = 200;
        var provider = dataProvider['get']['200'];
        provider(req, res, function (err, data) {
            if (err) {
                res.status(status).send(err);
            } else {
                res.status(status).send(data);
            }
        });
    }
};
