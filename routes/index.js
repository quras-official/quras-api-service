var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {layout: 'main'});
});

router.get('/generate', function(req, res, next) {
  res.render('generate', {layout: 'genwallet'});
});

router.get('/privacypolicy/ja', function(req, res, next) {
  res.render('privacy_jp', {layout: false});
});

router.get('/termofuse/ja', function(req, res, next) {
    res.render('term_jp', {layout: false});
});

router.get('/privacypolicy/en', function(req, res, next) {
    res.render('privacy_en', {layout: false});
});

router.get('/termofuse/en', function(req, res, next) {
    res.render('term_en', {layout: false});
});
module.exports = router;
