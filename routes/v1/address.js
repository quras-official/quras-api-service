// config
var env = process.env.NODE_ENV || "development";
var config = require('../../common/config.json')[env];

var constants = require('../constants.js');

// express, controller
var express = require('express');
var router = express.Router();
var commonf = require('../../common/commonf.js');
var controller = require('../../controllers/ExplorerController');
var async = require('async');
// var syncMysql = require('sync-mysql');
// var syncConnection = new syncMysql(config.database);
var mysql = require('mysql');

// log
const opts = {
  errorEventName:'info',
      logDirectory:'./logs', // NOTE: folder must exist and be writable...
      fileNamePattern:'api.log-<DATE>',
      dateFormat:'YYYY-MM-DD'
};
const logger = require('simple-node-logger').createRollingFileLogger( opts );

// Quras
const Quras = require('quras-js');
const rpcServer = new Quras.rpc.RPCClient(Quras.CONST.QURAS_NETWORK.MAIN);

// mysql connection
var mysql = require('mysql');
// var pool = mysql.createPool(config.database);
var generator = require('generate-password');
var crypto = require("crypto");

// constants
var RESPONSE_OK = 0;
var RESPONSE_ERR = 1;

router.get('/balance/:addr', function(req, res, next){
    var addr = req.params.addr;
    var asset = undefined;

    console.log("GetBalance addr => " + addr);
    logger.info("GetBalance addr => " + addr);

    var response = {
        code: RESPONSE_OK,
        msg: '',
        data: {}
    };

    commonf.getUnspent(mysqlPool, async, addr, asset, function(err, totals){
        if (err) {
            if (err == "NOTHING")
            {
                response.code = RESPONSE_OK;

                response.data = {balance: 0};
    
                return res.send(JSON.stringify(response));
            }
            else{
                response.code = RESPONSE_ERR;
    
                return res.send(JSON.stringify(response));
            }
        } else {
            var balance_data = controller.getStyledBalance(addr, Quras.CONST.QURAS_NETWORK.MAIN, totals);

            response.data = {
                balance : balance_data
            };
            res.send(JSON.stringify(response));
        }
        logger.info("GetBalance Response => " + JSON.stringify(response));
    });
});

async function getTxHistory(addr, from, count, res) {
  var response = {
      code: RESPONSE_OK,
      msg: '',
      data: {}
  };

  var scriptHash = Quras.wallet.getScriptHashFromAddress(addr);
  rpcServer.getMemPoolTransaction(scriptHash)
  .then((data) => {
    if (data.length > from) {
      if (data.length >= from + count) {
        var balance_data = data.slice(from, from + count);

        console.log(balance_data);

        response.data = {
            history : balance_data
        };
        res.send(JSON.stringify(response));
      } else {
        var balance_data = data.slice(from, data.length);

        commonf.getTransactionHistory(mysqlPool, async, addr, 0, from + count - data.length, function(err, totals){
          if (err) {
            response.code = RESPONSE_ERR;
  
            return res.send(JSON.stringify(response));
          } else {
            balance_data = balance_data.concat(totals);

            console.log(balance_data);

            response.data = {
                history : balance_data
            };
            res.send(JSON.stringify(response));
          }
        });
      }
    } else {
      commonf.getTransactionHistory(mysqlPool, async, addr, from - data.length, count,  function(err, totals){
        if (err) {
          response.code = RESPONSE_ERR;

          return res.send(JSON.stringify(response));
        } else {
            var balance_data = totals;

            console.log(balance_data);

            response.data = {
                history : balance_data
            };
            res.send(JSON.stringify(response));
        }
      });
    }
  })
  .catch ((error) => {
    response.code = RESPONSE_ERR;

    return res.send(JSON.stringify(response));
  });
}

router.get('/history/:addr', function(req, res, next){
    var addr = req.params.addr;
    var asset = undefined;

    console.log("GetHistory addr => " + addr);
    logger.info("GetHistory addr => " + addr);

    getTxHistory(addr, 0, 30, res);
});

