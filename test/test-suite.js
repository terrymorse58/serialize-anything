var semver = require('semver');

const errors = [];

// function jsonTest(src) {
//   try {
//     const result = JSON.parse(JSON.stringify(src));
//     console.log('    JSON: ', result);
//     return result;
//   } catch (err) {
//     console.log('    *** JSON Error ' + err.toString());
//   }
// }
function jsonTest(src) {}


const tests = [];

/**
 * Helper - filter
 * 
 * @param iterable - a list of values
 * @param predicate - (value) => {return true iff value should be included}
 */
function* filter(iterable, predicate) {
  for (value of iterable)
    if (predicate(value)) yield value;
}

/**
 * Helper - checkObjectsHaveSameKeys
 *
 * @param expected - first obj to check
 * @param actual - does it have the same keys?
 * @param check - what's being checked - helpful in error message
 * @throws error if there is a discrepency
*/
function checkObjectsHaveSameKeys(expected, actual, check) {
  let obj1Keys = new Set(Object.keys(expected));
  let obj2Keys = new Set(Object.keys(actual));
  let in1not2 = new Set(filter(obj1Keys.keys(), (key) => !obj2Keys.has(key)));
  let in2not1 = new Set(filter(obj2Keys.keys(), (key) => !obj1Keys.has(key)));

  let errors = {checking: check};
  
  if (in1not2.size) errors.missing = 'expected keys missing from actual: ' + Array.from(in1not2.keys());
  if (in2not1.size) errors.extra = 'actual contains unexpected keys: ' + Array.from(in2not1.keys());

  if (errors.missing || errors.extra) throw new Error(JSON.stringify(errors));
}

// Date
function test1(serialize, deserialize, options) {
  console.log("\nTest1 (Date):");
  console.log(
    '  const src = new Date();');
  {
    const src = new Date();
    console.log('    src:  ', src);
    try {
      const ser = serialize(src, options);
      console.log(`    ser:  '${ser}'`);
      const deser = deserialize(ser);
      console.log('    deser: ' + deser.constructor.name + ': ' + deser);
      if (!(deser instanceof Date)) {
        throw `Error deserialized item not a Date object`;
      }
      if (src.getTime() !== deser.getTime()) {
        throw 'Error: destination date does not match source date';
      }
    } catch (err) {
      console.log('*** TEST1 FAILED:', err);
      errors.push('Test1 ' + err.toString());
    }
  }
}
tests.push(test1);

// Map
function test2(serialize, deserialize, options) {
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
      let ser = serialize(src, options);
      console.log(`    ser:  '${ser}'`);
      let deser = deserialize(ser);
      console.log(
        '    deser:', deser);
    } catch (err) {
      console.log('*** TEST2 FAILED:', err);
      errors.push('Test2 ' + err.toString());
    }
  }
}
tests.push(test2);

// Function
function test3(serialize, deserialize, options) {
  console.log("\nTest3 (Function):");
  console.log(
    '  let src = function foo (x) { return x + 1;};');
  {
    let src = function foo (x) { return x + 1;};
    console.log('    src:  ', src);
    console.log('    src.toString:     ', src.toString());
    try {
      let ser = serialize(src, options);
      console.log(`    ser:  '${ser}'`);
      let deser = deserialize(ser);
      console.log('    deser:', deser);
      let ermsg = '';
      if (!deser) {
        ermsg = `Error could not deserialize "${ser}"`;
      }
      if (!ermsg.length && !deser.toString) {
        ermsg = `Error deserialized missing method 'toString'`;
      }
      if (!ermsg.length && deser(10) !== 11) {
        ermsg = 'Error deserialized function returned wrong result';
      }
      if (ermsg.length) {
        throw ermsg;
      }
    } catch (err) {
      console.log('*** TEST3 FAILED:', err);
      errors.push('Test3 ' + err.toString());
    }
  }
}
tests.push(test3);

// RegExp
function test4(serialize, deserialize, options) {
  console.log('\nTest4: (RegExp)');
  console.log(
    '  let src = [1,2,/abc/i];'
  );
  {
    let src = [1, 2, /abc/i];
    console.log('    src: ', src);
    try {
      let ser = serialize(src, options);
      console.log(`    ser:  '${ser}'`);
      let deser = deserialize(ser);
      console.log('    deser:', deser);
    } catch (err) {
      console.log('*** TEST FAILED error:', err);
      errors.push('Test4 ' + err.toString());
    }
  }
}
tests.push(test4);

