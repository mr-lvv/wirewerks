define([], function() {
	class Url {
		static product(part) {
			return '/api/client/product/' + part;
		}

		static products() {
			return '/api/client/products';
		}

		static sections() {
			return '/api/client/sections';
		}
	}

	return Url;
});
