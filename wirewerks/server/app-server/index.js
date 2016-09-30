var argv = require('yargs').argv;
global.require_common = function(path) {return require('../../common/')}
global._ = require('lodash')

var Server = require('./lib/server');
var server = new Server();
server.start(argv.env);
