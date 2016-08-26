var path = require("path")
var fs = require('fs')
var rimraf = require('rimraf')
var Builder = require('systemjs-builder')
var babel = require("babel-core")
var ncp = require('ncp').ncp


var paths = {
	dist: './dist',

	common: {
		source: '../../common',
		target: './src/common'
	}
}

function linkCommon() {
	unlinkCommon()
	fs.linkSync(paths.common.source, paths.common.target, 's')
}

function unlinkCommon() {
	if (fs.existsSync(paths.common.target))
		fs.unlinkSync(paths.common.target)
}

function babelBuild(callback) {
	babel.transformFile("./dist/app/main.js", {
		ast: false,
		compact: false,

		//inputSourceMap: ''
		//minified: true,
		//sourcemap: true,
		comments: false
	}, function (err, result) {
		fs.writeFile("./dist/app/main.js", result.code, function (err) {
			if (err) {
				console.log('Error!!!');
				return console.log(err);
			}

			console.log("Babel file was saved!");
			callback()
		});
	})
}

function build() {
	// sets the baseURL and loads the configuration file
	var builder = new Builder('./src', './src/app/config.js');

	builder.config({
		transpiler: "babel",

		/* Not Working...
		transpiler: "babel",

		babelOptions: {
			"optional": [
				"runtime",
				"optimisation.modules.system"
			]
		}
		*/
	})

	/*{minify: true, sourceMaps: true, lowResSourceMaps: true}*/
	builder
	.bundle('app/main.js', paths.dist + '/app/main.js')
	.then(function () {
		babelBuild(function() {
			console.log('Build complete');
		})
	})
	.catch(function (err) {
		console.log('Build error');
		console.log(err);
	})
	.finally(function () {
		unlinkCommon()
	})
}

function preBuild() {
//	fs.mkdirSync(paths.dist)
/*
	ncp('./src', './dist', function (err) {
		if (err) {
			return console.error(err);
		}

		build();
	});
*/
	build();
}

linkCommon()
//rimraf(paths.dist, preBuild)
preBuild()
