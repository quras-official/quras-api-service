// config
var env = process.env.NODE_ENV || "development";
var config = require('../../common/config.json')[env];

// express, controller
var express = require('express');
var router = express.Router();
var commonf = require('../../common/commonf.js');
var async = require('async');

// log
const opts = {
    errorEventName:'info',
    logDirectory:'./logs', // NOTE: folder must exist and be writable...
    fileNamePattern:'api.log-<DATE>',
    dateFormat:'YYYY-MM-DD'
};
const logger = require('simple-node-logger').createRollingFileLogger( opts );

// QURAS
const Quras = require('quras-js');

// mysql connection
var mysql = require('mysql');
var pool = mysql.createPool(config.database);

// constants
var RESPONSE_OK = 0;
var RESPONSE_ERR = 1;

router.get('/height', function(req, res, next){
    console.log("Get Block Height...");
    logger.info("Get Block Height...");

    var response = {
        code: RESPONSE_OK,
        msg: '',
        data: {}
    };

    commonf.getCurrentBlockHeight(pool, async, function(err, block_height){
        if (err) {
            response.code = RESPONSE_ERR;

            return res.send(JSON.stringify(response));
        } else {

            response.data = {
                Height : block_height
            };
            res.send(JSON.stringify(response));
        }
        logger.info("Get Block Height, Response => " + JSON.stringify(response));
    });
});

module.exports = router;