// test-serialize.js - test of serialize-all

const SerAny = require('../index.js');

// copied from custom-objects.js to handle custom objects
SerAny._custom = function (name) {
  let typeExists = eval('typeof ' + name + '!== "undefined"' );
  return typeExists ? eval('new ' + name + '()') : null;
};
SerAny._ds = SerAny.deserialize;
SerAny.deserialize = source => SerAny._ds(source, SerAny._custom);

// serialize options
const options = {
  maxDepth: 20,
  pretty: true
};

const errors = [];

class CustomObj extends Object {}



// Date
console.log("\nTest1 (Date):");
console.log(
  '  const src = new Date();');
{
  const src = new Date();
  console.log('    src:  ', src);
  try {
    const ser = SerAny.serialize(src, options);
    console.log('    ser:  ',ser);
    const deser = SerAny.deserialize(ser);
    console.log('    deser: ' + deser.constructor.name + ' ' + deser);
    if (src.getTime() !== deser.getTime()) {
      throw 'Error: destination date does not match source date';
    }
    let jsr = jsonTest(src);
    console.log('    json: ' + jsr.constructor.name + ' ' + jsr);
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
    let ser = SerAny.serialize(src, options);
    console.log(
      '    ser:  ', ser, '\n');
    let deser = SerAny.deserialize(ser);
    console.log(
      '    deser:', deser);
    jsonTest(src);
  } catch (err) {
    console.log('*** TEST2 FAILED:', err);
    errors.push('Test2 ' + err.toString());
  }
}

// Function
console.log("\nTest3 (Function):");
console.log(
  '  let src = function foo (x) { return x + 1;};');
{
  let src = function foo (x) { return x + 1;};
  console.log('    src:  ', src);
  console.log('    src.toString:     ', src.toString());
  try {
    let ser = SerAny.serialize(src, options);
    console.log('    ser:  ', ser);
    let deser = SerAny.deserialize(ser);
    console.log('    deser:', deser);
    console.log('    deser.toString(): ', deser.toString());
    if (!deser.toString().includes('function foo')) {
      throw 'Error deserialized missing "function foo"';
    }
    console.log('    deser(10):', deser(10));
    if (deser(10) !== 11) {
      throw 'Error deserialized function returned wrong result';
    }
    jsonTest(src);
  } catch (err) {
    console.log('*** TEST3 FAILED:', err);
    errors.push('Test3 ' + err.toString());
  }
}

  // RegExp
console.log('\nTest4: (RegExp)');
console.log(
  '  let src = [1,2,/abc/i];'
);
{
  let src = [1, 2, /abc/i];
  console.log('    src: ', src);
  try {
    let ser = SerAny.serialize(src, options);
    console.log('    ser: ', ser);
    let deser = SerAny.deserialize(ser);
    console.log('    deser:', deser);
    jsonTest(src);
  } catch (err) {
    console.log('*** TEST FAILED error:', err);
    errors.push('Test4 ' + err.toString());
  }
}

// Int8Array
console.log('\nTest5 (Int8Array):');
console.log(
  '  let src = Int8Array.from([3, 4, 42]);'
);
{
  let src = Int8Array.from([3, 4, 42]);
  console.log('    src:  ', src);
  try {
    let ser = SerAny.serialize(src, options);
    console.log('    ser:  ', ser);
    let deser = SerAny.deserialize(ser);
    console.log('    deser:', deser);
    jsonTest(src);
  } catch (err) {
    console.log('*** TEST FAILED:', err);
    errors.push('Test5 ' + err.toString());
  }
}

// Uint8Array
console.log('\nTest6 (Uint8Array):');
console.log(
  '  let src = Uint8Array.from([3, 128, 64]);'
);
{
  let src = Uint8Array.from([3, 128, 64]);
  console.log('    src:  ', src);
  try {
    let ser = SerAny.serialize(src, options);
    console.log('    ser:  ', ser);
    let deser = SerAny.deserialize(ser);
    console.log('    deser:', deser);
    jsonTest(src);
  } catch (err) {
    console.log('*** TEST FAILED:', err);
    errors.push('Test6 ' + err.toString());
  }
}

