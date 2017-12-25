'use strict';
var dataProvider = require('../models/payment.js');
/**
 * Operations on /payment
 */
module.exports = {
    /**
     * summary: 
     * description: Create new payment request
     * parameters: body
     * produces: application/json
     * responses: 200, default
     */
    post: function createPaymentRequest(req, res, next) {
        /**
         * Get the data for response 200
         * For response `default` status 200 is used.
         */
        var status = 200;
        var provider = dataProvider['post']['200'];
        provider(req, res, function (err, data) {
            if (err) {
                res.status(status).send(err);
            } else {
                res.status(status).send(data);
            }
        });
    }
};
