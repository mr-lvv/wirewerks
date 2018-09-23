define([
    '../app.js',
    './controllers/home/home.nav.js',
    './controllers/home/home.content.js',
    './controllers/cart/cart.nav.js',
    './controllers/cart/cart.content.js',
    './controllers/products/products.section.nav.js',
    './controllers/products/products.section.content.js',
    './controllers/products/products.product.nav.js',
    './controllers/products/products.product.content.js',
], function (
    app,
    homeNavCtrl,
    homeContentCtrl,
    cartNavCtrl,
    cartContentCtrl,
    productsSectionNavCtrl,
    productsSectionContentCtrl,
    productsproductNavCtrl,
    productsproductContentCtrl
) {
    app.controller('home.nav.ctrl', homeNavCtrl);
    app.controller('home.content.ctrl', homeContentCtrl);
    app.controller('cart.nav.ctrl', cartNavCtrl);
    app.controller('cart.content.ctrl', cartContentCtrl);
    app.controller('products.section.nav.ctrl', productsSectionNavCtrl);
    app.controller('products.section.content.ctrl', productsSectionContentCtrl);
    app.controller('products.product.nav.ctrl', productsproductNavCtrl);
    app.controller('products.product.content.ctrl', productsproductContentCtrl);

    app.directive('imageonload', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
 
                $(element).parent().css('visibility', 'visible').hide().fadeIn('slow');
             
            }
        };
    })
});