// Int16Array
console.log('\nTest7 (Int16Array):');
console.log(
  '  let src = Int16Array.from([32, 128, 64]);'
);
{
  let src = Int16Array.from([32, 128, 64]);
  console.log('    src:  ', src);
  try {
    let ser = SerAny.serialize(src, options);
    console.log('    ser:  ', ser);
    let deser = SerAny.deserialize(ser);
    console.log('    deser:', deser);
    jsonTest(src);
  } catch (err) {
    console.log('*** TEST FAILED:', err);
    errors.push('Test7 ' + err.toString());
  }
}

// Uint16Array
console.log('\nTest8 (Uint16Array):');
console.log(
  '  let src = Uint16Array.from([32, 128, 64]);'
);
{
  let src = Uint16Array.from([32, 128, 64]);
  console.log('    src:  ', src);
  try {
    let ser = SerAny.serialize(src, options);
    console.log('    ser:  ', ser);
    let deser = SerAny.deserialize(ser);
    console.log('    deser:', deser);
    jsonTest(src);
  } catch (err) {
    console.log('*** TEST FAILED:', err);
    errors.push('Test8 ' + err.toString());
  }
}

// Int32Array
console.log('\nTest9 (Int32Array):');
console.log(
  '  let src = Int32Array.from([32, 128, 64]);'
);
{
  let src = Int32Array.from([32, 128, 64]);
  console.log('    src:  ', src);
  try {
    let ser = SerAny.serialize(src, options);
    console.log('    ser:  ', ser);
    let deser = SerAny.deserialize(ser);
    console.log('    deser:', deser);
    jsonTest(src);
  } catch (err) {
    console.log('*** TEST FAILED:', err);
    errors.push('Test9 ' + err.toString());
  }
}
// Uint32Array
console.log('\nTest10 (Uint32Array):');
console.log(
  '  let src = Uint32Array.from([32, 128, 64]);'
);
{
  let src = Uint32Array.from([32, 128, 64]);
  console.log('    src:  ', src);
  try {
    let ser = SerAny.serialize(src, options);
    console.log('    ser:  ', ser);
    let deser = SerAny.deserialize(ser);
    console.log('    deser:', deser);
    jsonTest(src);
  } catch (err) {
    console.log('*** TEST FAILED:', err);
    errors.push('Test10 ' + err.toString());
  }
}

// Float32Array
console.log('\nTest11 (Float32Array):');
console.log(
  '  let src = Float32Array.from([32, 128, 64]);'
);
{
  let src = Float32Array.from([32, 128, 64]);
  console.log('    src:  ', src);
  try {
    let ser = SerAny.serialize(src, options);
    console.log('    ser:  ', ser);
    let deser = SerAny.deserialize(ser);
    console.log('    deser:', deser);
    jsonTest(src);
  } catch (err) {
    console.log('*** TEST FAILED:', err);
    errors.push('Test11 ' + err.toString());
  }
}

// Float64Array
console.log('\nTest12 (Float64Array):');
console.log(
  '  let src = Float64Array.from([32, 128, 64]);'
);
{
  let src = Float64Array.from([32, 128, 64]);
  console.log('    src:  ', src);
  try {
    let ser = SerAny.serialize(src, options);
    console.log('    ser:  ', ser);
    let deser = SerAny.deserialize(ser);
    console.log('    deser:', deser);
    jsonTest(src);
  } catch (err) {
    console.log('*** TEST FAILED:', err);
    errors.push('Test12 ' + err.toString());
  }
}
// BigInt64Array
console.log('\nTest13 (BigInt64Array):');
console.log(
  '  let src = BigInt64Array.from([32, 128, 64]);'
);
{
  let src = BigInt64Array.from([3n, 4n, 42n]);
  console.log('    src:  ', src);
  try {
    let ser = SerAny.serialize(src, options);
    console.log('    ser:  ', ser);
    let deser = SerAny.deserialize(ser);
    console.log('    deser:', deser);
    jsonTest(src);
  } catch (err) {
    console.log('*** TEST FAILED:', err);
    errors.push('Test13 ' + err.toString());
  }
}

  // BigUint64Array
