var express = require('express')
var products = require('./product.json')
var sections = require('./sections.json')
var rules = require('./rules.json')
var regexsearch=require('./regexsearch.json')
var _ = require('lodash')
var pdf = require('html-pdf');
var fs = require('fs');
var path = require('path');
var ejs = require('ejs');

var testBom = {
	"title": "Bill of Materials",
	"parts": {
		"KW-ZZZ-BLK-BK": {
			"quantity": 1,
			"name": "KW-ZZZ-BLK-BK",
			"description": "the description"
		},
		"FA-1BPB02921N-SCALCA0-032": {
			"quantity": 1,
			"name": "FA-1BPB02921N-SCALCA0-032",
			"description": "the description"
		},
		"WNC-A9S04LCA343-3232": {
			"quantity": 1,
			"name": "WNC-A9S04LCA343-3232",
			"description": "the description"
		},
		"FA-2BRB04Z32N-LCALCA0-323D23": {
			"quantity": 15,
			"name": "FA-2BRB04Z32N-LCALCA0-323D23",
			"description": "the description"
		}
	},
	"logo": "http://localhost:3000/images/general/wirewerks-beta.png",
	"email": "dfssfd@sdm.com",
	"client": "ds"
}


// For resource example: https://github.com/developit/express-es6-rest-api/blob/master/src/api/facets.js
class Api {
	constructor(app, config) {
		this.config = config
		this.app = app

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

		client.get("/productsids", (request, response) => {
			response.status(200).send(_.keys(products));			// Search result product. Wouldn't actually need the entire product
		});

		client.get("/sections", (request, response) => {
			response.status(200).send(sections);
		});

		client.get("/rules", (request, response) => {
			response.status(200).send(rules);
		});

		client.get("/productsregex", (request, response) => {
			response.status(200).send(regexsearch);
		});

		client.post("/bom", (request, response) => {
			var data = {
				'title': 'Bill of Materials',
				'parts': request.body.parts,
				'email': request.body.email,
				'client': request.body.client
			}

			this._createBom(data, (error, html) => {
				pdf.create(html).toBuffer(function (err, buffer) {
					response.setHeader('Content-Length', Buffer.byteLength(buffer));
					response.setHeader('Content-Type', 'application/pdf');
					response.setHeader('Content-Disposition', 'attachment; filename=test');
					response.write(buffer, 'binary');
					response.end();
				})
			})
		})

		// For testing: http://localhost:3000/api/client/internal/test/bom
		client.get('/internal/test/bom', (request, response) => {
			this._createBom(testBom, (err, html) => {
				response.status(200).send(html)
			})
		})

		app.use('/api/client', client);
	}

	_createBom(data, callback) {
		var logoUrl = 'http://localhost:' + this.config.port + '/images/general/wirewerks-beta.png'
		data.logo = logoUrl
		var templatePath = path.join(__dirname, '../../../client/ui/' + this.config.clientFolder + '/bom/bom.ejs')

		ejs.renderFile(templatePath, data, (error, html) => {
			if (error) {
				console.error('Error generating pdf', error)
			}

			callback(error, html)
		})
	}
}

module.exports = Api;
