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

async function getAddress(address, res) {
  var sqlUtxos = "SELECT txid, status, asset, name, value, claimed, tx_out_index, time FROM utxos WHERE address=?";
  var sqlTransaction = "SELECT txid, time as block_time, tx_type as type FROM tx_history WHERE claim_transaction_address = ? OR contract_transaction_from = ? OR contract_transaction_to = ? OR invocation_transaction_address = ? OR issue_transaction_address = ? OR issue_transaction_to = ? OR miner_transaction_address = ? OR miner_transaction_to = ? OR uploadrequest_transaction_upload_address = ? OR downloadrequest_transaction_upload_address = ? OR downloadrequest_transaction_download_address = ? OR approvedownload_transaction_approve_address = ? OR approvedownload_transaction_download_address = ? OR payfile_transaction_download_address = ? OR payfile_transaction_upload_address = ? ORDER BY time DESC";
  var sqlStorageWallet = "SELECT id From storage_wallets WHERE address = ?"

  var isStorageWallet = false;

  try {
    var txsResult = (await mysqlPool.query(sqlUtxos, [address]))[0];

    var txTransaction = (await mysqlPool.query(sqlTransaction, [address, address, address, address, address, address, address, address, address, address, address, address, address, address, address]))[0];

    var txStorageWallets = (await mysqlPool.query(sqlStorageWallet, [address]))[0];

    txStorageWallets.forEach(storagewallet => {
      isStorageWallet = true;
    });
    

    // Filter unclaimed tx
    var unclaims = [];
    var unavailable_claims = [];
    txsResult.forEach(tx => {
      if (tx.claimed != 1 && tx.asset == "0x" + Quras.CONST.ASSET_ID.XQC && tx.txid != null && tx.status == "spent") {
        var unclaim = {
          txid : tx.txid,
          vout : tx.tx_out_index
        }
        unclaims.push(unclaim)
      }
      else if (tx.claimed != 1 && tx.asset == "0x" + Quras.CONST.ASSET_ID.XQC && tx.txid != null && tx.status == "unspent") {
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

    retTx.is_storage_wallet = isStorageWallet;
      
    res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, retTx, res);
  } catch (err) {
    var bodyErrMsg = ["Connection Error"];
    res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_connection_err, null, res);
  }
}

async function getStorageWallets(endDayTimestamp, uploadPrice, res) {
  var storageResults = null;
  try {
    if (uploadPrice == -1) {
      var sqlStorageWallet = "SELECT address, storage_size, current_size, gurantee_amount_per_gb, pay_amount_per_gb, end_time, rate From storage_wallets";
      storageResults = (await mysqlPool.query(sqlStorageWallet, []))[0];
    } else {
      var sqlStorageWallet = "SELECT address, storage_size, current_size, gurantee_amount_per_gb, pay_amount_per_gb, end_time, rate From storage_wallets "
                                + "WHERE `end_time` >= ? AND pay_amount_per_gb <= ? ORDER BY rate";
      storageResults = (await mysqlPool.query(sqlStorageWallet, [endDayTimestamp, uploadPrice]))[0];
    }

    for(var i = 0; i < storageResults.length; i ++) {
      var sqlStateTransaction = "SELECT block_number FROM state_transaction WHERE state_script LIKE '0000' AND from_address LIKE ?";
      var scriptHash = Quras.wallet.getScriptHashFromAddress(storageResults[i]["address"]);
      stateResult = (await mysqlPool.query(sqlStateTransaction, ["0x" + scriptHash]))[0];
      storageResults[i]['file_count'] = stateResult.length;
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

async function getStorageWallets_be(offset, limit, res) {
  var storageResults = null;
  try {
      var sqlStorageWallet = "SELECT address, storage_size, current_size, gurantee_amount_per_gb, pay_amount_per_gb, end_time, rate From storage_wallets WHERE end_time > NOW() LIMIT ?,?";
      var sqlTotal = "SELECT id FROM storage_wallets WHERE end_time > NOW()";
      storageResults = (await mysqlPool.query(sqlStorageWallet, [offset, limit]))[0];
      for(var i = 0; i < storageResults.length; i ++) {
        var sqlStateTransaction = "SELECT block_number FROM state_transaction WHERE state_script LIKE '0000' AND from_address LIKE ?";
        var scriptHash = Quras.wallet.getScriptHashFromAddress(storageResults[i]["address"]);
        stateResult = (await mysqlPool.query(sqlStateTransaction, ["0x" + scriptHash]))[0];
        storageResults[i]['file_count'] = stateResult.length;
      }
      var totalResults = (await mysqlPool.query(sqlTotal, []))[0];

      var response = {};

    if (storageResults == null) {
      var bodyErrMsg = ["Connection Error"];
      res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_connection_err, null, res);
    } else {
      response.wallets = storageResults;
      response.total = totalResults.length;
      res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, response, res);
    }
  } catch (err) {
    var bodyErrMsg = ["Connection Error"];
    res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_connection_err, null, res);
  }
}

async function getStorageWallet(addr, res) {
  var storageResults = null;
  try {
    var sqlStorageWallet = "SELECT address, storage_size, current_size, gurantee_amount_per_gb, pay_amount_per_gb, end_time, rate From storage_wallets WHERE address = ?";
    storageResults = (await mysqlPool.query(sqlStorageWallet, [addr]))[0];

    for(var i = 0; i < storageResults.length; i ++) {
      var sqlStateTransaction = "SELECT block_number FROM state_transaction WHERE state_script LIKE '0000' AND from_address LIKE ?";
      var scriptHash = Quras.wallet.getScriptHashFromAddress(storageResults[i]["address"]);
      stateResult = (await mysqlPool.query(sqlStateTransaction, ["0x" + scriptHash]))[0];
      storageResults[i]['file_count'] = stateResult.length;
    }

    if (storageResults == null) {
      var bodyErrMsg = ["Connection Error"];
      res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_connection_err, null, res);
    } else {
      res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, storageResults[0], res);
    }
  } catch (err) {
    var bodyErrMsg = ["Connection Error"];
    res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_connection_err, null, res);
  }
}

