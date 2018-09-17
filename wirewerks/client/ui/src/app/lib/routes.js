define(['../app.js'], function(app) {
	/**
	 * State Configs
	 */
	
	app.filter('range', function () {
		return function (input, total) {
			total = parseInt(total);

			for (var i = 0; i < total; i++) {
				input.push(i);
			}

			return input;
		};
	});

	app.config(function (localStorageServiceProvider) {
		localStorageServiceProvider
			.setPrefix('wwApp')
			.setStorageCookie(999);
	});

	app.config(($locationProvider, $stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider) => {
		$urlMatcherFactoryProvider.strictMode(false);
		$locationProvider.html5Mode(true);
		$stateProvider
			.state("home", {
				url: '/state/home',
				views: {
					'nav': {
						templateUrl: 'app/views/home/home.nav.html',
						controller: 'home.nav.ctrl',
					},
					'content': {
						templateUrl: 'app/views/home/home.content.html',
						controller: 'home.content.ctrl',
					},
				},
				resolve: {
					sections: function ($http) {
						return $http.get("/api/client/sections").then(function (sections) {
							return sections.data;
						});
					},
				}
			})
			.state('cart', {
				url: '/state/cart',
				views: {
					'nav': {
						templateUrl: 'app/views/cart/cart.nav.html',
						controller: 'cart.nav.ctrl'
					},
					'content': {
						templateUrl: 'app/views/cart/cart.content.html',
						controller: 'cart.content.ctrl',
					},
				},
				resolve: {
					cart: function (localStorageService) {
						//--------------------------------------------------------------------------------------------------------------
						var imageExists = function (imgUrl) {

							let http = new XMLHttpRequest();

							http.open('HEAD', imgUrl, false);
							http.send();

							return http.status != 404;

						};
						//--------------------------------------------------------------------------------------------------------------
						var generateImgUrl = function (item) {
							const specificProductImgUrl = '/images/sections/' + item.sectionNumber + '/' + item.partNumber + '.png';
							const genericProductImgUrl = '/images/sections/' + item.sectionNumber + '/' + item.placeholder + '.png';
							const notFoundImgUrl = '/images/missing_img.png';

							//img exists for selected parts
							if (imageExists(specificProductImgUrl))
								return specificProductImgUrl;

							//generic img for this product (same as in products.section state)
							if (imageExists(genericProductImgUrl))
								return genericProductImgUrl;

							return notFoundImgUrl;
						};
						//--------------------------------------------------------------------------------------------------------------

						let item, cart = {};
						lsKeys = localStorageService.keys();
						
						for (let key of lsKeys) {
							item = localStorageService.get(key);
							if (item.isCartItem){
								item.imgUrl = generateImgUrl(item);
								cart[key] = item;
							}
						}
						return cart;
					}
				}
			})
			.state('products', {
				url: '/state/products',
				views: {
					'nav': {
						template: '<div ui-view="nav"></div>'
					},
					'content': {
						template: '<div ui-view="content"></div>'
					},
				},
				abstract: true
			})
			.state('products.section', {
				url: '/:sectionNumber',
				views: {
					"nav@products": {
						templateUrl: 'app/views/products/section.nav.html',
						controller: 'products.section.nav.ctrl'
					},
					"content@products": {
						templateUrl: 'app/views/products/section.content.html',
						controller: 'products.section.content.ctrl'
					},
				},
				resolve: {
					section: function ($stateParams, $http) {
						return $http.get("/api/client/section/" + $stateParams.sectionNumber).then(function (section) {
							return section.data;
						});
					}
				}
			})
			.state('products.section.product', {
				url: '/:partNumber',
				params: {cartItem: null },
				views: {
					"nav@products": {
						templateUrl: 'app/views/products/product.nav.html',
						controller: 'products.product.nav.ctrl'
					},
					"content@products": {
						templateUrl: 'app/views/products/product.content.html',
						controller: 'products.product.content.ctrl'
					}
				},
				resolve: {
					product: function ($stateParams, section) {
						for (let product of section.products) {
							if (product.partNumber == $stateParams.partNumber)
								return product;
						}
						return {'notFound': true};
					},
					cartItem: function ($stateParams) {
						return $stateParams.cartItem;
					}
				}
			});

		$urlRouterProvider.otherwise("/state/home");
	});
});
