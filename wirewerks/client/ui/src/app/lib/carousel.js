define(['../app', 'css-element-queries'], function(app, ResizeSensor) {
	class wwCarousel {
		constructor($scope, $element, $timeout) {
			this.$element = $element
			this.$scope = $scope
			this.$timeout = $timeout
			this.container = this.$element.find('.container')

			// TODO: Remove delay before setup
			// TODO: make sure new/removed elements cause re-setup
			// TODO: if carousel width changes, should update positions
			setTimeout(() => this.setup(), 200)

			// Set focus on an element
			$scope.$on('carousel.focus', (event, element) => {
				this._setFocus(element, true)
				this._spaceItemsVertically()
			})

			var debouncedPlaceItems = _.debounce(() => this._placeItems(), 250)

			new ResizeSensor($($element), unknownArg => {
				debouncedPlaceItems()			// Use debounce in case window resizing cause a ton of events.
			});

			// Can be terrible for performance, google for alternative, better ways! but works for now...
			$(window).resize((element) => {
				debouncedPlaceItems()			// Use debounce in case window resizing cause a ton of events.
			})
		}

		_setFocus(element, skipBroadcast) {
			this._clearAllFocus()
			var elem = $(element)
			elem.addClass('carousel-focused')
			elem.focus()

			// Get element's scope
			if (element && !skipBroadcast) {
				var scope = elem.scope()
				scope.$broadcast('carousel.focused', elem)
			}
		}

		_clearAllFocus() {
			this.items.each((index, element) => this._removeFocus(element))
		}

		_removeFocus(element) {
			$(element).removeClass('carousel-focused')
		}

		_isFocused(element) {
			return $(element).hasClass('carousel-focused')
		}

		_findFocusedItem(setIfNone) {
			var focused = _.find(this.items.toArray(), (element, index) => this._isFocused(element))

			if (!focused && setIfNone) {
				focused = this.items.first()
				this._setFocus(focused)
			}

			return focused
		}

		_itemIndex(element) {
			var index
			_.some(this.items.toArray(), (element, itemIndex) => {
				if (this._isFocused(element))
					index = itemIndex
			})

			return index
		}

		_calculateItemDistanceFromFocus() {
			var focused = this._findFocusedItem(true)
			var focusedIndex = this._itemIndex(focused)
			if (!focused || focusedIndex === undefined) {return console.warn('Should not have no focused items')}		// Just in case...

			var itemCount = this.items.length
			var peak = Math.max(focusedIndex + 1, itemCount - focusedIndex)		// Max # of items (left or right)

			var itemDistances = []
			itemDistances.focusedIndex = focusedIndex
			itemDistances.focus = focus
			itemDistances.peak = peak

			this.items.each((index, element) => {
				var distance = {element: element, index: index, distance: 0, inverseDistance: 0, direction: 'left'}

				if (index < focusedIndex) {
					distance.distance = focusedIndex - index
					distance.inverseDistance = index
					distance.direction = 'left'
				} else {
					distance.distance = index - focusedIndex
					distance.direction = 'right'
					distance.inverseDistance = distance.distance
				}

				distance.isFocused = index === focusedIndex
				distance.absolute = (peak - distance.distance) - 1

				itemDistances.push(distance)
			})

			return itemDistances
		}

		_setContainerHeight(distances) {
			distances = distances || this._calculateItemDistanceFromFocus()

			var maxItemHeight = 200			// Minimum height
			var buffer = 10							// Small buffer just in case I'm slightly wrong in a decimal somewhere

			this.items.each((index, element) => {
				var elementHeight = $(element).outerHeight(true)
				maxItemHeight = Math.max(maxItemHeight, elementHeight)
			})

			var vshapeHeight = distances.peak * wwCarousel.StepHeight
			var finalHeight = maxItemHeight + buffer + vshapeHeight

			this.container.height(finalHeight + 'px')
		}

		_spaceItemsHorizontally() {
			if (!this.items.length) {return}

			// Good rundown of different ways of getting width: http://stackoverflow.com/a/14600317/1578097
			var containerWidth = $('.container').width()
			var fakeContainerWidth = containerWidth - wwCarousel.ItemsWidth			// Account for the last item's size
			var itemsTotalWidth = this.items.length * wwCarousel.ItemsWidth

			// Behavior: 	space items so they fit in container, even if they overlap
			// 					Make sure they are not overspace, (eg: few items, large container)
			// 					so limit the space to the item size (Math.min).
			var ratio = fakeContainerWidth / itemsTotalWidth
			var space = Math.min(wwCarousel.ItemsWidth, wwCarousel.ItemsWidth * ratio)

			var current = 0
			this.items.each((index, element) => {
				$(element).css({left: current})
				current += space
			})
		}

		_spaceItemsVertically() {
			if (!this.items.length) {return}

			var distances = this._calculateItemDistanceFromFocus()
			distances.forEach(distance => {
				var zindex = distance.absolute + wwCarousel.BaseZIndex
				if (distance.isFocused)
					zindex = wwCarousel.FocusedZIndex

				$(distance.element).css({top: distance.absolute * wwCarousel.StepHeight + 'px', 'z-index': zindex})
			})

			this._setContainerHeight(distances)
		}

		_placeItems() {
			this._spaceItemsHorizontally()
			this._spaceItemsVertically()
		}

		_trackFocus() {
			var self = this
			this.items.focusin(function(event) {
				self.$timeout(() => {
					self._setFocus(this)
					self._spaceItemsVertically()
				})
			})
		}

		setup() {
			this.items = this.$element.find('.carousel-item')
			//console.log('# Elements:', this.items.length);

			// When element changes
			this._trackFocus()

			new ResizeSensor(this.items, unknownArg => {
				this._setContainerHeight()
			});

			// When element focus changes
			this._placeItems()
		}


		static get ItemsWidth() {return 200}
		static get BaseZIndex() {return 10}
		static get StepHeight() {return 10}			// # pixel difference between each items
		static get FocusedZIndex() {return 75}
	}

	app.component('wwCarousel', {
		controller: wwCarousel,
		transclude: true,
		templateUrl: 'app/views/carousel.html',
		bindings: {
		}
	})
});
