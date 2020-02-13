// config
var env = process.env.NODE_ENV || "development";
var config = require('../../common/config.json')[env];

// express, controller
var express = require('express');
var router = express.Router();
var commonf = require('../../common/commonf.js');
var constants = require('../constants.js');
var syncMysql = require('sync-mysql');

// log4js
var log4js = require('log4js');
log4js.configure({
    appenders: config.log4js
});

// QURAS
const Quras = require('quras-js');
const rpcServer = new Quras.rpc.RPCClient(Quras.CONST.QURAS_NETWORK.MAIN);

// mysql connection
var mysql = require('mysql');
var pool = mysql.createPool(config.database);
var syncConnection = new syncMysql(config.database);
var generator = require('generate-password');
var crypto = require("crypto");

async function getBlock(height, res) {
  try {
    var sqlBlocks = "SELECT * FROM blocks WHERE block_number=?";
    var sqlTxs = "SELECT transactions.* FROM transactions WHERE block_number=?";
  
    if (height == -1) {
      var bodyErrMsg = ["Page is not a valid integer", "height is not a valid integer"];
      res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_connection_err, null, res);
      return;
    }
    const blockResult = (await mysqlPool.query(sqlBlocks, [height]))[0];

    if (blockResult.length > 0) {
      const txsResult = (await mysqlPool.query(sqlTxs, [height]))[0];
      var transactions = [];
      var transfers = [];
      txsResult.forEach(tx => {
        if (tx.type == "ContractTransaction" || tx.type == "InvocationTransaction") {
          transfers.push(tx.txid);
        }
        transactions.push(commonf.getFormatedTx(tx));
      });

      blockResult[0].transactions = transactions;
      blockResult[0].transfers = transfers;
      
      var formatedBlock = commonf.getFormatedBlock(blockResult[0]);
      res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, formatedBlock, res);
    }
    else {
      var bodyErrMsg = ["Page is not a valid integer", "height is not a valid integer"];
      callback(bodyErrMsg, connection, constants.ERR_CONSTANTS.db_not_found_err);
    }
  } catch (err) {
    var bodyErrMsg = ["Connection Error"];
    res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_connection_err, null, res);
  }
}

async function getBlocks(offset, limit, res) {
  var sqlBlocks = "SELECT * FROM blocks ORDER BY block_number DESC LIMIT ?, ?";
  var sqlTxs = "SELECT * FROM transactions WHERE block_number=?";
  var sqlRecentBlocks = "SELECT * FROM blocks ORDER BY block_number DESC LIMIT ?";
  var sqlTxsFromBlocks = "SELECT * FROM transactions WHERE block_number>= ? AND block_number <= ? ORDER BY block_number";

  if (offset == -2 && limit == -2) {
    var bodyErrMsg = ["Page is not a valid integer", "Offset parameter and limit parameter are not a valid integer"];
    res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_not_found_err, null, res);
    return;
  }
  if (offset == -2) {
    var bodyErrMsg = ["Page is not a valid integer", "Offset parameter is not a valid integer"];
    res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_not_found_err, null, res);
    return;
  }
  if (limit == -2) {
    var bodyErrMsg = ["Page is not a valid integer", "Limit parameter is not a valid integer"];
    res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_not_found_err, null, res);
    return;
  }

  if (offset == -1) {
    try {
      var blockResult = (await mysqlPool.query(sqlRecentBlocks, [limit]))[0];
      var retBlocks = [];
      blockResult.forEach(block => {
        var formatedBlock = commonf.getFormatedBlockWithoutTransactions(block);
        retBlocks.push(formatedBlock);
      });

      var retBody = {total: blockResult[0].block_number, blocks: retBlocks};
      res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, retBody, res);
    }
    catch(err) {
      var bodyErrMsg = ["Connection Error"];
      res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_not_found_err, null, res);
    }
  } else {
    try {
      var blockResult = (await mysqlPool.query(sqlBlocks, [offset, limit]))[0];
      var retBlocks = [];

      blockResult.forEach(block => {
        var formatedBlock = commonf.getFormatedBlockWithoutTransactions(block);
        retBlocks.push(formatedBlock);
      });

      var recentBlock = (await mysqlPool.query(sqlRecentBlocks, [1]))[0];
      var retBody = {total: recentBlock[0].block_number, blocks: retBlocks};
      res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, retBody, res);
    }
    catch(err) {
      var bodyErrMsg = ["Connection Error"];
      res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_not_found_err, null, res);
    }
  }
}

router.get('/', function(req, res, next){
  var offset = -1;
  var limit = 20;

  console.log("Get blocks API was called, Params => offset : " + offset + ", limit : " + limit);
  getBlocks(offset, limit, res);
});

router.get('/:height', function(req, res, next){
  var height = req.params.height;

  if (commonf.isNumber(height)) {
    height = Number.parseInt(height, 10);
  } else {
    height = -1;
  }

  console.log("Get blocks API was called, Params => height : " + height);
  getBlock(height, res);
});

router.get('/:offset/:limit', function(req, res, next){
  var offset = req.params.offset;
  var limit = req.params.limit;

  if (commonf.isNumber(offset)) {
    offset = Number.parseInt(offset, 10);
  } else {
    offset = -2;
  }

  if (commonf.isNumber(limit)) {
    limit = Number.parseInt(limit, 10);
  } else {
    limit = -2;
  }

  console.log("Get blocks API was called, Params => offset : " + offset + ", limit : " + limit);
  getBlocks(offset, limit, res);
});

module.exports = router;