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

function getTx(txid, res) {
	async.waterfall([
		function getConn(callback) {
      
      callback(null, syncConnection, txid);
		},
		function getTxFromTxid(connection, txid, callback) {
      var sqlTx = "SELECT transactions.*, blocks.time, blocks.hash FROM transactions LEFT JOIN blocks ON transactions.block_number=blocks.block_number WHERE txid=?";

      try {
        var txsResult = connection.query(sqlTx, [txid]);

        // Get Transaction Exclusive fields
        var exclusive = {};
        if (txsResult[0].tx_type == "MinerTransaction") {
          var sqlExclusiveTx = "SELECT miner_transaction.*, register_transaction.name FROM miner_transaction LEFT JOIN register_transaction ON register_transaction.name = \'XQG\' WHERE miner_transaction.txid=?";
          exclusive = connection.query(sqlExclusiveTx, [txid]);
        } else if (txsResult[0].tx_type == "IssueTransaction") {
          var sqlExclusiveTx = "SELECT issue_transaction.*, register_transaction.name FROM issue_transaction LEFT JOIN register_transaction ON issue_transaction.asset = register_transaction.txid WHERE issue_transaction.txid=?";
          exclusive = connection.query(sqlExclusiveTx, [txid]);
        } else if (txsResult[0].tx_type == "ClaimTransaction") {
          var sqlExclusiveTx = "SELECT claim_transaction.*, register_transaction.name FROM claim_transaction LEFT JOIN register_transaction ON register_transaction.name=\'XQG\' WHERE claim_transaction.txid=?";
          exclusive = connection.query(sqlExclusiveTx, [txid]);
        } else if (txsResult[0].tx_type == "EnrollmentTransaction") {
          var sqlExclusiveTx = "SELECT * FROM enrollment_transaction WHERE txid=?";
          exclusive = connection.query(sqlExclusiveTx, [txid]);
        } else if (txsResult[0].tx_type == "RegisterTransaction") {
          var sqlExclusiveTx = "SELECT * FROM register_transaction WHERE txid=?";
          exclusive = connection.query(sqlExclusiveTx, [txid]);
        } else if (txsResult[0].tx_type == "ContractTransaction") {
          var sqlExclusiveTx = "SELECT contract_transaction.*, register_transaction.name FROM contract_transaction LEFT JOIN register_transaction ON contract_transaction.asset = register_transaction.txid WHERE contract_transaction.txid=?";
          exclusive = connection.query(sqlExclusiveTx, [txid]);
        } else if (txsResult[0].tx_type == "AnonymousContractTransaction") {
          var sqlExclusiveTx = "SELECT * FROM anonymous_contract_transaction WHERE txid=?";
          exclusive = connection.query(sqlExclusiveTx, [txid]);
        } else if (txsResult[0].tx_type == "PublishTransaction") {
          var sqlExclusiveTx = "SELECT * FROM publish_transaction WHERE txid=?";
          exclusive = connection.query(sqlExclusiveTx, [txid]);
        } else if (txsResult[0].tx_type == "InvocationTransaction") {
          var sqlExclusiveTx = "SELECT * FROM invocation_transaction WHERE txid=?";
          exclusive = connection.query(sqlExclusiveTx, [txid]);
        }

        // Get vin and vout fields.
        var vins = JSON.parse(txsResult[0].vin);
        var vouts = JSON.parse(txsResult[0].vout);

        var sqlFindUtxos = "SELECT utxos.*, register_transaction.name, register_transaction.txid FROM `utxos` RIGHT JOIN register_transaction ON utxos.asset = register_transaction.txid WHERE ";

        var vinUtxos;
        if (vins.length > 0) {
          var index = 0;
          vins.forEach(vin => {
            var sqlWhere = "";
            if (index == 0) {
              sqlWhere = "(utxos.txid='" + vin.txid + "' AND tx_out_index=" + vin.vout + ")";
            } else {
              sqlWhere = " OR (utxos.txid='" + vin.txid + "' AND tx_out_index=" + vin.vout + ")";
            }
            sqlFindUtxos += sqlWhere;
            index ++;
          });
          vinUtxos = connection.query(sqlFindUtxos, []);
        } else {
          vinUtxos = [];
        }
        
        var voutUtxos;
        if (vouts.length > 0) {
          sqlFindUtxos = "SELECT utxos.*, register_transaction.name, register_transaction.txid FROM `utxos` RIGHT JOIN register_transaction ON utxos.asset = register_transaction.txid WHERE ";
          index = 0;
          vouts.forEach(vout => {
            var sqlWhere = "";
            if (index == 0) {
              sqlWhere = "(utxos.txid='" + txid + "' AND tx_out_index=" + vout.n + ")";
            } else {
              sqlWhere = " OR (utxos.txid='" + txid + "' AND tx_out_index=" + vout.n + ")";
            }
            sqlFindUtxos += sqlWhere;
            index ++;
          });
          voutUtxos = connection.query(sqlFindUtxos, []);
        } else {
          voutUtxos = [];
        }
        
        var retTx = commonf.getFormatedTxInDetails(txsResult[0], vinUtxos, voutUtxos, exclusive);

        var body = retTx;
        callback(null, connection, constants.ERR_CONSTANTS.success, body);
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
        res.status(200).send(result);
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

function getTransactions(offset, limit, res) {
	async.waterfall([
		function getTxsFromParams(callback) {
      var sqlTxs = "SELECT transactions.*, blocks.time FROM transactions LEFT JOIN blocks ON transactions.block_number=blocks.block_number ORDER BY block_number DESC LIMIT ?";

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
          var txsResult = syncConnection.query(sqlTxs, [limit]);
          var retTxs = [];

          txsResult.forEach(tx => {
            retTxs.push(commonf.getFormatedTx(tx));
          });

          var body = {total: 100, txs: retTxs};
          callback(null, syncConnection, constants.ERR_CONSTANTS.success, body);
        }
        catch(err) {
          var bodyErrMsg = ["Connection Error"];
          callback(bodyErrMsg, syncConnection, constants.ERR_CONSTANTS.db_connection_err);
        }
      } else {
        try {
          var txsResult = syncConnection.query(sqlTxs, [limit]);
          var retTxs = [];

          txsResult.forEach(tx => {
            retTxs.push(commonf.getFormatedTx(tx));
          });

          var body = {total: 100, txs: retTxs};
          callback(null, syncConnection, constants.ERR_CONSTANTS.success, retBlocks);
        }
        catch(err) {
          var bodyErrMsg = ["Connection Error"];
          callback(bodyErrMsg, syncConnection, constants.ERR_CONSTANTS.db_connection_err);
        }
      }
		},
	],
		function(err, connection, code, result) {
			var body;

			if (err)
			{
				body = {"errors": err};
        logger.info(err, code);
        var result = JSON.stringify(body);
        res.setHeader('content-type', 'text/plain');
        res.status(200).send(result);
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

  console.log("Get Txs API was called, Params => offset : " + offset + ", limit : " + limit);
  getTransactions(offset, limit, res);
});

router.get('/:txid', function(req, res, next){
  var txid = req.params.txid;
  var prefix = txid.substring(0, 2);

  if (prefix != '0x') {
    txid = '0x' + txid;
  }
  console.log("Get Tx API was called, Params => txid : " + txid);
  getTx(txid, res);
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

  console.log("Get txs API was called, Params => offset : " + offset + ", limit : " + limit);
  getTransactions(offset, limit, res);
});

module.exports = router;