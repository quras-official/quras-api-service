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

// QURAS
const Quras = require('quras-js');
const rpcServer = new Quras.rpc.RPCClient(Quras.CONST.QURAS_NETWORK.MAIN);

// mysql connection
var mysql = require('mysql');

async function getfile(res) {
  var sqlTx = "SELECT upload_request_transaction.* FROM upload_request_transaction where status = 0";

  try {
    var fileResult = (await mysqlPool.query(sqlTx))[0];
    res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, fileResult, res);
  }
  catch(err) {
    var bodyErrMsg = ["Connection Error"];
    res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_not_found_err, null, res);
  }
}

async function updateapproval(scripthash, publickey, res) {
  var sqlTx = "SELECT approver_list.* FROM approver_list where approver_list.scripthash=?";
  try {
    var result = (await mysqlPool.query(sqlTx,[scripthash]))[0];
    console.log(result);
    if (result.length > 0) {
      if (result[0].publickey == publickey)
        publickey = "00";
      sqlTx = "UPDATE approver_list SET approver_list.publickey=? where approver_list.scripthash=?";
      var query_val = (await mysqlPool.query(sqlTx, [publickey, scripthash]));
      res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, query_val, res);
    }
    else {
      sqlTx = "INSERT INTO approver_list (scripthash, publickey) VALUES (?, ?)";
      var query_val = (await mysqlPool.query(sqlTx, [scripthash, publickey]));
      res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, query_val, res);
    }
  }
  catch(err) {
    console.log(err.message);
    logger.info(err.message);

    var bodyErrMsg = ["Connection Error"];
    res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_not_found_err, null, res);
  }
}

async function getapproval(scripthash, res) {
  var sqlTx = "select approver_list.* FROM approver_list where approver_list.scripthash=?";
  try {
    var result = (await mysqlPool.query(sqlTx,[scripthash]))[0];
    if (result.length > 0) {
      res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, result[0].publickey, res);
    }
    else
      res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, '00', res);
  }
  catch(err) {
    console.log(err.message);
    logger.info(err.message);

    var bodyErrMsg = ["Connection Error"];
    res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_not_found_err, null, res);
  }
}

async function UpdateApprovalList(scripthash, publickey, bRegister, res) {
  try {
    if (!bRegister) {
      var sql = "UPDATE approver_list SET status = 2 WHERE scripthash = ?";
      var query_val = (await mysqlPool.query(sql, [scripthash]));
      res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, query_val, res);
    } else {
      var sqlTx = "SELECT * FROM approver_list where scripthash=?";

      var result = (await mysqlPool.query(sqlTx,[scripthash]))[0];
      if (result.length > 0) {
        sqlTx = "UPDATE approver_list SET publickey=?, status=1 where scripthash=?";
        var query_val = (await mysqlPool.query(sqlTx, [publickey, scripthash]));
        res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, query_val, res);
      }
      else {
        sqlTx = "INSERT INTO approver_list (scripthash, publickey) VALUES (?, ?)";
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

async function getApprovalMember(scripthash, res) {
  var sqlTx = "select * FROM approver_list where scripthash=? AND status=1";
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

router.get('/all', function(req, res, next){
    var privKey = req.query.privkey;
    var addr = req.query.addr;

    console.log("Get all file info => " + addr);
    logger.info("Get all file info => " + addr);
    getfile(res);

});

router.get('/approval/get/:scripthash', function(req, res, next) {
  var scripthash = req.params.scripthash;

  console.log("Get File Approval Member's PubKey => " + scripthash);
  logger.info("Get File Approval Member's PubKey => " + scripthash);

  getApprovalMember(scripthash, res);
}); 

router.get('/approval/register/:scripthash/:publickey', function(req, res, next){
    var scripthash = req.params.scripthash;
    var publickey = req.params.publickey;

    console.log("Register File Approval Member's PubKey => ScriptHash=" + scripthash + ", PubKey=" + publickey);
    logger.info("Register File Approval Member's PubKey => ScriptHash=" + scripthash + ", PubKey=" + publickey);

    UpdateApprovalList(scripthash, publickey, true, res);
});

router.get('/approval/unregister/:scripthash', function(req, res, next){
  var scripthash = req.params.scripthash;

  console.log("UnRegister File Approval Member's PubKey => ScriptHash=" + scripthash);
  logger.info("UnRegister File Approval Member's PubKey => ScriptHash=" + scripthash);

  UpdateApprovalList(scripthash, '', false, res);
});


module.exports = router;