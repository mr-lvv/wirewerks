define(['../app'], function(app) {

	class wwCarousel {
		constructor($scope, $element) {
			this.$element = $element
			this.container = this.$element.find('.container')

			// TODO: Remove delay before setup
			// TODO: make sure new/removed elements cause re-setup
			// TODO: if carousel width changes, should update positions
			setTimeout(() => this.setup(), 200)
		}

		_calculateItemDistanceFromFocus() {
			// for each item:
			//		set position away from focused
			//		set percentage away from focused
			
		}

		_setContainerHeight() {
			var height = 200			// Minimum height
			this.items.each((index, element) => {
				var elementHeight = $(element).outerHeight(true)
				height = Math.max(height, elementHeight)
			})

			this.container.height(height + 'px')
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
				$(element).css({top: 0, left: current})
				current += space
			})
		}

		_spaceItemsVertically() {
			if (!this.items.length) {return}


		}

		_placeItems() {
			this._calculateItemDistanceFromFocus()
			this._spaceItemsHorizontally()
			this._spaceItemsVertically()
		}

		setup() {
			this.items = this.$element.find('.carousel-item')
			console.log('# Elements:', this.items.length);

			this._setContainerHeight()
			this._placeItems()
		}


		static get ItemsWidth() {return 200}
	}

	app.component('wwCarousel', {
		controller: wwCarousel,
		transclude: true,
		templateUrl: 'app/views/carousel.html',
		bindings: {}
	})
});
