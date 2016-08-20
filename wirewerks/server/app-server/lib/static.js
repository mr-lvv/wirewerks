var path = require('path');
var express =require('express');
var fs = require('fs');

class StaticFiles {
	/**
	 * Static serve + checks if path exists
	 */
	staticserve(url, path) {
		var mapping = true;
		if (!path) {
			// One argument
			mapping = false;
			path = url;
			url = undefined;
		}

		if (!fs.existsSync(path)) {
			console.warn('Could not find static path to serve: ' + path);
		}

		if (mapping) {
			this._app.use(url, express.static(path));
		} else {
			this._app.use(express.static(path));
		}
	}


	constructor(app) {
		this._app = app;
		this.paths = {
			client: path.join(__dirname, '../../../client/ui/src'),
			common: path.join(__dirname, '../../../common'),
		}

		this.staticserve('/', this.paths.client)
		this.staticserve('/common', this.paths.common)
	}
}

module.exports = StaticFiles;
