'use strict';
const Log = require('timestamp-log');
const log = new Log(process.env.LOG_LEVEL);
const Mysql = require('mysql');
const dateFormat = require('dateformat');

const pool = Mysql.createPool({
    connectionLimit: process.env.DATABASE_POOLING_LIMIT,
    host     : process.env.DATABASE_HOST,
    port     : process.env.DATABASE_PORT,
    user     : process.env.DATABASE_USERNAME,
    password : process.env.DATABASE_PASSWORD,
    database : process.env.DATABASE_DATABASE_NAME
});

var searchPartner = function(callback) {
    pool.getConnection(function (err, connection) {
        if (err) {
            callback({
                error: 'error-pooling-connection',
                message: 'VNPAY: ' + err.toString()
            });

            log.error(err);
        } else {
            var sql = 'SELECT * FROM flash_data_partners WHERE group_name = \'payment_service\' AND enable = 1 limit 1';
            connection.query(sql, function (reErr, results, fields) {
                if (reErr) {
                    callback({
                        error: 'error-find-partner',
                        message: 'VNPAY: ' + reErr.toString()
                    });

                    log.error(reErr);
                } else {
                    if (results.length == 0) {
                        callback({
                            error: 'error-find-partner',
                            message: 'VNPAY: Partner not found'
                        });
                    } else {
                        callback(null, results[0]);
                    }
                }
            });

            connection.release();
        }
    });
};

var searchBank = function (bankCode, callback) {
    searchPartner(function (err, partner) {
        if (err) {
            callback(err);
        } else {
            pool.getConnection(function (connectErr, connection) {
                if (connectErr) {
                    callback({
                        error: 'error-pooling-connection',
                        message: 'VNPAY: ' + connectErr.toString()
                    });

                    log.error(connectErr);
                } else {
                    var sql = 'SELECT * FROM flash_balance_topup_banks WHERE partner_code = ? AND in_bank_code = ?';
                    connection.query(sql, [partner.code, bankCode], function (sqlErr, results, fields) {
                        if (sqlErr) {
                            callback({
                                error: 'error-find-bank-service',
                                message: 'VNPAY: ' + sqlErr.toString()
                            });

                            log.error(sqlErr);
                        } else {
                            if (results.length == 0) {
                                callback({
                                    error: 'error-find-bank-service',
                                    message: 'VNPAY: Bank not found'
                                });
                            } else {
                                callback(null, results[0]);
                            }
                        }
                    });
                    connection.release();
                }
            });
        }

    });
};

var insertPaymentLog = function (bankCode, totalAmount, callback) {
    searchBank(bankCode, function (err, bank) {
        if (err) {
            callback(err);
        } else {
            pool.getConnection(function (connectErr, connection) {
                if (connectErr) {
                    callback({
                        error: 'error-pooling-connection',
                        message: 'VNPAY: ' + connectErr.toString()
                    });
                    
                    log.error(connectErr);
                } else {
                    const uuidv4 = require('uuid/v4');
                    var inTrace = uuidv4();
                    var exTrace = uuidv4();

                    var now = new Date();

                    var insertSql = 'INSERT INTO flash_balance_topup_payment_logs SET ?';

                    var insert = {
                        in_trace: inTrace.toString().replace('-', ''),
                        ex_trace: exTrace.toString().replace('-', ''),
                        ex_bank_code: bankCode,
                        amount: totalAmount,
                        partner_code: bank.partner_code,
                        in_status_id: 2,
                        partner_data: '',
                        created_at: dateFormat(now, 'yyyy-mm-dd HH:MM:ss'),
                        updated_at: dateFormat(now, 'yyyy-mm-dd HH:MM:ss')
                    };

                    connection.query(insertSql, insert, function (queryErr, results, fields) {
                        if (queryErr) {
                            callback({
                                error: 'error-insert-payment-log',
                                message: 'VNPAY: ' + queryErr.toString()
                            });

                            log.error(queryErr);
                        } else {
                            callback(null, {ex_trace: exTrace, in_trace: inTrace, in_status_id: 2, amount: totalAmount, bank_code: bankCode});
                        }
                    });

                    connection.release();
                }
            });
        }
    });
};

var findPaymentLogByTrace = function(trace, callback) {
    pool.getConnection(function (err, connection) {
        if (err) {
            callback({
                error: 'error-pooling-connection',
                message: 'VNPAY: ' + err.toString()
            });

            log.error(err);
        } else {
            var sql = 'SELECT * FROM flash_balance_topup_payment_logs WHERE in_trace = ? OR ex_trace = ?';
            connection.query(sql, [trace, trace], function (reErr, results, fields) {
                if (reErr) {
                    callback({
                        error: 'error-find-payment-log',
                        message: 'VNPAY: ' + reErr.toString()
                    });

                    log.error(reErr);
                } else {
                    if (results.length == 0) {
                        callback({
                            error: 'error-find-payment-log',
                            message: 'VNPAY: Payment not found'
                        });
                    } else {
                        callback(null, results[0]);
                    }
                }
            });

            connection.release();
        }
    });
};

var updatePaymentLog = function (trace, status, partnerData, callback) {
    findPaymentLogByTrace(trace, function (err, payment) {
        if (err) {
            callback(err);
        } else {
            pool.getConnection(function (connectErr, connection) {
                if (connectErr) {
                    callback({
                        error: 'error-pooling-connection',
                        message: 'VNPAY: ' + connectErr.toString()
                    });

                    log.error(connectErr);
                } else {
                    var sql = 'UPDATE flash_balance_topup_payment_logs SET partner_data = ?, in_status_id = ?, updated_at = ? WHERE in_trace = ?'
                    connection.query(sql, [partnerData, status, dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'), payment.in_trace],
                        function (resErr, result, fields) {
                            if (resErr) {
                                callback({
                                    error: 'error-update-payment-log',
                                    message: 'VNPAY: ' + resErr.toString()
                                });

                                log.error(resErr);
                            } else {
                                callback(null, {in_trace: payment.in_trace});
                            }
                        }
                    );

                    connection.release();
                }
            });
        }
    });
};

module.exports = {
    createPaymentLog: function (bankCode, totalAmount, callback) {
        insertPaymentLog(bankCode, totalAmount, function (err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    
    updatePaymentLog: function (in_trace, status, partnerDate) {
        updatePaymentLog(in_trace, status, partnerDate, function (err, result) {
            if (err) {
                log.error(err);
            } else {
                log.debug(result);
            }
        });
    }
};