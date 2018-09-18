define([], function() {
	var app = angular.module('ww', ['ngSanitize', 'ngCookies', 'ui.router', 'LocalStorageModule']);
	
	return app;
});