async function getStorageFailure(addr, res) {
  var storageResults = null;
  try {
    var sqlStorageWallet = "SELECT amount, utxid, upload_size, from_address From pay_upload_transaction WHERE to_address = ?";
    storageResults = (await mysqlPool.query(sqlStorageWallet, [addr]))[0];

    if (storageResults == null) {
      var bodyErrMsg = ["Connection Error"];
      res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_connection_err, null, res);
    } else {
      res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, storageResults[0], res);
    }
  } catch (err) {
    var bodyErrMsg = ["Connection Error"];
    res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_connection_err, null, res);
  }
}

router.get('/storagewallet/:endDayTimestamp/:uploadPrice', function(req, res, next){
  var endDayTimestamp = req.params.endDayTimestamp;
  var uploadPrice = req.params.uploadPrice;
  console.log("Get Stroage Wallets API was called, Params => durationDays : " + endDayTimestamp + ", uploadPrice : " + uploadPrice);
  logger.info("Get Stroage Wallets API was called, Params => durationDays : " + endDayTimestamp + ", uploadPrice : " + uploadPrice);
  getStorageWallets(endDayTimestamp, uploadPrice, res);
});

router.get('/storagewallet_be/:offset/:limit', function(req, res, next){
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
  
  console.log("Get All Stroage Wallets API was called, Params => offset : " + offset + ", limit : " + limit);
  logger.info("Get All Stroage Wallets API was called, Params => offset : " + offset + ", limit : " + limit);
  getStorageWallets_be(offset, limit, res);
});

router.get('/storagewallet_be', function(req, res, next){
  var offset = 0;
  var limit = 20;
  
  console.log("Get All Stroage Wallets API was called, Params => offset : " + offset + ", limit : " + limit);
  logger.info("Get All Stroage Wallets API was called, Params => offset : " + offset + ", limit : " + limit);
  getStorageWallets_be(offset, limit, res);
});

router.get('/storagewallet/uploads/failure/payupload/:address', function(req, res, next){
  var address = req.params.address;
  console.log("Get Storage Failure List from uploads => address : " + address);
  logger.info("Get Storage Failure List from uploads => address : " + address);
  getStorageFailure(address, res);
});

router.get('/storagewallet/:addr', function(req, res, next){
  var address = req.params.addr;
  console.log("Get Stroage Wallet API was called => address : " + address);
  logger.info("Get Stroage Wallet API was called => address : " + address);
  getStorageWallet(address, res);
});

router.get('/:address', function(req, res, next){
  var address = req.params.address;
  console.log("Get Tx API was called, Params => txid : " + address);
  logger.info("Get Tx API was called, Params => txid : " + address);
  getAddress(address, res);
});

module.exports = router;