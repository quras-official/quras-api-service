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
var syncMysql = require('sync-mysql');
var constants = require('../constants.js');

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
var syncConnection = new syncMysql(config.database);
var generator = require('generate-password');
var crypto = require("crypto");

// constants
var RESPONSE_OK = 0;
var RESPONSE_ERR = 1;

router.get('/rpc', function(req, res, next){
    console.log("Get All RPC Nodes...");

    var response = {
        code: RESPONSE_OK,
        msg: '',
        data: {}
    };

    commonf.getRpcNodesInfo(pool, async, function(err, nodes){
        if (err) {
            logger.error(err);

            response.code = RESPONSE_ERR;

            return res.send(JSON.stringify(response));
        } else {

            response.data = {
                nodes : nodes
            };
            res.send(JSON.stringify(response));
        }
    });
});

function getNodes(offset, limit, res) {
	async.waterfall([
		function getConn(callback) {
            callback(null, syncConnection, offset, limit);
		},
		function getTxFromTxid(connection, offset, limit, callback) {
            try{
                if (offset == -2) {
                    var sqlNodes = "SELECT * FROM nodes";

                    var nodesResult = connection.query(sqlNodes, []);
    
                    var retNodes = commonf.getFormatedNodes(nodesResult);
                    callback(null, connection, constants.ERR_CONSTANTS.success, retNodes);
                }
                else if (offset == -1) {
                    var bodyErrMsg = ["unexpected request"];
                    callback(bodyErrMsg, connection, constants.ERR_CONSTANTS.db_connection_err);
                } else {
                    var sqlNodes = "SELECT * FROM nodes WHERE id >= ? ORDER BY id LIMIT ?";

                    var nodesResult = connection.query(sqlNodes, [offset, limit]);
    
                    var retNodes = commonf.getFormatedNodes(nodesResult);
                    callback(null, connection, constants.ERR_CONSTANTS.success, retNodes);
                }
            }
            catch(err) {
                var bodyErrMsg = ["unexpected request"];
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

router.get('/', function(req, res, next){
    console.log("The Get Nodes API was called.");
    getNodes(-2, -2, res);
});

router.get('/:offset/:limit', function(req, res, next){
    var offset = req.params.offset;
    var limit = req.params.limit;

    if (commonf.isNumber(offset)) {
        offset = Number.parseInt(offset, 10);
    } else {
        offset = -1;
    }

    if (commonf.isNumber(limit)) {
        limit = Number.parseInt(limit, 10);
    } else {
        limit = -1;
    }

    console.log("The Get Nodes API was called, Params => offset : " + offset + ", limit : " + limit);
    getNodes(offset, limit, res);
})

function getNodeFromHash(hash, res) {
	async.waterfall([
		function getConn(callback) {
            callback(null, syncConnection, hash);
		},
		function getTxFromTxid(connection, hash, callback) {
            try{
                var sqlNodes = "SELECT * FROM nodes WHERE pub_key=?";

                var nodesResult = connection.query(sqlNodes, [hash]);
    
                var retNodes = commonf.getFormatedNodes(nodesResult);
                callback(null, connection, constants.ERR_CONSTANTS.success, retNodes.nodes[0]);
            }
            catch(err) {
                var bodyErrMsg = ["unexpected request"];
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

router.get('/:hash', function(req, res, next){
    var hash = req.params.hash;

    console.log("The Get Nodes API was called. Params => Hash : " + hash);
    getNodeFromHash(hash, res);
});

module.exports = router;