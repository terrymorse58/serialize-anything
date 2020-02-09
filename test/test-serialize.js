// test-serialize.js - test of serialize-all

const [serialize, deserialize] = require('../index.js');
console.log("test-serialize.js typeof serialize:",typeof serialize);
const errors = [];

// a sample custom object
class CustomObject extends Object {
  custom () {return "I am CustomObject";}
}
// a sample custom array
class CustomArray extends Array {
  custom () {return "I am CustomArray";}
}

// callback to pass custom object prototype back to deserialize
const prototypeOf = (constructorName) => {
  let typeExists = eval('typeof ' + constructorName + '!== "undefined"' );
  if (typeExists) {
    return eval('new ' + constructorName + '()');
  }
  return null;
}


// Date
console.log("\nTest1 (Date):");
console.log(
  '  const src = new Date();\n' +
  '  const dest1 = serialize(src);\n' +
  '  const deser = deserialize(dest1);');
{
  const src = new Date();
  console.log('    src:  ', src);
  try {
    const ser = serialize(src);
    console.log('    ser:  ',ser);
    const deser = deserialize(ser);
    console.log('    deser:', deser);
    if (src.getTime() !== deser.getTime()) {
      throw 'Error: destination date does not match source date';
    }
  } catch (err) {
    console.log('*** TEST1 FAILED:', err);
    errors.push('Test1 ' + err.toString());
  }
}

// Map
console.log("\nTest2 (Map):");
console.log(
  '  let src = new Map();\n' +
  '  let key1 = "key1";\n' +
  '  let key2 = {foo: "bar"};\n' +
  '  src.set(key1, "key1 value");\n' +
  '  src.set(key2, new Date());');
{
  let src = new Map();
  let key1 = 'key1';
  let key2 = { foo: 'bar' };
  src.set(key1, 'key1 value');
  src.set(key2, new Date());
  console.log(
    '    src:  ', src);
  try {
    let ser = serialize(src);
    console.log(
      '    ser:  ', ser, '\n');
    let deser = deserialize(ser);
    console.log(
      '    deser:', deser);
  } catch (err) {
    console.log('*** TEST2 FAILED:', err);
    errors.push('Test2 ' + err.toString());
  }
}

// Function
console.log("\nTest3 (Function):");
console.log(
  '  let src = function foo (x) { return x + 1;};\n' +
  '  let ser = serialize(src);\n' +
  '  let deser = deserialize(ser);');
{
  let src = function foo (x) { return x + 1;};
  try {
    let ser = serialize(src);
    let deser = deserialize(ser);
    console.log(
      '    src:  ', src, '\n' +
      '    ser: ', ser, '\n' +
      '    deser:', deser);
    console.log('    deser.toString(): ', deser.toString());
    if (!deser.toString().includes('function foo')) {
      throw 'Error deserialized missing "function foo"';
    }
    console.log('    deser(10):', deser(10));
    if (deser(10) !== 11) {
      throw 'Error deserialized function returned wrong result';
    }
  } catch (err) {
    console.log('*** TEST3 FAILED:', err);
    errors.push('Test3 ' + err.toString());
  }
}

// RegExp
console.log('\nTest4: (RegExp)');
console.log(
  '  let src = [1,2,/abc/i];\n' +
  '  let ser = serialize(src);\n' +
  '  let deser = deserialize(ser);'
);
{
  let src = [1, 2, /abc/i];
  console.log('    src: ', src);
  try {
    let ser = serialize(src);
    console.log('    ser: ', ser);
    let deser = deserialize(ser);
    console.log('    deser:', deser);
  } catch (err) {
    console.log('*** TEST FAILED error:', err);
    errors.push('Test4 ' + err.toString());
  }
}

