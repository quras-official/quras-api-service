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

function getAddress(address, res) {
	async.waterfall([
		function getConn(callback) {
      
      callback(null, syncConnection, address);
		},
		function getAddressFromAddr(connection, address, callback) {
      //var sqlTx = "SELECT blocks.time, utxos.status, utxos.asset, utxos.value, utxos.claimed, utxos.tx_out_index, transactions.*, claim_transaction.claims, contract_transaction._from, contract_transaction._to, enrollment_transaction.pubkey, invocation_transaction.script, invocation_transaction.gas, publish_transaction.contract_code_hash, publish_transaction.contract_code_script, publish_transaction.contract_code_parameters, publish_transaction.contract_code_returntype, publish_transaction.contract_needstorage, publish_transaction.contract_name, publish_transaction.contract_version, publish_transaction.contract_author, publish_transaction.contract_email, publish_transaction.contract_description, register_transaction.type, register_transaction.name, register_transaction.amount, register_transaction._precision, register_transaction.owner, register_transaction.admin, state_transaction.descriptors FROM `utxos` LEFT JOIN claim_transaction ON utxos.txid=claim_transaction.txid LEFT JOIN enrollment_transaction ON utxos.txid=enrollment_transaction.txid LEFT JOIN invocation_transaction ON utxos.txid=invocation_transaction.txid  LEFT JOIN contract_transaction ON utxos.txid=contract_transaction.txid LEFT JOIN transactions ON utxos.txid=transactions.txid LEFT JOIN issue_transaction ON utxos.txid=issue_transaction.txid LEFT JOIN miner_transaction ON utxos.txid=miner_transaction.txid LEFT JOIN publish_transaction ON utxos.txid=publish_transaction.txid LEFT JOIN register_transaction ON utxos.txid=register_transaction.txid LEFT JOIN state_transaction ON utxos.txid=state_transaction.txid LEFT JOIN blocks ON transactions.block_number=blocks.block_number WHERE utxos.address=? ORDER BY blocks.time DESC";
      var sqlUtxos = "SELECT txid, status, asset, name, value, claimed, tx_out_index, time FROM utxos WHERE address=?";
      var sqlTransaction = "SELECT txid, time as block_time, tx_type as type FROM tx_history WHERE claim_transaction_address = ? OR contract_transaction_from = ? OR contract_transaction_to = ? OR invocation_transaction_address = ? OR issue_transaction_address = ? OR issue_transaction_to = ? OR miner_transaction_address = ? OR miner_transaction_to = ? OR uploadrequest_transaction_upload_address = ? OR downloadrequest_transaction_upload_address = ? OR downloadrequest_transaction_download_address = ? OR approvedownload_transaction_approve_address = ? OR approvedownload_transaction_download_address = ? OR payfile_transaction_download_address = ? OR payfile_transaction_upload_address = ? ORDER BY time DESC";
      
      try {
        var txsResult = connection.query(sqlUtxos, [address]);

        var txTransaction = connection.query(sqlTransaction, [address, address, address, address, address, address, address, address, address, address, address, address, address, address, address]);

        // Filter unclaimed tx
        var unclaims = [];
        var unavailable_claims = [];
        txsResult.forEach(tx => {
          if (tx.claimed != 1 && tx.asset == "0x" + Quras.CONST.ASSET_ID.QRS && tx.txid != null && tx.status == "spent") {
            var unclaim = {
              txid : tx.txid,
              vout : tx.tx_out_index
            }
            unclaims.push(unclaim)
          }
          else if (tx.claimed != 1 && tx.asset == "0x" + Quras.CONST.ASSET_ID.QRS && tx.txid != null && tx.status == "unspent") {
            var unclaim = {
              txid : tx.txid,
              vout : tx.tx_out_index,
              status : 'unspent'
            }
            unavailable_claims.push(unclaim)
          }
        });
        // End filter
        rpcServer.getClaimAmount(unavailable_claims).then((data_claim) => {
        rpcServer.getClaimAmount(unclaims)
        .then((data) => {
          var available = {amount: data.unclaimed, asset_symbol: 'XQG', asset_hash: "0x" + Quras.CONST.ASSET_ID.QRG, references: unclaims};
          var unavailable = {amount: data_claim.unclaimed, asset_symbol: 'XQG', asset_hash: "0x" + Quras.CONST.ASSET_ID.QRG, references: unavailable_claims};
          var unclaimed = {
              available: available,
              unavailable: unavailable
          };
          var retTx = commonf.getFormatedAddress(txsResult, address, txTransaction, unclaimed);

          var sqlAssetName = "SELECT name, txid FROM register_transaction WHERE";
  
          var index = 0;
          retTx.balances.forEach(balance => {
            if (index == 0) {
              sqlAssetName += " txid='" + balance.asset_hash + "'";
            } else {
              sqlAssetName += " OR txid='" + balance.asset_hash + "'";
            }
            index ++;
          });
  
          if (retTx.balances.length > 0)
          {
            var assetNames = connection.query(sqlAssetName, []);
  
            retTx.balances.forEach(balance => {
              assetNames.forEach(name => {
                if (balance.asset_hash == name.txid) {
                  balance.asset_symbol = name.name;
                }
              });
            });
          }
          
          callback(null, connection, constants.ERR_CONSTANTS.success, retTx);
        })
        .catch((err) => {
          var bodyErrMsg = ["Connection Error"];
          callback(bodyErrMsg, connection, constants.ERR_CONSTANTS.db_connection_err);
        })
      })
      .catch((err) => {
        var bodyErrMsg = ["Connection Error"];
        callback(bodyErrMsg, connection, constants.ERR_CONSTANTS.db_connection_err);
      })
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

function getStorageWallets(durationDays, uploadPrice, copy, res) {
	async.waterfall([
		function getConn(callback) {
      
      callback(null, syncConnection, address);
		},
		function getStorageWallet(connection, urationDays, uploadPrice, copy, callback) {
      var storageResults = null;
      if (copy == -1) {
        var sqlStorageWallet = "SELECT address, storage_size, current_size, aurantee_amount_per_gb, pay_amount_per_gb, end_time, rate From storate_wallets";
        try {
          storageResults = connection.query(sqlStorageWallet, []);
        } catch (err) {
          var bodyErrMsg = ["Connection Error"];
          callback(bodyErrMsg, connection, constants.ERR_CONSTANTS.db_connection_err);
        }
      } else {
        var sqlStorageWallet = "SELECT address, storage_size, current_size, aurantee_amount_per_gb, pay_amount_per_gb, end_time, rate From storate_wallets "
                                 + "WHERE `end_time` >= NOW() + 1000 * 3600 * 24 * 2 AND pay_amount_per_gb <= ? ORDER BY rate DESC LIMIT 0, ?";
        try {
          storageResults = connection.query(sqlStorageWallet, []);
        } catch (err) {
          var bodyErrMsg = ["Connection Error"];
          callback(bodyErrMsg, connection, constants.ERR_CONSTANTS.db_connection_err);
        }
      }

      if (storageResults == null) {
        var bodyErrMsg = ["Connection Error"];
        callback(bodyErrMsg, connection, constants.ERR_CONSTANTS.db_connection_err);
      }

      callback(null, connection, constants.ERR_CONSTANTS.success, storageResults);
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

router.get('/:address', function(req, res, next){
  var address = req.params.address;
  console.log("Get Tx API was called, Params => txid : " + address);
  getAddress(address, res);
});

router.get('/storagewallet/', function(req, res, next){
  var address = req.params.address;
  console.log("Get All Stroage Wallets API was called => txid : " + address);
  getStorageWallets(-1, -1, -1, res);
});

router.get('/storagewallet/:durationDays/:uploadPrice/:copy', function(req, res, next){
  var durationDays = req.params.durationDays;
  var uploadPrice = req.params.uploadPrice;
  var copy = req.params.copy;
  console.log("Get Stroage Wallets API was called, Params => durationDays : " + durationDays + ", uploadPrice : " + uploadPrice + ", copy : " + copy);
  getStorageWallets(durationDays, uploadPrice, copy, res);
});

module.exports = router;