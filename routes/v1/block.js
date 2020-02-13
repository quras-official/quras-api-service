// config
var env = process.env.NODE_ENV || "development";
var config = require('../../common/config.json')[env];

// express, controller
var express = require('express');
var router = express.Router();
var commonf = require('../../common/commonf.js');
var async = require('async');

// log4js
var log4js = require('log4js');
log4js.configure({
    appenders: config.log4js
});
var logger = log4js.getLogger('api');

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

    var response = {
        code: RESPONSE_OK,
        msg: '',
        data: {}
    };

    commonf.getCurrentBlockHeight(pool, async, function(err, block_height){
        if (err) {
            logger.error(err);

            response.code = RESPONSE_ERR;

            return res.send(JSON.stringify(response));
        } else {

            response.data = {
                Height : block_height
            };
            res.send(JSON.stringify(response));
        }
    });
});

module.exports = router;