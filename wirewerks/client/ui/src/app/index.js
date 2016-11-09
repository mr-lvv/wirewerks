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
	'./lib/resources',
	'common/index',
	'./lib/carousel'
], function(ng, FastClick, scrollTo, chroma, app, Url, CategoryColors, routes, search, resources, common, carousel) {
	var PartInfo = common.PartInfo
	var PartNumber = common.PartNumber
	var PartService = common.PartService
	var ProductValidation = common.ProductValidation

	var UnknownPartSymbol = common.UnknownPartSymbol

	app.config(($mdThemingProvider) => {
		$mdThemingProvider.theme('grey')
			.primaryPalette('grey')
	})

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
		constructor($location, cart) {
			this.$location = $location
			this.view = views.home
			this.filters = {section: undefined}
			this.cart = cart
			this.SingleProductMode = true
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

		getCartNbItem() {
			return this.cart.getNbOfItems()
		}

	}

	app.service('app', Application)

	/**
	 *
	 */
	class wwApp {
		constructor($routeParams, $scope, app, $mdSidenav, productsIdsCache) {
			this.SingleProductMode = app.SingleProductMode
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
					//here find out which id it is
					var theId = _.find(productsIds, function(o) {
						return _.startsWith(id.replace(/-/g,''), o)
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

	var appModule = app;

	/**
	 *
	 */
	class Home {
		constructor(app) {
			this.app = app

			if (appModule.SingleProductMode) {
				app.goToProducts()
			}
		}
	}

	app.component('wwHome', {
		controller: Home,
		templateUrl: 'app/views/home.html',
		bindings: {}
	})

	/**
	 *
	 */
	class Order {
		constructor(productResource, $scope, cart, rulesCache, productsRegexCache, $rootScope, $mdDialog) {
			this.productResource = productResource

			this.initProduct()

			this.productsRegexCache = productsRegexCache
			this.$rootScope = $rootScope

			this.cart = cart
			this.partNumber = ""
			this.$mdDialog = $mdDialog

			$scope.$watch('order.productId', this._refreshProduct.bind(this))
			$scope.$watch('order.partnumber', this._refreshProduct.bind(this))

			this.rules = {}
			//Should optimize for each product
			rulesCache.get().then(rules => {
				this.rules = rules
			})

			this.disableAutopick = false
		}

		initProduct(product) {
			this.parts = []							// Type PartInfo, not part (to include category..)
			this.product = product				// Not actually product, more like productTemplate
			this.selection = {}					// TODO: not needed (should just be the parts list)
			this.sections = []

			if (this.rules && this.product) {
				this.validator = new ProductValidation(this.product, this.rules[this.productId])
			} else {
				this.validator = undefined
			}
		}

		_refreshProduct() {
			this.productResource.get(this.productId).then(product => {
				// If no product found, keep current product displayed
				if (product) {
					this.initProduct(product)
				}

				if(this.partnumber)
				{
					//Need to regex that partnumber
					this.productsRegexCache.byId(this.productId).then(regex => {
						var partNumber = new PartNumber(product, regex, this.validator)

						//disable autopick or it will correct errors...
						this.disableAutopick = true

						var parsed = partNumber.parse(this.partnumber)
						parsed.forEach(partInfo => {
							this._addPart(partInfo)
						})

						this.disableAutopick = false

						if (_.keys(parsed.errors).length) {
							var message = `There were parts selected that are not allowed to for number <em>${this.partnumber}</em>.<br>Please re-select:<br>`
							message += _.values(parsed.errors).map(error => error.category.title + ' for ' + error.value).join('<br>')

							this.$mdDialog.show(
								this.$mdDialog.alert()
								.clickOutsideToClose(true)
								.title('Product Part Error.')
								.htmlContent(message)
								.ariaLabel('Alert Dialog')
								.ok('Got it!')
							);
						}

						if (parsed.length) {
							this.$rootScope.$emit('order.parts.changed')
						}
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

		_clearAutopick() {
			// Remove all previous autopick
			var autopickParts = this.parts.filter(partInfo => partInfo.autopick)
			autopickParts.forEach(partInfo => {
				this.removePart(partInfo)
				delete partInfo.autopick
			})
		}

		updatePart(partInfo) {
			this._removeCategory(partInfo.category)
			this.sections = []
			this.parts.push(partInfo)
		}

		valid(category, part) {
			return this.validator.valid(category, part)
		}

		validateAll() {
			if (!this.validator) {return}

			this.validator.createValidationMap(this.selection)

			//done with the category, we can check if we can autopick
			if (this.disableAutopick == false && !this.isAutopicking) {
				this.isAutopicking = true				// Prevents infinite loop. Otherwise autopicking will add/remove the same item forever
				this._clearAutopick()

				this.product.partGroups.forEach(group => {
					group.partCategories.forEach(category => {
						if (!this.validator.validPartsMap[category.title])
							return

						if (this.validator.validPartsMap[category.title]['number'] == 1) {

							var partValue = this.validator.validPartsMap[category.title]['default'];
							if (this.selection[category.title] == partValue)
								return

							var defaultCategory = category
							var defaultPart = this.validator.validPartsMap[category.title][partValue]['part']
							if (defaultPart.xIsDigit)
								return;

							var defaultPartInfo = new PartInfo(defaultPart, defaultCategory)
							defaultPartInfo.autopick = true
							this._addPart(defaultPartInfo)
						}
					})
				})

				this.isAutopicking = false
			}
		}

		// Interal add
		_addPart(partInfo) {
			if (!partInfo.part.inputValue && this.isPartInOrder(partInfo)) {
				return
			}
			this.updatePart(partInfo)
			this.selection[partInfo.category.title] = partInfo.part.value
			this.validateAll()
		}

		// User add part
		addPart(partInfo) {
			delete partInfo.autopick			// Since part Info are currently not the same in order and part, this is sort of useless, but the idea is right..
			this._addPart(partInfo)
		}

		removePart(partInfo) {
			this._removeCategory(partInfo.category)
			delete this.selection[partInfo.category.title]
			this.validateAll()
		}

		isAutopick(partInfo) {
			var part = this.getPart(partInfo)
			return part.autopick
		}

		getPart(partInfo) {
			return _.find(this.parts, (orderPart) => {
				return orderPart.part.value === partInfo.part.value &&
				orderPart.category.type === partInfo.category.type
			})
		}

		isPartInOrder(partInfo) {
			return this.getPart(partInfo)
		}

		verifyOrder() {
			return this.sections.every((section) => {
				if(!section.constant && !section.selected)
					return false
				return true
			})
		}

		addToCart() {
			var description = ""
			this.sections.every((section) => {

				if(!section.constant)
				{
					if(section.data.part.part.xIsDigit)
					{
						description += section.data.part.part.inputValue.replace(/^0+/, '').replace("D", ".").replace(/[^0-9.]/g,'');
					}
					description += section.data.part.part.description
				}

				return true
			})

			//description = description.toUpperCase()
			this.cart.addToCart(this.partNumber, description)
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

		simpleOrderNumber(useSymbolForUnknown) {
			var partnumber = ''
			var buffer = ''
			if(this.orderNumber())
			{
				this.orderNumber().forEach(section => {
					// Don't add anything past the last actual selected part. (ie: FA-1D shouldn't produce part number FA-1DBCCGGGXXN...)
					// This is a current limitation that could potentially be removed...
					var isActualPartSection = !section.constant && !section.data.part;
					if (useSymbolForUnknown && isActualPartSection) {
						buffer += _.repeat(UnknownPartSymbol, section.label.length)
					} else {
						buffer += section.label
					}

					if ( !section.constant && section.data.part) {
						partnumber += buffer
						buffer = ''
					}
				})
			}
			return partnumber
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
					.textContent('Product Added To Bill Of Materials!')
					.position('bottom right')
					.hideDelay(3000)
				)
			} else {
				this.$mdDialog.show(
					this.$mdDialog.alert()
						.clickOutsideToClose(true)
						.title('Product Selection Incomplete.')
						.textContent('You need to choose a part for every section before adding the product to bill of materials.')
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
				if (focusedIndex === -1 || focusedIndex === undefined)
					focusedIndex = 0

				// Start from focusedIndex an find the next category that has no selected parts
				for (let i = 0; i < categories.length; i++) {
					var nextIndex = (i + focusedIndex) % categories.length
					var category = categories[nextIndex]

					var part = this.order.partForCategory(category)
					if (!part || (part.xIsDigit && (part.inputValueValid == undefined || part.inputValueValid==false))) {
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
				var focusedIndex
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
	class wwProduct {
		constructor($scope, $rootScope, Nav) {
			this.SingleProductMode = app.SingleProductMode

			function initNav() {
				if (this.product && this.order) {
					this.nav = new Nav()
					this.nav.init(this.product, this.order)
				}
			}

			$scope.$watch(() => this.product, initNav.bind(this))
			$scope.$watch(() => this.order, initNav.bind(this))

			$rootScope.$on('part.selected', (event, partInfo) => this._onPartChanged(partInfo.category))
			$rootScope.$on('order.parts.changed', () => this._onPartChanged())
		}

		// Category is the category from which a change has been made (can be undefined)
		_onPartChanged(category) {
			if(this.nav)
				this.nav.next(category)
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

		validCategories() {
			if (!this.product) return

			var categories = []
			this.product.partGroups.forEach(group => {
				var cat = validCategories(group)
				categories = _.concat(categories, cat)
			})
			return categories
		}
	}

	app.component('wwProduct', {
		controller: wwProduct,
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
					var product = $('.productGroups')
					var nav = $('.md-sidenav-left')


					var rect = $element[0].getBoundingClientRect();
					var visibleLeft = rect.left >= 0 + nav.width()
					var visibleRight = rect.right <= (window.innerWidth || document.documentElement.clientWidth)

					var visible = visibleLeft && visibleRight

					var middle = (product.width() - product.offset().left)/2;

					var move = ""
					if(!visibleLeft){
						var goTo = product.scrollLeft() + $element.offset().left - nav.width() -50
						move  =  goTo + "px"
					}
					else
					{
						move += "+="
						move += middle + "px"
					}

					if(!visible)
						product.scrollTo(move, {
							axis: 'x',
							interrupt: true,
							duration: 300,
							left: '+=100'
						})

					$scope.$emit('carousel.focus', $element)
				}
			})

			$scope.$on('carousel.focused', (event, element) => {
				this.product.nav.setFocus(this.category)
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

		headerStyle() {
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
				/* No longer needed in carousel since everything is with a set width
				 style['min-width'] = 200;
				style['max-width'] = 200;
				 */
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
			return parts
		}

		getSelectedParts() {
			var parts =  this.category.parts.filter(part => {
				return this.order.isPartInOrder(new PartInfo(part, this.category))
			})

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

	class Part {
		constructor($rootScope, $scope, $mdToast) {
			this.displayValue=null
			this.displayValueStr=""
			this.nbDigitsBeforePeriod=0
			this.decimal = false
			this.$rootScope = $rootScope
			this.$scope = $scope
			this.$mdToast = $mdToast

			//this should only be on selected parts loop though
			//how to check class selected?
			$scope.$watch(() => this.part.inputValue, this._refreshDisplayValue.bind(this))
		}

		_refreshDisplayValue(inputValue) {
			if (!inputValue) {
				return
			}

			var temp = inputValue.replace('D','.')
			temp = temp.replace(/[^0-9.]/g, '')
			temp = parseFloat(temp)
			if(this.displayValue == temp)
				return
			this.displayValue = temp
			this.displayValueStr = this.displayValue.toString()
			if(this.displayValueStr.indexOf(".") > -1)
			{
				this.decimal = true
				var nbInt = parseInt(this.displayValueStr)
				this.nbDigitsBeforePeriod = nbInt.toString().length
			}
		}
		get partInfo() {

			if(this.part.inputValue && !this.displayValue) {
				var temp = this.part.inputValue.replace('D','.')
				temp = temp.replace(/[^0-9.]/g, '')
				this.displayValue = parseFloat(temp)
				this.displayValueStr = this.displayValue.toString()
				if(this.displayValueStr.indexOf(".") > -1)
				{
					this.decimal = true
					var nbInt = parseInt(this.displayValueStr)
					this.nbDigitsBeforePeriod = nbInt.toString().length
				}
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
				if (this.order.isAutopick(this.partInfo)) {
					this.$mdToast.show(
						this.$mdToast.simple()
						.textContent('This part is constrained by some other part and cannot be removed.')
						.position('bottom right')
						.hideDelay(3000)
					)
				} else {
					this.order.removePart(this.partInfo)
				}
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
			return PartService.instance.validate(this.displayValueStr, this.part)
		}

		_updateValue()
		{
			//this is backspace and delete keys
			if(this.displayValue == null || this.displayValue.length == 0)
			{
				this.displayValueStr = ""
				this.part.inputValue = undefined
				this.part.inputValueValid = false
				this.decimal = false
				this.nbDigitsBeforePeriod = 0
				return
			}

			if(!this.validate() || this.displayValue == 0) {
				this.part.inputValue = undefined
				this.part.inputValueValid = false
			} else {
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

				var maxDecimal = 3
				var inputValue = this.displayValueStr
				//need to pad with leading zeroes or trailing zeroes
				var splitValue = inputValue.split(".")

				if(splitValue[0].length < this.numberOfDigit())
					splitValue[0] = pad(splitValue[0], this.numberOfDigit(), false)

				this.part.inputValue = splitValue[0]
				if(this.decimal && splitValue[1]) {
					if(splitValue[1].length > 0 && splitValue[1].length < maxDecimal-1)
						splitValue[1] = pad(splitValue[1], maxDecimal-1, true)

					this.part.inputValue = this.part.inputValue + "." + splitValue[1]
				}

				//Replace dot by D
				this.part.inputValue = this.part.inputValue.replace('.', 'D')

				//Replace non X values by
				var toAppend = this.part.value.replace(/X+/g,'')
				this.part.inputValue += toAppend
				this.part.inputValueValid = true
			}

			this.order.updatePart(this.partInfo)
		}


		numberOfDigit() {
			return PartService.instance.numberOfDigit(this.part)
		}

		valueChange() {
			this._updateValue()
		}

		limit($event) {
			//use keydown so we get all keys including backspace and delete
			// On return
			var element = $event.target

			if ($event.which === 13) {
				element.blur()
				return
			}
			var keyCode = $event.which || $event.keyCode || 0
			if( keyCode == 8 || keyCode == 46 )
			{
				//this is backspace and delete keys
				if(this.displayValueStr == "")
					$event.preventDefault()
				else
				{
					this.displayValueStr = this.displayValueStr.slice(0,-1)
					if (this.displayValueStr.indexOf(".") < 0 && this.decimal == true) {
						this.decimal = false
						this._updateValue()
					}
				}
			}
			else if(keyCode >= 48 && keyCode<=57 || (keyCode >= 96 && keyCode <= 105))
			{
				var maxLength = this.numberOfDigit()
				if(this.part.allowDecimal && this.decimal) {
					maxLength = Math.min(maxLength, this.nbDigitsBeforePeriod) + 3
				}
				//check max number of digits
				if(this.displayValueStr.length == maxLength)
				{
					$event.preventDefault()
				}
				else {
					if(keyCode >= 96 && keyCode <= 105)
						keyCode -= 48;
					this.displayValueStr += String.fromCharCode(keyCode)
				}
			}
			else if(keyCode == 190 && this.part.allowDecimal)
			{
				//decimal
				if (this.decimal == false)
				{
					this.decimal = true
					this.nbDigitsBeforePeriod = this.displayValueStr.length
					this.displayValueStr += "."
				}
				else
					$event.preventDefault()
			}
			else{
				$event.preventDefault()
			}
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
			category: '=?',
			selected: '=?'
		}
	})

	class ProductImage {
		constructor($scope, productImagesResource) {
			this.productImagesResource = productImagesResource
			$scope.$watch(() => this.partNumber, this._refreshProduct.bind(this))
		}

		_refreshProduct(partnumber) {
			if (!partnumber) {
				delete this.image
				return
			}

			this.productImagesResource.getImageFilenames(partnumber).then(groups => {
				_.values(groups).forEach(imageInfo => {
					if (imageInfo.image)
						imageInfo.image = Url.productImages(imageInfo.image)
					else
						imageInfo.image = undefined
				})

				this.groups = groups
			})
		}
	}

	app.component('wwProductImage', {
		controller: ProductImage,
		templateUrl: 'app/views/productimage.html',
		bindings: {
			partNumber: '=?'
		}
	})

	/**
	 *
	 */
	class ProductSelection {
		constructor($scope, $element, $timeout, app, productsCache, productsRegexCache) {
			this.app = app
			this.searchText = this.selectedItem ? this.selectedItem.part : ''
			this.$scope = $scope
			this.products = []
			productsCache.get().then(products => {
				this.products = products
			})

			productsRegexCache.get().then(productsRegex => {
				this.productsRegex = productsRegex
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

			if(text == "")
				return products

			var results = _.filter(products, function(product) {
				var toSearch = product.part
				var toMatch = text
				if(text.length > product.part.length) {
					toSearch = text
					toMatch = product.part
				}

				var re = new RegExp('^' + toMatch, 'i')
				var matched =  re.test(toSearch)

				if(!matched) {
					matched = product.title.toUpperCase().indexOf(text.toUpperCase()) >= 0
					if(!matched)
						matched = product.subTitle.toUpperCase().indexOf(text.toUpperCase()) >= 0
					else if (!matched)
						matched = product.description.toUpperCase().indexOf(text.toUpperCase()) >= 0
				}
				return matched
			})

			if(results.length == 1) {
				//try to regex it
				var regexRule = this.productsRegex[results[0].part]
				var re = new RegExp(regexRule)
				if(re.test(text))
				{
					results[0] = {'part':text}
				}
			}
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
		constructor(cart, $scope, $http, FileSaver, app, $mdDialog) {
			//get from localStorage
			this.cart = cart
			this.quantityChoice = _.range(1,100);
			this.products = undefined
			this.$scope = $scope
			this.$scope.$watch(()=>this.products, this._updateQuantity.bind(this))

			//Angular's email doesn't check TLD, even though we understand it's possible to have: me@localhost, it won't happen in this case...
			this.emailValidation = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
			this.client = this.cart.getClient()
			this.$scope.$watch(()=>this.client, this._setClient.bind(this))

			this.email = this.cart.getEmail()
			this.$scope.$watch(()=>this.email, this._setEmail.bind(this))
			this.$http = $http
			this.FileSaver = FileSaver
			this.app = app
			this.$mdDialog = $mdDialog
		}

		_updateQuantity() {
			if(!this.products)
				return;
			this.cart.updateQuantity(this.products)
		}

		getPdf(){
			if (!this.$scope.form.$valid) {

				var error = "You need to enter the Client's "
				var and = ""
				if(!this.client) {
					error += "name"
					and = " and "
				}

				if(!this.emailValidation.test(this.email))
					error += and + " email"
				error += "."

				this.$mdDialog.show(
					this.$mdDialog.alert()
						.clickOutsideToClose(true)
						.title('Information Incomplete.')
						.textContent(error)
						.ariaLabel('Alert Dialog')
						.ok('Got it!')
						.targetEvent(event)
				);
				return
			}

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
			this.cartName = "myCart3"
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
			localStorage.setItem(this.cartName, JSON.stringify(products))
			this.products = products;
		}
		getAllCart() {
			if(!this.products)
				this.products = JSON.parse(localStorage.getItem(this.cartName))
			return this.products
		}

		getNbOfItems() {
			var allProducts = this.getAllCart()
			var total = 0

			for(var key in allProducts){
				if (allProducts.hasOwnProperty(key)) {
					total += Number(allProducts[key].quantity);
				}
			}
			return total;
		}

		addToCart(completePartNumber, description) {

			var products = this.getAllCart()
			if (!products)
				products = {}

			if(products[completePartNumber])
				products[completePartNumber].quantity++
			else {
				var connectorA =$('.product-image.connectorA')[0]?$('.product-image.connectorA')[0].src.split("/").pop(): undefined
				var connectorB = $('.product-image.connectorB')[0]? $('.product-image.connectorB')[0].src.split("/").pop() : undefined
				var cable = $('.product-image.cable')[0]?$('.product-image.cable')[0].src.split("/").pop():undefined
				products[completePartNumber] = {}
				products[completePartNumber].quantity = 1
				products[completePartNumber].name = completePartNumber
				products[completePartNumber].description = description
				products[completePartNumber].connectorA = connectorA
				products[completePartNumber].connectorB =  connectorB
				products[completePartNumber].cable = cable

			}

			this.updateQuantity(products)
		}

		removeFromCart(completePartNumber){
			var products = this.getAllCart()
			if(!products)
				return

			delete products[completePartNumber]
			localStorage.setItem(this.cartName, JSON.stringify(products))
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
						return _.startsWith(id.replace(/-/g,''), o)
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

	app.directive('ignoreMouseWheel', function ($document) {
		return {
			restrict: 'A',
			link: function (scope, element) {
				element.bind('mousewheel', function (event) {
					var scrollAmount = event.originalEvent.wheelDelta * -1 + $document.scrollTop()
					event.preventDefault();
					$document.scrollTop(scrollAmount)
				})
			}
		}
	})
});
