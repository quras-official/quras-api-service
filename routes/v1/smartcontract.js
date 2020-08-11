var env = process.env.NODE_ENV || "development";
var config = require('../../common/config.json')[env];

// express, controller
var express = require('express');
var router = express.Router();
var commonf = require('../../common/commonf.js');
var constants = require('../constants.js');
var syncMysql = require('sync-mysql');

// log
const opts = {
  errorEventName:'info',
  logDirectory:'./logs', // NOTE: folder must exist and be writable...
  fileNamePattern:'api.log-<DATE>',
  dateFormat:'YYYY-MM-DD'
};
const logger = require('simple-node-logger').createRollingFileLogger( opts );

// mysql connection
var mysql = require('mysql');

async function updateSmartContractMember(scripthash, publickey, bRegister, res) {
  try {
    if (!bRegister) {
      var sql = "UPDATE smartcontract_member_list SET status = 2 WHERE scripthash = ?";
      var query_val = (await mysqlPool.query(sql, [scripthash]));
      res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, query_val, res);
    } else {
      var sqlTx = "SELECT * FROM smartcontract_member_list where scripthash=?";

      var result = (await mysqlPool.query(sqlTx,[scripthash]))[0];
      if (result.length > 0) {
        sqlTx = "UPDATE smartcontract_member_list SET publickey=?, status=1 where scripthash=?";
        var query_val = (await mysqlPool.query(sqlTx, [publickey, scripthash]));
        res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, query_val, res);
      }
      else {
        sqlTx = "INSERT INTO smartcontract_member_list (scripthash, publickey) VALUES (?, ?)";
        var query_val = (await mysqlPool.query(sqlTx, [scripthash, publickey]));
        res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, query_val, res);
      }
    }
  }
  catch(err) {
    console.log(err.message);
    logger.info(err.message);

    var bodyErrMsg = ["Connection Error"];
    res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_not_found_err, null, res);
  }
}

async function getSmartContractMember(scripthash, res) {
  var sqlTx = "select * FROM smartcontract_member_list where scripthash=? AND status=1";
  try {
    var result = (await mysqlPool.query(sqlTx,[scripthash]))[0];
    if (result.length > 0) {
      res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, result[0].publickey, res);
    } else {
      res = commonf.buildResponse(null, constants.ERR_CONSTANTS.db_not_found_err, '', res);
    }
  }
  catch(err) {
    console.log(err.message);
    logger.info(err.message);

    var bodyErrMsg = ["Connection Error"];
    res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_not_found_err, null, res);
  }
}

router.get('/privacy/get/:scripthash', function(req, res, next) {
  var scripthash = req.params.scripthash;

  console.log("Get Smart Contract Member's PubKey => " + scripthash);
  logger.info("Get Smart Contract Member's PubKey => " + scripthash);

  getSmartContractMember(scripthash, res);
}); 

router.get('/privacy/register/:scripthash/:publickey', function(req, res, next){
    var scripthash = req.params.scripthash;
    var publickey = req.params.publickey;

    console.log("Register Smart Contract Member's PubKey => ScriptHash=" + scripthash + ", PubKey=" + publickey);
    logger.info("Register Smart Contract Member's PubKey => ScriptHash=" + scripthash + ", PubKey=" + publickey);

    updateSmartContractMember(scripthash, publickey, true, res);
});

router.get('/privacy/unregister/:scripthash', function(req, res, next){
  var scripthash = req.params.scripthash;

  console.log("UnRegister Smart Contract Member's PubKey => ScriptHash=" + scripthash);
  logger.info("UnRegister Smart Contract Member's PubKey => ScriptHash=" + scripthash);

  updateSmartContractMember(scripthash, '', false, res);
});

module.exports = router;