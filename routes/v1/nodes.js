// config
var env = process.env.NODE_ENV || "development";
var config = require('../../common/config.json')[env];

// express, controller
var express = require('express');
var router = express.Router();
var commonf = require('../../common/commonf.js');
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

async function getNodes(offset, limit, res) {
    try{
        if (offset == -2) {
            var sqlNodes = "SELECT * FROM nodes";

            var nodesResult = (await mysqlPool.query(sqlNodes, []))[0];

            var retNodes = commonf.getFormatedNodes(nodesResult);
            res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, retNodes, res);
        }
        else if (offset == -1) {
            var bodyErrMsg = ["unexpected request"];
            res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_not_found_err, null, res);
        } else {
            var sqlNodes = "SELECT * FROM nodes WHERE id >= ? ORDER BY id LIMIT ?";

            var nodesResult = (await mysqlPool.query(sqlNodes, [offset, limit]))[0];

            var retNodes = commonf.getFormatedNodes(nodesResult);
            res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, retNodes, res);
        }
    }
    catch(err) {
        var bodyErrMsg = ["Connection Error"];
        res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_not_found_err, null, res);
    }
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

async function getNodeFromHash(hash, res) {
    try{
        var sqlNodes = "SELECT * FROM nodes WHERE pub_key=?";

        var nodesResult = (await mysqlPool.query(sqlNodes, [hash]))[0];

        var retNodes = commonf.getFormatedNodes(nodesResult);
        res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, retNodes.nodes[0], res);
    } catch(err) {
        var bodyErrMsg = ["unexpected request"];
        res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_not_found_err, null, res);
    }
}

router.get('/:hash', function(req, res, next){
    var hash = req.params.hash;

    console.log("The Get Nodes API was called. Params => Hash : " + hash);
    getNodeFromHash(hash, res);
});

module.exports = router;