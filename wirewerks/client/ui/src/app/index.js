console.log('Common: ', common);

class App {
	constructor($http) {
		this.$http = $http
		this.output = 'No data'
	}

	health() {
		this.$http.get('/api/client/health').then((response) => {
			console.log('Response: ', response);
			this.output = response.data;
		})
	}
}

angular.module('ww', [
	'ngCookies',
	'ngResource',
	'ngSanitize',
	'ngAria',
	'ngAnimate',
	'ngMaterial'
])
.component('wwApp', {
	controller: App,
	templateUrl: 'app/views/app.html',
	bindings: {}
});
