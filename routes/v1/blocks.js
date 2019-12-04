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

function getBlock(height, res) {
	async.waterfall([
		function getConn(callback) {
      
      callback(null, syncConnection, height);
      /*
			pool.getConnection(function(err,conn) {
				var connection = conn;
				if (err)
				{
					callback(err, connection, constants.ERR_CONSTANTS.db_connection_err);
				}
				else
				{
					callback(null, connection, height);
				}
      });
      */
		},
		function getBlockFromHeight(connection, height, callback) {
      var sqlBlocks = "SELECT * FROM blocks WHERE block_number=?";
      var sqlTxs = "SELECT transactions.*, blocks.time FROM transactions LEFT JOIN blocks ON transactions.block_number=blocks.block_number WHERE transactions.block_number=?";

      if (height == -1) {
        var bodyErrMsg = ["Page is not a valid integer", "height is not a valid integer"];
        callback(bodyErrMsg, connection, constants.ERR_CONSTANTS.api_param_format_err);
        return;
      }
      try {
        const blockResult = connection.query(sqlBlocks, [height]);

        if (blockResult.length > 0) {
          const txsResult = connection.query(sqlTxs, [height]);
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
          callback(null, connection, constants.ERR_CONSTANTS.success, formatedBlock);
        }
        else {
          var bodyErrMsg = ["Page is not a valid integer", "height is not a valid integer"];
          callback(bodyErrMsg, connection, constants.ERR_CONSTANTS.db_not_found_err);
        }
      }
      catch (err) {
        var bodyErrMsg = ["Connection Error"];
        callback(err, connection, constants.ERR_CONSTANTS.db_connection_err);
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

function getBlocks(offset, limit, res) {
	async.waterfall([
		function getBlocksFromParams(callback) {
			var sqlBlocks = "SELECT * FROM blocks ORDER BY block_number DESC LIMIT ?, ?";
      var sqlTxs = "SELECT * FROM transactions WHERE block_number=?";
      var sqlRecentBlocks = "SELECT * FROM blocks ORDER BY block_number DESC LIMIT ?";
      var sqlTxsFromBlocks = "SELECT * FROM transactions WHERE block_number>= ? AND block_number <= ? ORDER BY block_number";

      if (offset == -2 && limit == -2) {
        var bodyErrMsg = ["Page is not a valid integer", "Offset parameter and limit parameter are not a valid integer"];
        callback(bodyErrMsg, syncConnection, constants.ERR_CONSTANTS.db_not_found_err);
        return;
      }
      if (offset == -2) {
        var bodyErrMsg = ["Page is not a valid integer", "Offset parameter is not a valid integer"];
        callback(bodyErrMsg, syncConnection, constants.ERR_CONSTANTS.db_not_found_err);
        return;
      }
      if (limit == -2) {
        var bodyErrMsg = ["Page is not a valid integer", "Limit parameter is not a valid integer"];
        callback(bodyErrMsg, syncConnection, constants.ERR_CONSTANTS.db_not_found_err);
        return;
      }

      if (offset == -1) {
        try {
          var blockResult = syncConnection.query(sqlRecentBlocks, [limit]);
          var retBlocks = [];
          blockResult.forEach(block => {
            var formatedBlock = commonf.getFormatedBlockWithoutTransactions(block);
            retBlocks.push(formatedBlock);
          });
  
          var retBody = {total: blockResult[0].block_number, blocks: retBlocks};
          callback(null, syncConnection, constants.ERR_CONSTANTS.success, retBody);
        }
        catch(err) {
          var bodyErrMsg = ["Connection Error"];
          callback(bodyErrMsg, syncConnection, constants.ERR_CONSTANTS.db_connection_err);
        }
      } else {
        try {
          var blockResult = syncConnection.query(sqlBlocks, [offset, limit]);
          var retBlocks = [];

          blockResult.forEach(block => {
            var formatedBlock = commonf.getFormatedBlockWithoutTransactions(block);
            retBlocks.push(formatedBlock);
          });
  
          var recentBlock = syncConnection.query(sqlRecentBlocks, [1]);
          var retBody = {total: recentBlock[0].block_number, blocks: retBlocks};
          callback(null, syncConnection, constants.ERR_CONSTANTS.success, retBody);
        }
        catch(err) {
          var bodyErrMsg = ["Connection Error"];
          callback(bodyErrMsg, syncConnection, constants.ERR_CONSTANTS.db_connection_err);
        }
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