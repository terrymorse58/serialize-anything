// test-serialize-anything.js - test of serialize-anything

const SerAny = require('../index.js');
const TS = require('./test-suite');

const THIS_IS_A_TEST = "This is a test";

// copied from `custom-objects.js` to handle custom objects
SerAny._custom = function (name) {
  let typeExists = eval('typeof ' + name + '!== "undefined"' );
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

// run every test
TS.tests.forEach(test =>
  test(SerAny.serialize, SerAny.deserialize, options));

console.log("\nEnd of test.");
const errors = TS.errors;
if (errors.length) {
  console.error("\nErrors: ", errors);
  console.log("\nErrors: ", errors);
}
