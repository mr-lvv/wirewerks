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

	class Product {
		constructor(partNumber, datasheets, description, parts) {
			this.partNumber = partNumber;
			this.datasheets = datasheets;
			this.description = description;
			this.parts = parts;
		}

	}

	class Part {
		constructor(id, type, placeholder, color, options){
			this.id = id;                     //Part id always starts with underscore
			this.type = type;                 //TODO: Extend Part to create a class for each type
			this.placeholder = placeholder;   //Value used in the product's partNumber when no selection has been made
			this.color = color;               //TODO: Remove from part and let controllers automatically assign them 
			this.options = options;           //List of possible options for this part

			this.selectedOption = null;       //selected option reference

			//Numeric
			this.expectedFormat = null;
			this.input = null;
			this.lastValidInput = null;

			//
			this.isDisabled = true;
			this.value = null;
			this.details = null;
		}

		//Type functions
		get isNumeric() { return this.type == 'numeric'; }
		get isSelect() { return this.type == 'select'; }
		get isColor() { return this.type == 'color'; }
		get isHidden() { return this.type == 'hidden'; }
		get isConstant() { return this.type == 'constant'; }
		get isVariable(){ return !this.isConstant; }

		//Numeric Functions

	}

	return {
		//PartInfo: PartInfo,
		//PartNumber: PartNumber,
		//PartService: PartService,
		//ProductValidation: ProductValidation,
	};
}));
