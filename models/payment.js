'use strict';
const publisher = require('../connectors/publisher');
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
     * operationId: createPaymentRequest
     */
    post: {
        200: function (req, res, callback) {
            publisher.sendPaymentRequest(req.body.request_id, req.body.bank_code, req.body.total_amount, req.body.redirect_url, callback);
        },
        default: function (req, res, callback) {}
    }
};
