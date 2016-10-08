// if the module has no dependencies, the above pattern can be simplified to
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define([], factory);
	} else if (typeof module === 'object' && module.exports) {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory();
	} else {
		// Browser globals (root is window)
		root.common = factory();
	}
}(this, function () {

	// Unknown parts are more precise then "ABC.." in part number because sometimes part numbers's category value is the same as a part
	var UnknownPartSymbol = '?'

	/**
	 * Minimum required to distinguish different parts with same id
	 */
	class PartInfo {
		constructor(part, category) {
			this.part = part
			this.category = category
		}
	}

	/**
	 *
	 */
	class PartService {
		constructor() {
		}

		validate(value, part) {
			//here we can use regexp to check
			if (!value || value == 0)
				return false

			var numberOfDigit = this.numberOfDigit(part)
			if (part.allowDecimal) {
				if (value.indexOf(".") >= 0) {
					var decimalPart = value.split(".")[1]
					if (!decimalPart || decimalPart == 0)
						return false
				}

				var re = new RegExp('^\\d{1,' + numberOfDigit + "}(\\.[0-9][0-9]?)?$");
				return re.test(value)
			}
			else {
				var re = new RegExp('^\\d{1,' + numberOfDigit + "}$");
				return re.test(value)
			}
		}

		numberOfDigit(part) {
			return _.countBy(part.value)['X'];
		}

		static get instance() {return PartService._instance ? PartService._instance : PartService._instance = new PartService}
	}

	/**
	 * Handles product validation <mind blown>
	 */
	class ProductValidation {
		constructor(product, rule) {
			this.product = product
			this.rule = rule						// Rule for this product
			this.validPartsMap = {}
			this.selection = {}				// Last used selection (cached)
		}

		/**
		 * Validate a part in a category considering a set of parts
		 *
		 * @param category
		 * @param part
		 * @param selection Object Map between category and its part --> {category.title: part.value}
		 * @returns {boolean}
		 */
		validate(category, part, selection) {
			if (!this.rule)
				return true

			if (this.rule[category]) {
				var currentRulesArray = this.rule[category][part]
				var defaultRulesArray = this.rule[category]["*"]

				if (!currentRulesArray && !defaultRulesArray)
					return true

				currentRulesArray = currentRulesArray ? currentRulesArray : {}
				defaultRulesArray = defaultRulesArray ? defaultRulesArray : {}

				for (var key in selection) {
					if (selection.hasOwnProperty(key)) {
						var whichRule = currentRulesArray[key] ? currentRulesArray[key] : defaultRulesArray[key]
						if (whichRule) {
							//check if AND clause
							//see if the value affects anything
							if (whichRule[selection[key]]) {
								//check if there'a an AND clause
								var andArray = whichRule[selection[key]]["&"]
								if (andArray) {
									for (var key2 in andArray) {
										if (andArray.hasOwnProperty(key2)) {
											if (selection[andArray[key2].category] &&
											selection[andArray[key2].category] == andArray[key2].value)
												if (andArray[key2].valid == false)
													return false
										}
									}
								}

								if (whichRule[selection[key]].valid == false)
									return false
							}
							else if (whichRule["*"] && whichRule["*"].valid == false)
								return false
						}
					}
				}
			}

			return true
		}

		createValidationMap(selection) {
			this.validPartsMap = {}

			this.product.partGroups.forEach((group) => {
				group.partCategories.forEach((category) => {

					if (!category.parts)
						return;
					category.parts.forEach((part) => {

						var isValid = this.validate(category.title, part.value, selection)
						if (!this.validPartsMap[category.title]) {
							this.validPartsMap[category.title] = {}
						}


						this.validPartsMap[category.title][part.value] = {}
						this.validPartsMap[category.title][part.value]['valid'] = isValid
						if (isValid) {
							if (!this.validPartsMap[category.title]['number']) {
								this.validPartsMap[category.title]['number'] = 1
								this.validPartsMap[category.title]['default'] = part.value
								this.validPartsMap[category.title][part.value]['part'] = part
							}
							else
								this.validPartsMap[category.title]['number']++
						}
					})
				})
			})

			this.selection = _.clone(selection)			// Cache
		}

		// Using cached map
		valid(category, part) {
			return _.keys(this.selection).length === 0 || (this.validPartsMap[category] && this.validPartsMap[category][part]['valid'] === true)
		}
	}

	/**
	 * Parses part number
	 *        ex: FA-ABCDEE9GGGLCB
	 *
	 *        Can accept partial part number.
	 *        		ex: F-1DR
	 */
	class PartNumber {
		constructor(product, productRegex, validator) {
			this.product = product
			this.regex = productRegex
			this.validator = validator
		}

		/**
		 * Parse part number and creates a list of parts for every category
		 * @returns Array PartInfo
		 */
		parse(partnumber, keepWildcards) {
			if (!this.regex)
				return []

			if (!this.validator)
				return []

			// TODO: see if we can put it back
			//var productRegex = new RegExp(this.regex)
			//if (!productRegex.test(partnumber))
			//	return []

			var result = []

			this.selection = {}
			this.validator.createValidationMap(this.selection)

			var partnumberCleaned = partnumber.replace(/-/g, '')
			var startIndex = 0
			result.errors = {}			// Key is category where errors happen. Value is info object.
			this.product.partGroups.forEach((group) => {
				group.partCategories.forEach((category) => {
					if (category.constant) {
						//move forward
						startIndex += category.title.length
						return
					}

					var length = category.length
					var value = partnumberCleaned.substr(startIndex, length)

					// Simply skip parts that are not set (unknown parts)
					var isUnknownPart = value === _.repeat(UnknownPartSymbol, length)
					if (!isUnknownPart) {
						var found = category.parts.some(part => {
							var found = false
							var valueToCheck = value
							if (part.xIsDigit) {
								valueToCheck = value.replace(/[0-9]/g, "X")
							}

							// Check if part number is valid for this category
							var valid = false;				// Part number not found for this category
							if (part.value === valueToCheck) {
								valid = this.validator.valid(category.title, part.value, this.selection)

								if (valid && part.xIsDigit) {
									if (part.allowDecimal && partnumberCleaned[startIndex + length] == 'D') {
										//now we have to extract more
										length = length + 3
										value = partnumberCleaned.substr(startIndex, length)
									}

									var cleanedValue = part.allowDecimal ? value.replace('D', '.') : value.replace(/\D/g, '')
									if (!PartService.instance.validate(cleanedValue, part))
										valid = false
								}
							}

							// Wildcards are letters that can denote any valid part (ie: ABCDE)
							var wildcard = false
							if (!valid && (keepWildcards && value)) {
								var numberMatch = part.value === valueToCheck		// eg: 'XXN'
								var categoryMatch = value === category.type || value == _.repeat(category.type, category.length)
								var isWildCard = numberMatch || categoryMatch

								if (isWildCard) {
									valid = true
									wildcard = true
								}
							}

							if (valid) {
								if (part.xIsDigit) {
									part.inputValue = value
									part.inputValueValid = true

									if (wildcard) {
										part.inputValue = _.repeat('1', PartService.instance.numberOfDigit(part))
									}
								}

								var partInfo = new PartInfo(part, category)
								partInfo.wildcard = wildcard

								this.validator.createValidationMap(this.selection)			// Rebuild validation cache when parts change
								result.push(partInfo)
								found = true
							}

							return found
						})

						if (!found && value) {
							result.errors[category.title] = {category: category, value: value}		// Value is the part of the partnumber that caused the error
						}
					}

					startIndex += length
				})
			})

			return result
		}
	}

	return {
		PartInfo: PartInfo,
		PartNumber: PartNumber,
		PartService: PartService,
		ProductValidation: ProductValidation,

		UnknownPartSymbol: UnknownPartSymbol
	};
}));
