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

        let cartItem = generateCartItem(key, section.number, product.partNumber, product.partNumber, product.description, details, $scope.quantity, product.datasheet);
        localStorageService.set(key, cartItem);
    };
    //----------------------------------------------------------------------------------------------------
    var generateCartItem = function (key, section, partNumber, placeholder, description, selectedOptions, quantity, datasheet) {
        return { 'key': key, 'section': section, 'partNumber': partNumber, 'placeholder': placeholder, 'description': description, 'selectedOptions': selectedOptions, 'quantity': quantity, 'datasheet': datasheet, 'orderDateTime': new Date().toLocaleString(), 'isCartItem': true };
    };
    //----------------------------------------------------------------------------------------------------
    var getAllDetails = function (product) {
        let details = [];
        for (let part of product.parts) {
            if (partIsVariable(part) && (part.details || null))
                details.push(part.details);
        }
        return details.join(', ');
    };
    //********************************************** CART END  **********************************************
    $scope.getAsHtml = function (value) {
        return $sce.trustAsHtml(value) || $sce.trustAsHtml('&nbsp');
    };
    
    init();
};