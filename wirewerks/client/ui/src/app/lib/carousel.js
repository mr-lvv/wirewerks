define(['../app', 'css-element-queries'], function(app, ResizeSensor) {
	class wwCarousel {
		constructor($scope, $element, $timeout) {
			this.$element = $element
			this.$scope = $scope
			this.$timeout = $timeout
			this.container = this.$element.find('.container')
			this.autoChooseMode = true									// Choose mode based on container size
			this.mode = wwCarousel.Modes.Row

			// TODO: Remove delay before setup.
			// TODO: make sure new/removed elements cause re-setup.
			// TODO: if carousel width changes, should update positions.
			// BUG: sometimes selecting a part doesn't switch to next item.
			setTimeout(() => this.setup(), 200)

			// Set focus on an element
			$scope.$on('carousel.focus', (event, element) => {
				this._setFocus(element, true)
				this._placeItems()
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
			if (!this.items.length) {return}

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
				var distance = {element: element, index: index, distance: 0, inverseDistance: 0, direction: 'left', directionMultiplier: 1}

				if (index < focusedIndex) {
					distance.distance = focusedIndex - index
					distance.inverseDistance = index
					distance.direction = 'left'
					distance.directionMultiplier = -1
				} else {
					distance.distance = index - focusedIndex
					distance.direction = 'right'
					distance.inverseDistance = distance.distance
					distance.directionMultiplier = 1
				}

				distance.isFocused = index === focusedIndex
				distance.absolute = (peak - distance.distance) - 1

				itemDistances.push(distance)
			})

			return itemDistances
		}

		/* Experimental -- sane way to loop through items instead of using math (yuk! ;)) to calculate distances
		_loopItems(direction, callback) {
			var focused = this._findFocusedItem(true)
			var focusedIndex = this._itemIndex(focused)

			if (direction === 'left') {
			} else {
				callback(item)
			}
		}
		*/

		_setContainerHeight(distances) {
			distances = distances || this._calculateItemDistanceFromFocus()

			var buffer = 10								// Small buffer just in case I'm slightly wrong in a decimal somewhere
			var maxItemHeight = 200				// Minimum height
			this.items.each((index, element) => {
				var elementHeight = $(element).outerHeight(true)
				maxItemHeight = Math.max(maxItemHeight, elementHeight)
			})
			var finalHeight = 200 + buffer
			var vshapeHeight = 0

			if (this.mode === wwCarousel.Modes.Row) {
				vshapeHeight = distances.peak * wwCarousel.Options.StepHeight
				finalHeight = maxItemHeight + buffer + vshapeHeight
			} else if (this.mode === wwCarousel.Modes.Center) {
				// Could be focused item height here instead of maxItemHeight
				vshapeHeight = wwCarousel.Options.MinimumItemsShownHeight
				finalHeight = maxItemHeight + buffer + vshapeHeight
			} else {
				console.error('Unknown mode:', this.mode)
			}

			this.container.height(finalHeight + 'px')
		}

		_containerInfo() {
			var info = {}

			// Good rundown of different ways of getting width: http://stackoverflow.com/a/14600317/1578097
			info.containerWidth = $('.container').width()
			info.containerLeftover = info.containerWidth - wwCarousel.Options.ItemsWidth			// Space left after an element has been placed
			info.itemsTotalWidth = this.items.length * wwCarousel.Options.ItemsWidth

			info.ratioX = info.containerLeftover / info.itemsTotalWidth				// Account for the last item's size

			// Amount of space in X between each item
			info.spaceX = Math.min(wwCarousel.Options.ItemsWidth, wwCarousel.Options.ItemsWidth * info.ratioX)

			return info
		}

		_spaceItemsHorizontally(distances, containerInfo) {
			if (!this.items.length) {return}

			var info = containerInfo || this._containerInfo()

			if (this.mode === wwCarousel.Modes.Row) {
				// Behavior: 	space items so they fit in container, even if they overlap
				// 					Make sure they are not overspace, (eg: few items, large container)
				// 					so limit the space to the item size (Math.min).

				var current = 0
				this.items.each((index, element) => {
					var position = Math.min(current, info.containerLeftover) // Never overflow container.
					$(element).css({left: position})
					current += containerInfo.spaceX
				})
			} else if (this.mode === wwCarousel.Modes.Center) {
				distances = distances || this._calculateItemDistanceFromFocus()

				// Make sure the focused element is always centered
				var centeredPosition = info.containerLeftover / 2
				distances.forEach(distance => {
					var position = (distance.distance *distance.directionMultiplier * wwCarousel.Options.StepWidth) + centeredPosition
					$(distance.element).css({left: position})
				})
			} else {console.error('Unknown mode: ', this.mode)}
		}

		_setZIndex(distances) {
			if (!this.items.length) {return}

			distances = distances || this._calculateItemDistanceFromFocus()

			// Set z-index
			distances.forEach(distance => {
				var zindex = distance.absolute + wwCarousel.Options.BaseZIndex
				if (distance.isFocused)
					zindex = wwCarousel.Options.FocusedZIndex

				$(distance.element).css({'z-index': zindex})
			})
		}

		_spaceItemsVertically(distances) {
			if (!this.items.length) {return}

			distances = distances || this._calculateItemDistanceFromFocus()

			if (this.mode === wwCarousel.Modes.Row) {
				distances.forEach(distance => {
					$(distance.element).css({top: distance.absolute * wwCarousel.Options.StepHeight + 'px'})
				})
			} else if (this.mode === wwCarousel.Modes.Center) {
				distances.forEach(distance => {
					var vshapeOffset = wwCarousel.Options.MinimumItemsShownHeight
					var position = (-1 * (distance.distance * wwCarousel.Options.StepHeight)) + vshapeOffset
					$(distance.element).css({top: position + 'px'})
				})
			} else {console.error('Unknown mode:', this.mode)}

			this._setContainerHeight(distances)
		}

		_setMode(containerInfo) {
			if (this.autoChooseMode) {
				if (containerInfo.containerWidth < (wwCarousel.Options.ItemsWidth * 3)) {
					this.mode = wwCarousel.Modes.Center
				} else {
					this.mode = wwCarousel.Modes.Row
				}
			}
		}

		_placeItems() {
			var distances = this._calculateItemDistanceFromFocus()
			var containerInfo = this._containerInfo()

			this._setMode(containerInfo)
			this._spaceItemsHorizontally(distances, containerInfo)
			this._spaceItemsVertically(distances)
			this._setZIndex(distances)
		}

		_trackFocus() {
			var self = this
			this.items.focusin(function(event) {
				self.$timeout(() => {
					self._setFocus(this)
					self._placeItems()
				})
			})
		}

		_setItemsStyle() {
			this.items.each((index, element) => $(element).css({'min-width': wwCarousel.Options.ItemsWidth}))
		}

		setup() {
			this.items = this.$element.find('.carousel-item')

			this._setItemsStyle()
			//console.log('# Elements:', this.items.length);

			// When element changes
			this._trackFocus()

			new ResizeSensor(this.items, unknownArg => {
				this._setContainerHeight()
			});

			// When element focus changes
			this._placeItems()
		}


		static get Modes() {return {Center: 1, Row: 0}}
		static get Options() {
			var options = {
				ItemsWidth: 250,
				BaseZIndex: 10,
				StepHeight: 10,									// # pixel difference between each items
				StepWidth: 150,								// # pixel to separate items horizontally
				FocusedZIndex: 75,
				MinimumItemsShown: 3
			}

			options.MinimumItemsShownHeight = options.MinimumItemsShown * options.StepHeight
			return options
		}
	}

	app.component('wwCarousel', {
		controller: wwCarousel,
		transclude: true,
		templateUrl: 'app/views/carousel.html',
		bindings: {
		}
	})
});
