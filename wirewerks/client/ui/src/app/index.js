var Resources = {
	Product: {}
}

class App {
	constructor() {
	}
}

class Url {
	static products (part) {return '/api/client/product/' + part}
	static datasheet(sheet) {return 'http://www.wirewerks.com/wp-content/uploads/' + sheet + '-EN-C.pdf'}
}

class Product {
	constructor(productResource) {
		this.part = this.part || 'fa'
		productResource.get(this.part).then(product => {
			this.product = product
		})
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
	constructor() {

	}
}

class Part {
	constructor() {

	}

	select() {
		this.selected = !this.selected
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
.component('wwProduct', {
	controller: Product,
	templateUrl: 'app/views/product.html',
	bindings: {
		part: '=?'
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
	templateUrl: 'app/views/part.html',
	bindings: {
		part: '=?'
	}
})
.service('productResource', class Product {
	constructor($http) {
		this.$http = $http
	}

	get(part) {
		var url = Url.products(part)

		return this.$http.get(url).then(response => {
			return response.data
		})
	}
})
