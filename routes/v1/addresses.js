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

async function getAddress(address, res) {
  var sqlUtxos = "SELECT txid, status, asset, name, value, claimed, tx_out_index, time FROM utxos WHERE address=?";
  var sqlTransaction = "SELECT txid, time as block_time, tx_type as type FROM tx_history WHERE claim_transaction_address = ? OR contract_transaction_from = ? OR contract_transaction_to = ? OR invocation_transaction_address = ? OR issue_transaction_address = ? OR issue_transaction_to = ? OR miner_transaction_address = ? OR miner_transaction_to = ? OR uploadrequest_transaction_upload_address = ? OR downloadrequest_transaction_upload_address = ? OR downloadrequest_transaction_download_address = ? OR approvedownload_transaction_approve_address = ? OR approvedownload_transaction_download_address = ? OR payfile_transaction_download_address = ? OR payfile_transaction_upload_address = ? ORDER BY time DESC";
  
  try {
    var txsResult = (await mysqlPool.query(sqlUtxos, [address]))[0];

    var txTransaction = (await mysqlPool.query(sqlTransaction, [address, address, address, address, address, address, address, address, address, address, address, address, address, address, address]))[0];

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
    var data_claim = await rpcServer.getClaimAmount(unavailable_claims);
    var data = await rpcServer.getClaimAmount(unclaims);
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
        sqlAssetName += " txid=" + mysql.escape(balance.asset_hash) + "";
      } else {
        sqlAssetName += " OR txid=" + mysql.escape(balance.asset_hash) + "";
      }
      index ++;
    });

    if (retTx.balances.length > 0)
    {
      var assetNames = (await mysqlPool.query(sqlAssetName, []))[0];

      retTx.balances.forEach(balance => {
        assetNames.forEach(name => {
          if (balance.asset_hash == name.txid) {
            balance.asset_symbol = name.name;
          }
        });
      });
    }
      
    res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, retTx, res);
  } catch (err) {
    var bodyErrMsg = ["Connection Error"];
    res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_connection_err, null, res);
  }
}

async function getStorageWallets(durationDays, uploadPrice, copy, res) {
  var storageResults = null;
  try {
    if (copy == -1) {
      var sqlStorageWallet = "SELECT address, storage_size, current_size, aurantee_amount_per_gb, pay_amount_per_gb, end_time, rate From storate_wallets";
      storageResults = (await mysqlPool.query(sqlStorageWallet, []))[0];
    } else {
      var sqlStorageWallet = "SELECT address, storage_size, current_size, aurantee_amount_per_gb, pay_amount_per_gb, end_time, rate From storate_wallets "
                                + "WHERE `end_time` >= NOW() + 1000 * 3600 * 24 * ? AND pay_amount_per_gb <= ? ORDER BY rate DESC LIMIT 0, ?";
      storageResults = (await mysqlPool.query(sqlStorageWallet, [durationDays, uploadPrice, copy]))[0];
    }

    if (storageResults == null) {
      var bodyErrMsg = ["Connection Error"];
      res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_connection_err, null, res);
    } else {
      res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, storageResults, res);
    }
  } catch (err) {
    var bodyErrMsg = ["Connection Error"];
    res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_connection_err, null, res);
  }
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