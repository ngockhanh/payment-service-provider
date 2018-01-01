'use strict';
var Mockgen = require('../mockgen.js');
var publisher = require('../../connectors/publisher');
/**
 * Operations on /payment/checkTrans
 */
module.exports = {
    /**
     * summary: 
     * description: Query payment transaction
     * parameters: request_id
     * produces: application/json
     * responses: 200, default
     * operationId: checkPaymentTransByRequestId
     */
    get: {
        200: function (req, res, callback) {
            publisher.checkPaymentTrans(req.query.reference_id, req.query.request_id, callback);
        },
        default: function (req, res, callback) {
            /**
             * Using mock data generator module.
             * Replace this by actual data for the api.
             */
            Mockgen().responses({
                path: '/payment/checkTrans',
                operation: 'get',
                response: 'default'
            }, callback);
        }
    }
};
