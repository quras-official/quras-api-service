// config
var env = process.env.NODE_ENV || "development";
var config = require('../common/config.json')[env];

// express, controller
var express = require('express');
var router = express.Router();

// log4js
var log4js = require('log4js');
log4js.configure({
    appenders: config.log4js
});
var logger = log4js.getLogger('explorer');

// route
router.get('/', function(req, res, next) {
    logger.info('get index page');

    res.render('explorer/index', {layout: 'explorer'});
});

router.get('/blocks', function(req, res, next) {
    logger.info('get blocks page');
    //var url = 'explorer/block?page=' + parseInt(page);

        res.render('explorer/block', {layout: 'explorer'});
});

router.get('/block/:block_id', function(req, res, next) {
    logger.info('get block detail page');

    res.render('explorer/block_detail', {layout: 'explorer'});
});

router.get('/txs', function(req, res, next) {
    logger.info('get txs page');

    res.render('explorer/transaction', {layout: 'explorer'});
});

router.get('/tx/:tx_id', function(req, res, next) {
    logger.info('get tx detail page');

    res.render('explorer/transaction_detail', {layout: 'explorer'});
});

router.get('/accounts', function(req, res, next) {
    logger.info('get accounts page');

    res.render('explorer/account', {layout: 'explorer'});
});

router.get('/account/:account_id', function(req, res, next) {
    logger.info('get account detail page');

    res.render('explorer/account_detail', {layout: 'explorer'});
});

module.exports = router;