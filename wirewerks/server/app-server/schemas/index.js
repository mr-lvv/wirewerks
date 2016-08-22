var datasheetLinkPrefix = "http://www.wirewerks.com/wp-content/uploads/";
var datasheetLinkSuffix = "-EN-C.pdf";

class Product
{
	constructor()
	{
		this.title = "Cable Assemblies";
		this.subTitle = "Fiber Optic";
		this.description = "Build your Fiber Optic Cable Assembly: Replace each letter with the required option.";
		this.shortDescription = "b";
		this.longDescription = "blah blah blah blah";
		this.notes = "Other options are available upon request: Connectors Cable Constructions Fire Ratings MPO Wiring Schemes Polish Staggered Leads";
		this.dataSheetLink = "PDS-0023"; //prefix + dataSheetLink + suffix
		this.part = "FA";
		this.partGroups = []; //possible zero
		this.icon = "section8.svg";
		this.section = 8;
		this.finePrints = "* If more than one connector type, then place in alphabetical order, i.e. LC before SC, to avoid duplicate of part number creation for the same product. ** By default, cable assemblies with MPO connectors are manufactured with a Type A configuration. If an assembly is connectorized on both sides with an MPO connector, configuration types cannot be mixed. Examples: If a Type A is chosen on one end, the other end MUST also be of Type A configuration. *** If a decimal is required, add “D00” right after the non-decimal value and without leaving any space between. The “00” in “D00” must be replaced by the required value. Example: an assembly with an overall length of 105.55 meters shall read as 105D55."
	}
};

class PartGroup
{
	constructor()
	{
		this.partCategories = [];
	}
}

class PartCategory
{
	constructor()
	{
		this.title = "FIBER TYPE";
		this.type = "A";  //this should tell us the colour needed.
		this.length = 1;
		this.parts = [];
		this.finePrint = "*";
	}
};

class Part
{
	constructor()
	{
		this.description = "";
		this.shortDescription = "";
		this.finePrint = "**";
		this.value = "1";
		this.attributes = [];
		//this.formatRegularExp = "^[0-9]{2}X$"
	}
};

class Attribute
{
	constructor()
	{
		this.label = "Single Mode";
		this.bold = false;
	}
};