System.config({
	baseURL: "/",

	map: {
		// Ours
		ww: 'app',
		common: 'common',								// Support loading common folders

		"babel": "node_modules/babel-core@5.8.38",
		"babel-runtime": "node_modules/babel-runtime@5.8.38",

		// Vendors
		jquery: 'node_modules/jquery/dist/jquery.min.js',
		fastclick: 'node_modules/fastclick/lib/fastclick.js',
		scrollTo: 'node_modules/jquery.scrollto/jquery.scrollTo.js',
		angular: 'node_modules/angular/angular.js',
		'angular-animate': 'node_modules/angular-animate/angular-animate.min.js',
		'angular-cookies': 'node_modules/angular-cookies/angular-cookies.min.js',
		'angular-resource': 'node_modules/angular-resource/angular-resource.min.js',
		'angular-route': 'node_modules/angular-route/angular-route.min.js',
		'angular-sanitize': 'node_modules/angular-sanitize/angular-sanitize.min.js',
		'angular-aria': 'node_modules/angular-aria/angular-aria.min.js',
		'angular-material': 'node_modules/angular-material/angular-material.min.js',
		'angular-local-storage': 'node_modules/angular-local-storage/dist/angular-local-storage.js',
		'ui.router': 'node_modules/@uirouter/angularjs/release/angular-ui-router.js',
		hammer: 'node_modules/hammerjs/hammer.min.js',
		lodash: 'node_modules/lodash/lodash.min.js',
		chroma: 'node_modules/chroma-js/chroma.min.js',
		'angular-file-saver': 'node_modules/angular-file-saver/dist/angular-file-saver.bundle.min.js',
		'offline': 'node_modules/offline-js/offline.min.js',
		'css-element-queries': "node_modules/css-element-queries/src/ResizeSensor.js",
		bootstrap: 'node_modules/bootstrap/dist/js/bootstrap.min.js',
		'bootstrap.confirmation': '3rd/bootstrap-confirmation.min.js',
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
		'angular-local-storage':{deps: ['angular']},
		'ui.router':{deps: ['angular']},
		lodash: {exports: "_", format: "global"},
		bootstrap: {deps: ['jquery']},
		'bootstrap.confirmation': {deps: ['bootstrap']}
	}
});
