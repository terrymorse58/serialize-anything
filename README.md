# serialize-anything
A universal serializer and de-serializer for JavaScript data
---
![GitHub top language](https://img.shields.io/github/languages/top/terrymorse58/serialize-anything)
![GitHub package.json version](https://img.shields.io/github/package-json/v/terrymorse58/serialize-anything)
[![codebeat badge](https://codebeat.co/badges/944a5f1c-b519-43fb-85de-97b6a9326fb8)](https://codebeat.co/projects/github-com-terrymorse58-serialize-anything-master)
![David](https://img.shields.io/david/terrymorse58/serialize-anything)
![NPM Downloads](https://img.shields.io/npm/dw/serialize-anything)
![NPM License](https://img.shields.io/npm/l/serialize-anything)
[![Twitter](https://img.shields.io/twitter/follow/terrymorse.svg?style=social&label=@terrymorse)](https://twitter.com/terrymorse)

## Overview
**serialize-anything** serializes and de-serializes virtually all JavaScript standard and custom data types, with no data modification.

Compared to commonly used serialize/deserialze methods which convert only a subset of JavaScript data types — **serialize-anything** converts more without loss of any data.

#### Exceptions
1. There are two JavaScript types that **serialize-anything** does not support: *WeakMap* and *WeakSet*. Since there is no known way to enumerate their values, they can't be serialized.

---
## Data Types Supported
Comparing support for data types in the most popular methods.

Legend: &nbsp; &nbsp; ❌ - Error &nbsp; &nbsp; 🗑 - data loss &nbsp; &nbsp; ✅ - correct

Data Type              | JSON.* | s-javascript | s-to-js | s-anything
---------------------- | ------ | ------------ | ------- | ----------
Date                   | 🗑     | ✅           | ✅      | ✅
RegExp                 | 🗑     | ✅           | ✅      | ✅
Buffer                 | 🗑     | 🗑           | ✅      | ✅
Error                  | 🗑     | 🗑           | ✅      | ✅
BigInt                 | ❌     | ❌           | 🗑      | ✅
undefined              | ❌     | ✅           | ✅      | ✅
{prop: undefined}      | 🗑     | ✅           | ✅      | ✅
TypedArray             | 🗑     | 🗑           | ✅      | ✅
Map                    | 🗑     | ✅           | ✅      | ✅
Set                    | 🗑     | ✅           | ✅      | ✅
Custom Object          | 🗑     | 🗑           | 🗑      | ✅
Custom Array           | 🗑     | 🗑           | 🗑      | ✅
BigInt64Array          | ❌     | ❌           | 🗑      | ✅
BigUint64Array         | ❌     | ❌           | 🗑      | ✅
Function               | ❌     | ✅           | ❌      | ✅
ArrayBuffer            | 🗑     | ✅           | ❌      | ✅
WeakSet                | 🗑     | 🗑           | ❌      | ❌
WeakMap                | 🗑     | 🗑           | ❌      | ❌
Circular reference     | ❌     | ❌           | ❌      | ✅

&nbsp; &nbsp; &nbsp; JSON.* — JSON.stringify/parse<br>
&nbsp; &nbsp; &nbsp; s-javascript — [serialize-javascript](https://github.com/yahoo/serialize-javascript) <br>
&nbsp; &nbsp; &nbsp; s-to-js — [serialize-to-js](https://github.com/commenthol/serialize-to-js) <br>
&nbsp; &nbsp; &nbsp; s-anything — [serialize-anything](https://github.com/terrymorse58/serialize-anything)

---
## Installation
Install as a Node.js module:
```
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
To serialize:
```javascript
// serialize
serialized = SerAny.serialize(source);
```
To deserialize:
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
custom.baz = custom; // circular reference
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
  custom: CustomObj <ref *1> { foo: 'bar', baz: [Circular *1] },
  buffer: <Buffer 68 65 6c 6c 6f 20 77 6f 72 6c 64>
}
*/

const ser = SerAny.serialize(source);
```
Serialized result (JSON):
```json
{
  "_Serialize_Any_Encoded": true,
  "_SA_Content": {
    "undef": { "_SAType": "undef" },
    "regexp": {
      "_SAType": "RegExp",
      "_SAId": 1,
      "_SAsource": "abc",
      "_SAflags": "gi"
    },
    "bignum": {
      "_SAType": "BigInt",
      "_SAnum": "4000000000000000000"
    },
    "map": {
      "_SAType": "Map",
      "_SAId": 2,
      "_SAkvPairs": [ [1, "one"], [2,"two"] ]
    },
    "custom": {
      "_SAType": "_SACustomObject",
      "_SAId": 3,
      "_SAconstructorName": "CustomObj",
      "_SAobject": { "foo": "bar", "baz": { "_SAType": "_SACustomObjectRef", "_SAId": 3 } }
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
  custom: CustomObj <ref *1> { foo: 'bar', baz: CustomObj [Circular *1] },  
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
&nbsp;&nbsp;&nbsp; (Object) *[optional]* -  Control the serializer's behavior.

`options` properties:

&nbsp;&nbsp;&nbsp; `maxDepth`<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; (number) *[optional]* - Limit the number of levels<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; into the source data. Throws an error if source's<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; depth is greater than *maxDepth*. Default is 20 levels.

&nbsp;&nbsp;&nbsp; `pretty`<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; (boolean) *[optional]* - Return serialized data in<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; pretty format if *true*. Default is *false* - not pretty.

#### Return value
(string) - The serialized data.

---
### `SerAny.deserialize()`
Restore serialized data created by `SerAny.serialize()`.
#### Syntax
```javascript
SerAny.deserialize(source)
```
#### Parameters
`source`<br>
&nbsp;&nbsp;&nbsp; (string) - Serialized data that was created by `SerAny.serialize()`

#### Return value
(any type) - The de-serialized data, matching the type of the original source.

---

