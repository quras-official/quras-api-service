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

// log
const opts = {
    errorEventName:'info',
    logDirectory:'./logs', // NOTE: folder must exist and be writable...
    fileNamePattern:'api.log-<DATE>',
    dateFormat:'YYYY-MM-DD'
  };
  const logger = require('simple-node-logger').createRollingFileLogger( opts );

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
    logger.info("Get All RPC Nodes...");

    var response = {
        code: RESPONSE_OK,
        msg: '',
        data: {}
    };

    commonf.getRpcNodesInfo(pool, async, function(err, nodes){
        if (err) {
            response.code = RESPONSE_ERR;

            return res.send(JSON.stringify(response));
        } else {

            response.data = {
                nodes : nodes
            };
            res.send(JSON.stringify(response));
        }
        logger.info("Get All RPC Nodes, Response => " + JSON.stringify(response));
    });
});

async function getNodes(timestamp, offset, limit, res) {
    try{
        if (offset == -2) {
            var sqlNodes = "SELECT * FROM nodes";

            var nodesResult = (await mysqlPool.query(sqlNodes, []))[0];
            var formatedNodes = [];

            for (var i = 0 ; i < nodesResult.length; i++) {
                var node = nodesResult[i];
                var fNode = {};
                fNode.account = node.account;
                fNode.address = node.address;
                fNode.votes = node.vote;
                fNode.votes_percent = (node.vote * 100.0 / node.height).toFixed(2);
                fNode.daily_reward = await getDailyReward(node.address, timestamp);

                formatedNodes.push(fNode);
            }

            var rest = (100.0).toFixed(2);

            for (var i = 0; i < formatedNodes.length - 1; i++) {
                rest = rest - formatedNodes[i].votes_percent;
            }

            formatedNodes[formatedNodes.length - 1].votes_percent = rest.toFixed(2);

            var retNodes = commonf.getFormatedNodes(formatedNodes);
            res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, retNodes, res);
        }
        else if (offset == -1) {
            var bodyErrMsg = ["unexpected request"];
            res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_not_found_err, null, res);
        } else {
            var sqlNodes = "SELECT * FROM nodes WHERE id >= ? ORDER BY id LIMIT ?";

            var nodesResult = (await mysqlPool.query(sqlNodes, [offset, limit]))[0];

            var formatedNodes = [];

            for (var i = 0 ; i < nodesResult.length; i++) {
                var node = nodesResult[i];
                var fNode = {};
                fNode.account = node.account;
                fNode.address = node.address;
                fNode.votes = node.vote;
                fNode.votes_percent = (node.vote * 100.0 / node.height).toFixed(2);
                fNode.daily_reward = await getDailyReward(node.address, timestamp);

                formatedNodes.push(fNode);
            }

            var rest = (100.0).toFixed(2);

            for (var i = 0; i < formatedNodes.length - 1; i++) {
                rest = rest - formatedNodes[i].votes_percent;
            }

            formatedNodes[formatedNodes.length - 1].votes_percent = rest.toFixed(2);

            var retNodes = commonf.getFormatedNodes(formatedNodes);
            res = commonf.buildResponse(null, constants.ERR_CONSTANTS.success, retNodes, res);
        }
    }
    catch(err) {
        var bodyErrMsg = ["Connection Error"];
        res = commonf.buildResponse(bodyErrMsg, constants.ERR_CONSTANTS.db_not_found_err, null, res);
    }
}

async function getDailyReward(address, timestamp) {
    var endtimestamp = timestamp + 3600 * 24;
    
    try {
        var sql = "SELECT SUM(amount) reward from miner_transaction WHERE address = _to AND address = ? AND time >= ? AND time < ?";
        var result = (await mysqlPool.query(sql, [address, timestamp, endtimestamp]))[0];

        var sum = result[0].reward == null? 0: result[0].reward;
        return sum;
    } catch(error) {
    }
    return 0;
}

router.get('/:timestamp', function(req, res, next){
    var timestamp = req.params.timestamp;

    console.log("The Get Nodes API was called.");
    logger.info("The Get Nodes API was called.");
    getNodes(timestamp, -2, -2, res);
});

router.get('/:timestamp/:offset/:limit', function(req, res, next){
    var offset = req.params.offset;
    var limit = req.params.limit;
    var timestamp = req.params.timestamp;

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
    logger.info("The Get Nodes API was called, Params => offset : " + offset + ", limit : " + limit);
    getNodes(timestamp, offset, limit, res);
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
    logger.info("The Get Nodes API was called. Params => Hash : " + hash);
    getNodeFromHash(hash, res);
});

module.exports = router;