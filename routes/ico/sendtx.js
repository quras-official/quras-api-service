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

var ICO_HOLDER_PRIVKEY = 'b3bb07d55905375ab1eb923b2276e1ebf6903ce5770aed4b555e926910a9b126';
var ICO_HOLDER_ADDRESS = 'DknmAbcap8RnUpkLQvbXTwTXqFJMjN4QPz';

router.get('/send', function(req, res, next){
  var addr_field = req.query.addr;
  var asset = req.query.asset;
  var amount_field = req.query.amount;

  var addrs = addr_field.split(',');
  var amounts = amount_field.split(',');

  if (asset == undefined || !(asset == 'XQC' || asset == 'XQG') )
  {
    asset = 'XQC';
  }

  var response = {
    code: RESPONSE_OK,
    msg: '',
    data: {}
  };

  var amount_check = true;

  amounts.forEach(amount => {
    if (Number(amount) <= 0 || isNaN(Number(amount)))
    {
      amount_check = false;
    }

    if (!isNaN(Number(amount)))
    {
      if (Number(amount) % 1 != 0)
      {
        amount_check = false;
      }
    }
  });

  if (amount_check == false)
  {
    var response = {
      code: RESPONSE_ERR,
      msg: 'Amount is not correct',
      data: {}
    };
    res.send(JSON.stringify(response));
    return;
  }

  var addr_check = true;
  addrs.forEach(item => {
    if (Quras.wallet.isAddress(item) == false)
    {
      addr_check = false;
    }
  });

  if (addr_check == false)
  {
    var response = {
      code: RESPONSE_ERR,
      msg: 'Address format is not correct.',
      data: {}
    };
    res.send(JSON.stringify(response));
    return;
  }

  if (addrs.length != amounts.length)
  {
    var response = {
      code: RESPONSE_ERR,
      msg: 'Address count is not match with amount count',
      data: {}
    };
    res.send(JSON.stringify(response));
    return;
  }

  console.log("Send addr => " + addrs + " Amount => " + amounts);

  Quras.api.qurasDB.getBalance(Quras.CONST.QURAS_NETWORK.MAIN, ICO_HOLDER_ADDRESS)
  .then ((balance) => {
    var outputs = [];
    var toAmount = 0;

    for (var i = 0; i < addrs.length; i ++)
    {
      var toScriptHash = Quras.wallet.getScriptHashFromAddress(addrs[i]);
      var output = {
        assetId: Quras.CONST.ASSET_ID['QRS'],
        value: amounts[i],
        scriptHash: toScriptHash
      }
      toAmount += Number(amounts[i]);

      outputs.push(output);
    }

    var fromValue = balance['assets']['QRS']['balance'];

    if (Number(fromValue) < toAmount)
    {
      var response = {
        code: RESPONSE_ERR,
        msg: 'The balance is not sufficient',
        data: {}
      };
      res.send(JSON.stringify(response));
      return;
    }

    const testTx = Quras.tx.Transaction.createContractTx(balance, outputs)

    testTx.sign(ICO_HOLDER_PRIVKEY);

    rpcServer.sendRawTransaction(testTx.serialize())
    .then((data) => {
      if (data == true)
      {
        var response = {
          code: RESPONSE_OK,
          msg: 'The Transaction was successed.',
          data: {txid : testTx.hash}
        };
        res.send(JSON.stringify(response));
        return;
      }
      else
      {
        var response = {
          code: RESPONSE_ERR,
          msg: 'The Transaction was failed.',
          data: {}
        };
        res.send(JSON.stringify(response));
        return;
      }
    })
    .catch ((error) => {
      var response = {
        code: RESPONSE_ERR,
        msg: 'The SendTransactoin has exception',
        data: {}
      };
      res.send(JSON.stringify(response));
      return;
    });
  })
  .catch ((error) => {
    var response = {
      code: RESPONSE_ERR,
      msg: 'The ICO Holder Address has some Error.',
      data: {}
    };
    res.send(JSON.stringify(response));
    return;
  })
});

module.exports = router;