define([
	'ww/index',
	'common/index',

	'angular',
	'angular-animate',
	'angular-cookies',
	'angular-resource',
	'angular-route',
	'angular-sanitize',
	'angular-aria',
	'angular-material',
	'lodash',
	'angular-file-saver',
	'offline'
], function(ww, common) {
	Offline.options = {
		// Should we check the connection status immediatly on page load.
		checkOnLoad: false,
		// Should we monitor AJAX requests to help decide if we have a connection.
		interceptRequests: true
	}

	// Periodically check for offline status...
	setInterval(() => {
		Offline.check()
	}, 7000)
});