// Int8Array
function test5(serialize, deserialize, options) {
  console.log('\nTest5 (Int8Array):');
  console.log(
    '  let src = Int8Array.from([3, 4, 42]);'
  );
  {
    let src = Int8Array.from([3, 4, 42]);
    console.log('    src:  ', src);
    try {
      let ser = serialize(src, options);
      console.log(`    ser:  '${ser}'`);
      let deser = deserialize(ser);
      console.log('    deser:', deser);
    } catch (err) {
      console.log('*** TEST FAILED:', err);
      errors.push('Test5 ' + err.toString());
    }
  }
}
tests.push(test5);

// Uint8Array
function test6(serialize, deserialize, options) {
  console.log('\nTest6 (Uint8Array):');
  console.log(
    '  let src = Uint8Array.from([3, 128, 64]);'
  );
  {
    let src = Uint8Array.from([3, 128, 64]);
    console.log('    src:  ', src);
    try {
      let ser = serialize(src, options);
      console.log(`    ser:  '${ser}'`);
      let deser = deserialize(ser);
      console.log('    deser:', deser);
    } catch (err) {
      console.log('*** TEST FAILED:', err);
      errors.push('Test6 ' + err.toString());
    }
  }
}
tests.push(test6);

// Int16Array
function test7 (serialize, deserialize, options) {
  console.log('\nTest7 (Int16Array):');
  console.log(
    '  let src = Int16Array.from([32, 128, 64]);'
  );
  {
    let src = Int16Array.from([32, 128, 64]);
    console.log('    src:  ', src);
    try {
      let ser = serialize(src, options);
      console.log(`    ser:  '${ser}'`);
      let deser = deserialize(ser);
      console.log('    deser:', deser);
    } catch (err) {
      console.log('*** TEST FAILED:', err);
      errors.push('Test7 ' + err.toString());
    }
  }
}
tests.push(test7);

// Uint16Array
function test8 (serialize, deserialize, options) {
  console.log('\nTest8 (Uint16Array):');
  console.log(
    '  let src = Uint16Array.from([32, 128, 64]);'
  );
  {
    let src = Uint16Array.from([32, 128, 64]);
    console.log('    src:  ', src);
    try {
      let ser = serialize(src, options);
      console.log(`    ser:  '${ser}'`);
      let deser = deserialize(ser);
      console.log('    deser:', deser);
    } catch (err) {
      console.log('*** TEST FAILED:', err);
      errors.push('Test8 ' + err.toString());
    }
  }
}
tests.push(test8);

// Int32Array
function test9 (serialize, deserialize, options) {
  console.log('\nTest9 (Int32Array):');
  console.log(
    '  let src = Int32Array.from([32, 128, 64]);'
  );
  {
    let src = Int32Array.from([32, 128, 64]);
    console.log('    src:  ', src);
    try {
      let ser = serialize(src, options);
      console.log(`    ser:  '${ser}'`);
      let deser = deserialize(ser);
      console.log('    deser:', deser);
    } catch (err) {
      console.log('*** TEST FAILED:', err);
      errors.push('Test9 ' + err.toString());
    }
  }
}
tests.push(test9);

// Uint32Array
function test10 (serialize, deserialize, options) {
  console.log('\nTest10 (Uint32Array):');
  console.log(
    '  let src = Uint32Array.from([32, 128, 64]);'
  );
  {
    let src = Uint32Array.from([32, 128, 64]);
    console.log('    src:  ', src);
    try {
      let ser = serialize(src, options);
      console.log(`    ser:  '${ser}'`);
      let deser = deserialize(ser);
      console.log('    deser:', deser);
    } catch (err) {
      console.log('*** TEST FAILED:', err);
      errors.push('Test10 ' + err.toString());
    }
  }
}
tests.push(test10);

