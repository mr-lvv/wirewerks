var productsSectionContentCtrl = function (section, $scope, $state) {
    if (section.notFound) {
        $state.go('home', [], { location: 'replace' });
        return;
    }

    $scope.section = section;
};