// Int8Array
console.log('\nTest5 (Int8Array):');
console.log(
  '  let src5 = Int8Array.from([3, 4, 42]);\n' +
  '  let dest5 = serialize(src5);\n' +
  '  let dest5a = deserialize(src5);'
);
let src5 = Int8Array.from([3, 4, 42]);
try {
  let dest5 = serialize(src5);
  let dest5a = deserialize(dest5);
  console.log(
    '    src5: ', src5, '\n' +
    '    dest5:', dest5, '\n' +
    '    dest5a:', dest5a
  );
} catch (err) {
  console.log('*** TEST FAILED:',err);
  errors.push("Test5 " + err.toString());
}

// Uint8Array
console.log('\nTest6 (Uint8Array):');
console.log(
  '  let src6 = Uint8Array.from([3, 128, 64]);\n' +
  '  let dest6 = serialize(src6);\n' +
  '  let dest6a = deserialize(dest6);'
);
let src6 = Uint8Array.from([3, 128, 64]);
try {
  let dest6 = serialize(src6);
  let dest6a = deserialize(dest6);
  console.log(
    '    src6: ', src6, '\n' +
    '    dest6:', dest6, '\n' +
    '    dest6a:', dest6a
  );
} catch (err) {
  console.log('*** TEST FAILED:',err);
  errors.push("Test6 " + err.toString());
}

// Int16Array
console.log('\nTest7 (Int16Array):');
console.log(
  '  let src7 = Int16Array.from([32, 128, 64]);\n' +
  '  let dest7 = serialize(src7);\n' +
  '  let dest7a = deserialize(dest7);'
);
let src7 = Int16Array.from([32, 128, 64]);
try {
  let dest7 = serialize(src7);
  let dest7a = deserialize(dest7);
  console.log(
    '    src7: ', src7, '\n' +
    '    dest7:', dest7, '\n' +
    '    dest7a:', dest7a
  );
} catch (err) {
  console.log('*** TEST FAILED:',err);
  errors.push("Test7 " + err.toString());
}

// Uint16Array
console.log('\nTest8 (Uint16Array):');
console.log(
  '  let src8 = Uint16Array.from([32, 128, 64]);\n' +
  '  let dest8 = serialize(src8);\n' +
  '  let dest8a = deserialize(dest8);'
);
let src8 = Uint16Array.from([32, 128, 64]);
try {
  let dest8 = serialize(src8);
  let dest8a = deserialize(dest8);
  console.log(
    '    src8: ', src8, '\n' +
    '    dest8:', dest8, '\n' +
    '    dest8a:', dest8a
  );
} catch (err) {
  console.log('*** TEST FAILED:',err);
  errors.push("Test8 " + err.toString());
}

// Int32Array
console.log('\nTest9 (Int32Array):');
console.log(
  '  let src9 = Int32Array.from([32, 128, 64]);\n' +
  '  let dest9 = serialize(src9);\n' +
  '  let dest9a = deserialize(dest9);'
);
let src9 = Int32Array.from([32, 128, 64]);
try {
  let dest9 = serialize(src9);
  let dest9a = deserialize(dest9);
  console.log(
    '    src9: ', src9, '\n' +
    '    dest9:', dest9, '\n' +
    '    dest9a:', dest9a
  );
} catch (err) {
  console.log('*** TEST FAILED:',err);
  errors.push("Test9 " + err.toString());
}

// Uint32Array
console.log('\nTest10 (Uint32Array):');
console.log(
  '  let src10 = Uint32Array.from([32, 128, 64]);\n' +
  '  let dest10 = serialize(src10);\n' +
  '  let dest10a = deserialize(dest10);'
);
let src10 = Uint32Array.from([32, 128, 64]);
try {
  let dest10 = serialize(src10);
  let dest10a = deserialize(dest10);
  console.log(
    '    src10: ', src10, '\n' +
    '    dest10:', dest10, '\n' +
    '    dest10a:', dest10a
  );
} catch (err) {
  console.log('*** TEST FAILED:',err);
  errors.push("Test10 " + err.toString());
}

