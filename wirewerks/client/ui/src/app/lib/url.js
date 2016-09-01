define([], function() {
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

		static sections() {
			return '/api/client/sections'
		}
	}

	return Url
});
