define([], function() {
	var app = angular.module('ww', [
		'ngCookies',
		'ngResource',
		'ngSanitize',
		'ngAria',
		'ngAnimate',
		'ngMaterial',
		'ngRoute',
		'ngFileSaver'
	])
	app.SingleProductMode = true


	return app
});
