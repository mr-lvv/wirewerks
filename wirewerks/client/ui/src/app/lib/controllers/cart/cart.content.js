var cartContentCtrl = function (cart, $scope, $cookies, $state, $sce, localStorageService) {
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
        $scope.cartIsEmpty = _.keys(cart).length == 0;

        _.each(cart, function(item){
            initItem(item);
        });
    };

    var initItem = function(item){
        item.quantityMode = "closed";
        item.quantityInput = item.quantity;
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
    //-------------------------------------------EVENTS BEGIN---------------------------------------------
    var removeQuantityOpenCloseEvents = function () {
        $(document).off("click.cartQuantity");
        $(document).off("keyup.cartQuantity");
    };
    //----------------------------------------------------------------------------------------------------
    var addQuantityOpenCloseEvents = function (item, quantityInputContainerElem) {
        //Close quantityInput if user clicks anywhere outside the select box
        $(document).on("click.cartQuantity", function (event) {
            let evt = event || window.event;
            let target = evt.target;

            //User clicked outside of the quantityInput element
            if (!quantityInputContainerElem.contains(target)) {
                quantityGoToClosedState(item);
                $scope.$apply(); //manually update ng
            }
        });

        //Close quantityInput if user hits esc key
        $(document).on("keyup.cartQuantity", function (event) {
            let evt = event || window.event;
            let key = evt.keyCode || evt.which;

            if (key == 27) { //esc
                quantityGoToClosedState(item);
                $scope.$apply(); //manually update ng
            }
        });
    };
    //-------------------------------------------EVENTS END---------------------------------------------
    //------------------------------------------QUANTITY STATES--------------------------------------------
    var quantityGoToClosedState = function (item) {
        item.quantityMode = "closed";
        removeQuantityOpenCloseEvents();
    };
    //----------------------------------------------------------------------------------------------------
    var quantityGoToOpenedState = function (item, quantityInputContainerElem) {
        item.quantityMode = "opened";
        addQuantityOpenCloseEvents(item, quantityInputContainerElem);
    };
    //----------------------------------------------------------------------------------------------------
    var quantityGoToInputState = function (item, quantityInputElement) {
        item.quantityMode = "input";

        //set focus on input; timeout required because must wait for ng to update
        window.setTimeout(function () {
            quantityInputElement.focus();
        }, 0);

        removeQuantityOpenCloseEvents();
    };
    //------------------------------------------QUANTITY STATES--------------------------------------------
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
    //----------------------------------------------------------------------------------------------------
    $scope.onClickClosedQuantity = function (event, item) {
        let evt = event || window.event;
        let target = evt.target;

        quantityGoToOpenedState(item, target);
    };
    //----------------------------------------------------------------------------------------------------
    $scope.onClickOpenedQuantity = function (item) {
        let evt = event || window.event;
        let target = evt.target;

        let value = target.getAttribute("value");

        if (value == 'input') {
            let quantityInputElement = target.closest(".cart-quantity-container").getElementsByTagName('input')[0];
            quantityGoToInputState(item, quantityInputElement);
        }
        else {
            updateQuantity(item, value);
            quantityGoToClosedState(item);
        }
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
    var removeItem = function(key){
        localStorage.removeItem('wwApp.' + key);
        delete cart[key];
        
        updateCart();
    };
    //----------------------------------------------------------------------------------------------------
    var updateCart = function(){
        $scope.cartIsEmpty = _.keys(cart).length == 0;
        $scope.$apply();
    };
    //----------------------------------------------------------------------------------------------------
    $scope.getAsHtml = function (value) {
        return $sce.trustAsHtml(value) || $sce.trustAsHtml('&nbsp');
    };

    $scope.goToProduct = function(item){
        $state.go('products.section.product', { sectionNumber: item.sectionNumber, partNumber: item.placeholder, cartItem: item });
    };

    var imageError = function(e) {
        alert("ok");
        $(e).attr('data-src', $(e).attr('src'));
        $(e).attr('src', 'http://placehold.it/200x100/B40000/ffffff?text=404');
    };

    $().ready(function(){
        $('.hidden-before-load').each(function (i, obj) {
            $(obj).css('visibility', 'visible').hide().fadeIn('slow');
        });
        
    });

    initCart();
};