console.log('Hello World 2');
var testvar: number = 9;
console.log(testvar);

var testfunc = function () {
    testvar += 5;
    console.log(testvar);
}

export {testfunc};