// Float32Array
function test11 (serialize, deserialize, options) {
  console.log('\nTest11 (Float32Array):');
  console.log(
    '  let src = Float32Array.from([32, 128, 64]);'
  );
  {
    let src = Float32Array.from([32, 128, 64]);
    console.log('    src:  ', src);
    try {
      let ser = serialize(src, options);
      console.log(`    ser:  '${ser}'`);
      let deser = deserialize(ser);
      console.log('    deser:', deser);
    } catch (err) {
      console.log('*** TEST FAILED:', err);
      errors.push('Test11 ' + err.toString());
    }
  }
}
tests.push(test11);

// Float64Array
function test12 (serialize, deserialize, options) {
  console.log('\nTest12 (Float64Array):');
  console.log(
    '  let src = Float64Array.from([32, 128, 64]);'
  );
  {
    let src = Float64Array.from([32, 128, 64]);
    console.log('    src:  ', src);
    try {
      let ser = serialize(src, options);
      console.log(`    ser:  '${ser}'`);
      let deser = deserialize(ser);
      console.log('    deser:', deser);
    } catch (err) {
      console.log('*** TEST FAILED:', err);
      errors.push('Test12 ' + err.toString());
    }
  }
}
tests.push(test12);

// BigInt64Array
function test13 (serialize, deserialize, options) {
  console.log('\nTest13 (BigInt64Array):');
  console.log(
    '  let src = BigInt64Array.from([32, 128, 64]);'
  );
  {
    let src = BigInt64Array.from([3n, 4n, 42n]);
    console.log('    src:  ', src);
    try {
      let ser = serialize(src, options);
      console.log(`    ser:  '${ser}'`);
      let deser = deserialize(ser);
      console.log('    deser:', deser);
      if (!(deser instanceof BigInt64Array)) {
        throw `Error did not maintain BigInt64Array type`;
      }
    } catch (err) {
      console.log('*** TEST FAILED:', err);
      errors.push('Test13 ' + err.toString());
    }
  }
}
tests.push(test13);

// BigUint64Array
function test14 (serialize, deserialize, options) {
  console.log('\nTest14 (BigUint64Array):');
  console.log(
    '  let src = BigUint64Array.from([3000000000000000000n, 4n, 42n]);'
  );
  {
    let src = BigUint64Array.from([3000000000000000000n, 4n, 42n]);
    console.log('    src:  ', src);
    try {
      let ser = serialize(src, options);
      console.log(`    ser:  '${ser}'`);
      let deser = deserialize(ser);
      console.log('    deser:', deser);
      if (!(deser instanceof BigUint64Array)) {
        throw `Error did not maintain BigUint64Array type`;
      }
    } catch (err) {
      console.log('*** TEST FAILED:', err);
      errors.push('Test14 ' + err.toString());
    }
  }
}
tests.push(test14);

// ArrayBuffer
function test15 (serialize, deserialize, options) {
  console.log(`\nTest15 (ArrayBuffer):`);
  {
    console.log(
      '  let aBuf = new ArrayBuffer(8);\n' +
      '  let src = new Uint8Array(aBuf);\n' +
      '  let data = [1, 2, 3, 4, 5, 127];'
    );
    let aBuf = new ArrayBuffer(8);
    let src = new Uint8Array(aBuf);
    let data = [1, 2, 3, 4, 5, 127];
    console.log('    data: ', data);
    src.set(data);
    console.log('    src:  ', aBuf);
    console.log('    aBuf: ', aBuf);
    try {
      let ser = serialize(aBuf);
      console.log(`    ser:  '${ser}'`);
      let deser = deserialize(ser);
      console.log('    deser: ', deser);
    } catch (err) {
      console.log('*** TEST FAILED:', err);
      errors.push('Test15 ' + err.toString());
    }
  }
}
tests.push(test15);

// Set
function test16 (serialize, deserialize, options) {
  console.log(`\nTest16 (Set):`);
  {
    console.log(
      '  let src = new Set([1,2,"3",{createdAt: new Date()}]);'
    );
    let src = new Set([1, 2, '3', { createdAt: new Date() }]);
    console.log('    src: ', src);
    try {
      let ser = serialize(src, options);
      console.log(`    ser:  '${ser}'`);
      let deser = deserialize(ser);
      console.log('    deser:', deser);
    } catch (err) {
      console.log('*** TEST FAILED:', err);
      errors.push('Test15 ' + err.toString());
    }
  }
}
tests.push(test16);

