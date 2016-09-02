define(['../app', './url'], function(app, Url) {
	/**
	 *
	 */
	class SectionsCache {
		constructor($q, sectionResource) {
			this.resource = sectionResource
			this._cache = undefined
			this.$q = $q
		}

		get(force) {
			if (this._cache || force) {
				return this.$q.when(this._cache)
			}

			return this.resource.getSections().then(sections => {
				this._cache = sections
				return this._cache
			})
		}

		byId(sectionId) {
			return this.get().then((sections) => {
				return _.find(sections, (section) => {
					return section.id === sectionId
				})
			})
		}
	}

	app.service('sectionsCache', SectionsCache)

	/**
	 *
	 */
	class ProductsCache {
		constructor($q, productResource) {
			this.resource = productResource
			this._cache = undefined
			this.$q = $q
		}

		get(force) {
			if (this._cache || force) {
				return this.$q.when(this._cache)
			}

			return this.resource.getProducts().then(products => {
				this._cache = products
				return this._cache
			})
		}

		byId(productId) {
			return this.get().then((products) => {
				return _.find(products, (product) => {
					return product.part.toLowerCase() === productId.toLowerCase()
				})
			})
		}
	}

	app.service('productsCache', ProductsCache)


	/**
	 *
	 */
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

			return this.$http.get(url).then(this._responseData.bind(this)).then((response) => {
				// No product found.
				return response
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
