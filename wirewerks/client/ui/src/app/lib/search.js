define(['../app'], function(app) {

	class GlobalQuery {
		constructor() {

		}
	}

	app.service('globalQuery', GlobalQuery)

	class FacetedQuery {
		constructor() {

		}

		searchResults() {

		}

		static FromGlobalQuery() {
			return new FacetedQuery()
		}
	}

	app.sevice('facetedQuery', FacetedQuery)
});
