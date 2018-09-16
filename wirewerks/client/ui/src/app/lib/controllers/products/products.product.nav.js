var productsProductNavController = function (section, product, $scope, $sce) {
    $scope.section = section;
    $scope.product = product;

    $scope.getAsHtml = function (value) {
        return $sce.trustAsHtml(value) || $sce.trustAsHtml('&nbsp');
    };
};