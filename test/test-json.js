// test-json.js - test of JSON.stringify -> JSON.parse

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

function serialize(src) {
  try {
    return JSON.stringify(src);
  } catch (err) {
    let ermsg =
      `Error JSON.stringify failed '${err.toString()}', src: '${src}'`;
    console.log(ermsg);
    throw ermsg;
  }
}

function deserialize(ser) {
  try {
    return JSON.parse(ser);
  } catch (err) {
    let ermsg =
      `Error JSON.parse failed '${err.toString()}', ser: '${ser}'`;
    console.log(ermsg);
    throw ermsg;
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