// WeakSet
function test17 (serialize, deserialize, options) {
  console.log(`\nTest17 (WeakSet):`);
  {
    console.log(
      '  let src = new WeakSet();\n' +
      '  let obj = {value: "in the set"}\n' +
      '  src.add(obj);'
    );
    let src = new WeakSet();
    let obj = { value: 'in the set' };
    src.add(obj);
    console.log('    src: ', src);
    try {
      let ser = serialize(src, options);
      console.log(`    ser:  '${ser}'`);
      let deser = deserialize(ser);
      console.log('    deser:', deser);
    } catch (err) {
      console.log('*** TEST FAILED:', err);
      errors.push('Test17 ' + err.toString());
    }
  }
}
tests.push(test17);

// WeakMap
function test18 (serialize, deserialize, options) {
  console.log(`\nTest18 (WeakMap):`);
  {
    console.log(
      '  let src = new WeakMap();\n' +
      '  let obj = { foo: "I am foo" };\n' +
      '  src.set(obj, 42);'
    );
    let src = new WeakMap();
    let obj = { foo: 'I am foo' };
    src.set(obj, 42);
    console.log('    src: ', src);
    try {
      let ser = serialize(src, options);
      console.log(`    ser:  '${ser}'`);
      let deser = deserialize(ser);
      console.log('    deser:', deser);
    } catch (err) {
      console.log('*** TEST FAILED:', err);
      errors.push('Test18 ' + err.toString());
    }
  }
}
tests.push(test18);

// Buffer
function test19 (serialize, deserialize, options) {
  console.log(`\nTest19 (Buffer):`);
  {
    console.log(
      '  let src = Buffer.from("hello world");'
    );
    let src = Buffer.from('hello world');
    console.log('    src: ', src);
    try {
      let ser = serialize(src, options);
      console.log(`    ser:  '${ser}'`);
      let deser = deserialize(ser);
      console.log('    deser:', deser);
    } catch (err) {
      console.log('*** TEST FAILED:', err);
      errors.push('Test19 ' + err.toString());
    }
  }
}
tests.push(test19);

// CustomObject
function test20 (serialize, deserialize, options) {
  console.log(`\nTest20 (CustomObject):`);
  {
    console.log(
      '  class CustomObject extends Object {\n' +
      '    custom () {return "I am a custom Object";}\n' +
      '  }\n' +
      '  let src = new CustomObject();'
    );
    class CustomObject extends Object {
      custom () {return "I am a custom Object";}
    }
    let src = new CustomObject();
    console.log('    src: ', src);
    try {
      let ser = serialize(src, options);
      console.log(`    ser:  '${ser}'`);
      let deser = deserialize(ser);
      console.log('    deser:', deser);
      console.log('    deser.constructor.name: ', deser.constructor.name);
      if (deser.constructor.name !== 'CustomObject') {
        throw `Error did not maintain CustomObject type`;
      }
      if (typeof deser.custom === 'undefined') {
        throw `Error did not maintain CustomObject method 'custom'`;
      }
      console.log('    deser.custom(): ', deser.custom());
    } catch (err) {
      console.log('*** TEST FAILED:', err);
      errors.push('Test20 ' + err.toString());
    }
  }
}
tests.push(test20);

// CustomArray
function test21 (serialize, deserialize, options) {
  console.log(`\nTest21 (CustomArray with RegExp):`);

  console.log(
    '  class CustomArray extends Array {\n' +
    '    custom () {return "I am a custom Array";}\n' +
    '  }\n' +
    '  let src = CustomArray.from([1,2,"foo",{key: [1,2,3, /abc/g]}]);'
  );

  class CustomArray extends Array {
    custom () {return 'I am a custom Array';}
  }

  let src = CustomArray.from([1, 2, 'foo', { key: [1, 2, 3, /abc/g] }]);
  console.log('    src: ', src);
  console.log('    src.custom(): ', src.custom());
  try {
    let ser = serialize(src, options);
    console.log(`    ser:  '${ser}'`);
    let deser = deserialize(ser);
    console.log('    deser:', deser);
    if (deser.constructor.name !== 'CustomArray') {
      throw `Error did not maintain CustomArray type`;
    }
    if (typeof deser.custom !== 'function') {
      throw `Error did not maintain CustomArray method 'custom'`;
    }
    console.log('    deser.custom(): ', deser.custom());
  } catch (err) {
    console.log('*** TEST FAILED:', err);
    errors.push('Test21 ' + err.toString());
  }
}
tests.push(test21);

