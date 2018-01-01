'use strict';
const Log = require('timestamp-log');
const Guid = require('guid');
const cassandra = require('cassandra-driver');
const log = new Log(process.env.LOG_LEVEL);
const cassandraContactPoints = [process.env.CASSANDRA_HOST_PRIMARY || 'cassandra-database', process.env.CASSANDRA_HOST_SECONDARY || 'localhost']
const cassandraTrackingTable = process.env.CASSANDRA_TRACKING_TABLE || 'payments.payment_tracker'
const cassandraKeyspaceName = process.env.CASSANDRA_KEYSPACE_NAME || 'payments'

/**
 * Operations on /kafka/collection-handler
 */
module.exports = {
    /**
     * summary: [Public] Connector exposed method.
     * description: Record a payment into database.
     * parameters: paymentRequestId, paymentStatus, paymentBankCode, paymentTotalAmount, paymentRedirectUrl
     * produces: application/json
     * responses: callback(error, response)
     * operationId: createPayment
     */
    createPayment: function (requestId, status, bankCode, totalAmount, redirectUrl, callback) {
        let paymentId = Guid.raw();
        let paymentStatus = status || 'INIT';
        let paymentCreatedAt = new Date().toISOString();
        const client = new cassandra.Client({ contactPoints: cassandraContactPoints, keyspace: cassandraKeyspaceName });
        const query = 'INSERT INTO ' + cassandraTrackingTable + ' (id, status, bank_code, total_amount, redirect_url, request_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const params = [paymentId, paymentStatus, bankCode, totalAmount, redirectUrl, requestId, paymentCreatedAt];
        client.execute(query, params, { prepare: true }, (err, data) => {
            if (!err) {
                callback(null, {
                    id: paymentId,
                    request_id: requestId,
                    status: paymentStatus
                });
                log.debug(data);
            } else {
                callback({
                    'code': 'error-execute-cassandra',
                    'message': 'CASSANDRA:' + err.message.toString()
                });
                log.error(err);
            }
        });
    },
    /**
     * summary: [Public] Connector exposed method.
     * description: Update a payment status in database.
     * parameters: paymentStatus, paymentRequestId
     * produces: application/json
     * responses: callback(error, response)
     * operationId: updatePayment
     */
    updatePayment: function (paymentId, requestId, status, message, callback) {
        const client = new cassandra.Client({ contactPoints: cassandraContactPoints, keyspace: cassandraKeyspaceName });
        const query = 'UPDATE ' + cassandraTrackingTable + ' SET status=?, message=? WHERE id=? AND request_id=?';
        const params = [status, message, paymentId, requestId];
        client.execute(query, params, { prepare: true }, (err, data) => {
            if (!err) {
                callback && callback(null, {
                    id: paymentId,
                    request_id: data.request_id,
                    status: status
                });
                log.debug(data);
            } else {
                callback && callback({
                    'code': 'error-execute-cassandra',
                    'message': 'CASSANDRA:' + err.message.toString()
                });
                log.error(err);
            }
        });
    },
    /**
     * summary: [Public] Connector exposed method.
     * description: Get a payment by request id in database.
     * parameters: paymentId requestId
     * produces: application/json
     * responses: callback(error, response)
     * operationId: getPaymentByRequestId
     */
    getPaymentByRequestId: function (paymentId, requestId, callback) {
        const client = new cassandra.Client({ contactPoints: cassandraContactPoints, keyspace: cassandraKeyspaceName });
        var query = 'SELECT * FROM ' + cassandraTrackingTable + ' WHERE id=?';
        var params = [paymentId];

        if (requestId) {
            query += ' AND request_id=?';

            params.push(requestId);
        }

        query += ' ALLOW FILTERING';

        client.execute(query, params, { prepare: true }, (err, data) => {
            if (!err) {
                callback && callback(null, data.rows[0]);
                log.debug(data);
            } else {
                callback && callback({
                    'code': 'error-execute-cassandra',
                    'message': 'CASSANDRA:' + err.message.toString()
                });
                log.error(err);
            }
        });
    }
};