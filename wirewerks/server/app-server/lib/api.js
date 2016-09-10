var express = require('express')
var products = require('./product.json')
var sections = require('./sections.json')
var rules = require('./rules.json')
var _ = require('lodash')
var pdf = require('html-pdf');
var fs = require('fs');
var path = require('path');
var ejs = require('ejs');

// For resource example: https://github.com/developit/express-es6-rest-api/blob/master/src/api/facets.js
class Api {
	constructor(app, config) {
		var client = express.Router();

		client.use(function (request, response, next) {
			response.set({'Cache-Control': 'max-age=0'});
			next();
		});

		client.get("/health", (request, response) => {
			response.status(200).send({status: 'online'})
		});

		client.get("/product/:part", (request, response) => {
			var product = products[request.params.part];
			if (!product) {
				product = products[request.params.part.toLowerCase()];
			}
			if (!product) {
				product = products[request.params.part.toUpperCase()];
			}

			if(product)
			{
				response.status(200).send(product);
			}
			else
			{
				response.status(404).send("can't find product");
			}
		});

		client.get("/products", (request, response) => {
			response.status(200).send(_.values(products));			// Search result product. Wouldn't actually need the entire product
		});

		client.get("/sections", (request, response) => {
			response.status(200).send(sections);
		});

		client.get("/rules", (request, response) => {
			response.status(200).send(rules);
		})

		client.post("/bom", (request, response) => {

			var logoUrl = 'http://localhost:' + config.port + '/images/general/wirewerks-beta.png'
			var data = {
				'title':'Wirewerks BOM',
				'parts' : request.body.parts,
				'logo' : logoUrl
			}

			var templatePath = path.join(__dirname, '../../../client/ui/' + config.clientFolder +'/bom/bom.ejs')

			ejs.renderFile(templatePath, data, function(err, html){
				pdf.create(html).toBuffer(function(err, buffer){
					response.setHeader('Content-Length', Buffer.byteLength(buffer));
					response.setHeader('Content-Type', 'application/pdf');
					response.setHeader('Content-Disposition', 'attachment; filename=test');
					response.write(buffer, 'binary');
					response.end();
				});
			});


		})

		app.use('/api/client', client);
	}
}

module.exports = Api;
