// test-serialize-anything.js - test of serialize-anything

const SerAny = require('../index.js');
const TS = require('./test-suite');

const THIS_IS_A_TEST = "This is a test";

// modified from `custom-objects.js` to handle custom objects,
//   and anonymous constructors
SerAny._custom = function (name) {
  if (!name) name = 'Object';
  let typeExists = name && eval('typeof ' + name + '!== "undefined"' );
  return typeExists ? eval('new ' + name + '()') : null;
};
SerAny._ds = SerAny.deserialize;
SerAny.deserialize = source => SerAny._ds(source, SerAny._custom);

// our custom objects
class CustomObj extends Object {}
class CustomObject extends Object {
  custom () {return "I am a custom Object";}
}
class CustomArray extends Array {
  custom () {return "I am a custom Array";}
}

// serialize options
const options = {
  maxDepth: 20,
  pretty: true
};

// run every test by default
let tests = TS.tests;

// tests = tests.filter((test) => { return test.name == 'test25'; });

tests.forEach(test =>
  test(SerAny.serialize, SerAny.deserialize, options));

console.log("\nEnd of test.");
const errors = TS.errors;
if (errors.length) {
  console.error("\nErrors: ", errors);
  console.log("\nErrors: ", errors);
}