console.log('\nTest14 (BigUint64Array):');
console.log(
  '  let src = BigUint64Array.from([3000000000000000000n, 4n, 42n]);'
);
{
  let src = BigUint64Array.from([3000000000000000000n, 4n, 42n]);
  console.log('    src:  ', src);
  try {
    let ser = SerAny.serialize(src, options);
    console.log('    ser:  ', ser);
    let deser = SerAny.deserialize(ser);
    jsonTest(src);
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
    '  let aBuf = new ArrayBuffer(8);\n' +
    '  let src = new Uint8Array(aBuf);\n' +
    '  let data = [1, 2, 3, 4, 5, 127];'
  );
  let aBuf = new ArrayBuffer(8);
  let src = new Uint8Array(aBuf);
  let data = [1, 2, 3, 4, 5, 127];
  console.log('    data: ',data);
  src.set(data);
  console.log('    src:  ', aBuf);
  console.log('    aBuf: ', aBuf);
  try {
    let ser = SerAny.serialize(aBuf);
    console.log('    ser:', ser);
    let deser = SerAny.deserialize(ser);
    console.log('    deser: ', deser);
    jsonTest(src);
  } catch (err) {
    console.log('*** TEST FAILED:', err);
    errors.push('Test14a ' + err.toString());
  }
}

// Set
console.log(`\nTest15 (Set):`);
{
  console.log(
    '  let src = new Set([1,2,"3",{createdAt: new Date()}]);'
  );
  let src = new Set([1,2,"3",{createdAt: new Date()}]);
  console.log('    src: ', src);
  try {
    let ser = SerAny.serialize(src, options);
    console.log('    ser:  ', ser);
    let deser = SerAny.deserialize(ser);
    console.log('    deser:', deser);
    jsonTest(src);
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
    let ser = SerAny.serialize(src, options);
    console.log('    ser:  ', ser);
    let deser = SerAny.deserialize(ser);
    console.log('    deser:', deser);
    jsonTest(src);
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
    let ser = SerAny.serialize(src, options);
    console.log('    ser:  ', ser);
    let deser = SerAny.deserialize(ser);
    console.log('    deser:', deser);
    jsonTest(src);
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
    let ser = SerAny.serialize(src, options);
    console.log('    ser:  ', ser);
    let deser = SerAny.deserialize(ser);
    console.log('    deser:', deser);
    jsonTest(src);
  } catch (err) {
    console.log('*** TEST FAILED:', err)
    errors.push('Test18 ' + err.toString())
  }
}

// CustomObject
console.log(`\nTest19 (CustomObject):`);
class CustomObject extends Object {
  custom () {return "I am a custom Object";}
}
{
  console.log(
    '  class CustomObject extends Object {\n' +
    '    custom () {return "I am a custom Object";}\n' +
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
    let ser = SerAny.serialize(src, options);
    console.log('    ser:  ', ser);
    let deser = SerAny.deserialize(ser);
    console.log('    deser:', deser);
    console.log('    deser.custom(): ', deser.custom());
    jsonTest(src);
  } catch (err) {
    console.log('*** TEST FAILED:', err);
    errors.push('Test19 ' + err.toString())
  }
}

// CustomArray
console.log(`\nTest20 (CustomArray with RegExp):`);
class CustomArray extends Array {
  custom () {return "I am a custom Array";}
}
{
  console.log(
    '  class CustomArray extends Array {\n' +
    '    custom () {return "I am a custom Array";}\n' +
    '  }\n' +
    '  let src = CustomArray.from([1,2,"foo",{key: [1,2,3, /abc/g]}]);'
  );
  let src = CustomArray.from([1,2,"foo",{key: [1,2,3, /abc/g]}]);
  console.log('    src: ', src);
  console.log('    src.custom(): ', src.custom());
  try {
    let ser = SerAny.serialize(src, options);
    console.log('    ser:  ', ser);
    let deser = SerAny.deserialize(ser);
    console.log('    deser:', deser);
    console.log('    deser.custom():', deser.custom());
    jsonTest(src);
  } catch (err) {
    console.log('*** TEST FAILED:', err);
    errors.push('Test20 ' + err.toString())
  }
}