async function getMyAssets(address, res) {
  var sqlTx = "SELECT register_transaction.* FROM register_transaction WHERE admin=? ORDER BY block_number";

  try {
    var txsResult = (await mysqlPool.query(sqlTx, [address]))[0];

    var sqlIssued = "SELECT asset, amount FROM issue_transaction WHERE ";
    var sqlWhere = '';
    txsResult.forEach(tx => {
      if (sqlWhere.length == 0) {
        sqlWhere += "asset=" + mysql.escape(tx.txid) + "";
      }
      else {
        sqlWhere += " OR asset=" + mysql.escape(tx.txid) + "";
      }
    });

    sqlIssued += sqlWhere;

    var txsIssued = (await mysqlPool.query(sqlIssued, []))[0]; console.log(txsResult);

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
    var retTx = commonf.getFormatedMyAssets(txsResult);
    res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, retTx, res);
  }
  catch(err) {
    var bodyErrMsg = ["Connection Error"];
    res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_connection_err, null, res);
  }
}

async function getMultiSignAddress(address, res) {
  var likeAddr = '%' + address + '%';
  var sqlTx = "SELECT address FROM register_multisign_transaction WHERE pubkeys like ? ORDER BY block_number";
  var ret = [];

  try {
    var txsResult = (await mysqlPool.query(sqlTx, [likeAddr]))[0];

    txsResult.forEach(tx => {
      ret.push(tx.address);
    });

    res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, ret, res);
  }
  catch(err) {
    var bodyErrMsg = ["Connection Error"];
    res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_connection_err, null, res);
  }
}

async function getMultiSignMembers(address, res) {
  var sqlTx = "SELECT pubkeys FROM register_multisign_transaction WHERE address = ? ORDER BY block_number";
  var ret = [];

  try {
    var txsResult = (await mysqlPool.query(sqlTx, [address]))[0][0];

    var jpubkeys = JSON.parse(txsResult.pubkeys);
    jpubkeys.forEach(pubkey => {
      ret.push(pubkey.Address);
    });

    res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, ret, res);
  }
  catch(err) {
    var bodyErrMsg = ["Connection Error"];
    res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_connection_err, null, res);
  }
}

async function getMultiSignMemberPubkeys(address, res) {
  var sqlTx = "SELECT pubkeys FROM register_multisign_transaction WHERE address = ? ORDER BY block_number";
  var ret = [];

  try {
    var txsResult = (await mysqlPool.query(sqlTx, [address]))[0][0];

    var jpubkeys = JSON.parse(txsResult.pubkeys);
    jpubkeys.forEach(pubkey => {
      ret.push(pubkey.PublicKey);
    });

    res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, ret, res);
  }
  catch(err) {
    var bodyErrMsg = ["Connection Error"];
    res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_connection_err, null, res);
  }
}

router.get('/assets/:address', function(req, res, next){

    var address = req.params.address;
  
    console.log("Get my assets api was called.");
    logger.info("Get my assets api was called.");
    getMyAssets(address, res);
});

router.get('/multi/:address', function(req, res, next){

  var address = req.params.address;

  console.log("Get my multi sign addresses api was called.");
  logger.info("Get my multi sign addresses api was called.");
  getMultiSignAddress(address, res);
});

router.get('/multi/members/:address', function(req, res, next){

  var address = req.params.address;

  console.log("Get my multi sign members api was called.");
  logger.info("Get my multi sign members api was called.");
  getMultiSignMembers(address, res);
});

router.get('/multi/member_pubkeys/:address', function(req, res, next){

  var address = req.params.address;

  console.log("Get my multi sign members pubkeys api was called.");
  logger.info("Get my multi sign members pubkeys api was called.");
  getMultiSignMemberPubkeys(address, res);
});
module.exports = router;