// Array containing BigInt
function test22 (serialize, deserialize, options) {
  console.log(`\nTest22 (Array containing BigInt):`);
  {
    console.log(
      '  let src = [1, 2, 3000000000n];'
    );
    let src = [1, 2, 3000000000n];
    console.log('    src: ', src);
    try {
      let ser = serialize(src, options);
      console.log(`    ser:  '${ser}'`);
      let deser = deserialize(ser);
      console.log('    deser:', deser);
    } catch (err) {
      console.log('*** TEST FAILED:', err);
      errors.push('Test22 ' + err.toString());
    }
  }
}
tests.push(test22);

// Object containing undefined prop
function test23 (serialize, deserialize, options) {
  console.log(`\nTest23 (Object containing undefined prop):`);
  console.log(
    '  let src = {foo: "bar", notSet: undefined};'
  );
  let src = { foo: 'bar', notSet: undefined };
  console.log('    src: ', src);
  try {
    let ser = serialize(src, options);
    console.log(`    ser:  '${ser}'`);
    let deser = deserialize(ser);
    console.log('    deser:', deser);
  } catch (err) {
    console.log('*** TEST FAILED:', err);
    errors.push('Test23  ' + err.toString());
  }
}
tests.push(test23);

// undefined variable
function test24 (serialize, deserialize, options) {
  console.log(`\nTest24 (undefined variable):`);
  console.log(
    '  let src = undefined;'
  );
  let src = undefined;
  console.log('    src: ', src);
  try {
    let ser = serialize(src, options);
    console.log(`    ser:  '${ser}'`);
    let deser = deserialize(ser);
    console.log('    deser:', deser);
  } catch (err) {
    console.log('*** TEST FAILED:', err);
    errors.push('Test24 ' + err.toString());
  }
}
tests.push(test24);

// Error
function test25 (serialize, deserialize, options) {
  console.log(`\nTest25 (Error):`);
  console.log(
    '  let src = new Error("this is a sample error");'
  );
  try {
    throw new Error("this is a sample cause");
  } catch (cause) {
    let src = new Error('this is a sample error', {cause: cause});
    console.log('    src: ', src);
    try {
      let ser = serialize(src, options);
      console.log(`    ser:  '${ser}'`);
      let deser = deserialize(ser);
      console.log('    deser:', deser);
      if (semver.gte(process.version, '16.9.0')) {
        if (!deser.cause)
          throw new Error("No cause serialized for error");
        if (! (deser.cause instanceof Error))
          throw new Error("Cause is unexpected type: " + typeof deser.cause);
      }
    } catch (err) {
      console.log('*** TEST FAILED:', err);
      errors.push('Test25 ' + err.toString());
    }  
  }
}
tests.push(test25);

// demo
function test26 (serialize, deserialize, options) {
  console.log(`\nTest26 (demo):`);
  console.log(
    '  class CustomObj extends Object {}\n' +
    '    const custom = new CustomObj();\n' +
    '    Object.assign(custom,{foo:"bar"});\n' +
    '    let src = {\n' +
    '      undef: undefined,\n' +
    '      regexp: /abc/gi\n' +
    '      bignum: 4000000000000000000n\n' +
    '      map: new Map([\n' +
    '        [1, \'one\'],\n' +
    '        [2, \'two\']\n' +
    '      ]),\n' +
    '      custom: custom,\n' +
    '      buffer: Buffer.from(\'hello world\')\n' +
    '    };\n'
  );
  try {
    class CustomObj extends Object {}
    const custom = new CustomObj();
    custom.foo = 'bar';
    let src = {
      undef: undefined,
      regexp: /abc/gi,
      bignum: 4000000000000000000n,
      map: new Map([[1, 'one'], [2, 'two']]),
      custom: custom,
      buffer: Buffer.from('hello world')
    };
    console.log('    src: ', src);
    let ser = serialize(src, options);
    console.log(`    ser:  '${ser}'`);
    let deser = deserialize(ser);
    console.log('    deser:', deser);
    if (deser.map.get(1) != 'one') throw new Error('Map does not contain right value for key, "1"');
    checkObjectsHaveSameKeys(src, deser, 'src vs. deser');
    checkObjectsHaveSameKeys(src.custom, deser.custom, 'src.custom vs. deser.custom');
  } catch (err) {
    console.log('*** TEST FAILED:', err);
    errors.push('Test26 ' + err.toString());
  }
}
tests.push(test26);

