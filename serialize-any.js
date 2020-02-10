(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.SerAny = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// serialize-all - serialize and de-serialize all JavaScript data types

const deepCopy = require('deep-copy-all');

const defaultOptions = {
  maxDepth: 20,
  pretty: false
};

/**
 * serialize the input
 * @param {*} item - the item to serialize
 * @param [options]
 * @param {number} options.maxDepth - maximum object depth
 * @param {boolean} options.pretty - pretty output
 * @return {string}
 */
function serialize (item, options = undefined) {
  options = options || defaultOptions;
  if (typeof options.maxDepth === 'undefined') {
    options.maxDepth = defaultOptions.maxDepth;
  }
  if (typeof options.pretty === 'undefined') {
    options.pretty = defaultOptions.pretty;
  }

  let iCopy = deepCopy(item);

  iCopy = serializeObject(iCopy, options, 0);

  const saWrapper = {
    _Serialize_Any_Encoded: true,
    _SA_Content: iCopy
  };

  return options.pretty
    ? JSON.stringify(saWrapper, null, 2)
    : JSON.stringify(saWrapper);

  // recursively serialize object in-place (depth first)
  function serializeObject (obj, options, depth) {
    depth++;

    if (depth > options.maxDepth) {
      throw 'Error maximum depth exceeded - possible circular reference';
    }

    // let str = "    ";
    // for (let i=0; i<depth; i++) {
    //   str += '  ';
    // }
    //console.log(str + 'serializeObject obj:', obj);

    const objType = objectType(obj);

    //console.log(str + '  serializeObject objType:', objType);

    const objBehaviors = objectBehaviors[objType];
    const objSerialize = objBehaviors.serialize;
    const objIterate = objBehaviors.iterate;
    const objSetChild = objBehaviors.setValue;

    if (objIterate) {
      objIterate(obj, (elInfo) => {
        const elType = elInfo.type;
        const elBehaviors = objectBehaviors[elType];
        const elSerialize = elBehaviors.serialize;
        const elIterate = elBehaviors.iterate;
        if (elIterate) {
          elInfo.value = serializeObject(elInfo.value, options, depth);
        } else if (elSerialize) {
          //console.log(str + '  serializing child:', elInfo.value, '...');
          elInfo.value = elSerialize(elInfo.value);
          objSetChild(obj, elInfo);
          //console.log(str + '  child is now:', elInfo.value);
        }
      });
    }
    if (objSerialize) {
      obj = objSerialize(obj);
    }
    return obj;
  }

}

/**
 * deserialize data that was created from serialize
 * @param {string} jsonData - the data to deserialize
 * @param {function} [getCustomObject] - `SerAny.customObject`
 * @return {*} - the deserialized object
 */
function deserialize (jsonData, getCustomObject = undefined) {
  // console.log('deserialize item:', item, ', getCustomObject:', getCustomObject);

  let iCopy = JSON.parse(jsonData);

  // check for our wrapper
  const iCopyType = objectType(iCopy);
  if (iCopyType !== 'Object' || !iCopy._Serialize_Any_Encoded) {
    throw 'Error: object was not serialized by serialize-any';
  }

  // strip off our wrapper
  iCopy = iCopy._SA_Content;

  return deserializeObject(iCopy, getCustomObject, 0);

  // recursively deserialize the object (breadth first)
  function deserializeObject (obj, getCustomObject, depth) {
    depth++;

    // debug
    let str = '    ';
    for (let i = 0; i < depth; i++) {
      str += '  ';
    }
    // console.log(str + 'deserializeObject obj:', obj);

    let objType = objectType(obj);

    // console.log(str + '  deserializeObject object type:', objType);

    let objBehaviors = objectBehaviors[objType];
    const objDeserialize = objBehaviors.deserialize;

    if (objDeserialize) {
      obj = objDeserialize(obj, getCustomObject);
      objType = objectType(obj);
      objBehaviors = objectBehaviors[objType];
    }

    const objIterate = objBehaviors.iterate;

    if (objIterate) {
      const objSetChild = objBehaviors.setValue;
      objIterate(obj, (elInfo) => {
        const elType = elInfo.type;
        const elBehaviors = objectBehaviors[elType];
        const elDeserialize = elBehaviors.deserialize;
        const elIterate = elBehaviors.iterate;
        if (elIterate) {
          elInfo.value = deserializeObject(elInfo.value, getCustomObject, depth);
        } else if (elDeserialize) {
          // console.log(str + '  deserializing child:', elInfo.value, '...');
          elInfo.value = elDeserialize(elInfo.value, getCustomObject);
          objSetChild(obj, elInfo);
          // console.log(str + '  child is now:', elInfo.value);
        }
      });
    }
    return obj;
  }
}

// return true if the item is a primitive data type
const isPrimitive = (item) => {
  let type = typeof item;
  return type === 'number' || type === 'string' || type === 'boolean'
    || type === 'symbol' || item === null;
};


const objectType = (obj) => {

  // console.log('        objectType() obj:',obj);

  // match primitives right away
  if (isPrimitive(obj) || !obj instanceof Object) {
    return 'primitive';
  }

  // force undefined to a serializable type
  // because JSON.stringify strips out properties set to undefined
  if (typeof obj === 'undefined') {
    return 'undef';
  }

  // force BigInt to a serializable type
  // because JSON.stringify throws error on BigInt
  if (typeof obj === 'bigint') {
    return 'BigInt';
  }

  // return type of custom serialized objects
  if (obj._SAType && obj._SAType.includes('_SACustom')) {
    return obj._SAType;
  }

  // return type of serialized regular objects
  if (typeof obj._SAType !== 'undefined') {
    return obj._SAType + '_Serialized';
  }

  // try to match object constructor name
  const consName = obj.constructor
    && obj.constructor.name;
  if (typeof consName === 'string' && consName.length
    && objectBehaviors[consName]) {
    return consName;
  }

  // identify as vanilla Array or Object
   return (obj instanceof Array) ? 'Array' : 'Object';
};

/**
 * define object behaviors
 */
const objectBehaviors = {
  "Array": {
    type: Array,
    serialize: (src) => {
      // only serialize custom arrays
      if (src.constructor.name !== 'Array') {
        return {
          _SAType: "_SACustomArray",
          _SAconstructorName: src.constructor.name,
          _SAvalues: Array.from(src)
        }
      } else {
        return src;
      }
    },
    iterate: (array, callback) => {
      const len = array.length;
      for (let i = 0; i < len; i++) {
        const val = array[i];
        const elInfo = {
          key: i,
          value: val,
          type: objectType(val)
        };
        callback(elInfo);
      }
    },
    setValue: (array, elInfo) => {
      // console.log('setting array value for elInfo:',elInfo);
      array[elInfo.key] = elInfo.value;
    }
  },
  'Date': {
    type: Date,
    serialize: (srcDate) => {
      return {
        _SAType: 'Date',
        _SAtimestamp: srcDate.getTime()
      };
    }
  },
  "Date_Serialized": {
    deserialize: (srcSer) => {
      return new Date(srcSer._SAtimestamp);
    }
  },
  'RegExp': {
    type: RegExp,
    serialize: (regex) => {
      return {
        _SAType: 'RegExp',
        _SAsource: regex.source,
        _SAflags: regex.flags
      }
    }
  },
  "RegExp_Serialized": {
    deserialize: (srcSer) => {
      return new RegExp(srcSer._SAsource, srcSer._SAflags || "");
    }
  },
  "Function": {
    type: Function,
    serialize: (fn) => {
      return {
        _SAType: "Function",
        _SAfunction: fn.toString()
      }
    }
  },
  "Function_Serialized": {
    deserialize: (srcSer) => {
      return new Function('return ' + srcSer._SAfunction)();
    },
  },
  'undef': {
    serialize: (src) => {
      return {
        _SAType: 'undef'
      }
    },
  },
  'undef_Serialized': {
    deserialize: (srcSer) => {
      return undefined;
    }
  }
};

// in case they don't exist, perform existence checks on these
// types before adding them

if (typeof BigInt !== 'undefined') {
  Object.assign(objectBehaviors, {
    "BigInt": {
      type: BigInt,
      serialize: (big) => {
        return {
          _SAType: 'BigInt',
          _SAnum: big.toString()
        }
      }
    },
    "BigInt_Serialized": {
      deserialize: (bigSer) => {
        return BigInt(bigSer._SAnum);
      }
    }
  });
}

if (typeof Int8Array !== 'undefined') {
  Object.assign(objectBehaviors, {
    'Int8Array': {
      type: Int8Array,
      serialize: (src) => {
        return {
          _SAType: "Int8Array",
          _SAvalues: Array.from(src)
        }
      }
    },
    "Int8Array_Serialized": {
      deserialize: (srcSer) => {
        return Int8Array.from(srcSer._SAvalues);
      }
    }
  })
}

if (typeof Uint8Array !== 'undefined') {
  Object.assign(objectBehaviors, {
    "Uint8Array": {
      type: Uint8Array,
      serialize: (src) => {
        return {
          _SAType: "Uint8Array",
          _SAvalues: Array.from(src)
        }
      }
    },
    "Uint8Array_Serialized": {
      deserialize: (srcSer) => {
        return Uint8Array.from(srcSer._SAvalues);
      }
    }
  });
}

if (typeof Uint8ClampedArray !== 'undefined') {
  Object.assign(objectBehaviors, {
    "Uint8ClampedArray": {
      type: Uint8ClampedArray,
      serialize: (src) => {
        return {
          _SAType: "Uint8ClampedArray",
          _SAvalues: Array.from(src)
        }
      }
    },
    "Uint8ClampedArray_Serialized": {
      deserialize: (srcSer) => {
        return Uint8ClampedArray.from(srcSer._SAvalues);
      },

    }
  });
}

if (typeof Int16Array !== 'undefined') {
  Object.assign(objectBehaviors, {
    "Int16Array": {
      type: Int16Array,
      serialize: (src) => {
        return {
          _SAType: "Int16Array",
          _SAvalues: Array.from(src)
        }
      }
    },
    "Int16Array_Serialized": {
      deserialize: (srcSer) => {
        return Int16Array.from(srcSer._SAvalues);
      }
    }
  });
}

if (typeof Uint16Array !== 'undefined') {
  Object.assign(objectBehaviors, {
    "Uint16Array": {
      type: Uint16Array,
      serialize: (src) => {
        return {
          _SAType: "Uint16Array",
          _SAvalues: Array.from(src)
        }
      }
    },
    "Uint16Array_Serialized": {
      deserialize: (srcSer) => {
        return Uint16Array.from(srcSer._SAvalues);
      }
    }
  });
}

if (typeof Int32Array !== 'undefined') {
  Object.assign(objectBehaviors, {
    "Int32Array": {
      type: Int32Array,
      serialize: (src) => {
        return {
          _SAType: "Int32Array",
          _SAvalues: Array.from(src)
        }
      }
    },
    "Int32Array_Serialized": {
      deserialize: (srcSer) => {
        return Int32Array.from(srcSer._SAvalues);
      }
    }
  });
}

if (typeof Uint32Array !== 'undefined') {
  Object.assign(objectBehaviors, {
    "Uint32Array": {
      type: Uint32Array,
      serialize: (src) => {
        return {
          _SAType: "Uint32Array",
          _SAvalues: Array.from(src)
        }
      }
    },
    "Uint32Array_Serialized": {
      deserialize: (srcSer) => {
        return Uint32Array.from(srcSer._SAvalues);
      }
    }
  });
}

if (typeof Float32Array !== 'undefined') {
  Object.assign(objectBehaviors, {
    "Float32Array": {
      type: Float32Array,
      serialize: (src) => {
        return {
          _SAType: "Float32Array",
          _SAvalues: Array.from(src)
        }
      }
    },
    "Float32Array_Serialized": {
      deserialize: (srcSer) => {
        return Float32Array.from(srcSer._SAvalues);
      }
    }
  });
}

if (typeof Float64Array !== 'undefined') {
  Object.assign(objectBehaviors, {
    "Float64Array": {
      type: Float64Array,
      serialize: (src) => {
        let values = [];
        src.forEach(fl64 => values.push(fl64.toString()));
        return {
          _SAType: "Float64Array",
          _SAvalues: values
        }
      }
    },
    "Float64Array_Serialized": {
      deserialize: (srcSer) => {
        return Float64Array.from(srcSer._SAvalues);
      }
    }
  });
}

if (typeof BigInt64Array !== 'undefined') {
  Object.assign(objectBehaviors, {
    "BigInt64Array": {
      type: BigInt64Array,
      serialize: (src) => {
        let values = [];
        src.forEach(bigint => values.push(bigint.toString()));
        return {
          _SAType: "BigInt64Array",
          _SAvalues: values
        }
      }
    },
    "BigInt64Array_Serialized": {
      deserialize: (srcSer) => {
        return BigInt64Array.from(srcSer._SAvalues);
      }
    }
  });
}

if (typeof BigUint64Array !== 'undefined') {
  Object.assign(objectBehaviors, {
    "BigUint64Array": {
      type: BigUint64Array,
      serialize: (src) => {
        let values = [];
        src.forEach(bigint => values.push(bigint.toString()));
        return {
          _SAType: "BigUint64Array",
          _SAvalues: values
        }
      }
    },
    "BigUint64Array_Serialized": {
      deserialize: (srcSer) => {
        return BigUint64Array.from(srcSer._SAvalues);
      }
    }
  });
}

if (typeof ArrayBuffer !== 'undefined') {
  // do not support, require typed array buffers
  Object.assign(objectBehaviors, {
    'ArrayBuffer': {
      type: ArrayBuffer,
      serialize: (src) => {
        const uint8 = new Uint8Array(src);
        let values = [];
        uint8.forEach((val) => {
          values.push(val);
        });
        return {
          _SAType: 'ArrayBuffer',
          _SAvalues: values
        }
      }
    },
    "ArrayBuffer_Serialized": {
      deserialize: (srcSer) => {
        const values = srcSer._SAvalues;
        const abuf = new ArrayBuffer(values.length);
        const uint8 = new Uint8Array(abuf);
        uint8.set(values);
        return abuf;
      }
    }
  });
}

if (typeof Map !== 'undefined') {
  Object.assign(objectBehaviors, {
    "Map": {
      type: Map,
      serialize: (srcMap) => {
        let kvPairs = [];
        srcMap.forEach((value, key) => {
          kvPairs.push([key, value]);
        });
        return {
          _SAType: "Map",
          _SAkvPairs: kvPairs
        }
      },
      iterate: (map, callback) => {
        map.forEach((val, key) => {
          const elInfo = {
            key: key,
            value: val,
            type: objectType(val)
          };
          callback(elInfo);
        });
      },
      setValue: (map, elInfo) => {
       // console.log('setting map value for elInfo:',elInfo);
        map.set(elInfo.key, elInfo.value);
      }
    },
    'Map_Serialized': {
      deserialize: (serData) => {
        const kvPairs = serData._SAkvPairs;
        const map = new Map();
        kvPairs.forEach(([key, value]) => {
          map.set(key, value);
        });
        return map;
      }
    }
  });
}

if (typeof Set !== 'undefined') {
  Object.assign(objectBehaviors, {
    "Set": {
      type: Set,
      serialize: (set) => {
        let values = [];
        set.forEach(val => values.push(val));
        return {
          _SAType: "Set",
          _SAvalues: values
        }
      },
      iterate: (set, callback) => {
        set.forEach((val) => {
          const elInfo = {
            key: null,
            value: val,
            originalValue: val,
            type: objectType(val)
          };
          callback(elInfo);
        });
      },
      setValue: (set, elInfo) => {
        // delete current value, then add new value
        set.delete(elInfo.originalValue);
        set.add(elInfo.value);
        elInfo.originalValue = elInfo.value;
      }
    },
    "Set_Serialized": {
      deserialize: (srcSer) => {
        return new Set(srcSer._SAvalues);
      }
    }
  });
}

if (typeof WeakSet !== 'undefined') {
  Object.assign(objectBehaviors, {
    "WeakSet" : {
      type: WeakSet,
      serialize: () => {
        throw "Error: serialize WeakSet not supported";
      }
    }
  });
}

if (typeof WeakMap !== 'undefined') {
  Object.assign(objectBehaviors, {
    "WeakMap" : {
      type: WeakMap,
      serialize: () => {
        throw "Error: serialize WeakMap not supported";
      }
    }
  });
}

// node.js Buffer
if (typeof Buffer !== 'undefined') {
  Object.assign(objectBehaviors, {
    "Buffer" : {
      type: Buffer,
      serialize: (buf) => {
        return {
          _SAType: "Buffer",
          _SAutf8String: buf.toString()
        }
      }
    },
    "Buffer_Serialized": {
      deserialize: (srcSer) => {
        return Buffer.from(srcSer._SAutf8String);
      }
    }
  });
}

// always include Object, primitive, unknown
Object.assign(objectBehaviors, {
  "Object": {
    type: Object,
    serialize: (obj) => {
      const cName = obj.constructor.name;
      if (cName === 'Object') {
        // no need to serialize vanilla Object
        return obj;
      } else {
        return {
          _SAType: "_SACustomObject",
          _SAconstructorName: cName,
          _SAobject: Object.assign({},obj)
        }
      }
    },
    iterate: (obj, callback) => {
      const keys = Object.keys(obj);
      const len = keys.length;
      for (let i = 0; i < len; i++) {
        const key = keys[i];
        const value = obj[key];
        const elInfo = {
          key: key,
          value: value,
          type: objectType(value),
        };
        callback(elInfo);
      }
    },
    setValue: (obj, elInfo) => {
     // console.log('setting Object value for elInfo:',elInfo);
      obj[elInfo.key] = elInfo.value;
    }
  },
  "_SACustomObject": {
    // any object with a custom constructor name
    deserialize: (srcSer, getCustomObject) => {
      const cName = srcSer._SAconstructorName;
      const cNameDefined = eval('typeof ' + cName + ' !== "undefined"');
      const srcObj = srcSer._SAobject;
      let cObj;
      if (cNameDefined) {
        cObj = new eval(cName)();
      } else {
        if (!getCustomObject) {
          throw 'Error: deserialize _SACustomObject - getCustomObject missing';
        }
        cObj = getCustomObject(cName);
      }
      if (!cObj) {
        throw 'Error: unable to deserialize - "' + cName + '" undefined';
      }
      Object.assign(cObj, srcObj);
      return cObj;
    }
  },
  "_SACustomArray": {
    // any array with a custom constructor name
    deserialize: (srcSer, getCustomObject) => {
      const cName = srcSer._SAconstructorName;
      const cNameDefined = eval('typeof ' + cName + ' !== "undefined"');
      let values = srcSer._SAvalues;
      let array;
      if (cNameDefined) {
        array = new eval(cName)();
      } else {
        if (!getCustomObject) {
          throw 'Error: deserialize _SACustomArray - getCustomObject missing';
        }
        array = getCustomObject(cName);
      }
      if (!array) {
        throw 'Error: deserialize _SACustomArray - "' + cName + '" undefined';
      }
      array = array.concat(array, values);
      return array;
    }
  },
  'unknown': {
  },
  "primitive": {
  }
});

module.exports = {
  serialize,
  deserialize
};
},{"deep-copy-all":2}],2:[function(require,module,exports){
"use strict";const[isPrimitive,objectType,objectBehaviors]=require("./object-library.js"),defaultOptions={goDeep:!0,includeNonEnumerable:!1,maxDepth:20};module.exports=function(e,o){if(void 0===(o=o||defaultOptions).goDeep&&(o.goDeep=defaultOptions.goDeep),void 0===o.includeNonEnumerable&&(o.includeNonEnumerable=defaultOptions.includeNonEnumerable),void 0===o.maxDepth&&(o.maxDepth=defaultOptions.maxDepth),!o.goDeep)return objectBehaviors[objectType(e)].makeShallow(e);if(!e||isPrimitive(e))return e;const t=objectType(e);if(!objectBehaviors[t].mayDeepCopy)return objectBehaviors[t].makeShallow(e);let i=objectBehaviors[t].makeEmpty(e);return copyObject(e,i,t,0,o),i};const copyObject=(e,o,t,i,a)=>{if(++i>=a.maxDepth)return void console.log("copyObject too deep, depth:",i,",obj:",e);const r=objectBehaviors[t];if(!r.mayDeepCopy)return;const c=r.addElement;(0,r.iterate)(e,a.includeNonEnumerable,e=>{const t=e.value,r=e.type;let n,p=objectBehaviors[r].mayDeepCopy;n=p?objectBehaviors[r].makeEmpty(t):objectBehaviors[r].makeShallow(t),c(o,e.key,n,e.descriptor),p&&copyObject(t,n,r,i,a)})};
},{"./object-library.js":3}],3:[function(require,module,exports){
// object library - specific behaviors for each object type

// return true if the item is a primitive data type
const isPrimitive = (item) => {
  let type = typeof item;
  return type === 'number' || type === 'string' || type === 'boolean'
    || type === 'undefined' || type === 'bigint' || type === 'symbol'
    || item === null;
}

// establish a "type" keyword for an object
const objectType = (obj) => {

  // match primitives right away
  if (isPrimitive(obj) || !obj instanceof Object) {
    return 'primitive';
  }

  // try to match object constructor name
  const consName = obj.constructor && obj.constructor.name
    && obj.constructor.name.toLowerCase();
  if (typeof consName === 'string' && consName.length
    && objectBehaviors[consName]) {
    return consName;
  }

  // try to match by looping through objectBehaviors type property
  let typeTry;
  for (const name in objectBehaviors) {
    typeTry = objectBehaviors[name].type;
    if (!typeTry || obj instanceof typeTry) {
      // console.log('objectType matched in a fall-back loop name:',name);
      return name;
    }
  }
  return 'unknown';
}

/**
 * define object behaviors
 * Note: The order is important - custom objects must be listed BEFORE
 *       the standard JavaScript Object.
 * @namespace
 * @property {*} type - object data "type"
 * @property {Boolean} [mayDeepCopy] - true if object may be deep copied
 * @property {function} [addElement] - add a single element to object
 * @property {function} [makeEmpty] - make an empty object
 * @property {function} makeShallow - make shallow copy of object
 * @property {function} [iterate] - iterate over objects elements
 *                                  with callback({key,value,"type"})
 */
const objectBehaviors = {
  "array": {
    type: Array,
    mayDeepCopy: true,
    addElement: (array, key, value) => Array.prototype.push.call(array, value),
    makeEmpty: source => {
      const newArray = [];
      Object.setPrototypeOf(newArray, Object.getPrototypeOf(source));
      return newArray;
    },
    makeShallow: source => {
      const dest = [...source];
      Object.setPrototypeOf(dest, Object.getPrototypeOf(source));
      return dest;
    },
    iterate: (array, copyNonEnumerables, callback) => {
      const len = array.length;
      for (let i = 0; i < len; i++) {
        const val = array[i];
        const elInfo = {
          key: i,
          value: val,
          type: objectType(val)
        }
        callback(elInfo);
      }
    }
  },
  "date": {
    type: Date,
    makeShallow: date => new Date(date.getTime()),
  },
  "regexp": {
    type: RegExp,
    makeShallow: src => new RegExp(src),
  },
  'function': {
    type: Function,
    makeShallow: fn => fn,
  }
};

// in case they don't exist, perform existence checks on these
// types before adding them

if (typeof Int8Array !== 'undefined') {
  Object.assign(objectBehaviors, {
    "int8array": {
      type: Int8Array,
      makeShallow: source => Int8Array.from(source),
    }
  });
}

if (typeof Uint8Array !== 'undefined') {
  Object.assign(objectBehaviors, {
    "uint8array": {
      type: Uint8Array,
      makeShallow: source => Uint8Array.from(source),
    }
  });
}

if (typeof Uint8ClampedArray !== 'undefined') {
  Object.assign(objectBehaviors, {
    "uint8clampedarray": {
      type: Uint8ClampedArray,
      makeShallow: source => Uint8ClampedArray.from(source),
    }
  });
}

if (typeof Int16Array !== 'undefined') {
  Object.assign(objectBehaviors, {
    "int16array": {
      type: Int16Array,
      makeShallow: source => Int16Array.from(source),
    }
  });
}

if (typeof Uint16Array !== 'undefined') {
  Object.assign(objectBehaviors, {
    "uint16array": {
      type: Uint16Array,
      makeShallow: source => Uint16Array.from(source),
    }
  });
}

if (typeof Int32Array !== 'undefined') {
  Object.assign(objectBehaviors, {
    "int32array": {
      type: Int32Array,
      makeShallow: source => Int32Array.from(source),
    }
  });
}

if (typeof Uint32Array !== 'undefined') {
  Object.assign(objectBehaviors, {
    "uint32array": {
      type: Uint32Array,
      makeShallow: source => Uint32Array.from(source),
    }
  });
}

if (typeof Float32Array !== 'undefined') {
  Object.assign(objectBehaviors, {
    "float32array": {
      type: Float32Array,
      makeShallow: source => Float32Array.from(source),
    }
  });
}

if (typeof Float64Array !== 'undefined') {
  Object.assign(objectBehaviors, {
    "float64array": {
      type: Float64Array,
      makeShallow: source => Float64Array.from(source),
    }
  });
}

if (typeof BigInt64Array !== 'undefined') {
  Object.assign(objectBehaviors, {
    "bigint64array": {
      type: BigInt64Array,
      makeShallow: source => BigInt64Array.from(source),
    }
  });
}

if (typeof BigUint64Array !== 'undefined') {
  Object.assign(objectBehaviors, {
    "biguint64array": {
      type: BigUint64Array,
      makeShallow: source => BigUint64Array.from(source),
    }
  });
}

if (typeof ArrayBuffer !== 'undefined') {
  Object.assign(objectBehaviors, {
    "arraybuffer": {
      type: ArrayBuffer,
      makeShallow: buffer => buffer.slice(0)
    }
  });
}

if (typeof Map !== 'undefined') {
  Object.assign(objectBehaviors, {
    "map": {
      type: Map,
      mayDeepCopy: true,
      addElement: (map, key, value) => map.set(key, value),
      makeEmpty: () => new Map(),
      makeShallow: sourceMap => new Map(sourceMap),
      iterate: (map, copyNonEnumerables, callback) => {
        map.forEach((val, key) => {
          const elInfo = {
            key: key,
            value: val,
            type: objectType(val)
          }
          callback(elInfo);
        });
      }
    }
  });
}

if (typeof Set !== 'undefined') {
  Object.assign(objectBehaviors, {
    "set": {
      type: Set,
      mayDeepCopy: true,
      addElement: (set, key, value) => set.add(value),
      makeEmpty: () => new Set(),
      makeShallow: set => new Set(set),
      iterate: (set, copyNonEnumerables, callback) => {
        set.forEach(val => {
          const elInfo = {
            key: null,
            value: val,
            type: objectType(val)
          }
          callback(elInfo);
        });
      }
    }
  });
}

if (typeof WeakSet !== 'undefined') {
  Object.assign(objectBehaviors, {
    "weakset" : {
      type: WeakSet,
      makeShallow: wset => wset
    }
  });
}

if (typeof WeakMap !== 'undefined') {
  Object.assign(objectBehaviors, {
    "weakmap" : {
      type: WeakMap,
      makeShallow: wmap => wmap
    }
  });
}

// node.js Buffer
if (typeof Buffer !== 'undefined') {
  Object.assign(objectBehaviors, {
    "buffer" : {
      type: Buffer,
      makeShallow: buf => Buffer.from(buf)
    }
  });
}

// always include Object, primitive, unknown
Object.assign(objectBehaviors, {
  "object": {
    type: Object,
    mayDeepCopy: true,
    addElement: (obj, key, value, descriptor = undefined) => {
      if (!descriptor) {
        obj[key] = value;
      } else {
        Object.defineProperty(obj, key, descriptor);
      }
    },
    makeEmpty: source => {
      const newObj = {};
      Object.setPrototypeOf(newObj, Object.getPrototypeOf(source));
      return newObj;
    },
    makeShallow: source => {
      const dest = Object.assign({}, source);
      Object.setPrototypeOf(dest, Object.getPrototypeOf(source));
      return dest;
    },
    iterate: (obj, copyNonEnumerables, callback) => {
      const keys = copyNonEnumerables ?
        Object.getOwnPropertyNames(obj) : Object.keys(obj);
      const len = keys.length;
      for (let i = 0; i < len; i++) {
        const key = keys[i];
        const value = obj[key];
        const elInfo = {
          key: key,
          value: value,
          type: objectType(value),
        }
        if (copyNonEnumerables && !obj.propertyIsEnumerable(key)) {
          elInfo.descriptor = Object.getOwnPropertyDescriptor(obj, key);
        }
        callback(elInfo);
      }
    }
  },
  "unknown": {
    makeShallow: source => source
  },
  "primitive": {
    makeShallow: source => source
  }
});

module.exports = [
  isPrimitive,
  objectType,
  objectBehaviors
]
},{}]},{},[1])(1)
});
