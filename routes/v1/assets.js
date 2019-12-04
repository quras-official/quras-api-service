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

function getAssets(offset, limit, res) {
	async.waterfall([
		function getConn(callback) {
      
      callback(null, syncConnection, offset, limit);
		},
		function getAssetsFromOffset(connection, offset, limit, callback) {
      var sqlTx = "SELECT register_transaction.*, transactions.block_number, blocks.time FROM register_transaction LEFT JOIN transactions ON register_transaction.txid=transactions.txid LEFT JOIN blocks ON transactions.block_number=blocks.block_number ORDER BY transactions.block_number";
      if (offset != -1 || limit != -1) {
        sqlTx += " LIMIT ?, ?";
      }
      
      try {
        var txsResult = connection.query(sqlTx, [offset, limit]);

        var hash = [];
        var index = 0;
        var sqlIssued = "SELECT utxos.* FROM issue_transaction LEFT JOIN utxos on issue_transaction.txid=utxos.txid WHERE ";
        txsResult.forEach(tx => {
          if (index == 0) {
            sqlIssued += "utxos.asset='" + tx.txid + "'";
          }
          else {
            sqlIssued += " OR utxos.asset='" + tx.txid + "'";
          }
          index ++;
        });

        var txsIssued = connection.query(sqlIssued, []); 

        txsResult.forEach(tx => {
          var iAmount = 0;
          txsIssued.forEach(issuedItem => {
            if (issuedItem.asset == tx.txid) {
              iAmount += issuedItem.value;
            }
          });

          tx.issuedAmount = iAmount;
          tx.address_count = 0;
          tx.transaction_count = 0;
        });
        var retTx = commonf.getFormatedAssets(txsResult);
        callback(null, connection, constants.ERR_CONSTANTS.success, retTx);
      }
      catch(err) {
        var bodyErrMsg = ["Connection Error"];
        callback(bodyErrMsg, connection, constants.ERR_CONSTANTS.db_connection_err);
      }
		}
	],
		function(err, connection, code, result) {
			var body;

			if (err)
			{
				body = {"errors": err};
        logger.info(err, code);
        var result = JSON.stringify(body);
        res.setHeader('content-type', 'text/plain');
        res.status(400).send(result);
			}
			else
			{
        body = result;
        var result = JSON.stringify(body);
        res.setHeader('content-type', 'text/plain');
        res.status(200).send(result);
			}
		}
	);
}

function getAsset(hash, res) {
	async.waterfall([
		function getConn(callback) {
      
      callback(null, syncConnection, hash);
		},
		function getAssetsFromHash(connection, hash, callback) {
      var sqlTx = "SELECT register_transaction.*, transactions.block_number, blocks.time FROM register_transaction LEFT JOIN transactions ON register_transaction.txid=transactions.txid LEFT JOIN blocks ON transactions.block_number=blocks.block_number WHERE register_transaction.txid=?";
      var sqlIssued = "SELECT utxos.* FROM issue_transaction LEFT JOIN utxos on issue_transaction.txid=utxos.txid WHERE utxos.asset=?";
      try {
        var txsResult = connection.query(sqlTx, [hash]);
        var txsIssued = connection.query(sqlIssued, [hash]);

        var issuedAsset = 0;
        var transactions = [];
        var addresses = [];
        var transfers = [];

        txsIssued.forEach(txIssued => {
          issuedAsset += txIssued.value;
        });

        var retTx = commonf.getFormatedAsset(txsResult[0], issuedAsset, addresses, transactions, transfers);
        callback(null, connection, constants.ERR_CONSTANTS.success, retTx);
      }
      catch(err) {
        var bodyErrMsg = ["Connection Error"];
        callback(bodyErrMsg, connection, constants.ERR_CONSTANTS.db_connection_err);
      }
		}
	],
		function(err, connection, code, result) {
			var body;

			if (err)
			{
				body = {"errors": err};
        logger.info(err, code);
        var result = JSON.stringify(body);
        res.setHeader('content-type', 'text/plain');
        res.status(400).send(result);
			}
			else
			{
        body = result;
        var result = JSON.stringify(body);
        res.setHeader('content-type', 'text/plain');
        res.status(200).send(result);
			}
		}
	);
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
  getAssets(offset, limit, res);
});

router.get('/', function(req, res, next){
  var offset = 0;
  var limit = 20;
  console.log("Get assets api was called, Params => Offset : 0, Limit : 20");
  getAssets(offset, limit, res);
});

router.get('/all', function(req, res, next){
  var offset = -1;
  var limit = -1;
  console.log("Get all assets api was called.");
  getAssets(offset, limit, res);
});

router.get('/:hash', function(req, res, next){
  var hash = req.params.hash;

  console.log("Get assets api was called, Params => Hash : " + hash);
  getAsset(hash, res);
});
module.exports = router;