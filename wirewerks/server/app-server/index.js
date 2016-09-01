var argv = require('yargs').argv;

var Server = require('./lib/server');
var server = new Server();
server.start(argv.env);
