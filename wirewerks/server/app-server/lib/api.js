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
var PartNumber = require_common('index').PartNumber
var ProductValidation = require_common('index').ProductValidation
var groups = require('./groups.json')

function clock(start) {
	if (!start) return process.hrtime();
	var end = process.hrtime(start);
	return Math.round((end[0] * 1000) + (end[1] / 1000000));
}
/*
class ImageInfo {
	constructor(partNumber, path) {
		this.partNumber = partNumber
		this.path = path
	}
}
*/

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

class ProductImages {
	constructor(clientFolder) {
		this._clientFolder = clientFolder
	}

	_imageFolder() {
		var imageFolder = path.join(this._clientFolder + '/images/products')
		return imageFolder
	}

	_getProductImageFiles() {
		if (!this._productImages) {
			var files = fs.readdirSync(this._imageFolder());
			files = files.filter(file => {return path.extname(file) === '.png'})
			this._productImages = files.map(file => {
				return {partNumber: path.basename(file, '.png'), path: file}
			})
		}

		return this._productImages

	}

	_mapPart(groupFrom, groupTo, partInfo) {
		var result = _.cloneDeep(partInfo)

		groupFrom.categories.some((category, index) => {
			if (category.type === partInfo.category.type) {
				result.category.type = groupTo.categories[index].type			// If this isn't enough, then we would need to find the actual category and replace it entirely..
				return true
			}

			return false			// Keep looping
		})

		return result
	}

	_applyGroupMappingsToImages(productGroups, images, parser, productTemplate) {
		var newImages = []

		productGroups.mappings.forEach(mapping => {
			// Get groups from mapping
			var groupFrom = _.find(productGroups.groups, group => group.name === mapping.from)
			var groupTo = _.find(productGroups.groups, group => group.name === mapping.to)

			images.forEach(imageInfo => {
				if (imageInfo.group.name !== groupFrom.name) {return}

				//
				// Create new image info for map

				// Create same part number, but replace "from" categories with ?? and add same parts in "to" categories
				var parts = imageInfo.parts.map(this._mapPart.bind(this, groupFrom, groupTo))
				var number = PartNumber.partNumber(parts, productTemplate, true, true)

				var newImageInfo = {
					partNumber: number,
					path: imageInfo.path,										// Keep same image file

					productGroups: imageInfo.productGroups,
					group: groupTo,
					parts: parts
				}

				newImages.push(newImageInfo)
			})
		})

		images = _.concat(images, newImages)

		return images
	}

	_getProductImages(productGroups, productTemplate, parser) {
		var images = this._getProductImageFiles()

		// Add all parts for each imageInfo
		images = images.map(imageInfo => {

			imageInfo.productGroups = productGroups
			imageInfo.parts = parser.parse(imageInfo.partNumber, true)			// Could cache this since it's probably really slow
			imageInfo.group = this._groupFromImageInfo(imageInfo)				// Tag which group each image is from

			return imageInfo
		})

		images = this._applyGroupMappingsToImages(productGroups, images, parser, productTemplate)

		return images
	}

	_groupFromImageInfo(imageInfo) {
		var result

		// Find last group that has parts
		imageInfo.productGroups.groups.forEach(group => {
			var hasParts = imageInfo.parts.some(this._isPartInGroup.bind(this, group))
			if (hasParts) {
				result = group
			}
		})

		return result
	}

	_isPartInGroup(group, partInfo) {
		return group.categories.some(category => category.type === partInfo.category.type)
	}

	_filterPartsNotInGroup(parts, group) {
		return parts.filter(this._isPartInGroup.bind(this, group))
	}

