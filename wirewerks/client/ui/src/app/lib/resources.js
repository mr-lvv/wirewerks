define(['../app', './url'], function(app, Url) {
	class Resource {
		constructor() {}

		_responseData(response)
		{
			return response.data
		}
	}

	/**
	 *
	 */
	class Product extends Resource {
		constructor($http, $q) {
			super()

			this.$http = $http
			this.$q = $q
		}

		get(part) {
			if (!part) {
				return this.$q.when()			// No part, no products
			}

			var url = Url.product(part.toLowerCase())

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

			return this.$http.get(url).then(this._responseData.bind(this), response => {
				// No product found.
				return []
			})
		}
	}
	app.service('productResource', Product)

	class Section extends Resource {
		constructor($http) {
			super()

			this.$http = $http
		}

		getSections() {
			var url = Url.sections()

			return this.$http.get(url).then(this._responseData.bind(this))
		}
	}
	app.service('sectionResource', Section)
});
