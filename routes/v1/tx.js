// config
var env = process.env.NODE_ENV || "development";
var config = require('../../common/config.json')[env];

// express, controller
var express = require('express');
var router = express.Router();

// log4js
var log4js = require('log4js');
log4js.configure({
    appenders: config.log4js
});

// Quras
const Quras = require('quras-js');
const rpcServer = new Quras.rpc.RPCClient(Quras.CONST.QURAS_NETWORK.MAIN);

// mysql connection
var mysql = require('mysql');

// constants
var RESPONSE_OK = 0;
var RESPONSE_ERR = 1;

router.get('/send', function(req, res, next){
    var privKey = req.query.privkey;
    var addr = req.query.addr;
    var asset = req.query.asset;
    var amount = req.query.amount;

    console.log("Send addr => " + addr + " Amount => " + amount);

    var response = {
      code: RESPONSE_OK,
      msg: '',
      data: {}
    };
});

module.exports = router;