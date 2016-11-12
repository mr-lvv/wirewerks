var path = require("path")
var Builder = require('systemjs-builder')
var babel = require("babel-core")
var fs = require('fs-extra')
var lodash = require('lodash')
var child_process = require('child_process')
var argv = require('yargs').argv;
var config = {
	minified: !argv.dev
}

var paths = {
	dist: './dist',
	styles: path.join('.', 'src', 'styles'),

	common: {
		source: '../../common',
		target: './src/common'
	},

	libsass_fromStyles: path.join('..', '..', '..', '..', 'server', 'ww-libsass'),
	libsass: path.join('..', '..', 'server', 'ww-libsass')
}

var libsass = require(paths.libsass);


function copyFile(source, target) {
	if (fs.existsSync(source)) {
		fs.copySync(source, target)
	}
}

function linkCommon() {
	unlinkCommon()
	if (!fs.existsSync(paths.common.target)) {
		// Need to use absolute path (node js 6.4.0 bug) to create junctions on windows...
		fs.symlinkSync(path.resolve(paths.common.source), path.resolve(paths.common.target), 'junction');
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
	var minified = false //config.minified
	console.log('Build Minified is : ', minified);

	babel.transformFile("./dist/app/main.js", {
		ast: false,
		compact: false,

		//inputSourceMap: ''
		minified: minified,
		// sourcemaps: true,
		comments: false
	}, function (err, result) {
		if (err) {
			console.error('Error building.', err.message);
			callback(err);
			return
		}
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

	var exec = path.join(paths.libsass_fromStyles, 'node_sass', 'node_modules', '.bin', 'node-sass')
	var args = ` --output-style nested --source-map true ${filename} ${output}`;
	var cmd = exec + args

	console.log('Building css: ', cmd);
	var result = child_process.execSync(cmd, {cwd: paths.styles})
	console.log(result.toString());

	copyFile('./src/styles/main.css', './dist/styles/main.css')
}

function buildPostCss(callback) {
	callback = callback || function() {}

	var cssFile = path.join(paths.styles, 'main.css')
	var cssFileTarget = path.join(paths.styles, 'main_production.css')
	var cssFileTargetMap = path.join(paths.styles, 'main_production.css.map')
	var css = fs.readFileSync(cssFile)

	console.log('Building css prefix: ', cssFile);
	var autoprefix = libsass.autoprefixer({browsers: ['> 1%', 'IE 9']})	// Must match file content in src/styles/browserlist
	libsass.postcss([autoprefix, libsass.cssnano()])
		.process(css, {from: cssFile, to: cssFileTarget})
		.then(result => {
			fs.writeFileSync(cssFileTarget, result.css.toString())
			fs.writeFileSync(cssFileTargetMap, result.map.toString())

			copyFile('./src/styles/main_production.css', './src/styles/main.css')							// Copy over current main.css in case we copy everything from 'src' later...
			copyFile('./src/styles/main_production.css.map', './src/styles/main.css.map')			//
			copyFile('./src/styles/main_production.css', './dist/styles/main.css')
			copyFile('./src/styles/main_production.css.map', './dist/styles/main.css.map')
			console.log('Post Css completed.');

			callback();
		});
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
		console.log('Build Completed!');
	})
}

function buildAllCss(callback) {
	// Make sure CSS is present prior to copy...
	buildCss()
	buildPostCss(callback)
}

function preBuild(callback) {
	buildAllCss(() => {
		// Copy all files
		var pathFilter = ['src/node_modules', ".scss", 'src/common']
		var validNodeModules = ['bowser', 'systemjs']

		var options = {
			stopOnErr: true,
			filter: function (filename) {

				var isInvalid = pathFilter.some((pathFilter) => {
					if (filename.indexOf(pathFilter) !== -1) {
						var validModule = validNodeModules.some((filter) => {
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
		callback()
	})
}

try
{
	// Build mode
	if (argv.css) {
		console.log('Building Css Only.');
		buildAllCss(() => {console.log('Css build Completed!');})
	} else {
		// Full Build

		linkCommon()
		fs.removeSync(paths.dist)
		preBuild(() => {
			try {
				console.log('Building...');
				build();
			} catch (error) {
				console.error(error);
			}
		})
	}

} catch (error) {
	console.error(error);
}
