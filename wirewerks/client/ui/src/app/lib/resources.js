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
	class ProductsIdsCache {
		constructor($q, productsIdsResource) {
			this.resource = productsIdsResource
			this._cache = undefined
			this.$q = $q
		}

		get(force) {
			if (this._cache || force) {
				return this.$q.when(this._cache)
			}

			return this.resource.getProductsIds().then(productsIds => {
				this._cache = productsIds
				return this._cache
			})
		}
	}
	app.service('productsIdsCache', ProductsIdsCache)

	/**
	 *
	 */
	class RulesCache {
		constructor($q, rulesResource) {
			this.resource = rulesResource
			this._cache = undefined
			this.$q = $q
		}

		get(force) {
			if (this._cache || force) {
				return this.$q.when(this._cache)
			}

			return this.resource.getRules().then(rules => {
				this._cache = rules
				return this._cache
			})
		}
	}

	app.service('rulesCache', RulesCache)

	/**
	 *
	 */
	class ProductsRegexCache {
		constructor($q, productsRegexResource) {
			this.resource = productsRegexResource
			this._cache = undefined
			this.$q = $q
		}

		get(force) {
			if (this._cache || force) {
				return this.$q.when(this._cache)
			}

			return this.resource.getProductsRegex().then(productsRegex => {
				this._cache = productsRegex
				return this._cache
			})
		}

		byId(productId) {
			return this.get().then((productsRegex) => {
				return productsRegex[productId]
			})
		}
	}
	app.service('productsRegexCache', ProductsRegexCache)

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

	/**
	 *
	 */
	class ProductsIds extends Resource {
		constructor($http, $q) {
			super()

			this.$http = $http
			this.$q = $q
		}

		getProductsIds() {
			var url = Url.productsids();
			return this.$http.get(url).then(this._responseData.bind(this)).then((response) => {
				// No product found.
				return response
			})
		}
	}
	app.service('productsIdsResource', ProductsIds)

	/**
	 *
	 */
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

	/**
	 *
	 */
	class Rules extends Resource {
		constructor($http) {
			super()

			this.$http = $http
		}

		getRules() {
			var url = Url.rules()

			return this.$http.get(url).then(this._responseData.bind(this))
		}
	}
	app.service('rulesResource', Rules)

	/**
	 *
	 */
	class ProductsRegex extends Resource {
		constructor($http, $q) {
			super()

			this.$http = $http
			this.$q = $q
		}

		getProductsRegex() {
			var url = Url.productsRegex();
			return this.$http.get(url).then(this._responseData.bind(this))
		}
	}
	app.service('productsRegexResource', ProductsRegex)
});
