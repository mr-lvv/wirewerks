var mongoose = require("mongoose");

let uri = 'mongodb://heroku_6wnklz32:equ6gmq7oknlnc6noj1ubl7dkc@ds033086.mlab.com:33086/heroku_6wnklz32';

mongoose.connect(uri, { useNewUrlParser: true }, function () {
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