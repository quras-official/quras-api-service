// config
var env = process.env.NODE_ENV || "development";
var config = require('../common/config.json')[env];

// express, controller
var express = require('express');
var router = express.Router();
var commonf = require('../common/commonf.js');
var cryptof = require('../common/cryptof.js')
var controller = require('../controllers/ExplorerController');
var async = require('async');

// log4js
var log4js = require('log4js');
log4js.configure({
    appenders: config.log4js
});
var logger = log4js.getLogger('api');

// Quras
const Quras = require('quras-js');
const rpcServer = new Quras.rpc.RPCClient(Quras.CONST.QURAS_NETWORK.MAIN);

// mysql connection
var mysql = require('mysql');
var pool = mysql.createPool(config.database);
var generator = require('generate-password');
var crypto = require("crypto");

// constants
var RESPONSE_OK = 0;
var RESPONSE_ERR = 1;

router.get('/unspent', function(req, res, nex) {
    var addr = req.query.addr;
    var asset = req.query.type;

    console.log("Unspent addr => " + addr + ", asset type : " + asset);

    var response = {
        code: RESPONSE_OK,
        msg: '',
        data: {}
    };

    commonf.getUnspent(pool, async, addr, asset, function(err, totals){
        if (err) {
            logger.error(err);

            response.code = RESPONSE_ERR;

            return res.send(JSON.stringify(response));
        } else {
            response.data = {
                unspents : totals
            };
            res.send(JSON.stringify(response));
        }
    });
});

router.get('/balance', function(req, res, next){
    var addr = req.query.addr;
    var asset = req.query.type;

    console.log("GetBalance addr => " + addr);

    var response = {
        code: RESPONSE_OK,
        msg: '',
        data: {}
    };

    commonf.getUnspent(pool, async, addr, asset, function(err, totals){
        if (err) {
            logger.error(err);

            response.code = RESPONSE_ERR;

            return res.send(JSON.stringify(response));
        } else {
            var balance_data = controller.getStyledBalance(addr, Quras.CONST.QURAS_NETWORK.MAIN, totals);

            response.data = {
                balance : balance_data
            };
            res.send(JSON.stringify(response));
        }
    });
});

module.exports = router;