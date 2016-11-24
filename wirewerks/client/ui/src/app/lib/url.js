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

		static rules() {
			return '/api/client/rules'
		}

		static bompdf() {
			return '/api/client/bom'
		}

		static productsids(){
			return '/api/client/productsids'
		}

		static productsRegex(){
			return '/api/client/productsregex'
		}

		static productImagesApi() {
			return '/api/client/productimage'
		}

		static productImages(imageFile) {
			var path = 'https://s3.amazonaws.com/wirewerks-sg-images'
			if (imageFile)
				path += '/' + imageFile

			return path
		}
	}

	return Url
});
