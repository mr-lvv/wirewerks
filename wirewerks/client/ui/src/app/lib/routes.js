define(['../app'], function(app) {
	/**
	 * State Configs
	 */
	app.config(($routeProvider, $locationProvider) => {
		$locationProvider.html5Mode(true);

		$routeProvider.when('/state/product', {
			template: '',
			controller: function(app) {
				app.view = 'product'
			}
		}).when('/state/product/:productId', {
			template: '',
			controller: function(app, $routeParams) {
				app.view = 'product'
			}
		}).when('/state/cart', {
			template: '',
			controller: function (app) {
				app.view = 'cart'
			}
		}).when('/state/home', {
			template: '',
			controller: function (app) {
				app.view = 'home'
			}
		}).otherwise('/')
	})
});
