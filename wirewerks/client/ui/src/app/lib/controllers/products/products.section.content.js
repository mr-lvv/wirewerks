var productsSectionContentCtrl = function (section, $scope, $state, $sce, localStorageService) {
    if (section.notFound) {
        $state.go('home', [], { location: 'replace' });
        return;
    }

    $scope.section = section;
    $scope.selectedProduct = null;
    $scope.quantity = 1;

    var init = function(){

        $scope.header = (section.type + " products").toUpperCase();
        $scope.headerBackgroundClass = "bg-" + section.type;
    };
    //********************************************** ON PRODUCT CLICK BEGIN  **********************************************
    //----------------------------------------------------------------------------------------------------
    $scope.onProductClick = function(product){
        if(hasVariablePart(product)){
            $state.go('.product', {partNumber: product.partNumber} );
        }
        else{
            $scope.selectedProduct = product;
            $('#modalProductSummary').modal('show');
        }
    };
    //----------------------------------------------------------------------------------------------------
    var hasVariablePart = function(product){
        for(let part of product.parts)
            if(partIsVariable(part))
                return true;

        return false;
    };
    //----------------------------------------------------------------------------------------------------
    var partIsVariable = function (part) {
        return part ? part.type != 'constant' : null;
    };
    //********************************************** ON PRODUCT CLICK END  **********************************************
    //********************************************** PRODUCT QUANTITY BEGIN  **********************************************
    $scope.substractQuantity = function () {
        if ($scope.quantity > 1)
            $scope.quantity--;
    };
    //----------------------------------------------------------------------------------------------------
    $scope.addQuantity = function () {
        $scope.quantity++;
    };
    //********************************************** PRODUCT QUANTITY END  **********************************************
    //********************************************** CART BEGIN  **********************************************
    $scope.addToCart = function () {
        let product = $scope.selectedProduct;
        let key = product.partNumber;
        let details = getAllDetails(product);
        let selectedOptions = getAllSelectedOptions(product);

        let cartItem = generateCartItem(key, section.number, section.description, product.partNumber, product.partNumber, product.description, details, selectedOptions, $scope.quantity, getDatasheet(product));
        localStorageService.set(key, cartItem);
    };

    var generateCartItem = function (key, sectionNumber, sectionDescription, partNumber, placeholder, description, details, selectedOptions, quantity, datasheet) {
        return { 'key': key, 'sectionNumber': sectionNumber, 'sectionDescription': sectionDescription, 'partNumber': partNumber, 'placeholder': placeholder, 'description': description, 'details': details, 'selectedOptions': selectedOptions, 'quantity': quantity, 'datasheet': datasheet, 'orderDateTime': new Date().toLocaleString(), 'isCartItem': true };
    };
    //----------------------------------------------------------------------------------------------------
    var partIsNumeric = function (part) {
        return part ? part.type == 'numeric' : null;
    };
    //----------------------------------------------------------------------------------------------------
    var partIsSelect = function (part) {
        return part ? part.type == 'select' : null;
    };
    //----------------------------------------------------------------------------------------------------
    var partIsColor = function (part) {
        return part ? part.type == 'color' : null;
    };
    //----------------------------------------------------------------------------------------------------
    var partIsHidden = function (part) {
        return part ? part.type == 'hidden' : null;
    };
    //----------------------------------------------------------------------------------------------------
    var partIsConstant = function (part) {
        return part ? part.type == 'constant' : null;
    };
    //----------------------------------------------------------------------------------------------------
    var getAllDetails = function (product) {
        let details = [];
        for (let part of product.parts) {
            if (partIsVariable(part))
                details.push(part.details);
        }
        return details.join(', ');
    };
    var getAllSelectedOptions = function (product) {
        let selectedOptions = [];
        for (let part of product.parts) {
            if (!partIsConstant(part)) {
                if (partIsNumeric(part)) {
                    selectedOptions.push(part.selectedOption.value);
                    selectedOptions.push(part.input);
                }
                else {
                    selectedOptions.push(part.selectedOption.value);
                }
            }
        }
        return selectedOptions;
    };
    var getDatasheet = function (product) {
        for (let datasheet of product.datasheets)
            if (validateOption(datasheet))
                return datasheet.value;

        console.log("getDatasheet: No valid datasheet was found");
        return null;
    };
    $scope.getDatasheet = getDatasheet;
    var validateOption = function (option) {
        if (!Array.isArray(option.conditions) || !option.conditions.length)
            return true;

        //Loop acts as a boolean AND for conditions; Returns true only if all conditions are true
        for (let condition of option.conditions) {
            if (!conditionIsValid(condition))
                return false;
        }

        //all conditions returned true
        return true;
    };
    $scope.validateOption = validateOption;
    //----------------------------------------------------------------------------------------------------
    var conditionIsValid = function (condition) {
        let partToCheck = getPartFromId(condition.partId);

        //part to check has not had a selection made yet; Do not check conditions until a selection has been made; return true
        if (!partToCheck.selectedOption)
            return true;

        //Return true if any condition is evaluated to true   
        for (let valueToCheck of condition.acceptedValues) {
            if (partToCheck.selectedOption.value == valueToCheck)
                return true;
        }
        return false;
    };
    //********************************************** CART END  **********************************************
    $scope.getAsHtml = function (value) {
        return $sce.trustAsHtml(value) || $sce.trustAsHtml('&nbsp');
    };
    
    init();
};