var cartContentCtrl = function (cart, $scope, $state, $sce, localStorageService) {
    $scope.quantityRange = 10;

    $(document).ready(function () {
        $('.removePopover').confirmation({
            onConfirm: function (event, element) {
                removeItem(element[0].getAttribute("data-key"));
            },
            onCancel: function (event, element) { }
        });
    });

    var initCart = function () {
        $scope.cart = cart;
        $scope.cartIsEmpty = cart.length == 0;

        for(let item of cart){
            initItem(item);
        }
    };

    var initItem = function(item){
        item.quantityInput = item.quantity;
        item.isRemoved = false;
    };

    //********************************************** NUMERIC INPUT BEGIN  **********************************************
    $scope.quantityInputIsValid = function (item) {
        if (item.quantityInput == 0)
            return false;

        if (item.quantityInput == "")
            return false;

        if (item.quantityInput == item.quantity)
            return false;

        return true;
    };
    //--------------------------------------------NUMERIC INPUT BEGIN------------------------------------------------
    $scope.onKeypressNumericInput = function (event) {
        let evt = event || window.event;
        let key = evt.keyCode || evt.which;

        if (!keyIsNumeric(key)) {
            evt.preventDefault(); //prevent key input
        }
    };
    //----------------------------------------------------------------------------------------------------
    //Prevents paste
    $scope.onPasteNumericInput = function (event) {
        let evt = event || window.event;

        if (evt.preventDefault) evt.preventDefault();
    };
    //----------------------------------------------------------------------------------------------------
    var keyIsNumeric = function (key) {
        key = String.fromCharCode(key);
        return /[0-9]/.test(key); //allow numbers
    };
    //--------------------------------------------NUMERIC INPUT END------------------------------------------------
    //--------------------------------------------NG EVENTS BEGIN------------------------------------------------
    $scope.onClickQuantityUpdate = function (item) {
        updateQuantity(item, item.quantityInput);
        quantityGoToClosedState(item);
    };
    //--------------------------------------------NG EVENTS END------------------------------------------------
    //----------------------------------------------------------------------------------------------------
    var updateQuantity = function (item, quantity) {
        item.quantity = quantity;
        item.quantityInput = quantity;

        updateLocalStorage(item);
    };
    //********************************************** NUMERIC INPUT END  **********************************************
    var updateLocalStorage = function (item) {
        let updatedItem = _.clone(item);
        delete updatedItem.quantityMode;
        delete updatedItem.quantityInput;

        localStorageService.set(item.key, updatedItem);
    };
    //----------------------------------------------------------------------------------------------------
    var removeItem = function (key) {
        localStorage.removeItem('wwApp.' + key);
        
        angular.forEach($scope.cart, function (item) {
            if (item.key == key){
                item.isRemoved = true;
            }
        });

        updateCart();
    };
    //----------------------------------------------------------------------------------------------------
    var updateCart = function () {
        $scope.cartIsEmpty = generateCartIsEmpty();
        $scope.$apply();
    };
    //----------------------------------------------------------------------------------------------------
    var generateCartIsEmpty = function () {
        if(cart.length == 0)
            return true;
        
        for(let item of cart){
            if(!item.isRemoved)
                return false;
        }
        
        return true;
    };
    //----------------------------------------------------------------------------------------------------
    $scope.getAsHtml = function (value) {
        return $sce.trustAsHtml(value) || $sce.trustAsHtml('&nbsp');
    };

    $scope.goToProduct = function(item){
        $state.go('products.section.product', { sectionNumber: item.sectionNumber, partNumber: item.placeholder, cartItem: item });
    };

    $().ready(function(){
        $('.hidden-before-load').each(function (i, obj) {
            $(obj).css('visibility', 'visible').hide().fadeIn('slow');
        });
        
    });

    initCart();
};