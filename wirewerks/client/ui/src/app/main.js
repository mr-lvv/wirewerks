define([
	'ww/index.js',
	'common/index.js',

	'angular',
	'angular-local-storage',
	'lodash',
	'offline',
	'ui.router',
	'bootstrap.confirmation',
	'imagesloaded'
], function(ww, common) {	

	Offline.options = {
		// Should we check the connection status immediatly on page load.
		checkOnLoad: false,
		// Should we monitor AJAX requests to help decide if we have a connection.
		interceptRequests: true
	};

	// Periodically check for offline status...
	setInterval(() => {
		Offline.check();
	}, 7000);
});
