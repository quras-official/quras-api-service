/**
 * Created by dotFund on 9/12/2018.
 */
// config
var env = process.env.NODE_ENV || "development";
var config = require('../common/config.json')[env];

// express, controller
var express = require('express');
var router = express.Router();

// log4js
var log4js = require('log4js');
log4js.configure({
    appenders: config.log4js
});
var logger = log4js.getLogger('api');

// mysql connection
var mysql = require('mysql');
var pool = mysql.createPool(config.database);
function get_version(req, type, res) {
    pool.getConnection(function(err,conn) {
        if (err)
        {
            logger.info('connection err');
            res.setHeader('content-type', 'text/plain');
            res.send("1.0.0.0");
        }
        else
        {
            conn.query('SELECT * FROM app_version', function(err, rows){
                conn.release();
                if (err)
                {
                    logger.info('connection err');
                    res.setHeader('content-type', 'text/plain');
                    res.send("1.0.0.0");
                }
                else
                {
                    if (rows.length > 0) {
                        var version = "1.0.0.0";
                        if (type == 0) {
                            version = rows[0].miner;
                        }
                        else {
                            version = rows[0].wallet;
                        }
                        res.setHeader('content-type', 'text/plain');
                        res.send(version);
                    }
                }
            });
        }
    });
}
router.get('/mine', function(req, res, next) {
    get_version(req, 0, res);
});

router.post('/mine', function(req, res, next) {
    get_version(req, 0, res);
});

router.get('/wallet', function(req, res, next) {
    get_version(req, 1, res);
});

router.post('/wallet', function(req, res, next) {
    get_version(req, 1, res);
});

module.exports = router;