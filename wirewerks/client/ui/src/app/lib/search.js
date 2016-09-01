define(['../app'], function(app) {
	/*
																									Work In Progress
	 */

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

	app.service('facetedQuery', FacetedQuery)
});
