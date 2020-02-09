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
fails with and error on other types (BigInt, Function, undefined variable).

#### Exceptions
There are only two JavaScript types that *serialize-anything* does not support:
*WeakMap* and*WeakSet*. Since there is no way to enumerate their values, they
can't be serialized.

## Installation
```shell script
$ npm install serialize-anything
```

## Usage
Node.js
```javascript
const [serialize, deserialize] = require('serialize-anything');

// serialize
serialized = serialize(source);

// deserialize
deserialized = deserialize(serialized);

// deserialize data that contains custom data types
deserialized = deserializeCustom(serialized);
```
## Functions

### `serialize()`
Serialize JavaScript data
#### Syntax
```javascript
serialize(source [, options])
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
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {true|false} *[optional]* - Return serialized
data in<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; pretty format if *true*. Default is
*false* - not pretty.

#### Return value
The serialized data  {String}.

---
### `deserialize()`
Restore data that was produced by `serialize()`.
#### Syntax
```javascript
deserialize(source)
```
#### Parameters
`source`<br>
&nbsp;&nbsp;&nbsp; {String} - Serialized data that was produced by `serialize()`
#### Return value
{*} - The de-serialized data, of a type matching the original data
that was input to *serialize()*
---
### `deserializeCustom()`
Deserialize JavaScript data that contains custom data types.
#### Syntax
```javascript
deserializeCustom(source)
```
#### Parameters
`source`<br>
&nbsp;&nbsp;&nbsp; {String} - Serialized data that was produced by `serialize()`
#### Return value ####
The de-serialized data, matching the original data's type.

#### Special Note
In order to provide *serialize-anything* access to custom data types,
the following `deserializeCustom()` function
must be placed on the calling page:
```javascript
function deserializeCustom(item) {
  return deserialize(item, (constructorName) => {
    let typeExists =
      eval('typeof ' + constructorName + '!== "undefined"' );
    if (typeExists) {
      return eval('new ' + constructorName + '()');
    }
    return null;
  });
}
```


### serialize-anything vs JSON.*
***serialize-anything*** correctly handles all of the data types that
```javascript
JSON.parse( JSON.stringify(data) )
````
(JSON.*) cannot. Here are several examples:

#### Date
JSON.* converts Date to String:
```javascript
// serialize ... deserialize:
type: Date
value: Sun Feb 09 2020 10:52:49 GMT-0800 (Pacific Standard Time)
```
```javascript
// JSON.stringify ... JSON.parse:
type: String
value: "2020-02-09T17:33:12.061Z"
```
#### Map
JSON.* converts standard JavaScript Map object into a vanilla, empty Object:
```javascript
// serialize ... deserialize:
Map(2) {
  'key1' => 'key1 value',
  { foo: 'bar' } => Date {...}
}
```
```javascript
// JSON.stringify ... JSON.parse:
Object {}
```
#### Regular Expression
JSON.* converts regular expression to vanilla, empty Object:
```javascript
// serialize ... deserialize:
Array [ 1, 2, /abc/i ]
```
```javascript
// JSON.stringify ... JSON.parse:
Array [ 1, 2, Object {} ]
```

#### Typed Array
JSON.* converts standard TypedArray to Object:
```javascript
// serialize ... deserialize:
Int8Array [ 3, 4, 42 ]
```
```javascript
// JSON.stringify ... JSON.parse:
Object { '0': 3, '1': 4, '2': 42 }
```
#### BingInt64Array
JSON.* cannot handle standard JavaScript BingInt64Array at all:
```javascript
// serialize ... deserialize:
BigUint64Array [ 3000000000000000000n, 4n, 42n ]
```
```javascript
// JSON.stringify ... JSON.parse:
"TypeError: Do not know how to serialize a BigInt"
```
#### ArrayBuffer
JSON.* converts ArrayBuffer to Object with numbered properties:
```javascript
// serialize ... deserialize:
ArrayBuffer {
  [Uint8Contents]: <01 02 03 04 05 7f 00 00>,
  byteLength: 8
}
```
```javascript
// JSON.stringify ... JSON.parse:
Object { '0': 1, '1': 2, '2': 3, '3': 4, '4': 5, '5': 127, '6': 0, '7': 0 }
```
#### Custom Object
JSON.* converts a custom object into a vanilla Object:
```javascript
// serialize ... deserialize:
CustomObject {
  key: 'value',
  key2: [ 1, 2, 3 ]
}
```
```javascript
// JSON.stringify ... JSON.parse:
Object {
  key: 'value',
  key2: [ 1, 2, 3 ]
}
```
#### Custom Array
JSON.* converts a custom array into a vanilla Array:
```javascript
// serialize ... deserialize:
CustomArray [ 1, 2, 42 ]
```
```javascript
// JSON.stringify ... JSON.parse:
Array [ 1, 2, 42 ]
```

#### BigInt
JSON.* fails with an error whenever it encounters a BigInt:
```javascript
// serialize ... deserialize:
Array [ 1, 2, 3000000000n ]
```
```javascript
// JSON.stringify ... JSON.parse:
"TypeError: Do not know how to serialize a BigInt"
```

#### Undefined object property
JSON.* strips out any object property with value set to 'undefined':
```javascript
// serialize ... deserialize:
Object {
  foo: 'bar',
  notSet: undefined
}
```
```javascript
// JSON.stringify ... JSON.parse:
Object {
  foo: 'bar'
}
```

#### Function
JSON.* fails with an error message on attemt to serialize Function:
```javascript
// serialize ... deserialize:
function foo (x) { return x + 1;}
```
```javascript
// JSON.stringify ... JSON.parse:
"SyntaxError: Unexpected token u in JSON at position 0"
```




