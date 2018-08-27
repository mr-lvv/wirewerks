var mongoose = require("mongoose");

mongoose.connect('mongodb://localhost/wirewerksdb', function () {
    console.log("Connecting to mongodb...");
})
    .then(() => {
        var argv = require('yargs').argv;
        var Server = require('./lib/server');
        var server = new Server();
        return server.start(argv.env);
    })
    .catch(err => { // mongoose connection error will be handled here
        console.error('App starting error:', err.stack);
        process.exit(1);
    });

mongoose.Promise = global.Promise;