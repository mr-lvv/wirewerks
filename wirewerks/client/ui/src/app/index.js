let tmpl = `
Yup Yup!
`;

class MyComp {
	constructor() {
		console.log('yesssssss');
	}

	go() {
		console.log('goooooooooaaaaaaaaaaaaaaaaaaaal!!!!');
	}
}

angular.module('ww', [])
.component('wwTest', {
	controller: MyComp,
	template: tmpl,
	bindings: {
		myvalue: '='
	}
});
