define(['angular', 'fastclick', 'chroma'], function(ng, FastClick, chroma) {
	var app = angular.module('ww', [
		'ngCookies',
		'ngResource',
		'ngSanitize',
		'ngAria',
		'ngAnimate',
		'ngMaterial',
		'ngRoute'
	])
	.run(() => {
		FastClick.attach(document.body)
	});

	class Url {
		static product(part) {
			return '/api/client/product/' + part
		}

		static products() {
			return '/api/client/products'
		}

		static datasheet(sheet) {
			return 'http://www.wirewerks.com/wp-content/uploads/' + sheet + '-EN-C.pdf'
		}
	}

	class CategoryColors {
		static fromCategoryType(type) {
			type = type ? type.toUpperCase() : '';

			var color;
			if (type === 'A') {
				color = chroma('#e3811c')
			} else if (type === 'B') {
				color = chroma('#00a770')
			} else if (type === 'C') {
				color = chroma('#cc171e')
			} else if (type === 'D') {
				color = chroma('#0089cf')
			} else if (type === 'E') {
				color = chroma('#b70b7f')
			} else if (type === 'F') {
				color = chroma('#e6bd15')
			} else if (type === 'G') {
				color = chroma('#00658f')
			} else if (type === 'H') {
				color = chroma('#007f60')
			} else if (type === 'I') {
				color = chroma('#821f24')
			} else if (type === 'J') {
				color = chroma('#fcb116')
			} else if (type === 'K') {
				color = chroma('#90356a')
			} else if (type === 'L') {
				color = chroma('#ee4a97')
			} else if (type === 'N') {
				color = chroma('#c7b227')
			} else {
				color = chroma.random()
			}

			return color;
		}
	}

	/**
	 * State Configs
	 */
	app.config(($routeProvider, $locationProvider) => {
		$locationProvider.html5Mode(true);

		$routeProvider.when('/state/product', {
			template: '',
		}).when('/state/product/:productId', {
			template: ''
		}).otherwise('/')
	})

	class Application {
		constructor() {
		}
	}

	app.service('app', Application)

	/**
	 *
	 */
	class App {
		constructor($timeout, $routeParams, $scope, $location, app) {
			this.id = 'fa'

			$scope.$watch(() => $routeParams, function(params) {
				// Route params changed...
				//console.log('param: ', params);
			})
		}
	}

	app.component('wwApp', {
		controller: App,
		templateUrl: 'app/views/app.html',
		bindings: {}
	})

	/**
	 * Minimum required to distinguish different parts with same id
	 */
	class PartInfo {
		constructor(part, category) {
			this.part = part
			this.category = category
		}
	}

	/**
	 *
	 */
	class Order {
		constructor(productResource, $scope) {
			this.productResource = productResource
			this.product = undefined;
			this.parts = []							// Type PartInfo, not part (to include category..)

			this.sections = []

			$scope.$watch('order.productId', this._refreshProduct.bind(this))
		}

		_refreshProduct() {
			this.sections = []

			this.productResource.get(this.productId).then(product => {
				// If no product found, keep current product displayed
				if (product)
					this.product = product				// Not actually product, more like productTemplate
			})
		}

		// Give a group id (ascending) from a category according to current product
		_groupId(category) {
			if (!this.product) return

			return _.find(this.product.partGroups, (group) => {
				var found = _.find(group.partCategories, (productCategory) => productCategory === category.type)
				if (found)
					return group.id
			})
		}

		/**
		 * Remove all parts related to a category
		 */
		_removeCategory(category) {
			_.remove(this.parts, (partInfo) => {
				return partInfo.category.type === category.type
			})
		}

		_partForCategory(category) {
			return _.find(this.parts, (partInfo) => {
				return partInfo.category.type === category.type
			})
		}

		addPart(partInfo) {
			if (this.isPartInOrder(partInfo)) {return}
			this._removeCategory(partInfo.category)
			this.sections = []

			this.parts.push(partInfo)
		}

		isPartInOrder(partInfo) {
			return this.parts.some((orderPart) => {
				return 	orderPart.part.value === partInfo.part.value &&
							orderPart.category.type === partInfo.category.type
			})
		}

		orderNumber() {
			if (!this.product) return
			if (this.sections.length)
				return this.sections

			var sections = this.sections

			sections.push({
				label: this.product.part,
				data: this.product
			})

			this.product.partGroups.forEach((group) => {
				sections.push({label: '-', data: group})

				group.partCategories.forEach((category) => {
					var partInfo = this._partForCategory(category)

					var label = _.repeat(category.type, category.length)
					var selected = false
					if (partInfo) {
						label = partInfo.part.value.toUpperCase()
						selected = true
					}

					var color = chroma(category.color || CategoryColors.fromCategoryType(category.type))
					if (!selected) {
						color = color.brighten(1.5)
						color.alpha(0.25)
					} else {
						color.alpha(0.75)
					}

					sections.push({
						label: label,
						classes: 'part',
						selected: selected,
						color: color.css(),
						data: {part: partInfo, category: category}
					})
				})
			})

			if (this.product.suffix) {
				sections.push({
					label: this.product.suffix,
					data: this.product
				})
			}

			return sections
		}
	}

	app.component('wwOrder', {
		controller: Order,
		controllerAs: 'order',
		templateUrl: 'app/views/order.html',
		bindings: {
			productId: '='
		}
	})

	/**
	 *
	 */
	class OrderNumber {
		constructor() {

		}
	}

	app.component('wwOrderNumber', {
		controller: OrderNumber,
		templateUrl: 'app/views/ordernumber.html',
		require: {
			order: '^wwOrder'
		},
		bindings: {
		}
	})

	/**
	 *
	 */
	class Product {
		constructor() {
		}

		getDataSheetLink() {
			if (!this.product) {
				return
			}

			return Url.datasheet(this.product.dataSheetLink)
		}
	}

	app.component('wwProduct', {
		controller: Product,
		templateUrl: 'app/views/product.html',
		require: {
			order: '^wwOrder'
		},
		bindings: {
			product: '=?'
		}
	})

	/**
	 *
	 */
	class PartGroup {
		constructor() {

		}
	}

	app.component('wwPartGroup', {
		controller: PartGroup,
		templateUrl: 'app/views/partgroup.html',
		bindings: {
			group: '=?'
		}
	})

	/**
	 *
	 */
	class PartCategory {
		constructor($scope) {
			$scope.$watch('$ctrl.category', category => {
				if (!category) {
					return
				}

				category.color = CategoryColors.fromCategoryType(category.type);
				category.parts.forEach(part => {
					part.color = category.color.brighten(1.5)
				})
			})
		}

		style() {
			if (!this.category) {
				return
			}

			return {background: this.category.color.css()}
		}
	}

	app.component('wwPartCategory', {
		controller: PartCategory,
		templateUrl: 'app/views/partcategory.html',
		bindings: {
			category: '=?',
			group: '=?'
		}
	})

	/**
	 *
	 */
	class Part {
		constructor() {

		}

		get partInfo() {
			return new PartInfo(this.part, this.category)
		}

		select() {
			this.order.addPart(this.partInfo)
		}

		style() {
			if (!this.part) {
				return
			}

			return {background: this.part.color.css()}
		}

		isSelected() {
			return this.order.isPartInOrder(this.partInfo)
		}
	}

	app.component('wwPart', {
		controller: Part,
		require: {
			order: '^wwOrder'
		},
		templateUrl: 'app/views/part.html',
		bindings: {
			part: '=?',
			group: '=?',
			category: '=?'
		}
	})

	/**
	 *
	 */
	class ProductSelection {
		constructor(productResource, $scope, $element, $timeout) {
			this.searchText = this.selectedItem
			this.productResource = productResource
			this.$scope = $scope
			this.$element = $element
		}

		// Sort of hacking way since depending on autocomplete's controller inner workings
		_getAutocomplete() {
			var el = angular.element(this.$element.find('md-autocomplete'))
			var ctrl = el.controller('mdAutocomplete')

			return ctrl
		}

		_showAutocomplete(value) {
			var el = angular.element(this.$element.find('md-autocomplete'))
			var ctrl = el.controller('mdAutocomplete')
			ctrl.hidden = !value
		}

		searchTextChange(text) {

		}

		selectedItemChange(item) {
			this.id = item
		}

		query(text) {
			return this.productResource.getProducts()
		}

		keydown(event) {
			if (event.which === 13) {
				this.id = this.searchText
				this.selectedItem = this.id
				this._showAutocomplete(true)
			}
		}

		focus(event) {
			this._showAutocomplete(true)
		}

		$onChanges(changes) {
			if (changes.id)
				this.searchText = changes.id.currentValue
		}
	}

	app.component('wwProductSelection', {
		controller: ProductSelection,
		templateUrl: 'app/views/productselection.html',
		bindings: {
			selectedItem: '=productId'
		}
	})

	/**
	 *
	 */
	class Cart {
		constructor() {
			//get from localStorage
			this.quantityChoice = _.range(1,100);
			this.orders = [];
			this.orders[0] = {
				"name" : "product blah blah",
				"quantity" : 3,
				"description" : "description blah blah blah blah blah"
			};
		}
	}

	app.component('wwCart', {
		controller: Cart,
		templateUrl: 'app/views/cart.html',
		require: {
			order: '^wwCart'
		}
	})

	/**
	 *
	 */
	app.service('productResource', class Product {
		constructor($http, $q) {
			this.$http = $http
			this.$q = $q
		}

		_responseData(response) {
			return response.data
		}

		get(part) {
			if (!part) {
				return this.$q.when()			// No part, no products
			}

			var url = Url.product(part)

			return this.$http.get(url).then(this._responseData.bind(this)).then((product) => {
				// Assign sequential unique id to every group so we can can distinguish and order them
				if (product) {
					var i = 0
					product.partGroups.forEach((group) => group.id = i++)
				}

				return product
			})
		}

		getProducts() {
			var url = Url.products();

			return this.$http.get(url).then(
				this._responseData.bind(this),
				response => {
					// No product found. Simply return nothing
					return undefined
				}
			)
		}
	})
});
