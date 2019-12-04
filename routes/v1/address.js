// config
var env = process.env.NODE_ENV || "development";
var config = require('../../common/config.json')[env];

var constants = require('../constants.js');

// express, controller
var express = require('express');
var router = express.Router();
var commonf = require('../../common/commonf.js');
var cryptof = require('../../common/cryptof.js')
var controller = require('../../controllers/ExplorerController');
var async = require('async');
var syncMysql = require('sync-mysql');
var syncConnection = new syncMysql(config.database);

// log4js
var log4js = require('log4js');
log4js.configure({
    appenders: config.log4js
});
var logger = log4js.getLogger('api');

// Quras
const Quras = require('quras-js');
const rpcServer = new Quras.rpc.RPCClient(Quras.CONST.QURAS_NETWORK.MAIN);

// mysql connection
var mysql = require('mysql');
var pool = mysql.createPool(config.database);
var generator = require('generate-password');
var crypto = require("crypto");

// constants
var RESPONSE_OK = 0;
var RESPONSE_ERR = 1;

router.get('/balance/:addr', function(req, res, next){
    var addr = req.params.addr;
    var asset = undefined;

    console.log("GetBalance addr => " + addr);

    var response = {
        code: RESPONSE_OK,
        msg: '',
        data: {}
    };

    commonf.getUnspent(pool, async, addr, asset, function(err, totals){
        if (err) {
            if (err == "NOTHING")
            {
                logger.error(err);

                response.code = RESPONSE_OK;

                response.data = {balance: 0};
    
                return res.send(JSON.stringify(response));
            }
            else{
                logger.error(err);

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
    });
});

router.get('/history/:addr', function(req, res, next){
    var addr = req.params.addr;
    var asset = undefined;

    console.log("GetBalance addr => " + addr);

    var response = {
        code: RESPONSE_OK,
        msg: '',
        data: {}
    };

    commonf.getTransactionHistory(pool, async, addr, function(err, totals){
        if (err) {
            logger.error(err);

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
});

function getMyAssets(address, res) {
	async.waterfall([
		function getConn(callback) {
      
      callback(null, syncConnection);
		},
		function getAssetsFromOffset(connection, callback) {
      var sqlTx = "SELECT register_transaction.*, transactions.block_number, blocks.time FROM register_transaction LEFT JOIN transactions ON register_transaction.txid=transactions.txid LEFT JOIN blocks ON transactions.block_number=blocks.block_number WHERE admin=? ORDER BY transactions.block_number";

      try {
        var txsResult = connection.query(sqlTx, [address]);

        var sqlIssued = "SELECT asset, amount FROM issue_transaction WHERE ";
        var sqlWhere = '';
        txsResult.forEach(tx => {
          if (sqlWhere.length == 0) {
            sqlWhere += "asset='" + tx.txid + "'";
          }
          else {
            sqlWhere += " OR asset='" + tx.txid + "'";
          }
        });

        sqlIssued += sqlWhere;

        var txsIssued = connection.query(sqlIssued, []); 

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

router.get('/assets/:address', function(req, res, next){

    var address = req.params.address;
  
    console.log("Get my assets api was called.");
    getMyAssets(address, res);
});
module.exports = router;