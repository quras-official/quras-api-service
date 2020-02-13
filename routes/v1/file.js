var env = process.env.NODE_ENV || "development";
var config = require('../../common/config.json')[env];

// express, controller
var express = require('express');
var router = express.Router();
var commonf = require('../../common/commonf.js');
var constants = require('../constants.js');
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

async function getfile(res) {
  var sqlTx = "SELECT upload_request_transaction.* FROM upload_request_transaction";

  try {
    var fileResult = (await mysqlPool.query(sqlTx))[0];
    res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, fileResult, res);
  }
  catch(err) {
    var bodyErrMsg = ["Connection Error"];
    res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_not_found_err, null, res);
  }
}
router.get('/all', function(req, res, next){
    var privKey = req.query.privkey;
    var addr = req.query.addr;

    console.log("Get all file info => " + addr);
    getfile(res);

});

module.exports = router;