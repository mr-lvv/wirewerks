define(['../app', 'css-element-queries', 'hammer', 'popmotion'], function(app, ResizeSensor, Hammer, motion) {
	function loop(v, n) {
		return ((v % n) + n) % n;
	}

	function isExplorer() {
		return bowser.msie || bowser.msedge
	}

	class wwCarousel {
		constructor($scope, $element, $timeout, $interval) {
			this.$element = $element
			this.$scope = $scope
			this.$timeout = $timeout
			this.container = this.$element.find('.container')
			this.autoChooseMode = false									// Choose mode based on container size
			this.loop = false
			this.mode = wwCarousel.Modes.Center

			// TODO: Remove delay before setup.
			// TODO: make sure new/removed elements cause re-setup.
			// TODO: if carousel width changes, should update positions.
			// Not doing much: this._placementCheckCounter = $interval(() => this._placementCheck, 300)

			// COMPETE HACK! Makes setup look slooooooooooow on IE, but prevent
			// have a mess. Need to find better fix
			var waitBeforeSetup = 200
			if (this.isSlowBrowser()) {
				waitBeforeSetup = 500
			}
			$timeout(() => this.setup(), waitBeforeSetup)


			// Set focus on an element
			$scope.$on('carousel.focus', (event, element) => {
				this._setFocus(element, true)
			})

			var debouncedPlaceItems = _.debounce(() => {
				$timeout(() => this._placeItems())
			}, 100)

			new ResizeSensor($($element), unknownArg => {
				debouncedPlaceItems()			// Use debounce in case window resizing cause a ton of events.
			});

			// Can be terrible for performance, google for alternative, better ways! but works for now...
			$(window).resize((element) => {
				debouncedPlaceItems()			// Use debounce in case window resizing cause a ton of events.
			})

			var container = $element.find('.container')
			var hammer = new Hammer(container.get(0), {});
			hammer.on('swipe', (event) => {
				// Apply angular digest to anything that goes herepop
				$timeout(() => {
					if (event.direction === Hammer.DIRECTION_LEFT) {
						this._selectNext()
					} else {
						this._selectPrevious()
					}
				})
			})

			$scope.$on('$destroy', () => {this._placementCheck()})
		}

		// Check if the number of items has changed, and re-do setup if it has..
		_placementCheck() {
			var items = this._getItems()
			var current = this._items ? this._items.length : 0;

			if (items.length != current) {
				this.setup()
			}
		}

		isSlowBrowser() {
			return isExplorer()
		}

		_getItem(offset) {
			var focused = this._findFocusedItem(true)
			var focusedIndex = this._itemIndex(focused)

			var length = this.items.length || 1
			var target = focusedIndex + offset
			var itemIndex
			if (this.loop) {
				itemIndex = loop(target, length)
			} else {
				itemIndex = Math.max(0, Math.min(this.items.length - 1, target))
			}
			var element = this.items[itemIndex]

			return element
		}

		_selectNext() {
			var next = this._getItem(1)
			this._setFocus(next)
		}

		_selectPrevious() {
			var previous = this._getItem(-1)
			this._setFocus(previous)
		}

		_setFocus(element, skipBroadcast) {
			if (this._isFocused(element)) {
				return
			}

			this._selectElement(element, skipBroadcast)
			this._placeItems()
		}

		_selectElement(element, skipBroadcast) {
			element = $(element)
			this._previousSelected = this._selected
			this._selected = element

			this._clearAllFocus()
			element.addClass('carousel-focused')
			element.focus()

			// Get element's scope
			if (element && !skipBroadcast) {
				var scope = element.scope()
				scope.$broadcast('carousel.focused', element)
			}

			return true
		}

		_clearAllFocus() {
			if(!this.items) {
				return
			}

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
				this._selectElement(focused)
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
			if (!this.items || !this.items.length) {return}

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
				var distance = {
					element: element,
					index: index,
					distance: 0,
					inverseDistance: 0,
					direction: 'left',
					directionMultiplier: 1,
					target: {x: 0, y: 0}
				}

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
				distances.forEach(distance => {
					distance.target.x = Math.min(current, info.containerLeftover) // Never overflow container.
					current += containerInfo.spaceX
				})
			} else if (this.mode === wwCarousel.Modes.Center) {
				distances = distances || this._calculateItemDistanceFromFocus()

				// Make sure the focused element is always centered
				var centeredPosition = info.containerLeftover / 2
				distances.forEach(distance => {
					distance.target.x = (distance.distance * distance.directionMultiplier * wwCarousel.Options.StepWidth) + centeredPosition
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
					distance.target.y = distance.absolute * wwCarousel.Options.StepHeight
				})
			} else if (this.mode === wwCarousel.Modes.Center) {
				distances.forEach(distance => {
					var vshapeOffset = wwCarousel.Options.MinimumItemsShownHeight
					distance.target.y = (-1 * (distance.distance * wwCarousel.Options.StepHeight)) + vshapeOffset
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
			if (!distances) {return}

			var containerInfo = this._containerInfo()

			this._setMode(containerInfo)
			this._spaceItemsHorizontally(distances, containerInfo)
			this._spaceItemsVertically(distances)
			this._setZIndex(distances)

			var duration
			if (!this._initialized) {
				duration = 0
				this._initialized = true
			}

			distances.forEach(distance => {
				var tween = motion.tween({
					values: {
						x: {
							to: distance.target.x
						},
						y: {
							to: distance.target.y
						}
					}
				})

				if (duration !== undefined)
					tween.duration = duration

				if (this.isSlowBrowser()) {
					//console.log('Element', distance.element, distance.target.x, distance.target.y);
					$(distance.element).css({left: distance.target.x + 'px', top: distance.target.y + 'px'})
				} else {
					tween.on(distance.element).start()
				}
			})
		}

		_trackFocus() {
			var self = this
			this.items.focusin(function(event) {
				// Since setFocus will be async, we cannot guarantee it will have same _selected once it's executed.
				// Therefore, we should bail out now and not rely on _setFocus checking against selection to ignore its own operation.
				if (self._selected.is(this)) {
					return
				}

				self.$timeout(() => {
					self._setFocus(this)
				})
			})
		}

		_setItemsStyle() {
			this.items.each((index, element) => $(element).css({'min-width': wwCarousel.Options.ItemsWidth}))
		}

		_getItems() {
			return this.$element.find('.carousel-item')
		}

		setup() {
			this.items = this._getItems()

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