	/**
	 * Get Image that best fit given parts for given group
	 *
	 * Strategy: Get closest matches in order, then filter for each group.
	 * Mapping: "Map images category HHI to JJK
	 */
	_getImageForParts(productImages, requestParts, group) {
		// Remove all images that are not related to current group
		productImages = productImages.filter(imageInfo => imageInfo.group.name === group.name)

		// Add all parts for each imageInfo
		productImages = productImages.map(imageInfo => {
			var info = _.clone(imageInfo)
			info.matches = 0
			info.exactMatches = 0
			info.exactMatchInGroup = 0

			return info
		})

		// Remove those that don't have any parts (since some were filtered)
		productImages = productImages.filter(imageInfo => imageInfo.parts.length)

		// Remove those that only have wildcard matches for all parts
		productImages = productImages.filter(imageInfo => {
			return imageInfo.parts.some(partInfo => !partInfo.wildcard)
		})

		// Tag the number of matching parts for each imageInfo
		requestParts.forEach(partInfo => {
			productImages.forEach(imageInfo => {
				// Get the matching part for this category
				var imagePart = _.find(imageInfo.parts, part => {
					return part.category.type === partInfo.category.type
				})

				if (imagePart) {
					// Is it an exact match?
					if (imagePart.part.value === partInfo.part.value) {
						imageInfo.exactMatches++
						imageInfo.matches++

						if (this._isPartInGroup(group, partInfo)) {
							imageInfo.exactMatchInGroup++
						}
					} else if (imagePart.wildcard) {
						imageInfo.matches++
					}
				}
			})
		})

		// Remove those that have more matching parts then the requested part number
		// This is to prevent FA-1B to be found as a better match then FA-1 for FA-1
		productImages = productImages.filter(imageInfo => !(imageInfo.parts.length > requestParts.length))

		// Remove if there is not at least one exact match.
		productImages = productImages.filter(imageInfo => imageInfo.exactMatches > 0)

		// Is there at least one exact match in current group?
		productImages = productImages.filter(imageInfo => imageInfo.exactMatchInGroup > 0)

		// Does it even have any match (eg: for request FA-1, FA-2 shouldn't produce any image)
		productImages = productImages.filter(imageInfo => imageInfo.matches)

		// Find the image that has the most parts matching
		var ordered = _.orderBy(productImages, [
			function numberOfMatchingParts(o) {
				return o.matches
			},
			function numberOfExactMatchingParts(o) {
				return o.exactMatches
			},
			function numberExactMatches(o) {
				return _.filter(o.parts, part => !part.wildcard).length
			}
		], 'desc')

		var image = _.first(ordered)

		if (image)
			return image.path
	}

	/**
	 *	Take in product id:
	 *        FA-1BCDEE9
	 *
	 * 		Method [Get Image For Parts]
	 *
	 *        Get part per group
	 *        do matching per group
	 *
	 *
	 * @param id String Eg: FA-1D
	 * @returns {*}
	 */
	getImagesFromProductId(id) {
		if (!id) {
			return {error: true, message: 'No Product specfifed.'}
		}

		id = id.toUpperCase()												// Normalize product id
		var productTokens = id.split(/-(.+)?/)						// Split on first occurence of '-'
		var product = productTokens[0]
		var productId = productTokens[1].replace('-', '')		// Remove '-' as there are none in filenames

		if (!product || !productId) {
			return {error: true, message: 'Product id is malformed. It needs to be FA-XXXXXXXXXXXX.'}
		}

		// Find correct image from product number
		var productTemplate = _.cloneDeep(products[product])		// Better then cloneDeep here would be to not modify product in PartNumber

		if (!productTemplate) {
			return {error: true, message: 'Product not found: ' + product}
		}

		var productGroups = groups[product]

		var validator = new ProductValidation(productTemplate, rules[productTemplate.part])
		var productRegex = regexsearch[productTemplate.part]
		var parser = new PartNumber(productTemplate, productRegex, validator)

		var requestParts = parser.parse(id)			// Only get requested parts (no wildcard)
		if (requestParts.errors.length) {
			return {error: true, message: 'Product number invalid: ', errors: requestParts.errors}
		}

		var productImages = this._getProductImages(productGroups, productTemplate, parser)

		var images = {}

		productGroups.groups.forEach(group => {
			var image = this._getImageForParts(productImages, requestParts, group)
			if (image) {
				images[group.name] = {image: image}
			}
		})

		return images
	}
}

// For resource example: https://github.com/developit/express-es6-rest-api/blob/master/src/api/facets.js
class Api {
	constructor(app, config) {
		this.config = config
		this.app = app
		this.productImages = new ProductImages(this._clientFolder())

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

		/**
		// 1.	Strip product number (FA-)
		// 2.	find closest match
		// 			Going left to right, find part number in image list.
		//				When faced wth wildcard (A, B, C..), consider even match.
		//					disambiguate by longest match until all parts have been found (or not found), return closest match.
		*/
		client.get('/productimage', (request, response) => {
			var start = clock()

			var id = request.query.productid
			var images = this.productImages.getImagesFromProductId(id)

			if (images.error) {
				return response.status(400).send(images)
			} else {
				response.status(200).send({groups: images})
			}

			console.log(`Product image request took ${clock(start)} (ms)`)			// Just in case it becomes overly slow...
		})

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

	_clientFolder() {
		return path.join(__dirname, '../../../client/ui/' + this.config.clientFolder)
	}

	_createBom(data, callback) {
		var logoUrl = 'http://localhost:' + this.config.port + '/images/general/wirewerks-beta.png'
		data.logo = logoUrl
		var templatePath = path.join(this._clientFolder() + '/bom/bom.ejs')

		ejs.renderFile(templatePath, data, (error, html) => {
			if (error) {
				console.error('Error generating pdf', error)
			}

			callback(error, html)
		})
	}
}

module.exports = Api;
