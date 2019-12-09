var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

//var ver = require('./routes/version');
var api = require('./routes/api');
var v1_address = require('./routes/v1/address');
var v1_block = require('./routes/v1/block');
var v1_nodes = require('./routes/v1/nodes');
var v1_tx = require('./routes/v1/tx');
var ico_tx = require('./routes/ico/sendtx');
var v1_blocks = require('./routes/v1/blocks');
var v1_txs = require('./routes/v1/txs');
var v1_status = require('./routes/v1/status');
var v1_addresses = require('./routes/v1/addresses');
var v1_assets = require('./routes/v1/assets');
var v1_file = require('./routes/v1/file');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

//app.use('/', index);
//app.use('/explorer', explorer);
app.use('/api', api);
app.use('/v1/address', v1_address);
app.use('/v1/block', v1_block);
app.use('/v1/nodes', v1_nodes);
app.use('/v1/tx', v1_tx);
app.use('/ico', ico_tx);
app.use('/v1/blocks', v1_blocks);
app.use('/v1/txs', v1_txs);
app.use('/v1/status', v1_status);
app.use('/v1/addresses', v1_addresses);
app.use('/v1/assets', v1_assets);
app.use('/v1/file',v1_file);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');

  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? /*err*/{} : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
