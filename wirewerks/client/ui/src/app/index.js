class App {
	constructor() {
		console.log('yesssssss');
	}

	go() {
		console.log('goooooooooaaaaaaaaaaaaaaaaaaaal!!!!');
	}
}

angular.module('ww', [])
.component('wwApp', {
	controller: App,
	templateUrl: 'app/views/app.html',
	bindings: {
	}
});
