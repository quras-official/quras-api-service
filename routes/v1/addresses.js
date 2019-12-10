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
      var sqlUtxos = "SELECT utxos.txid, utxos.status, utxos.asset, utxos.value, utxos.claimed, utxos.tx_out_index FROM utxos WHERE utxos.address=?";
      var sqlTransaction = "SELECT transactions.* FROM transactions WHERE transactions.txid IN ";
      var sqlClaimTx = "SELECT claim_transaction.claims,claim_transaction.txid FROM claim_transaction WHERE claim_transaction.txid IN ";
      var sqlContractTx = "SELECT contract_transaction.txid,contract_transaction._from, contract_transaction._to FROM contract_transaction WHERE contract_transaction.txid IN ";
      var sqlEnrollmentTx = "SELECT enrollment_transaction.txid,enrollment_transaction.pubkey FROM enrollment_transaction WHERE enrollment_transaction.txid IN ";
      var sqlInvocationTx = "SELECT invocation_transaction.txid,invocation_transaction.script, invocation_transaction.gas FROM invocation_transaction WHERE invocation_transaction.txid IN ";
      var sqlPublishTx = "SELECT publish_transaction.txid,publish_transaction.contract_code_hash, publish_transaction.contract_code_script, publish_transaction.contract_code_parameters, publish_transaction.contract_code_returntype, publish_transaction.contract_needstorage, publish_transaction.contract_name, publish_transaction.contract_version, publish_transaction.contract_author, publish_transaction.contract_email, publish_transaction.contract_description FROM publish_transaction WHERE publish_transaction.txid IN ";
      var sqlRegisterTx = "SELECT register_transaction.txid,register_transaction.type, register_transaction.name, register_transaction.amount, register_transaction._precision, register_transaction.owner, register_transaction.admin FROM register_transaction WHERE register_transaction.txid IN ";
      var sqlStateTx = "SELECT state_transaction.txid,state_transaction.descriptors FROM state_transaction WHERE state_transaction.txid IN ";
      
      try {
        var txsResult = connection.query(sqlUtxos, [address]);
        var txIds = "(";
        var i = 0;

        for(i = 0; i < txsResult.length ; i ++) 
        {
          txIds += "'" + txsResult[i].txid + "'";
          if (i != txsResult.length - 1)
          {
            txIds += ",";
          }
        }
        txIds += ")";

        var txTransaction = connection.query(sqlTransaction + txIds, []);
        var txClaim = connection.query(sqlClaimTx + txIds, []);
        var txContract = connection.query(sqlContractTx + txIds, []);
        var txEnroll = connection.query(sqlEnrollmentTx + txIds, []);
        var txInvoc = connection.query(sqlInvocationTx + txIds, []);
        var txPublish = connection.query(sqlPublishTx + txIds, []);
        var txRegister = connection.query(sqlRegisterTx + txIds, []);
        var txState = connection.query(sqlStateTx + txIds, []);

        txsResult.forEach(tx => {
          var i;
          tx['size'] = null; tx['tx_type'] = null; tx['version'] = null; tx['attribute'] = null; tx['vin'] = null; tx['vout'] = null; tx['sys_fee'] = null; tx['net_fee'] = null; tx['scripts'] = null; tx['nonce'] = null; tx['time'] = null;
          for(i = 0; i < txTransaction.length; i ++){
            var transactionTx = txTransaction[i];
             if (tx.txid == transactionTx.txid)
             {
              tx['size'] = transactionTx.size;
              tx['tx_type'] = transactionTx.tx_type;
              tx['version'] = transactionTx.version;
              tx['attribute'] = transactionTx.attribute;
              tx['vin'] = transactionTx.vin;
              tx['vout'] = transactionTx.vout;
              tx['sys_fee'] = transactionTx.sys_fee;
              tx['net_fee'] = transactionTx.net_fee;
              tx['scripts'] = transactionTx.scripts;
              tx['nonce'] = transactionTx.nonce;
              tx['time'] = transactionTx.time;
              break;
             }
          }
          
          tx['claims'] = null;
          for(i = 0; i < txClaim.length ; i ++) {
            var claimTx = txClaim[i];
            if (tx.txid == claimTx.txid)
            {
              tx['claims'] = claimTx.claims;
              break;
            }
          }
          
          tx['_from'] = null; tx['_to'] = null;
          for (i = 0;i < txContract.length ; i ++){
            var contractTx = txContract[i];
            if (tx.txid == contractTx.txid)
            {
              tx['_from'] = contractTx._from;
              tx['_to'] = contractTx._to;
              break;
            } 
          }

          tx['pubkey'] = null;
          for (i = 0; i < txEnroll.length; i ++) {
            var enrolTx = txEnroll[i];
            if (tx.txid == enrolTx.txid)
            {
              tx['pubkey'] = enrolTx.pubkey;
              break;
            }
          }
          
          tx['script'] = null; tx['gas'] = null;
          for(i = 0 ;i < txInvoc.length; i ++) {
            var invocTx = txInvoc[i];
            if (tx.txid == invocTx.txid)
            {
              tx['script'] = invocTx.script;
              tx['gas'] = invocTx.gas;
              break;
            }
          }
          
          tx['contract_code_hash'] = null; tx['contract_code_script'] = null; tx['contract_code_parameters'] = null; tx['contract_code_returntype'] = null; tx['contract_needstorage'] = null; tx['contract_name'] = null; tx['contract_version'] = null; tx['contract_author'] = null; tx['contract_email'] = null; tx['contract_description'] = null;
          for(i = 0; i < txPublish.length; i ++) {
            var pubTx = txPublish[i];
            if (tx.txid == pubTx.txid)
            {
              tx['contract_code_hash'] = pubTx.contract_code_hash;
              tx['contract_code_script'] = pubTx.contract_code_script;
              tx['contract_code_parameters'] = pubTx.contract_code_parameters;
              tx['contract_code_returntype'] = pubTx.contract_code_returntype;
              tx['contract_needstorage'] = pubTx.contract_needstorage;
              tx['contract_name'] = pubTx.contract_name;
              tx['contract_version'] = pubTx.contract_version;
              tx['contract_author'] = pubTx.contract_author;
              tx['contract_email'] = pubTx.contract_email;
              tx['contract_description'] = pubTx.contract_description;
              break;
            }
          }
          
          tx['type'] = null; tx['name'] = null; tx['amount'] = null; tx['_precision'] = null; tx['owner'] = null; tx['admin'] = null;
          for(i = 0;i < txRegister.length ; i ++){
            var registerTx = txRegister[i];
            if (tx.txid == registerTx.txid)
            {
              tx['type'] = registerTx.type;
              tx['name'] = registerTx.name;
              tx['amount'] = registerTx.amount;
              tx['_precision'] = registerTx._precision;
              tx['owner'] = registerTx.owner;
              tx['admin'] = registerTx.admin;
              break;
            }
          }
          
          tx['descriptors'] = null;
          for(i = 0;i < txState.length;i ++) {
            var stateTx = txState[i];
            if (tx.txid == stateTx.txid)
            {
              tx['descriptors'] = stateTx.descriptors;
              break;
            }
          }
        });

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
          console.log(data);
          console.log(data_claim);
          console.log(unavailable_claims);
          var available = {amount: data.unclaimed, asset_symbol: 'XQG', asset_hash: "0x" + Quras.CONST.ASSET_ID.QRG, references: unclaims};
          var unavailable = {amount: data_claim.unclaimed, asset_symbol: 'XQG', asset_hash: "0x" + Quras.CONST.ASSET_ID.QRG, references: unavailable_claims};
          var unclaimed = {
              available: available,
              unavailable: unavailable
          };
          var retTx = commonf.getFormatedAddress(txsResult, address, unclaimed);

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

router.get('/:address', function(req, res, next){
  var address = req.params.address;
  console.log("Get Tx API was called, Params => txid : " + address);
  getAddress(address, res);
});

module.exports = router;