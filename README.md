# serialize-anything
A universal serializer and de-serializer for JavaScript data
---

## Overview
**serialize-anything** serializes and de-serializes virtually all
JavaScript standard and custom data types, with no data loss.

Contrast this with the JavaScript standard way to serialize/deserialze,
*JSON.stringify()* and
*JSON.parse()*, which do not maintain certain data types (Date,
undefined property, RegExp, custom Object, custom Array, Set, Map), and
fails with an error on other types (BigInt, Function, undefined variable).

#### Exceptions
There are only two JavaScript types that *serialize-anything* does not support:
*WeakMap* and *WeakSet*. Since there is no way at this time to enumerate their
values, they can't be serialized.

## Installation
Install as a Node.js module:
```shell script
 $ npm install serialize-anything
```
Or download a package from [github](https://github.com/terrymorse58/serialize-anything.git).

## Usage
Node.js:
```javascript
const SerAny = require('serialize-anything');

// copied from `custom-objects.js` to handle custom objects (optional)
SerAny._custom = function (name) {
  let typeExists = eval('typeof ' + name + '!== "undefined"' );
  return typeExists ? eval('new ' + name + '()') : null;
};
SerAny._ds = SerAny.deserialize;
SerAny.deserialize = source => SerAny._ds(source, SerAny._custom);
```
From HTML file:
```HTML
<script src="serialize-any.js"></script>
<script>
    // copied from `custom-objects.js` to handle custom objects (optional)
    SerAny._custom = function (name) {
      let typeExists = eval('typeof ' + name + '!== "undefined"' );
      return typeExists ? eval('new ' + name + '()') : null;
    };
    SerAny._ds = SerAny.deserialize;
    SerAny.deserialize = source => SerAny._ds(source, SerAny._custom);
</script>
````
To serialize - convert JavaScript data to serial-anything data:
```javascript
// serialize
serialized = SerAny.serialize(source);
```
To deserialize - convert serial-anything data to JavaScript data:
```javascript
// deserialize
deserialized = SerAny.deserialize(serialized);
```
---
### Example
Serialize some challenging data:
```javascript
const custom = new CustomObj();
custom.foo = 'bar';
let source = {
  undef: undefined,
  regexp: /abc/gi,
  bignum: 4000000000000000000n,
  map: new Map([[1, 'one'], [2, 'two']]),
  custom,
  buffer: Buffer.from("hello world")
};

/* source:
{
  undef: undefined,
  regexp: /abc/gi,
  bignum: 4000000000000000000n,
  map: Map(2) { 1 => 'one', 2 => 'two' },
  custom: CustomObj { foo: 'bar' },
  buffer: <Buffer 68 65 6c 6c 6f 20 77 6f 72 6c 64>
}
*/

const ser = SerAny.serialize(source);
```
Serialized JSON output:
```json
{
  "_Serialize_Any_Encoded": true,
  "_SA_Content": {
    "undef": { "_SAType": "undef" },
    "regexp": {
      "_SAType": "RegExp",
      "_SAsource": "abc",
      "_SAflags": "gi"
    },
    "bignum": {
      "_SAType": "BigInt",
      "_SAnum": "4000000000000000000"
    },
    "map": {
      "_SAType": "Map",
      "_SAkvPairs": [ [1, "one"], [2,"two"] ]
    },
    "custom": {
      "_SAType": "_SACustomObject",
      "_SAconstructorName": "CustomObj",
      "_SAobject": { "foo": "bar" }
    },
    "buffer": {
      "_SAType": "Buffer",
      "_SAutf8String": "hello world"
    }
  }
}
```
Deserialized:
```javascript
const deser = SerAny.deserialize(ser);

/* deser:
{
  undef: undefined,
  regexp: /abc/gi,
  bignum: 4000000000000000000n,
  map: Map(2) { 1 => 'one', 2 => 'two' },
  custom: CustomObj { foo: 'bar' },
  buffer: <Buffer 68 65 6c 6c 6f 20 77 6f 72 6c 64>
}
*/
```

---
## Functions

### `SerAny.serialize()`
Serialize JavaScript data
#### Syntax
```javascript
SerAny.serialize(source [, options])
```
#### Parameters
`source`<br>
&nbsp;&nbsp;&nbsp; The JavaScript data to serialize

`options`<br>
&nbsp;&nbsp;&nbsp; {Object} *[optional]* -  Control the serializer's behavior.

`options` properties:

&nbsp;&nbsp;&nbsp; `maxDepth`<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {number} *[optional]* - Limit the
number of levels<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; into the source data.
Throws an error if source's<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; depth is
greater than *maxDepth*. Default is 20 levels.

&nbsp;&nbsp;&nbsp; `pretty`<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {boolean} *[optional]* - Return serialized
data in<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; pretty format if *true*. Default is
*false* - not pretty.

#### Return value
The serialized data as a string.

---
### `SerAny.deserialize()`
Restore serialized data created by `SerAny.serialize()`.
#### Syntax
```javascript
deserialize(source)
```
#### Parameters
`source`<br>
&nbsp;&nbsp;&nbsp; (string) - Serialized data that was created by
`SerAny.serialize()`

#### Return value
The de-serialized data, matching the type of the original data

---

### serialize-anything vs JSON.*
***serialize-anything*** correctly converts—with no data alteration—data
types which the built-in standard
`JSON.parse( JSON.stringify(data) )`
(*JSON.**) does not. Here are several examples:

#### Date
*JSON.** converts **Date** object to a string:
```javascript
// serialize-anything:
typeof: 'object'
toString(): 'Mon Feb 10 2020 21:27:19 GMT-0800 (Pacific Standard Time)'
getTime(): 1581398566403
```
```javascript
// JSON.*:
typeof: 'string'
value: '2020-02-11T05:27:19.305Z'
getTime(): TypeError: getTime is not a function
```
#### Map
*JSON.** converts standard JavaScript **Map** object into a vanilla, empty Object:
```javascript
// serialize-anything:
Map(2) {
  'key1' => 'key1 value',
  { foo: 'bar' } => Date {...}
}
```
```javascript
// JSON.*:
Object {}
```
#### Regular Expression RegExp
*JSON.** converts regular expression **RegExp** object to an **Object** with
no data:
```javascript
// serialize-anything:
Array [ 1, 2, /abc/i ]
```
```javascript
// JSON.*:
Array [ 1, 2, Object {} ]
```

#### Typed Array
*JSON.** converts standard **TypedArray** to **Object** with numbers as the
property names:
```javascript
// serialize-anything:
Int8Array [ 3, 4, 42 ]
```
```javascript
// JSON.*:
Object { '0': 3, '1': 4, '2': 42 }
```
#### BingInt64Array
*JSON.** throws an error on standard JavaScript **BingInt64Array**:
```javascript
// serialize-anything:
BigUint64Array [ 3000000000000000000n, 4n, 42n ]
```
```javascript
// JSON.*:
"TypeError: Do not know how to serialize a BigInt"
```
#### ArrayBuffer
*JSON.** converts **ArrayBuffer** to **Object** with numbers for the property
names:
```javascript
// serialize-anything:
ArrayBuffer {
  [Uint8Contents]: <01 02 03 04 05 7f 00 00>,
  byteLength: 8
}
```
```javascript
// JSON.*:
Object { '0': 1, '1': 2, '2': 3, '3': 4, '4': 5, '5': 127, '6': 0, '7': 0 }
```
#### Custom Object
*JSON.** converts a custom object into a plain **Object**:
```javascript
// serialize-anything:
CustomObject {
  key: 'value',
  key2: [ 1, 2, 3 ]
}
```
```javascript
// JSON.*:
Object {
  key: 'value',
  key2: [ 1, 2, 3 ]
}
```
#### Custom Array
*JSON.** converts a custom array into a plain **Array**:
```javascript
// serialize-anything:
CustomArray [ 1, 2, 42 ]
```
```javascript
// JSON.*:
Array [ 1, 2, 42 ]
```

#### BigInt
*JSON.** fails with an error whenever it encounters **BigInt** data type:
```javascript
// serialize-anything:
Array [ 1, 2, 3000000000n ]
```
```javascript
// JSON.*:
"TypeError: Do not know how to serialize a BigInt"
```

#### Undefined object property
*JSON.** strips out any object property with value set to 'undefined':
```javascript
// serialize-anything:
Object {
  foo: 'bar',
  notSet: undefined
}
```
```javascript
// JSON.*:
Object {
  foo: 'bar'
}
```

#### Function
*JSON.** fails with an error message on **Function**:
```javascript
// serialize-anything:
function foo (x) { return x + 1; }
```
```javascript
// JSON.*:
"SyntaxError: Unexpected token u in JSON at position 0"
```