// Float32Array
console.log('\nTest11 (Float32Array):');
console.log(
  '  let src11 = Float32Array.from([32, 128, 64]);\n' +
  '  let dest11 = serialize(src11);\n' +
  '  let dest11a = deserialize(dest11);'
);
let src11 = Float32Array.from([32, 128, 64]);
try {
  let dest11 = serialize(src11);
  let dest11a = deserialize(dest11);
  console.log(
    '    src11: ', src11, '\n' +
    '    dest11:', dest11, '\n' +
    '    dest11a:', dest11a
  );
} catch (err) {
  console.log('*** TEST FAILED:',err);
  errors.push("Test11 " + err.toString());
}

// Float64Array
console.log('\nTest12 (Float64Array):');
console.log(
  '  let src12 = Float64Array.from([32, 128, 64]);\n' +
  '  let dest12 = serialize(src12);\n' +
  '  let dest12a = deserialize(dest12);'
);
let src12 = Float64Array.from([32, 128, 64]);
try {
  let dest12 = serialize(src12);
  let dest12a = deserialize(dest12);
  console.log(
    '    src12: ', src12, '\n' +
    '    dest12:', dest12, '\n' +
    '    dest12a:', dest12a
  );
} catch (err) {
  console.log('*** TEST FAILED:',err);
  errors.push("Test12 " + err.toString());
}

// BigInt64Array
console.log('\nTest13 (BigInt64Array):');
console.log(
  '  let src = BigInt64Array.from([32, 128, 64]);\n' +
  '  let ser = serialize(src);\n' +
  '  let deser = deserialize(ser);'
);
{
  let src = BigInt64Array.from([3n, 4n, 42n]);
  console.log('    src:  ', src);
  try {
    let ser = serialize(src);
    console.log('    ser:  ', ser);
    let deser = deserialize(ser);
    console.log('    deser:', deser);
  } catch (err) {
    console.log('*** TEST FAILED:', err);
    errors.push('Test13 ' + err.toString());
  }
}

// BigUint64Array
console.log('\nTest14 (BigUint64Array):');
console.log(
  '  let src = BigUint64Array.from([3000000000000000000n, 4n, 42n]);\n' +
  '  let ser = serialize(src);\n' +
  '  let deser = deserialize(ser);'
);
{
  let src = BigUint64Array.from([3000000000000000000n, 4n, 42n]);
  console.log('    src:  ', src);
  try {
    let ser = serialize(src);
    console.log('    ser:  ', ser);
    let deser = deserialize(ser);
    console.log('    deser:', deser);
  } catch (err) {
    console.log('*** TEST FAILED:', err);
    errors.push('Test14 ' + err.toString());
  }
}
// ArrayBuffer
console.log(`\nTest14a (ArrayBuffer):`);
{
  console.log(
    '  let aBuf = new ArrayBuffer(8)\n' +
    '  let src = new Uint8Array(aBuf)\n' +
    '  src.set([1, 2, 3], 3);\n' +
    '  let ser = serialize(aBuf)\n' +
    '  let deser = deserialize(ser);'
  );
  let aBuf = new ArrayBuffer(8)
  let src = new Uint8Array(aBuf)
  src.set([1, 2, 3], 3);
  console.log('    aBuf: ', aBuf);
  try {
    let ser = serialize(aBuf)
    console.log('    ser:',ser);
    let deser = deserialize(ser);
    console.log('    deser: ', deser);
  } catch (err) {
    console.log('*** TEST FAILED:', err)
    errors.push('Test14a ' + err.toString())
  }
}

// Set
console.log(`\nTest15 (Set):`);
{
  console.log(
    '  let src = new Set([1,2,"3",{createdAt: new Date()}]);\n' +
    '  let ser = serialize(src);\n' +
    '  let deser = deserialize(ser);'
  );
  let src = new Set([1,2,"3",{createdAt: new Date()}]);
  console.log('    src: ', src);
  try {
    let ser = serialize(src);
    console.log('    ser:  ', ser);
    let deser = deserialize(ser);
    console.log('    deser:', deser);
  } catch (err) {
    console.log('*** TEST FAILED:', err);
    errors.push('Test15 ' + err.toString())
  }
}

