var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var compression = require('compression');
var StaticFiles = require('./static');
var Api = require('./api');

var config = {
	default: {
		port: 3000,
		bodyLimit: '100kb',
		corsHeaders: ['Link'],
		clientFolder: 'src'
	},

	production: {
		port: process.env.PORT || 80,
		bodyLimit: '100kb',
		corsHeaders: ['Link'],
		clientFolder: 'dist'
	}
};

class Server {
	constructor() {
		this.app = express();
	}

	_cors() {
		return {
			origin: '*',
			allowedHeaders: ["Access-Control-Allow-Headers", "Origin", "X-Requested-With", "Content-Type", "Accept"],
			exposeHeaders: this.config.corsHeaders
		};
	}

	_setup() {
		this.app.set('query parser', 'extended');
		this.app.enable('case sensitive routing');
		this.app.set('port', this.config.port);
		this.app.set("title", 'Wirewerks');
		this.app.use(cors(this._cors()));
		this.app.use(bodyParser.json({ limit: this.config.bodyLimit }));
		this.app.use(bodyParser.urlencoded({ extended: true }));
		this.app.use(compression());
		this.app.options('*', cors(this._cors()));									// Enable cors pre-flight
	}

	_api() {
		new StaticFiles(this.app, this.config);
		new Api(this.app, this.config);
	}

	_onstart() {
		console.log('Server started on port: ', this.config.port);
	}

	start(env) {
		env = env || 'default';
		this.config = config[env];

		if (process.env.PORT)
			this.config.port = process.env.PORT;

		this.server = http.createServer(this.app);

		this._setup();
		this._api();

		this.server.listen(this.config.port, this._onstart.bind(this));
	}
}

module.exports = Server;
