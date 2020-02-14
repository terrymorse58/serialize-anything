// test-serialize-to-js.js - test of serialize-to-js

const serialize = require('serialize-to-js');
const TS = require('./test-suite');

// our custom objects
class CustomObj extends Object {}
class CustomObject extends Object {
  custom () {return "I am a custom Object";}
}
class CustomArray extends Array {
  custom () {return "I am a custom Array";}
}

// serialize options
const options = null;

function deserialize (ser) {
  try {
    return eval('(' + ser + ')');
  } catch (err) {
    throw `Error could not eval '(${ser})'`;
  }
}

// run every test
TS.tests.forEach(test =>
  test(serialize, deserialize, options));

console.log("\nEnd of test.");
const errors = TS.errors;
if (errors.length) {
  console.error("\nErrors: ", errors);
  console.log("\nErrors: ", errors);
}
