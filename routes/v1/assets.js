// config
var env = process.env.NODE_ENV || "development";
var config = require('../../common/config.json')[env];

// express, controller
var express = require('express');
var router = express.Router();
var commonf = require('../../common/commonf.js');
var constants = require('../constants.js');
var syncMysql = require('sync-mysql');
var mysql = require('mysql');

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

async function getAssets(offset, limit, res) {
  try {
    var sqlTx = "SELECT register_transaction.* FROM register_transaction ORDER BY block_number";
    if (offset != -1 || limit != -1) {
      sqlTx += " LIMIT ?, ?";
    }
    
    var txsResult = (await mysqlPool.query(sqlTx, [offset, limit]))[0];

    var hash = [];
    var index = 0;
    var sqlIssued = "SELECT * FROM issue_transaction WHERE ";
    txsResult.forEach(tx => {
      if (index == 0) {
        sqlIssued += "asset=" + mysql.escape(tx.txid) + "";
      }
      else {
        sqlIssued += " OR asset=" + mysql.escape(tx.txid) + "";
      }
      index ++;
    });

    var txsIssued = (await mysqlPool.query(sqlIssued, []))[0]; 

    txsResult.forEach(tx => {
      var iAmount = 0;
      txsIssued.forEach(issuedItem => {
        if (issuedItem.asset == tx.txid) {
          iAmount += issuedItem.amount;
        }
      });

      tx.issuedAmount = iAmount;
      tx.address_count = 0;
      tx.transaction_count = 0;
    });
    var retTx = commonf.getFormatedAssets(txsResult);
    res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, retTx, res);
  } catch (err) {
    var bodyErrMsg = ["Connection Error"];
    res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_connection_err, null, res);
  }
}

async function getAsset(hash, offset, limit, res) {
  try {
    var sqlTx = "SELECT register_transaction.* FROM register_transaction WHERE txid=?";
    var sqlIssued = "SELECT * FROM issue_transaction WHERE asset=?";
    var sqlHolders = "SELECT address, balance FROM holders WHERE asset=? ORDER BY balance DESC LIMIT ?, ?";
    var sqlTotalHolders = "SELECT address FROM holders WHERE asset=?";

    var txsResult = (await mysqlPool.query(sqlTx, [hash]))[0];
    var txsIssued = (await mysqlPool.query(sqlIssued, [hash]))[0];
    var holdersReults = (await mysqlPool.query(sqlHolders, [hash, offset, limit]))[0];
    var totalholdersReults = (await mysqlPool.query(sqlTotalHolders, [hash]))[0];

    var issuedAsset = 0;
    var transactions = [];
    var addresses = [];
    var transfers = [];
    var holders = [];
    var totalAmount = txsResult[0].amount;
    var totalHoldersCnt = totalholdersReults.length;

    txsIssued.forEach(txIssued => {
      issuedAsset += txIssued.amount;
    });

    holdersReults.forEach(holderResult => {
      holders.push({
        address : holderResult.address,
        balance : holderResult.balance,
        percentage : (holderResult.balance  * 100) / totalAmount
      });
    });

    var retTx = commonf.getFormatedAsset(txsResult[0], issuedAsset, addresses, transactions, transfers, holders, totalHoldersCnt);
    res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, retTx, res);
  }
  catch(err) {
    var bodyErrMsg = ["Connection Error"];
    res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_connection_err, null, res);
  }
}

router.get('/:offset/:limit', function(req, res, next){
  var offset = req.params.offset;
  var limit = req.params.limit;

  if (commonf.isNumber(offset)) {
    offset = Number.parseInt(offset, 10);
  } else {
    offset = -1;
  }

  if (commonf.isNumber(limit)) {
    limit = Number.parseInt(limit, 10);
  } else {
    limit = -1;
  }

  console.log("Get Assets API was called, Params => Offset : " + offset + " Limit : ", limit);
  logger.info("Get Assets API was called, Params => Offset : " + offset + " Limit : ", limit);
  getAssets(offset, limit, res);
});

router.get('/', function(req, res, next){
  var offset = 0;
  var limit = 20;
  console.log("Get assets api was called, Params => Offset : 0, Limit : 20");
  logger.info("Get assets api was called, Params => Offset : 0, Limit : 20");
  getAssets(offset, limit, res);
});

router.get('/all', function(req, res, next){
  var offset = -1;
  var limit = -1;
  console.log("Get all assets api was called.");
  logger.info("Get all assets api was called.");
  getAssets(offset, limit, res);
});

router.get('/:hash/:offset/:limit', function(req, res, next){
  var hash = req.params.hash;
  var offset = req.params.offset;
  var limit = req.params.limit;

  if (commonf.isNumber(offset)) {
    offset = Number.parseInt(offset, 10);
  } else {
    offset = -1;
  }

  if (commonf.isNumber(limit)) {
    limit = Number.parseInt(limit, 10);
  } else {
    limit = -1;
  }

  console.log("Get assets api was called, Params => Hash : " + hash);
  logger.info("Get assets api was called, Params => Hash : " + hash);
  getAsset(hash, offset, limit, res);
});

router.get('/:hash', function(req, res, next){
  var hash = req.params.hash;
  
  console.log("Get assets api was called, Params => Hash : " + hash);
  logger.info("Get assets api was called, Params => Hash : " + hash);
  getAsset(hash, 0, 20, res);
});
module.exports = router;