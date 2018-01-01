'use strict';
var publisher = require('../../connectors/publisher');
/**
 * Operations on /payment/returnResult
 */
module.exports = {
    /**
     * summary: 
     * description: The url which payment provider will redirect to after payment finished
     * parameters: 
     * produces: application/json
     * responses: 200
     * operationId: receivingPaymentResult
     */
    get: {
        200: function (req, res, callback) {
            publisher.receivePaymentResult(req.query, callback);
        }
    }
};
