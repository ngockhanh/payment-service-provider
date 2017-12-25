'use strict';
const Log = require('timestamp-log');
const log = new Log(process.env.LOG_LEVEL);
const publisher = require(
    (process.env.KAFKA_QUEUE_ENABLED === "YES") ?
        '../../publisher.kafka' :
        '../../connectors/publisher');
/**
 * Operations on /payment/returnResult
 */
module.exports = {
    /**
     * summary: 
     * description: Receive payment result
     * parameters: 
     * produces: application/json
     * responses: 200, default
     * operationId: receivePaymentResult
     */
    get: {
        200: function (req, res, callback) {
            /**
             * Using mock data generator module.
             * Replace this by actual data for the api.
             */
            publisher.receivePaymentResult(req.query, callback);
        },
        default: function (req, res, callback) {}
    }
};
