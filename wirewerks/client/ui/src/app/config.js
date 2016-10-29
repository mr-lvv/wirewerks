System.config({
	baseURL: "/",
	defaultJSExtensions: true,

	map: {
		// Ours
		ww: 'app',
		common: 'common',								// Support loading common folders

		"babel": "node_modules/babel-core@5.8.38",
		"babel-runtime": "node_modules/babel-runtime@5.8.38",

		// Vendors
		jquery: 'node_modules/jquery/dist/jquery.min',
		fastclick: 'node_modules/fastclick/lib/fastclick',
		scrollTo: 'node_modules/jquery.scrollto/jquery.scrollTo',
		angular: 'node_modules/angular/angular',
		'angular-animate': 'node_modules/angular-animate/angular-animate.min',
		'angular-cookies': 'node_modules/angular-cookies/angular-cookies.min',
		'angular-resource': 'node_modules/angular-resource/angular-resource.min',
		'angular-route': 'node_modules/angular-route/angular-route.min',
		'angular-sanitize': 'node_modules/angular-sanitize/angular-sanitize.min',
		'angular-aria': 'node_modules/angular-aria/angular-aria.min',
		'angular-material': 'node_modules/angular-material/angular-material.min',
		hammer: 'node_modules/hammerjs/hammer.min',
		lodash: 'node_modules/lodash/lodash.min',
		chroma: 'node_modules/chroma-js/chroma.min',
		'angular-file-saver': 'node_modules/angular-file-saver/dist/angular-file-saver.bundle.min.js',
		'offline': 'node_modules/offline-js/offline.min.js',
		'css-element-queries': "node_modules/css-element-queries/src/ResizeSensor"
	},

	meta: {
		fastclick: {deps: ['jquery']},
		scrollTo: {deps: ['jquery']},
		'css-element-queries': {deps: ['jquery']},
		'angular-animate': {deps: ['angular']},
		'angular-cookies': {deps: ['angular']},
		'angular-resource': {deps: ['angular']},
		'angular-route': {deps: ['angular']},
		'angular-sanitize': {deps: ['angular']},
		'angular-aria': {deps: ['angular']},
		'angular-material': {deps: ['angular']},
		'angular-file-saver':{deps: ['angular']},
		lodash: {exports: "_", format: "global"}
	}
});


