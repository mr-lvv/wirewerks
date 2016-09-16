var path = require("path")
var Builder = require('systemjs-builder')
var babel = require("babel-core")
var fs = require('fs-extra')
var lodash = require('lodash')
var child_process = require('child_process')

var paths = {
	dist: './dist',
	styles: './src/styles/',

	common: {
		source: '../../common',
		target: './src/common'
	}
}

function linkCommon() {
	unlinkCommon()
	if (!fs.existsSync(paths.common.target)) {
		fs.linkSync(paths.common.source, paths.common.target, 's')
	}
}

function unlinkCommon() {
	if (fs.existsSync(paths.common.target)) {
		try {
			fs.unlinkSync(paths.common.target)
		} catch (error) {
			console.log('Could not unlink common folder.. the folder may be a copy and not a link, which is ok for deployement.');
		}
	}
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

function buildCss() {
	var filename = 'main.scss'
	var output = 'main.css'

	var exec = '../../../../server/ww-libsass/node_sass/node_modules/.bin/node-sass'
	var args = ` --output-style nested --source-map true ${filename} ${output}`;
	var cmd = exec + args

	console.log('Building css: ', cmd);
	var result = child_process.execSync(cmd, {cwd: paths.styles})
	console.log(result.toString());
}

function buildPostCss() {
	var cmd = '../../../../server/ww-libsass/node_modules/.bin/postcss'
	var args = ` --config .postcss.json`;

	console.log('Building css prefix: ', cmd);
	var result = child_process.execSync(cmd + args, {cwd: paths.styles})
	console.log(result.toString());
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
	var pathFilter = ['src/node_modules', ".scss", 'src/common', 'src/styles']
	var validNodeModules = ['bowser', 'systemjs']

	var options = {
		stopOnErr: true,
		filter: function(filename) {

			var isInvalid = pathFilter.some((pathFilter) => {
				if (filename.indexOf(pathFilter) !== -1) {
					var validModule = validNodeModules.some((filter) =>{
						return filename.indexOf(filter) !== -1
					})

					if (!validModule) {
						return true					// Filter out
					}
				}
			})

			if (isInvalid)
				return false

			return true;		// Copy file
		}
	}

	fs.copySync('./src', './dist', options)
	fs.copySync('./src/styles/main_production.css', './dist/styles/main.css')
}

try
{
	linkCommon()
	fs.removeSync(paths.dist)
	preBuild()

	buildCss()
	buildPostCss()

	build();
} catch (error) {
	console.error(error);
}
