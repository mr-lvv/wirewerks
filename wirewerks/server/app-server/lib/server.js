var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var compression = require('compression');
var StaticFiles = require('./static');
var Api = require('./api')

var config = {
	port: 3000,
	bodyLimit: '100kb',
	corsHeaders: ['Link']
}

class Server {
	constructor() {
		this.app = express();
	}

	_cors() {
		return {
			origin: '*',
			allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept"],
			exposeHeaders: config.corsHeaders
		}
	}

	_setup() {
		this.app.set('query parser', 'extended')
		this.app.enable('case sensitive routing')
		this.app.set('port', config.port);
		this.app.set("title", 'Wirewerks');
		this.app.use(cors(this._cors()))
		this.app.use(bodyParser.json({limit: config.bodyLimit}));
		this.app.use(bodyParser.urlencoded({extended: true}));
		this.app.use(compression());
		this.app.options('*', cors(this._cors()));									// Enable cors pre-flight
	}

	_api() {
		new StaticFiles(this.app)
		new Api(this.app)
	}

	_onstart() {
		console.log('Server started on port: ', config.port);
	}

	start() {
		this.server = http.createServer(this.app);

		this._setup()
		this._api()

		this.server.listen(process.env.PORT || config.port, this._onstart.bind(this));
	}
}

module.exports = Server;