// Array containing BigInt
console.log(`\nTest21 (Array containing BigInt):`);
{
  console.log(
    '  let src = [1, 2, 3000000000n];'
  );
  let src = [1, 2, 3000000000n];
  console.log('    src: ', src);
  try {
    let ser = SerAny.serialize(src, options);
    console.log('    ser:  ', ser);
    let deser = SerAny.deserialize(ser);
    console.log('    deser:', deser);
    jsonTest(src);
  } catch (err) {
    console.log('*** TEST FAILED:', err);
    errors.push('Test21 ' + err.toString())
  }
}

// Object containing undefined prop
console.log(`\nTest22 (Object containing undefined prop):`);
{
  console.log(
    '  let src = {foo: "bar", notSet: undefined};'
  );
  let src = {foo: "bar", notSet: undefined};
  console.log('    src: ', src);
  try {
    let ser = SerAny.serialize(src, options);
    console.log('    ser:  ', ser);
    let deser = SerAny.deserialize(ser);
    console.log('    deser:', deser);
    jsonTest(src);
  } catch (err) {
    console.log('*** TEST FAILED:', err);
    errors.push('Test22 ' + err.toString())
  }
}

// undefined variable
console.log(`\nTest23 (undefined variable):`);
{
  console.log(
    '  let src = undefined;'
  );
  let src = undefined;
  console.log('    src: ', src);
  try {
    let ser = SerAny.serialize(src, options);
    console.log('    ser:  ', ser);
    let deser = SerAny.deserialize(ser);
    console.log('    deser:', deser);
    jsonTest(src);
  } catch (err) {
    console.log('*** TEST FAILED:', err);
    errors.push('Test23 ' + err.toString())
  }
}

// Error
console.log(`\nTest24 (Error):`);
{
  console.log(
    '  let src = new Error("this is a sample error");'
  );
  let src = new Error("this is a sample error");
  console.log('    src: ', src);
  try {
    let ser = SerAny.serialize(src, options);
    console.log('    ser:  ', ser);
    let deser = SerAny.deserialize(ser);
    console.log('    deser:', deser);
    jsonTest(src);
  } catch (err) {
    console.log('*** TEST FAILED:', err);
    errors.push('Test24 ' + err.toString())
  }
}


// demo
console.log(`\nTest25 (demo):`);
{
  console.log(
    '  class CustomObj extends Object {}\n' +
    '    const custom = new CustomObj();\n' +
    '    Object.assign(custom,{foo:"bar"});\n' +
    '    let src = {\n' +
    '      map: new Map([\n' +
    '        [1, \'one\'],\n' +
    '        [2, \'two\'],\n' +
    '        [3, \'three\'],\n' +
    '      ]),\n' +
    '      custom\n' +
    '    };\n'
  );
  try {
    const custom = new CustomObj();
    custom.foo = 'bar';
    let src = {
      undef: undefined,
      regexp: /abc/gi,
      bignum: 4000000000000000000n,
      map: new Map([[1, 'one'], [2, 'two']]),
      custom,
      buffer: Buffer.from("hello world")
    };
    console.log('    src: ', src);
    let ser = SerAny.serialize(src, options);
    console.log('    ser:  ', ser);
    let deser = SerAny.deserialize(ser);
    console.log('    deser:', deser);
    jsonTest(src);
  } catch (err) {
    console.log('*** TEST FAILED:', err);
    errors.push('Test25 ' + err.toString())
  }
}


function jsonTest(src) {
  try {
    const result = JSON.parse(JSON.stringify(src));
    console.log('    JSON: ', result);
    return result;
  } catch (err) {
    console.log('    *** JSON Error ' + err.toString());
  }
}


console.log("\nEnd of test.");
if (errors.length) {
  console.error("\nErrors: ", errors);
  console.log("\nErrors: ", errors);
}