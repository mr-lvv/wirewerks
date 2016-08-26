System.config({
	baseURL: "/",
	defaultJSExtensions: true,
	/*
	 transpiler: "babel",
	 babelOptions: {
	 "optional": [
	 "runtime",
	 "optimisation.modules.system"
	 ]
	 },
	 */

	paths: {
		"3rd:*": "node_modules/*"
	},

	map: {
		// Ours
		ww: '/app',
		common: '../common',								// Support loading common folders


		// Vendors
		jquery: '/node_modules/jquery/dist/jquery.slim',
		fastclick: '/node_modules/fastclick/lib/fastclick',
		angular: '/node_modules/angular/angular',
		'angular-animate': '/node_modules/angular-animate/angular-animate',
		'angular-cookies': '/node_modules/angular-cookies/angular-cookies',
		'angular-resource': '/node_modules/angular-resource/angular-resource',
		'angular-route': '/node_modules/angular-route/angular-route',
		'angular-sanitize': '/node_modules/angular-sanitize/angular-sanitize',
		'angular-aria': '/node_modules/angular-aria/angular-aria',
		'angular-material': '/node_modules/angular-material/angular-material',
		hammer: 'node_modules/hammerjs/hammer.min.js',
		lodash: 'node_modules/lodash/lodash.min.js',
		chroma: 'node_modules/chroma-js/chroma.min.js'
	},

	meta: {
		fastclick: {deps: ['jquery']},
		'angular-animate': {deps: ['angular']},
		'angular-cookies': {deps: ['angular']},
		'angular-resource': {deps: ['angular']},
		'angular-route': {deps: ['angular']},
		'angular-sanitize': {deps: ['angular']},
		'angular-aria': {deps: ['angular']},
		'angular-material': {deps: ['angular']},
	}
});

System.import('app/main.js')
