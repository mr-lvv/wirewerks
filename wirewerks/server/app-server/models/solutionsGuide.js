var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var conditionSchema = new Schema({
    partId: { type: String },
    acceptedValues: { type: [String] } //evaluate with boolean OR between accepted values; value1 || value2 || ... || valueN
},{ _id : false});

var optionSchema = new Schema({
    value: {type: String},
    description: {type: String},
    conditions: { type: [conditionSchema] }, //evaluate with boolean AND between conditions; cond1 && cond2 && ... && condN

    group: {type: Number} //If more than one option group is required
},{ _id : false });

var partSchema = new Schema({
    id: {type: String},
    type: { type: String, enum: ['constant', 'numeric', 'select', 'color', 'hidden'], required: true},
    placeholder: { type: String }, // ex: FA-, A, B, EE, NNN
    description: { type: String }, // ex: LEAD LENGTH   
    color: { type: String, enum: ['default','deep-orange', 'light-green', 'light-red', 'light-blue', 'light-purple', 'light-yellow', 'deep-blue', 'deep-green', 'deep-red', 'light-orange', 'deep-purple', 'pink', 'deep-yellow', 'sky-blue']},
    integersLength: { type: Number }, //number of expected digits
    decimalsLength: { type: Number }, //number of expected digits
    options: [optionSchema],

    columns: {type: Number}, //Number of columns in which options should be shown

    max: { type: Number }, //maximum allowed value
    min: { type: Number }, //minimum allowed value

    optionsGroup1Title: { type: String },
    optionsGroup2Title: { type: String }
},{ _id : false });

var datasheetSchema = new Schema({
    value: { type: String },
    conditions: { type: [conditionSchema] }, //evaluate with boolean AND between conditions; cond1 && cond2 && ... && condN
}, { _id: false });

var productSchema = new Schema({
    partNumber: {type: String, required: true},
    datasheets: [datasheetSchema],
    description: {type: String, required: true},
    parts: [partSchema]
},{ _id : false });

var sectionSchema = new Schema({
    type: { type: String, enum: ['copper', 'fiber', 'other']},
    description: {type: String, required: true},
    number: {type: Number, required: true},
    products: [productSchema]
}, { collection: 'SolutionsGuide'});

var SolutionsGuide = mongoose.model('SolutionsGuide', sectionSchema);

module.exports = SolutionsGuide;