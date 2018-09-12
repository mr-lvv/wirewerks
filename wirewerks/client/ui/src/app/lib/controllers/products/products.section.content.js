var productsSectionContentCtrl = function (section, $scope, $state) {
    if (section.notFound) {
        $state.go('home', [], { location: 'replace' });
        return;
    }

    $scope.section = section;


    var init = function(){

        $scope.header = (section.type + " products").toUpperCase();
        $scope.headerBackgroundClass = "bg-" + section.type;
    };

    init();
};