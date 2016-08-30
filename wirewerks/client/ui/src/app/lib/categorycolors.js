define(['chroma'], function(chroma) {
	class CategoryColors {
		static fromCategoryType(type) {
			type = type ? type.toUpperCase() : '';

			var color;
			if (type === 'A') {
				color = chroma('#e3811c')
			} else if (type === 'B') {
				color = chroma('#00a770')
			} else if (type === 'C') {
				color = chroma('#cc171e')
			} else if (type === 'D') {
				color = chroma('#0089cf')
			} else if (type === 'E') {
				color = chroma('#b70b7f')
			} else if (type === 'F') {
				color = chroma('#e6bd15')
			} else if (type === 'G') {
				color = chroma('#00658f')
			} else if (type === 'H') {
				color = chroma('#007f60')
			} else if (type === 'I') {
				color = chroma('#821f24')
			} else if (type === 'J') {
				color = chroma('#fcb116')
			} else if (type === 'K') {
				color = chroma('#90356a')
			} else if (type === 'L') {
				color = chroma('#ee4a97')
			} else if (type === 'N') {
				color = chroma('#c7b227')
			} else if (type === 'Y') {
				color = chroma('#f47421')
			} else {
				console.warn('No color set for category: ', type, ' -- using random color instead.')
				color = chroma.random()
			}

			return color;
		}
	}

	return CategoryColors
});
