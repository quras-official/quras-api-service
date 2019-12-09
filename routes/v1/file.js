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

function getfile(res) {
  async.waterfall([
		function getConn(callback) {
      
      callback(null, syncConnection);
    },
    function getfilelist(connection, callback) {
      var sqlTx = "SELECT upload_request_transaction.* FROM upload_request_transaction";

      try {
        var fileResult = connection.query(sqlTx);
        callback(null, syncConnection, constants.ERR_CONSTANTS.success, fileResult);
      }
      catch(err) {
        var bodyErrMsg = ["Connection Error"];
        callback(bodyErrMsg, syncConnection, constants.ERR_CONSTANTS.db_connection_err);
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
		});
}
router.get('/all', function(req, res, next){
    var privKey = req.query.privkey;
    var addr = req.query.addr;

    console.log("Get all file info => " + addr);
    getfile(res);

});

module.exports = router;