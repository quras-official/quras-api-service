// config
var env = process.env.NODE_ENV || "development";
var config = require('../common/config.json')[env];

// express, controller
var express = require('express');
var router = express.Router();

// route
router.get('/', function(req, res, next) {
    res.render('explorer/index', {layout: 'explorer'});
});

router.get('/blocks', function(req, res, next) {
        res.render('explorer/block', {layout: 'explorer'});
});

router.get('/block/:block_id', function(req, res, next) {
    res.render('explorer/block_detail', {layout: 'explorer'});
});

router.get('/txs', function(req, res, next) {
    res.render('explorer/transaction', {layout: 'explorer'});
});

router.get('/tx/:tx_id', function(req, res, next) {
    res.render('explorer/transaction_detail', {layout: 'explorer'});
});

router.get('/accounts', function(req, res, next) {
    res.render('explorer/account', {layout: 'explorer'});
});

router.get('/account/:account_id', function(req, res, next) {
    res.render('explorer/account_detail', {layout: 'explorer'});
});

module.exports = router;