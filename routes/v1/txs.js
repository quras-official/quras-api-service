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

async function getTx(txid, res) {
  var sqlTx = "SELECT transactions.* FROM transactions WHERE txid=?";

  try {
    var txsResult = (await mysqlPool.query(sqlTx, [txid]))[0];

    // Get Transaction Exclusive fields
    var exclusive = {};
    if (txsResult[0].tx_type == "MinerTransaction") {
      var sqlExclusiveTx = "SELECT miner_transaction.*, \"XQG\" as name FROM miner_transaction WHERE txid=?";
      exclusive = (await mysqlPool.query(sqlExclusiveTx, [txid]))[0];
    } else if (txsResult[0].tx_type == "IssueTransaction") {
      var sqlExclusiveTx = "SELECT issue_transaction.* FROM issue_transaction WHERE txid=?";
      exclusive = (await mysqlPool.query(sqlExclusiveTx, [txid]))[0];
    } else if (txsResult[0].tx_type == "ClaimTransaction") {
      var sqlExclusiveTx = "SELECT claim_transaction.*, \"XQG\" as name FROM claim_transaction WHERE txid=?";
      exclusive = (await mysqlPool.query(sqlExclusiveTx, [txid]))[0];
    } else if (txsResult[0].tx_type == "EnrollmentTransaction") {
      var sqlExclusiveTx = "SELECT * FROM enrollment_transaction WHERE txid=?";
      exclusive = (await mysqlPool.query(sqlExclusiveTx, [txid]))[0];
    } else if (txsResult[0].tx_type == "RegisterTransaction") {
      var sqlExclusiveTx = "SELECT * FROM register_transaction WHERE txid=?";
      exclusive = (await mysqlPool.query(sqlExclusiveTx, [txid]))[0];
    } else if (txsResult[0].tx_type == "ContractTransaction") {
      var sqlExclusiveTx = "SELECT contract_transaction.* FROM contract_transaction WHERE txid=?";
      exclusive = (await mysqlPool.query(sqlExclusiveTx, [txid]))[0];
    } else if (txsResult[0].tx_type == "AnonymousContractTransaction") {
      var sqlExclusiveTx = "SELECT * FROM anonymous_contract_transaction WHERE txid=?";
      exclusive = (await mysqlPool.query(sqlExclusiveTx, [txid]))[0];
    } else if (txsResult[0].tx_type == "PublishTransaction") {
      var sqlExclusiveTx = "SELECT * FROM publish_transaction WHERE txid=?";
      exclusive = (await mysqlPool.query(sqlExclusiveTx, [txid]))[0];
    } else if (txsResult[0].tx_type == "InvocationTransaction") {
      var sqlExclusiveTx = "SELECT * FROM invocation_transaction WHERE txid=?";
      exclusive = (await mysqlPool.query(sqlExclusiveTx, [txid]))[0];
    }

    // Get vin and vout fields.
    var vins = JSON.parse(txsResult[0].vin);
    var vouts = JSON.parse(txsResult[0].vout);

    var sqlFindUtxos = "SELECT utxos.* FROM utxos WHERE ";

    var vinUtxos;
    if (vins.length > 0) {
      var index = 0;
      vins.forEach(vin => {
        var sqlWhere = "";
        if (index == 0) {
          sqlWhere = "(utxos.txid=" + mysql.escape(vin.txid) + " AND tx_out_index=" + mysql.escape(vin.vout) + ")";
        } else {
          sqlWhere = " OR (utxos.txid=" + mysql.escape(vin.txid) + " AND tx_out_index=" +  mysql.escape(vin.vout) + ")";
        }
        sqlFindUtxos += sqlWhere;
        index ++;
      });
      vinUtxos = (await mysqlPool.query(sqlFindUtxos, []))[0];
    } else {
      vinUtxos = [];
    }
    
    var voutUtxos;
    if (vouts.length > 0) {
      sqlFindUtxos = "SELECT utxos.* FROM utxos WHERE ";
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
      voutUtxos = (await mysqlPool.query(sqlFindUtxos, []))[0];
    } else {
      voutUtxos = [];
    }
    
    var retTx = commonf.getFormatedTxInDetails(txsResult[0], vinUtxos, voutUtxos, exclusive);

    var body = retTx;
    res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, body, res);
  }
  catch(err) {
    var bodyErrMsg = ["Connection Error"];
    res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_not_found_err, null, res);
  }
}

async function getTransactions(offset, limit, res) {
  var sqlTxs = "SELECT transactions.* FROM transactions ORDER BY block_number DESC LIMIT ?";

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
      var txsResult = (await mysqlPool.query(sqlTxs, [limit]))[0];
      var retTxs = [];

      if (txsResult == null) {
        throw new Error();
      }

      txsResult.forEach(tx => {
        retTxs.push(commonf.getFormatedTx(tx));
      });

      var body = {total: 100, txs: retTxs};
      res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, body, res);
    }
    catch(err) {
      var bodyErrMsg = ["Connection Error"];
      res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_not_found_err, null, res);
    }
  } else {
    try {
      var txsResult = (await mysqlPool.query(sqlTxs, [limit]))[0];
      var retTxs = [];

      txsResult.forEach(tx => {
        retTxs.push(commonf.getFormatedTx(tx));
      });

      var body = {total: 100, txs: retTxs};
      res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, body, res);
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

  console.log("Get Txs API was called, Params => offset : " + offset + ", limit : " + limit);
  logger.info("Get Txs API was called, Params => offset : " + offset + ", limit : " + limit);
  getTransactions(offset, limit, res);
});

router.get('/:txid', function(req, res, next){
  var txid = req.params.txid;
  var prefix = txid.substring(0, 2);

  if (prefix != '0x') {
    txid = '0x' + txid;
  }
  console.log("Get Tx API was called, Params => txid : " + txid);
  logger.info("Get Tx API was called, Params => txid : " + txid);
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
  logger.info("Get txs API was called, Params => offset : " + offset + ", limit : " + limit);
  getTransactions(offset, limit, res);
});

module.exports = router;