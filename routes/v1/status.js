// config
var env = process.env.NODE_ENV || "development";
var config = require('../../common/config.json')[env];

// express, controller
var express = require('express');
var router = express.Router();
var commonf = require('../../common/commonf.js');
var cryptof = require('../../common/cryptof.js')
var controller = require('../../controllers/ExplorerController');
var async = require('async');
var constants = require('../constants.js');
var promisify = require('deferred').promisify;
var syncMysql = require('sync-mysql');

// log4js
var log4js = require('log4js');
log4js.configure({
    appenders: config.log4js
});
var logger = log4js.getLogger('api');

// QURAS
const Quras = require('quras-js');
const rpcServer = new Quras.rpc.RPCClient(Quras.CONST.QURAS_NETWORK.MAIN);

// mysql connection
var mysql = require('mysql');
var pool = mysql.createPool(config.database);
var syncConnection = new syncMysql(config.database);
var generator = require('generate-password');
var crypto = require("crypto");

async function getStatus(res) {
  try{
    var sqlStatus = "SELECT * FROM status";

    var statusResult = (await mysqlPool.query(sqlStatus, []))[0];

    var retStatus = commonf.getFormatedStatus(statusResult[0]);

    res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, retStatus, res);
  }
  catch(err) {
    var bodyErrMsg = ["unexpected request"];
    res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_not_found_err, null, res);
  }
}

router.get('/', function(req, res, next){
  console.log("The Status API was called.");
  getStatus(res);
});

module.exports = router;