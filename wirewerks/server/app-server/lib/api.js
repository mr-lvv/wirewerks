var express = require('express')

var product = require('./product.json')

// For resource example: https://github.com/developit/express-es6-rest-api/blob/master/src/api/facets.js
class Api {
	constructor(app) {
		var client = express.Router();

		client.use(function (request, response, next) {
			response.set({'Cache-Control': 'max-age=0'});
			next();
		});

		client.get("/health", (request, response) => {
			response.status(200).send({status: 'online'})
		});

		client.get("/product/:part", (request, response) => {
			if(product[request.params.part])
			{
				response.status(200).send(product[request.params.part]);
			}
			else
			{
				response.send("can't find product");
			}
		});


		app.use('/api/client', client);
	}
}

module.exports = Api;
