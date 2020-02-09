// serialize-all - serialize and de-serialize all JavaScript data types

const deepCopy = require('deep-copy-all');


function serialize (item) {
  //console.log("serialize item:", item);

  let iCopy = deepCopy(item);

  return JSON.stringify(serializeObject(iCopy, 0));
}

// recursively serialize object in-place (depth first)
function serializeObject (obj, depth) {
  depth++;

  let str = "    ";
  for (let i=0; i<depth; i++) {
    str += '  ';
  }
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
        elInfo.value = serializeObject(elInfo.value, depth);
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

function deserialize (objJSON, prototyper = undefined) {
  // console.log('deserialize item:', item, ', prototyper:', prototyper);

  let iCopy = JSON.parse(objJSON);

  return deserializeObject(iCopy, prototyper, 0);
}

function deserializeObject(obj, prototyper, depth) {
  depth++;

  let str = "    ";
  for (let i=0; i<depth; i++) {
    str += '  ';
  }
  // console.log(str + 'deserializeObject obj:', obj);

  const objType = objectType(obj);

  // console.log(str + '  deserializeObject object type:', objType);

  const objBehaviors = objectBehaviors[objType];
  const objDeserialize = objBehaviors.deserialize;
  const objIterate = objBehaviors.iterate;
  const objSetChild = objBehaviors.setValue;

  if (objIterate) {
    objIterate(obj, (elInfo) => {
      const elType = elInfo.type;
      const elBehaviors = objectBehaviors[elType];
      const elDeserialize = elBehaviors.deserialize;
      const elIterate = elBehaviors.iterate;
      if (elIterate) {
        elInfo.value = deserializeObject(elInfo.value, prototyper, depth);
      } else if (elDeserialize) {
        // console.log(str + '  deserializing child:', elInfo.value, '...');
        elInfo.value = elDeserialize(elInfo.value, prototyper);
        objSetChild(obj, elInfo);
        // console.log(str + '  child is now:', elInfo.value);
      }
    });
  }
  if (objDeserialize) {
    obj = objDeserialize(obj, prototyper);
  }
  return obj;

}

// return true if the item is a primitive data type
const isPrimitive = (item) => {
  let type = typeof item;
  return type === 'number' || type === 'string' || type === 'boolean'
    || type === 'undefined' || type === 'bigint' || type === 'symbol'
    || item === null;
}


/**
 * define object behaviors
 * Note: The order is important - custom objects must be listed BEFORE
 *       the standard JavaScript Object.
 * @namespace
 * @property {*} type - object data "type"
 * @property {function} [addElement] - add a single element to object
 * @property {function} [makeEmpty] - make an empty object
 * @property {function} [iterate] - iterate over objects elements
 *                                  with callback({key,value,"type"})
 */

const objectType = (obj) => {

  // match primitives right away
  if (isPrimitive(obj) || !obj instanceof Object) {
    // console.log(`objectType returning "primitive"`);
    return 'primitive';
  }

  // return type of custom serialized objects
  if (obj._SerializeAnyType && obj._SerializeAnyType.includes('_SACustom')) {
    return obj._SerializeAnyType;
  }

  // return type of serialized object
  if (typeof obj._SerializeAnyType !== 'undefined') {
    return obj._SerializeAnyType + '_Serialized';
  }

  // try to match object constructor name
  const consName = obj.constructor
    && obj.constructor.name;
  if (typeof consName === 'string' && consName.length
    && objectBehaviors[consName]) {
    // console.log(`objectType matched "${consName}" in objectBehaviors`);
    return consName;
  }

  // identify as generic Array or Object
  const generic = (obj instanceof Array) ? 'Array' : 'Object';
  // console.log(`objectType didn't match "${consName}", returning "${generic}"`);
  return generic;
}

/**
 * define object behaviors
 * Note: The order is important - custom objects must be listed BEFORE
 *       the standard JavaScript Object.
 * @namespace
 * @property {*} type - object data "type"
 * @property {function} [addElement] - add a single element to object
 * @property {function} [makeEmpty] - make an empty object
 * @property {function} [iterate] - iterate over objects elements
 *                                  with callback({key,value,"type"})
 */
const objectBehaviors = {
  "Array": {
    type: Array,
    serialize: (src) => {
      if (src.constructor.name === 'Array') {
        return src;
      } else {
        return {
          _SerializeAnyType: "_SACustomArray",
          _SAconstructorName: src.constructor.name,
          _SAvalues: Array.from(src)
        }
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
        _SerializeAnyType: 'Date',
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
        _SerializeAnyType: 'RegExp',
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
        _SerializeAnyType: "Function",
        _SAfunction: fn.toString()
      }
    }
  },
  "Function_Serialized": {
    deserialize: (srcSer) => {
      return new Function('return ' + srcSer._SAfunction)();
    },
  }
};

// in case they don't exist, perform existence checks on these
// types before adding them

if (typeof Int8Array !== 'undefined') {
  Object.assign(objectBehaviors, {
    'Int8Array': {
      type: Int8Array,
      serialize: (src) => {
        return {
          _SerializeAnyType: "Int8Array",
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
          _SerializeAnyType: "Uint8Array",
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
          _SerializeAnyType: "Uint8ClampedArray",
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
          _SerializeAnyType: "Int16Array",
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
          _SerializeAnyType: "Uint16Array",
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
          _SerializeAnyType: "Int32Array",
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
          _SerializeAnyType: "Uint32Array",
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
          _SerializeAnyType: "Float32Array",
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
          _SerializeAnyType: "Float64Array",
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
          _SerializeAnyType: "BigInt64Array",
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
          _SerializeAnyType: "BigUint64Array",
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
    "ArrayBuffer": {
      type: ArrayBuffer,
      serialize: (src) => {
        throw "Error: serializing untyped ArrayBuffer not supported";
      },
      deserialize: (src) => {
        throw "Error: deserializing untyped ArrayBuffer not supported";
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
          _SerializeAnyType: "Map",
          _SAkeyValuePairs: kvPairs
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
        const kvPairs = serData._SAkeyValuePairs;
        const map = new Map();
        kvPairs.forEach(([key, value]) => {
          map.set(key, value);
        });
        return map;
      },
      iterate: (mapSer, callback) => {
        const kvPairs = mapSer._SAkeyValuePairs;
        kvPairs.forEach((value, index) => {
          const elInfo = {
            key: index,
            value: value,
            type: objectType(value)
          };
          callback(elInfo);
        });
      },
      setValue: (mapSer, elInfo) => {
        const kvPairs = mapSer._SAkeyValuePairs;
        kvPairs[elInfo.key] = elInfo.value;
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
          _SerializeAnyType: "Set",
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
        set.delete(elInfo.originalValue);
        set.add(elInfo.value);
        elInfo.originalValue = elInfo.value;
      }
    },
    "Set_Serialized": {
      deserialize: (srcSer) => {
        return new Set(srcSer._SAvalues);
      },
      iterate: (setSer, callback) => {
        const setVals = setSer._SAvalues;
        setVals.forEach((val, index) => {
          const elInfo = {
            key: index,
            value: val,
            type: objectType(val)
          };
          callback(elInfo);
        })
      },
      setValue: (setSer, elInfo) => {
        const setVals = setSer._SAvalues;
        setVals[elInfo.key] = elInfo.value;
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
      },
      deserialize: () => {
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
      },
      deserialize: () => {
        throw "Error: serialize WeakMap not supported";
      },
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
          _SerializeAnyType: "Buffer",
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
          _SerializeAnyType: "_SACustomObject",
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
    deserialize: (srcSer, prototyper) => {
      const cName = srcSer._SAconstructorName;
      const cNameDefined = eval('typeof ' + cName + ' !== "undefined"');
      const srcObj = srcSer._SAobject;
      let cObj;
      if (cNameDefined) {
        cObj = new eval(cName)();
      } else {
        if (!prototyper) {
          throw 'Error: deserialize _SACustomObject - proototyper missing';
        }
        cObj = prototyper(cName);
      }
      if (!cObj) {
        throw 'Error: unable to deserialize - "' + cName + '" undefined';
      }
      Object.assign(cObj, srcObj);
      return cObj;
    },
    iterate: (objSer, callback) => {
      const obj = objSer._SAobject;
      for (let [key, value] of Object.entries(obj)) {
        const elInfo = {
          key: key,
          value: value,
          type: objectType(value)
        };
        callback(elInfo);
      }
    },
    setValue: (objSer, elInfo) => {
     // console.log('setting _SACustomObject value for elInfo:',elInfo);
      const obj = objSer._SAobject;
      obj[elInfo.key] = elInfo.value;
    }
  },
  "_SACustomArray": {
    deserialize: (srcSer, prototyper) => {
      const cName = srcSer._SAconstructorName;
      const cNameDefined = eval('typeof ' + cName + ' !== "undefined"');
      let values = srcSer._SAvalues;
      let array;
      if (cNameDefined) {
        array = new eval(cName)();
      } else {
        if (!prototyper) {
          throw 'Error: deserialize _SACustomArray - prototyper missing';
        }
        array = prototyper(cName);
      }
      if (!array) {
        throw 'Error: deserialize _SACustomArray - "' + cName + '" undefined';
      }
      array = array.concat(array, values);
      return array;
    },
    iterate: (arraySer, callback) => {
      const values = arraySer._SAvalues;
      values.forEach((value, index) => {
        const elInfo = {
          key: index,
          value: value,
          type: objectType(value)
        };
        callback(elInfo);
      });
    },
    setValue: (arrSer, elInfo) => {
     // console.log('setting _SACustomArray value for elInfo:', elInfo);
      const array = arrSer._SAvalues;
      array[elInfo.key] = elInfo.value;
    }
  },
  'unknown': {
  },
  "primitive": {
  }
});

module.exports = [serialize, deserialize];