// config
var env = process.env.NODE_ENV || "development";
var config = require('../../common/config.json')[env];

// express, controller
var express = require('express');
var router = express.Router();
var commonf = require('../../common/commonf.js');
var constants = require('../constants.js');
var syncMysql = require('sync-mysql');

const isPortReachable = require('is-port-reachable');

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
const rpcServer = new Quras.rpc.RPCClient(Quras.CONST.QURAS_NETWORK.MAIN);

// mysql connection
var mysql = require('mysql');

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

async function getBackendStatus(res) {
  try{
    var retStatus = {online : false};
    if (await isPortReachable(config.backend.port, {host: config.backend.ip})) {
      retStatus.online = true;
    } else {
      retStatus.online = false;
    }

    res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, retStatus, res);
  }
  catch(err) {
    var bodyErrMsg = ["unexpected request"];
    res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_not_found_err, null, res);
  }
}

router.get('/', function(req, res, next){
  console.log("The Status API was called.");
  logger.info("The Status API was called.");
  getStatus(res);
});

router.get('/backend', function(req, res, next){
  console.log("The Status of Backend was called.");
  logger.info("The Status of Backend was called.");
  getBackendStatus(res);
});

module.exports = router;