// WeakSet
console.log(`\nTest16 (WeakSet):`);
{
  console.log(
    '  let src = new WeakSet();\n' +
    '  let obj = {value: "in the set"}\n' +
    '  src.add(obj);'
  );
  let src = new WeakSet();
  let obj = {value: "in the set"}
  src.add(obj);
  console.log('    src: ', src);
  try {
    let ser = serialize(src);
    console.log('    ser:  ', ser);
    let deser = deserialize(ser);
    console.log('    deser:', deser);
  } catch (err) {
    console.log('*** TEST FAILED:', err)
    errors.push('Test16 ' + err.toString())
  }
}

// WeakMap
console.log(`\nTest17 (WeakMap):`);
{
  console.log(
    '  let src = new WeakMap();\n' +
    '  let obj = { foo: "I am foo" };\n' +
    '  src.set(obj, 42);'
  );
  let src = new WeakMap();
  let obj = { foo: "I am foo" };
  src.set(obj, 42);
  console.log('    src: ', src);
  try {
    let ser = serialize(src);
    console.log('    ser:  ', ser);
    let deser = deserialize(ser);
    console.log('    deser:', deser);
  } catch (err) {
    console.log('*** TEST FAILED:', err)
    errors.push('Test17 ' + err.toString())
  }
}

// Buffer
console.log(`\nTest18 (Buffer):`);
{
  console.log(
    '  let src = Buffer.from("hello world");'
  );
  let src = Buffer.from("hello world");
  console.log('    src: ', src);
  try {
    let ser = serialize(src);
    console.log('    ser:  ', ser);
    let deser = deserialize(ser);
    console.log('    deser:', deser);
  } catch (err) {
    console.log('*** TEST FAILED:', err)
    errors.push('Test18 ' + err.toString())
  }
}

// CustomObject
console.log(`\nTest19 (CustomObject):`);
{
  console.log(
    '  class CustomObject extends Object {\n' +
    '    custom () {return "I am CustomObject";}\n' +
    '  }\n' +
    '  let src = new CustomObject();\n' +
    '  src.key = "value";\n' +
    '  src.key2 = [1,2, new Date()];'
  );
  let src = new CustomObject();
  src.key = "value";
  src.key2 = [1,2, new Date()];
  console.log('    src: ', src);
  console.log('    src.custom(): ', src.custom());
  try {
    let ser = serialize(src);
    console.log('    ser:  ', ser);
    let deser = deserialize(ser, prototypeOf);
    console.log('    deser:', deser);
  } catch (err) {
    console.log('*** TEST FAILED:', err);
    errors.push('Test19 ' + err.toString())
  }
}

// CustomArray
console.log(`\nTest20 (CustomArray):`);
{
  console.log(
    '  class CustomArray extends Array {\n' +
    '    custom () {return "I am CustomArray";}\n' +
    '  }' +
    '  let src = CustomArray.from([1,2,"foo",{key: [1,2,3, /abc/g]}]);'
  );
  let src = CustomArray.from([1,2,"foo",{key: [1,2,3, /abc/g]}]);
  console.log('    src: ', src);
  console.log('    src.custom(): ', src.custom());
  try {
    let ser = serialize(src);
    console.log('    ser:  ', ser);
    let deser = deserialize(ser, prototypeOf);
    console.log('    deser:', deser);
    console.log('    deser[3].key:', deser[3].key);
  } catch (err) {
    console.log('*** TEST FAILED:', err)
    errors.push('Test20 ' + err.toString())
  }
}


console.log("\nEnd of test.");
if (errors.length) {
  console.error("\nErrors: ", errors);
  console.log("\nErrors: ", errors);
}