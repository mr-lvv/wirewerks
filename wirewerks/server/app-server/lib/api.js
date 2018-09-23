var express = require('express');
var path = require('path');
var ejs = require('ejs');
var sg = require('../models/solutionsGuide');
var AWS = require('aws-sdk');
var s3Client = new AWS.S3();

// For resource example: https://github.com/developit/express-es6-rest-api/blob/master/src/api/facets.js
class Api {
	constructor(app, config) {
		this.config = config;
		this.app = app;

		var client = express.Router();
		this.app.use("/api/client", client);

		app.use(function (req, res, next) {
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
			next();
		});

		client.get("/health", (req, res) => {
			res.status(200).send({ status: 'online' });
		});

		client.get('/sections', (req, res) => {
			sg.find({}, 'type description number').exec(function (err, sections) {
				if (err) {
					res.status(200).send({ 'notFound': true });
					return;
				}

				//Sections Found
				res.status(200).send(sections);
			});
		});

		client.get('/section/:number', (req, res) => {
			sg.findOne({ "number": req.params.number }).exec(function (err, section) {
				if (err || !section) {
					res.status(200).send({ 'notFound': true });
					return;
				}

				//Section Found
				res.status(200).send(section);
			});
		});

		client.get('/sectionDescription/:number', (req, res) => {
			sg.findOne({ "number": req.params.number }, 'description').exec(function (err, description) {
				if (err || !description) {
					res.status(200).send({ 'notFound': true });
					return;
				}

				//Section Found
				res.status(200).send(description);
			});
		});

		client.post('/addSections', (req, res) => {
			var sections = req.body;
			console.log(sections);

			sg.create(sections, (err) => {
				if(err)
					res.send(err);
				else
					res.send(sections);
			});			
		});

		client.post('/add/:sectionNumber', (req, res) => {
			sg.findOne({ "number": req.params.sectionNumber }).then(function (section) {
				var products = req.body;

				for (let product of products) {
					console.log(product);
					section.products.push(product);
				}

				section.save(function (err) {
					if (err)
						res.status(404).send(err);
					else
						res.status(200).send({ status: 'products added' });
				});
			});
		});
	}
}

module.exports = Api;
