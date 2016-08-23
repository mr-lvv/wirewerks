var Resources = {
	Product: {}
}

class Url {
	static product (part) {return '/api/client/product/' + part}
	static products () {return '/api/client/products'}
	static datasheet(sheet) {return 'http://www.wirewerks.com/wp-content/uploads/' + sheet + '-EN-C.pdf'}
}


class App {
	constructor($timeout) {
		this.id = 'fa'
	}
}

class Order {
	constructor(productResource, $scope) {
		this.productResource = productResource

		$scope.$watch('order.productId', this._refreshProduct.bind(this))
	}

	_refreshProduct() {
		this.productResource.get(this.productId).then(product => {
			// If no product found, keep current product displayed
			if (product)
				this.product = product
		})
	}
}

class Product {
	constructor() {
	}

	getDataSheetLink() {
		if (!this.product) {return}

		return Url.datasheet(this.product.dataSheetLink)
	}
}

class PartGroup {
	constructor() {

	}
}

class PartCategory {
	constructor($scope) {
		$scope.$watch('$ctrl.category', category => {
			if (!category) {return}

			category.color = chroma.random();
			category.parts.forEach(part => {
				part.color = category.color.brighten(1.5)
			})
		})
	}

	style() {
		if (!this.category) {return}

		return {background: this.category.color.css()}
	}
}

class Part {
	constructor() {

	}

	select() {
		this.selected = !this.selected
	}

	style() {
		if (!this.part) {return}

		return {background: this.part.color.css()}
	}
}

class ProductSelection {
	constructor(productResource, $scope, $element) {
		this.searchText = this.selectedItem
		this.productResource = productResource
		this.$scope = $scope
		this.$element = $element
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

			var el = angular.element(this.$element.find('md-autocomplete'))
			var ctrl = el.controller('mdAutocomplete')
			ctrl.hidden = true
		}
	}

	$onChanges(changes) {
		if (changes.id)
			this.searchText = changes.id.currentValue
	}
}

angular.module('ww', [
	'ngCookies',
	'ngResource',
	'ngSanitize',
	'ngAria',
	'ngAnimate',
	'ngMaterial'
])
.run(() => {
	FastClick.attach(document.body)
})
.component('wwApp', {
	controller: App,
	templateUrl: 'app/views/app.html',
	bindings: {}
})
.component('wwOrder', {
	controller: Order,
	controllerAs: 'order',
	templateUrl: 'app/views/order.html',
	bindings: {
		productId: '='
	}
})
.component('wwProduct', {
	controller: Product,
	templateUrl: 'app/views/product.html',
	bindings: {
		product: '=?'
	}
})
.component('wwPartGroup', {
	controller: PartGroup,
	templateUrl: 'app/views/partgroup.html',
	bindings: {
		group: '=?'
	}
})
.component('wwPartCategory', {
	controller: PartCategory,
	templateUrl: 'app/views/partcategory.html',
	bindings: {
		category: '=?'
	}
})
.component('wwPart', {
	controller: Part,
	require: {
		order: '^wwOrder'
	},
	templateUrl: 'app/views/part.html',
	bindings: {
		part: '=?'
	}
})
.component('wwProductSelection', {
	controller: ProductSelection,
	templateUrl: 'app/views/productselection.html',
	bindings: {
		selectedItem: '=productId'
	}
})
.service('productResource', class Product {
	constructor($http) {
		this.$http = $http
	}

	_responseData(response) {
		return response.data
	}

	get(part) {
		var url = Url.product(part)

		return this.$http.get(url).then(this._responseData.bind(this))
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