// circular object
function test27(serialize, deserialize, options) {
  console.log(`\nTest27 (circular object reference):`);
  console.log(
    '  const src = { foo: "Foo", bar: {bar: "Bar"}};\n' +
    '  src.bar.baz = src;'
  );
  try {
    const src = {foo: "Foo", bar: {bar: "Bar"}};
    src.bar.baz = src;
    console.log('    src: ', src);
    let ser = serialize(src, options);
    console.log('    ser:', ser);
    const deser = deserialize(ser);
    console.log('    deser:', deser);
    console.log('\n  deser.foo = "FOO_FOO";');
    deser.foo = "FOO_FOO";
    console.log('    deser:', deser);
  } catch (err) {
    console.log('*** TEST FAILED:', err);
    errors.push('Test27 ' + err.toString());
  }
}
tests.push(test27);

// max depth - ensure that we serialize up to, but not exceeding max depth
function test28(serialize, deserialize, options) {
  console.log('\nTest28 (max depth):');
  console.log(
`    let wideObject = Array.from({length: options.maxDepth - 5}, (x, i) => { return new Object(); } );
    let extraWideObject = [...wideObject, Array.from({length: 10}, (x, i) => { return new Object(); })];
    let generateDeepObject = (deepObject) => {
      deepObject.deepestChild = deepObject.deepestChild.child = new Object();
      return deepObject;
    };
    let deepObject = wideObject.reduce(generateDeepObject, new function () { this.deepestChild = this; }() );
    tooDeepObject = extraWideObject.reduce(generateDeepObject, new function () { this.deepestChild = this; }() );
  
    assertDoesNotThrow {
      serialize(wideObject);
      serialize(deepObject);
      serialize(extraWideObject);
    }
    assertThrows {
      serialize(tooDeepObject);
    }
  `);
  let tooDeepObject;
  try {
    if (options.maxDepth <= 5) throw new Error("maxDepth must be at least five for this test to run");
    let wideObject = Array.from({length: options.maxDepth - 5}, (x, i) => { return new Object(); } );
    let extraWideObject = [...wideObject, Array.from({length: 10}, (x, i) => { return new Object(); })];
    let generateDeepObject = (deepObject) => {
      deepObject.deepestChild = deepObject.deepestChild.child = new Object();
      return deepObject;
    };
    let deepObject = wideObject.reduce(generateDeepObject, new function () { this.deepestChild = this; }() );
    tooDeepObject = extraWideObject.reduce(generateDeepObject, new function () { this.deepestChild = this; }() );
    serialize(wideObject);
    serialize(deepObject);
    serialize(extraWideObject);
  } catch (err) {
    console.log('*** TEST FAILED: ', err);
    errors.push('Test28 ' + err.toString());
  }
  try {
    serialize(tooDeepObject);
    console.log('*** TEST FAILED: ', err);
    errors.push('Test28 - expected to fail serializing deep object, but didn\'t');
  } catch (err) {} // we expect to catch an error here
}
tests.push(test28);

// anonymous custom object
function test29(serialize, deserialize, options) {
  console.log('\nTest29 (anonymous custom object)');
  console.log(
`const src = new function() { this.foo = "bar"; }();
const ser = serialize(src);
const des = deserialize(ser, function() { return new Object(); });
`);
  try {
    const src = new function() { this.foo = "bar"; }();
    console.log('    src: ', src);
    let ser = serialize(src, options);
    console.log('    ser:', ser);
    const deser = deserialize(ser, function() { return new Object(); } );
    console.log('    deser:', deser);
  } catch (err) {
    console.log('*** TEST FAILED: ', err);
    errors.push('Test29 ' + err.toString());
  }

}
tests.push(test29);

module.exports = {
  tests: tests,
  errors
};
