define([
	'angular',
	'fastclick',
	'scrollTo',
	'chroma',
	'./app',
	'./lib/url',
	'./lib/categorycolors',
	'./lib/routes',
	'./lib/search',
	'./lib/resources'
], function(ng, FastClick, scrollTo, chroma, app, Url, CategoryColors, search, resources) {
	app.run(() => {
		FastClick.attach(document.body)
	})

	function productCategories(product) {
		var categories = []
		product.partGroups.forEach(group => {
			group.partCategories.forEach(category => {
				if (!category.constant)
					categories.push(category)
			})
		})

		return categories
	}

	function filterProductsBySection(products, section) {
		return _.filter(products, (product) => {
			return product.section === section.id
		})
	}

	var views = {
		product: 'product',
		cart: 'cart',
		home: 'home'
	}

	class Application {
		constructor($location) {
			this.$location = $location
			this.view = views.home
			this.filters = {section: undefined}

			// Search filters (ie: section, etc...)

		}

		goToHome() {
			ga('send', 'event', 'Navigation', 'Home');

			this.$location.path("/state/home");
		}

		goToCart() {
			ga('send', 'event', 'Navigation', 'View Cart');

			this.$location.path("/state/cart");
		}

		goToProducts(id) {
			id = id || 'FA'
			if (id)
				id = '/' + id

			ga('send', 'event', 'Navigation', 'Product', id);
			this.$location.path("/state/product" + id);
		}


		/**
		 * Toggle between cart/product
		 */
		toggleCart() {
			if (this.view === views.cart)
				this.goToProducts()
			else
				this.goToCart()
		}

	}

	app.service('app', Application)

	/**
	 *
	 */
	class wwApp {
		constructor($timeout, $routeParams, $scope, $location, app, $mdSidenav, productsIdsCache) {

			this.productsIds = []
			//Should optimize for each product


			this.id = ''
			this.app = app
			this.partnumber = ''
			this.foundId = ''

			// Should be removed at some point...
			$scope.$watch(() => $routeParams, (params) => {
				// Route params changed...
				if (params.productId)
					this.id = params.productId
			}, true)

			$scope.$watch(() => this.id, (id) => {
				if (!id) {
					return
				}

				productsIdsCache.get().then(productsIds => {
					this.productsIds = productsIds
					//here find out which id it is
					var theId = _.find(productsIds, function(o) {
						return id.replace(/-/g,'').startsWith(o)
					});

					if (!theId || theId == id)
					{
						this.foundId = id.toUpperCase()
						this.partnumber = ''
					}
					else
					{
						this.foundId = theId.toUpperCase()
						this.partnumber = id
					}
					this.app.goToProducts(id)
				})
			})

			this.$mdSidenav = $mdSidenav
		}

		toggleNavigation() {
			this.$mdSidenav('ww-nav-left').toggle().then(function () {});
		}
	}

	app.component('wwApp', {
		controller: wwApp,
		templateUrl: 'app/views/app.html',
		bindings: {}
	})

	/**
	 *
	 */
	class Home {
		constructor(app) {
			this.app = app
		}
	}

	app.component('wwHome', {
		controller: Home,
		templateUrl: 'app/views/home.html',
		bindings: {}
	})

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
	class Order {
		constructor(productResource, $scope, cart, rulesCache, partService, productsRegexCache) {
			this.productResource = productResource
			this.product = undefined;
			this.parts = []							// Type PartInfo, not part (to include category..)
			this.productsRegexCache = productsRegexCache

			this.sections = []
			this.cart = cart
			this.partNumber = ""
			this.partService = partService

			$scope.$watch('order.productId', this._refreshProduct.bind(this))
			$scope.$watch('order.partnumber', this._refreshProduct.bind(this))

			this.rules = {}
			//Should optimize for each product
			rulesCache.get().then(rules => {
				this.rules = rules
			})

			this.selection = {}
			this.validPartsMap = {}
			this.disableAutopick = false
		}

		_refreshProduct() {
			this.productResource.get(this.productId).then(product => {
				// If no product found, keep current product displayed
				if (product) {
					this.parts = []
					this.product = product				// Not actually product, more like productTemplate
					this.selection = {}
					this.sections = []
				}

				if(this.partnumber)
				{
					//Need to regex that partnumber
					this.productsRegexCache.byId(this.productId).then(regex => {
						if(!regex)
							return
						var productRegex = new RegExp(regex)
						if(!productRegex.test(this.partnumber))
							return

						//disable autopick or it will correct errors...
						this.disableAutopick = true
						var partnumberCleaned = this.partnumber.replace(/-/g,'')
						var startIndex = 0
						product.partGroups.forEach((group) => {
							group.partCategories.forEach((category) => {
								if (category.constant) {
									//move forward
									startIndex += category.title.length
								}
								else
								{
									var length = category['length']
									var value = partnumberCleaned.substr(startIndex, length)
									for(var i = 0 ; i < category.parts.length; i++) {
										var part = category.parts[i]
										var valueToCheck = value
										if(part.xIsDigit)
										{
											valueToCheck = value.replace(/[0-9]/g, "X")
										}

										if(part.value == valueToCheck)
										{
											var valid =  this.valid(category.title, part.value)
											if(!valid)
												break

											if(part.xIsDigit) {
												if(!this.partService.validate(value.replace(/\D/g,''), part))
													break
												part.inputValue = value
												part.inputValueValid = true
											}
											var partInfo = new PartInfo(part,category)
											this.addPart(partInfo)
											break
										}
									}
									startIndex += length
								}
							})
						})
						this.disableAutopick = false
					})
				}
			})
		}

		// Give a group id (ascending) from a category according to current product
		_groupId(category) {
			if (!this.product) return

			return _.find(this.product.partGroups, (group) => {
				var found = _.find(group.partCategories, (productCategory) => productCategory === category.type)
				if (found)
					return group.id
			})
		}

		/**
		 * Remove all parts related to a category
		 */
		_removeCategory(category) {
			_.remove(this.parts, (partInfo) => {
				return partInfo.category.type === category.type
			})
			this.sections = []
		}

		partForCategory(category) {
			if (!category) return

			return _.find(this.parts, (partInfo) => {
				return partInfo.category.type === category.type
			})
		}

		updatePart(partInfo) {
			this._removeCategory(partInfo.category)
			this.sections = []
			this.parts.push(partInfo)
		}

		valid(category, part) {
			return (_.keys(this.selection).length == 0 || (this.validPartsMap[category] && this.validPartsMap[category][part]['valid'] == true))
		}

		validateAll() {
			this.validPartsMap = {}
			this.product.partGroups.forEach((group) => {
				group.partCategories.forEach((category) => {

					if(!category.parts)
						return;
					category.parts.forEach((part) => {

						var isValid = this.validate(category.title, part.value)
						if(!this.validPartsMap[category.title]) {
							this.validPartsMap[category.title] = {}
						}


						this.validPartsMap[category.title][part.value] = {}
						this.validPartsMap[category.title][part.value]['valid'] = isValid
						if(isValid) {
							if(!this.validPartsMap[category.title]['number']) {
								this.validPartsMap[category.title]['number'] = 1
								this.validPartsMap[category.title]['default'] = part.value
								this.validPartsMap[category.title][part.value]['part'] = part
							}
							else
								this.validPartsMap[category.title]['number']++
						}
					})
					//done with the category, we can check if we can autopick
					if(this.disableAutopick == false) {
						if (this.validPartsMap[category.title]['number'] ==1) {

							var partValue = this.validPartsMap[category.title]['default'];
							if(this.selection[category.title] == partValue)
								return

							var defaultCategory = category
							var defaultPart = this.validPartsMap[category.title][partValue]['part']
							if(defaultPart.xIsDigit)
								return;
							var defaultPartInfo = new PartInfo(defaultPart, defaultCategory)
							this.addPart(defaultPartInfo)
						}
					}
				})
			})
		}

		validate(category, part) {
			if(!this.rules || !this.rules[this.productId] )
				return true

			if(this.rules[this.productId][category])
			{
				var currentRulesArray = this.rules[this.productId][category][part]
				var defaultRulesArray = this.rules[this.productId][category]["*"]

				if(!currentRulesArray && !defaultRulesArray)
					return true

				currentRulesArray = currentRulesArray ? currentRulesArray : {}
				defaultRulesArray = defaultRulesArray ? defaultRulesArray : {}

				for (var key in this.selection){
					if (this.selection.hasOwnProperty(key)) {
						var whichRule = currentRulesArray[key] ? currentRulesArray[key] : defaultRulesArray[key]
						if(whichRule)
						{
							//check if AND clause
							//see if the value affects anything
							if(whichRule[this.selection[key]]) {
								//check if there'a an AND clause
								var andArray = whichRule[this.selection[key]]["&"]
								if(andArray)
								{
									for (var key2 in andArray)
									{
										if(andArray.hasOwnProperty(key2))
										{
											if(this.selection[andArray[key2].category] &&
												this.selection[andArray[key2].category] == andArray[key2].value)
												if(andArray[key2].valid == false)
													return false
										}
									}
								}

								if (whichRule[this.selection[key]].valid == false)
									return false
							}
							else if(whichRule["*"] && whichRule["*"].valid == false)
								return false
						}
					}
				}
			}

			return true
		}

		addPart(partInfo) {
			if (!partInfo.part.inputValue && this.isPartInOrder(partInfo)) {return}
			this.updatePart(partInfo)
			this.selection[partInfo.category.title] = partInfo.part.value
			this.validateAll()
		}

		removePart(partInfo) {
			this._removeCategory(partInfo.category)
			delete this.selection[partInfo.category.title]
			this.validateAll()
		}

		isPartInOrder(partInfo) {
			return this.parts.some((orderPart) => {
				return 	orderPart.part.value === partInfo.part.value &&
							orderPart.category.type === partInfo.category.type
			})
		}

		verifyOrder() {
			return this.sections.every((section) => {
				if(!section.constant && !section.selected)
					return false
				return true
			})
		}

		addToCart() {
			this.cart.addToCart(this.partNumber)
		}

		orderNumber() {
			if (!this.product) return
			if (this.sections.length)
				return this.sections

			this.partNumber = ""
			var sections = this.sections

			var first = true
			this.product.partGroups.forEach((group) => {
				if (!first) {
					sections.push({label: '-', data: group, constant: true})
					this.partNumber += '-'
				}
				first = false

				group.partCategories.forEach((category) => {

					if (category.constant) {
						sections.push({
							label: category.title,
							data: this.product,
							constant : true
						})
						this.partNumber += category.title
					}
					else {
						var partInfo = this.partForCategory(category)

						var label = _.repeat(category.type, category.length)
						var selected = false
						if (partInfo) {
							if(partInfo.part.xIsDigit) {
								if(partInfo.part.inputValueValid)
								{
									label = partInfo.part.inputValue.toUpperCase()
									selected = true
								}
							}
							else {
								label = partInfo.part.value.toUpperCase()
								selected = true
							}

						}

						var color = category.color || CategoryColors.fromCategoryType(category.type)
						color = chroma(color.hex())		// Clone to modify
						if (!selected) {
							color = color.brighten(1.5)
							color.alpha(0.25)
						} else {
							color.alpha(0.75)
						}

						sections.push({
							label: label,
							classes: 'part',
							selected: selected,
							color: color.css(),
							data: {part: partInfo, category: category}
						})
						this.partNumber += label
					}
				})
			})
			return sections
		}
	}

	app.component('wwOrder', {
		controller: Order,
		controllerAs: 'order',
		templateUrl: 'app/views/order.html',
		bindings: {
			productId: '=',
			partnumber: '='
		}
	})

	function setPrimaryButtonClasses(classes) {
		classes['md-primary'] = true
	}

	/**
	 *
	 */
	class OrderNumber {
		constructor($mdDialog, $mdToast) {
			this.$mdDialog = $mdDialog
			this.$mdToast = $mdToast
		}

		cartButtonClasses() {
			var classes = {};
			if (this.order.verifyOrder()) {
				setPrimaryButtonClasses(classes)
			}

			return classes
		}

		addToCart(event) {
			if (this.order.verifyOrder()) {
				this.order.addToCart()

				this.$mdToast.show(
					this.$mdToast.simple()
					.textContent('Product Added To Cart!')
					.position('bottom right')
					.hideDelay(3000)
				);
			} else {
				this.$mdDialog.show(
					this.$mdDialog.alert()
						.clickOutsideToClose(true)
						.title('Product Selection Incomplete.')
						.textContent('You need to choose a part for every section before adding the product to cart.')
						.ariaLabel('Alert Dialog')
						.ok('Got it!')
						.targetEvent(event)
				);
			}
		}
	}

	app.component('wwOrderNumber', {
		controller: OrderNumber,
		templateUrl: 'app/views/ordernumber.html',
		require: {
			order: '^wwOrder'
		},
		bindings: {
		}
	})

	/**
	 *
	 */
	app.service('Nav', function($rootScope) {
		/**
		 *
		 */
		class Nav {
			constructor() {
			}

			init(product, order) {
				this.product = product
				this.order = order

				this.next()
			}

			_nextFocusedIndex(focusedIndex, categories, order) {
				if (focusedIndex === -1)
					focusedIndex = 0

				// Start from focusedIndex an find the next category that has no selected parts
				for (let i = 0; i < categories.length; i++) {
					var nextIndex = (i + focusedIndex) % categories.length
					var category = categories[nextIndex]

					if (!this.order.partForCategory(category)) {
						return nextIndex
					}
				}

				// All parts are selected
				return undefined
			}

			clearFocus() {
				var categories = productCategories(this.product)
				if (!categories.length)
					return

				// Reset navigation info on categories
				categories.forEach(category => {
					category.navFocus = false
				})
			}

			setFocus(category) {
				this.clearFocus()

				if (category) {
					category.navFocus = true
					$rootScope.$emit('nav.focus', category)
				}
			}

			next(fromCategory) {
				if (!this.order || !this.product) {
					console.warn('No order or product on navigation. Cannot focus next category.')
					return
				}

				//
				// Select next category
				var categories = productCategories(this.product)
				if (!categories.length)
					return

				// Find currently focused category
				var focusedIndex = 0
				if (fromCategory) {
					focusedIndex = _.findIndex(categories, category => category.type === fromCategory.type)
				}

				var category

				var index = this._nextFocusedIndex(focusedIndex, categories)
				if (index !== undefined) {
					category = categories[index]
				}

				this.setFocus(category)
			}
		}

		return Nav
	})

	function validCategories(group) {
		return _.filter(group.partCategories, (category) => !category.constant)
	}

	/**
	 *
	 */
	class Product {
		constructor($scope, $rootScope, Nav) {
			function initNav() {
				if (this.product && this.order) {
					this.nav = new Nav()
					this.nav.init(this.product, this.order)
				}
			}

			$scope.$watch(() => this.product, initNav.bind(this))
			$scope.$watch(() => this.order, initNav.bind(this))

			$rootScope.$on('part.selected', (event, partInfo) => {
				this.nav.next(partInfo.category)
			})
		}

		getDataSheetLink() {
			if (!this.product) {
				return
			}

			return Url.datasheet(this.product.dataSheetLink)
		}

		// Return all group that has valid categories
		validGroups() {
			if (!this.product) return

			var groups = _.filter(this.product.partGroups, group => {
				return validCategories(group).length
			})

			return groups
		}
	}

	app.component('wwProduct', {
		controller: Product,
		templateUrl: 'app/views/product.html',
		require: {
			order: '^wwOrder'
		},
		bindings: {
			product: '=?'
		}
	})

	/**
	 *
	 */
	class PartGroup {
		constructor() {

		}

		validCategories() {
			return validCategories(this.group)
		}
	}

	app.component('wwPartGroup', {
		controller: PartGroup,
		templateUrl: 'app/views/partgroup.html',
		bindings: {
			group: '=?'
		}
	})

	/**
	 *
	 */
	class PartCategory {
		constructor($scope, $rootScope, $element) {
			$scope.$watch('$ctrl.category', category => {
				if (!category) {
					return
				}

				category.color = CategoryColors.fromCategoryType(category.type);

				if (category.parts) {
					category.parts.forEach(part => {
						part.color = category.color.brighten(1.5)
					})
				}
			})

			$rootScope.$on('nav.focus', (event, category) => {
				//
				// Scroll horizontally to new category
				if (category.type === this.category.type) {
					var product = $('.product')
/*
					product.scrollTo($element, {
						axis: 'x',
						interrupt: true,
						duration: 2000,
						left: '+=150'
//						offset: {top: 0, left: -200}
					})
					*/
					/*
					var productOffset = product.offset().left
					var pos_x = $element.offset().left - productOffset
					var width = product.width()
					var visible = width - productOffset
					*/
				}
			})
		}

		_navFocusDistance() {
			if (this.isNavFocused())
				return 1

			return 0
		}

		_navZoom() {
			return this._navFocusDistance() * 1.25
		}

		style() {
			if (!this.category) {return}

			var color = this.category.color
			if (!this.isPicked())
				color = color.darken(1.1)

			var style = {background: color.css()}
			var navZoom = this._navZoom()
			if (navZoom) {
				style.zoom = (navZoom * 100) + '%'
			}

			return style
		}

		columnStyle() {
			var style = {}
			if (this.isNavFocused()) {
				style['min-width'] = 200;
				style['max-width'] = 200;
			}

			return style
		}

		// Is any part picked in this category?
		isPicked() {
			return this.order.partForCategory(this.category)
		}

		setNavFocus() {
			this.product.nav.setFocus(this.category)
		}

		// Is this category the next navigatable one?
		isNavFocused() {
			return this.category.navFocus
		}

		overlayClasses() {
			var classes = {
				picked: this.isPicked(),
				'nav-focused': this.isNavFocused()
			}

			classes[this.category.type] = true

			return classes
		}

		// Get parts to show for this category
		getParts() {
			var parts = this.category.parts

			if (!this.isNavFocused()) {
				parts = _.filter(parts, part => {
					return this.order.isPartInOrder(new PartInfo(part, this.category))
				})
			}

			return parts
		}
	}

	app.component('wwPartCategory', {
		controller: PartCategory,
		templateUrl: 'app/views/partcategory.html',
		require: {
			order: '^wwOrder',
			product: '^wwProduct'
		},
		bindings: {
			category: '=?',
			group: '=?'
		}
	})

	/**
	 *
	 */


	app.service('partService',  class PartService {
		constructor() {
		}
		validate(value, part) {
			//here we can use regexp to check
			if(!value || value == 0)
				return false

			var numberOfDigit = this.numberOfDigit(part)
			if(part.allowDecimal)
			{
				var re = new RegExp('^\\d{1,' + numberOfDigit + "}(\\.[0-9][0-9]?)?$");
				return re.test(value)
			}
			else
			{
				var re = new RegExp('^\\d{1,' + numberOfDigit + "}$");
				return re.test(value)
			}
		}

		numberOfDigit(part) {
			return _.countBy(part.value)['X'];
		}
	})

	class Part {
		constructor($rootScope, $scope, partService) {
			this.inputValue=null
			this.decimal = false
			this.$rootScope = $rootScope
			this.$scope = $scope
			this.partService = partService
		}

		get partInfo() {

			if(this.part.inputValue) {
				var temp = this.part.inputValue.replace('D','.')
				this.inputValue = temp.replace(/[^0-9.]/g, '')
			}

			return new PartInfo(this.part, this.category)
		}
		
		valid() {
			return this.order.valid(this.category.title, this.part.value)
		}

		digitClick(event) {
			// Don't propagate to parent, otherwise it will unselect current part
			event.stopPropagation()
		}

		nextCategory() {
			this.$rootScope.$emit('part.selected', this.partInfo)
		}

		select() {
			if (this.order.isPartInOrder(this.partInfo)) {
				this.order.removePart(this.partInfo)
			} else {
				this.order.addPart(this.partInfo)
			}

			// If there is a second step expected, then don't continue navigation.
			if (!this.part.xIsDigit) {
				this.nextCategory()
			}
		}

		shouldShowXIsDigit() {
			return (this.part.xIsDigit && this.isSelected());
		}

		getSuffix() {
			return this.part.value.substring(this.numberOfDigit())
		}

		validate() {
			return this.partService.validate(this.inputValue, this.part)
		}

		valueChange() {

			//This happens when we delete or backspace

			//this.order.updatePart(this.partInfo)
			if (this.inputValue.indexOf(".") < 0)
				this.decimal = false

			this._updateValue()

		}

		_updateValue()
		{
			var maxChars = this.numberOfDigit()
			var maxDecimal = this.decimal ? 2+1 : 0 //includes the period

			if(this.inputValue.length > maxChars + maxDecimal)
			{
				//the keypress is adding a number to big, shift everything to the right
				this.inputValue = this.inputValue.substr(1);

				//if it's decimal we need to move the decimal point too
				if(this.decimal)
					this.inputValue = (this.inputValue * 10).toFixed(2)
			}

			if(!this.validate()) {
				this.part.inputValue = undefined
				this.part.inputValueValid = false
			} else {
				this.part.inputValue = this.inputValue
				this.part.inputValueValid = true
				function pad(num, size, decimal) {
					var s = num + "";
					while (s.length < size) {
						if(!decimal)
							s = "0" + s;
						else
							s = s + "0"
					}
					return s;
				}

				//need to pad with leading zeroes or trailing zeroes
				var splitValue = this.inputValue.split(".")

				if(splitValue[0].length < maxChars)
					splitValue[0] = pad(splitValue[0], maxChars, false)

				this.part.inputValue = splitValue[0]
				if(this.decimal) {
					if(splitValue[1].length > 0 && splitValue[1].length < maxDecimal-1)
						splitValue[1] = pad(splitValue[1], maxDecimal-1, true)

					this.part.inputValue = this.part.inputValue + "." + splitValue[1]
				}

				//Replace dot by D
				this.part.inputValue = this.part.inputValue.replace('.', 'D')

				//Replace non X values by
				var toAppend = this.part.value.replace(/X+/g,'')
				this.part.inputValue += toAppend
			}

			this.order.updatePart(this.partInfo)
		}


		numberOfDigit() {
			return this.partService.numberOfDigit(this.part)
		}

		limit($event)
		{
			var element = $event.target

			// On return
			if ($event.which === 13) {
				element.blur()
				return
			}

			var keyPress = String.fromCharCode($event.which)
			if(this.part.allowDecimal && !this.decimal && keyPress == '.')
			{
				this.decimal = true
			}
			else if(isNaN(keyPress)) {
				return $event.preventDefault()
			}
			//now we know it's either the decimal or a digit that was input
			this.inputValue = this.inputValue ? this.inputValue : ""
			this.inputValue += keyPress
			this._updateValue()
			$event.preventDefault()
		}

		style() {
			if (!this.part) {
				return
			}

			return {background: this.part.color.css()}
		}

		isSelected() {
			return this.order.isPartInOrder(this.partInfo)
		}
	}

	app.component('wwPart', {
		controller: Part,
		require: {
			order: '^wwOrder',
			partCategory: '^wwPartCategory'
		},
		templateUrl: 'app/views/part.html',
		bindings: {
			part: '=?',
			group: '=?',
			category: '=?'
		}
	})

	/**
	 *
	 */
	class ProductSelection {
		constructor($scope, $element, $timeout, app, productsCache) {
			this.app = app
			this.searchText = this.selectedItem ? this.selectedItem.part : ''
			this.$scope = $scope
			this.products = []
			productsCache.get().then(products => {
				this.products = products
			})

			this._sendTextAnalytics = _.debounce(text => {
				ga('send', 'event', 'Search', 'text', text);
			}, 3000)
		}

		// Sort of hacking way since depending on autocomplete's controller inner workings
		_getAutocomplete() {
			var el = angular.element(this.$element.find('md-autocomplete'))
			var ctrl = el.controller('mdAutocomplete')

			return ctrl
		}

		_showAutocomplete(value) {
			var el = angular.element(this.$element.find('md-autocomplete'))
			var ctrl = el.controller('mdAutocomplete')
			ctrl.hidden = !value
		}

		searchTextChange(text) {
			this._sendTextAnalytics(text)
		}

		selectedItemChange(item) {
			this.id = item ? item.part : ''
		}

		query(text) {
			var products = this.products

			// Filter by selected section
			var sectionFilter= this.app.filters.section
			if (sectionFilter) {
				products = filterProductsBySection(products, sectionFilter)
			}
			var results = _.filter(products, function(product) {
				var re = new RegExp('^' + text, 'i')
				return re.test(product.part)
			})
			return results
		}

		focus(event) {
			this._showAutocomplete(true)
		}

		$onChanges(changes) {
			if (changes.id)
				this.searchText = changes.id.currentValue
		}

		notFoundMessage() {
			var message = 'No products matching "' + this.searchText + '" were found'
			if (this.app.filters.section) {
				message += ' in <em class="heavy">section ' + this.app.filters.section.id + '</em>'
			}

			message += '.'

			return message
		}
	}

	app.component('wwProductSelection', {
		controller: ProductSelection,
		templateUrl: 'app/views/productselection.html',
		bindings: {
			id: '=productId'
		}
	})

	/**
	 *
	 */
	class wwCart {
		constructor(cart, $scope, $http, FileSaver,app) {
			//get from localStorage
			this.cart = cart
			this.quantityChoice = _.range(1,100);
			this.products = undefined
			this.$scope = $scope
			this.$scope.$watch(()=>this.products, this._updateQuantity.bind(this), true)

			//Angular's email doesn't check TLD, even though we understand it's possible to have: me@localhost, it won't happen in this case...
			this.emailValidation = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
			this.email = ""
			this.client = this.cart.getClient()
			this.$scope.$watch(()=>this.client, this._setClient.bind(this))

			this.email = this.cart.getEmail()
			this.$scope.$watch(()=>this.email, this._setEmail.bind(this))
			this.$http = $http
			this.FileSaver = FileSaver
			this.app = app
		}

		_updateQuantity() {
			if(!this.products)
				return;
			this.cart.updateQuantity(this.products)
		}

		getPdf(){
			var data = {};
			data.client = this.client
			data.parts = this.products
			data.email = this.email
			var config = {
				headers : {
			 		'Content-Type': 'application/json'
				}
				,responseType: 'arraybuffer'
			}

			ga('send', 'event', 'User Action', 'Get Bill of Materials', data);

			var fs = this.FileSaver
			this.$http.post(Url.bompdf(), data, config)
				.then(
					function(response){
						// success callback
						var dataBlob = new Blob([response.data], { type: 'application/pdf' });
						fs.saveAs(dataBlob, 'wirewerks-bom.pdf', true);

					},
					function(response){
						// failure callback
					}
				);
		}

		getProducts() {
			//accidentally call watch
			this.products = this.cart.getAllCart()
			return this.products
		}

		removeFromCart(partNumber) {
			this.cart.removeFromCart(partNumber)
		}

		goTo(partNumber) {
			this.app.goToProducts(partNumber)
		}

		getClient() {
			this.cart.getClient()
		}

		_setClient(client) {
			this.cart.setClient(this.client ? this.client : "")
		}

		getEmail() {
			this.cart.getEmail()
		}

		_setEmail(client) {
			this.cart.setEmail(this.email ? this.email : "")
		}


		isEmpty() {
			var products = this.cart.getAllCart()
			if (!products || !_.keys(products).length)
				return true
			return false
		}

		getSubmitClasses() {
			var classes = {}

			if (this.$scope.form.$valid) {
				setPrimaryButtonClasses(classes)
			}

			return classes
		}
	}

	app.component('wwCart', {
		controller: wwCart,
		templateUrl: 'app/views/cart.html',
		require: {
			order: '^wwCart'
		}
	})

	app.service('cart',  class Cart {
		constructor() {
			this.products = undefined
			this.email = undefined
			this.client = undefined
		}


		getClient() {
			if(this.client == undefined)
				this.client = localStorage.getItem("client")

			if(this.client == undefined)
				this.client = ""

			return this.client
		}

		setClient(client){
			localStorage.setItem("client", client)
			this.client = client
		}

		getEmail() {
			if(!this.email)
				this.email = localStorage.getItem("email")
			return this.email ? this.email : ""
		}

		setEmail(email){
			localStorage.setItem("email", email)
			this.email = email
		}

		updateQuantity(products) {
			localStorage.setItem("myCart2", JSON.stringify(products))
			this.products = products;
		}
		getAllCart() {
			if(!this.products)
				this.products = JSON.parse(localStorage.getItem("myCart2"))
			return this.products
		}

		addToCart(completePartNumber) {
			//window.localStorate
			//alert("added to cart: "+ completePartNumber)

			var products = this.getAllCart()
			if (!products)
				products = {}

			if(products[completePartNumber])
				products[completePartNumber].quantity++
			else {
				products[completePartNumber] = {}
				products[completePartNumber].quantity = 1
				products[completePartNumber].name = completePartNumber
				products[completePartNumber].description = "the description"
			}

			this.updateQuantity(products)
		}

		removeFromCart(completePartNumber){
			var products = this.getAllCart()
			if(!products)
				return

			delete products[completePartNumber]
			localStorage.setItem("myCart2", JSON.stringify(products))
			this.products = products;
		}
	})

	/**
	 *
	 */
	class wwProductNav {
		constructor(app, $scope, $routeParams, productsCache, sectionsCache, $mdSidenav, productsIdsCache) {
			// Set the section to the currently viewed product on page refresh
			if (app.view === views.product) {
				var id = $routeParams.productId
				productsIdsCache.get().then(productsIds => {
					this.productsIds = productsIds
					//here find out which id it is
					var theId = _.find(productsIds, function(o) {
						return id.startsWith(o)
					});

					productsCache.byId(theId).then((product) => {
						sectionsCache.byId(product.section).then((section) => {
							this.section = section
						})
					})
				})
			}

			$scope.$watch(() => this.section, (section) => {
				app.filters.section = section
			})

			this.$mdSidenav = $mdSidenav
		}

		close() {
			this.$mdSidenav('ww-nav-left').close().then(function () {});
		}
	}

	app.component('wwProductNav', {
		controller: wwProductNav,
		templateUrl: 'app/views/productnav.html',
	})

	/**
	 *
	 */
	class wwSectionSelection {
		constructor(sectionsCache) {
			sectionsCache.get().then((sections) => {
				this.sections = sections
			})
		}
	}

	app.component('wwSectionSelection', {
		controller: wwSectionSelection,
		templateUrl: 'app/views/sectionselection.html',
		bindings: {
			selected: '=?'
		}
	})

	/**
	 *
	 */
	class wwSectionProducts {
		constructor(app, productsCache, $scope) {
			$scope.$watch(() => this.section, (section) => {
				productsCache.get().then(products => {
					this.products = []
					if (section) {
						this.products = filterProductsBySection(products, section)
					}
					else
						this.products = _.sortBy(products, function(o) {return o.part})
				})
			})
		}
	}

	app.component('wwSectionProducts', {
		controller: wwSectionProducts,
		templateUrl: 'app/views/sectionproducts.html',
		bindings: {
			section: '=?'
		}
	})

	/**
	 *
	 */
	class wwProductListItem {
		constructor(app, $mdSidenav) {
			this.selectProduct = ($event) => {
				app.goToProducts(this.product.part)

				var sidenav = $mdSidenav('ww-nav-left')
				if (!sidenav.isLockedOpen()) {
					sidenav.toggle().then(function () {});
				}
			}
		}
	}

	app.component('wwProductListItem', {
		controller: wwProductListItem,
		templateUrl: 'app/views/productlistitem.html',
		bindings: {
			product: '='
		}
	})
});
