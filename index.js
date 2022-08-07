// serialize-all - serialize and de-serialize all JavaScript data types

const deepCopy = require('deep-copy-all');

const defaultOptions = {
  maxDepth: 20,
  pretty: false
};

// get named object constructor, if it exists in global scope
function namedConstructor(name) {
  let constructor = (typeof global !== 'undefined' && global[name])
    || (typeof window !== 'undefined' && window[name])
    || (typeof WorkerGlobalScope !== 'undefined' && WorkerGlobalScope[name]);
  if (typeof constructor !== 'function') { constructor = null; }
  return constructor;
}

// serialize one element of an object
function serializeElement(elInfo, data) {
  const elType = elInfo.type;
  const elBehaviors = objectBehaviors[elType];
  const elSerialize = elBehaviors.serialize;
  const elIterate = elBehaviors.iterate;
  const elStartValue = elInfo.value;
  const str = "    ".repeat(data.path.length);
  // data elements can change when serializing children - save a copy now
  const objType = data.objType;
  const obj = data.obj; 
  const objSetChild = data.objSetChild;

  // console.log(str + `  ${objType} > ${elInfo.key}{${elType}} evaluating...`);
  // console.log(str, 'object is: ', obj);
  if (elIterate) {
    // console.log(str + `    ${objType} > ${elType} going deeper...`);
    data.path.push(elInfo.key);
    elInfo.value = serializeObject(elInfo.value, data.options, data);
    data.path.pop(elInfo.key);
  } else if (elSerialize) {
    // console.log(str + `    ${objType} > ${elInfo.key}{${elType}} serializing...`);
    elInfo.value = elSerialize(elInfo.value, data);
  }
  const elHasChanged = (elInfo.value !== elStartValue);
  if (elHasChanged) {
    // console.log(str +
    //   `    ${objType} > ${elType} updating child in parent...`);
    //   console.log(str, 'again, object is: ', obj);
      objSetChild(obj, elInfo);
    // console.log(str +
    //   `      ${objType} > ${elType} parent is now:`, obj);
  }
}

/**
 * recursively serialize object in-place (depth first) 
 * 
 * @param obj - the object to serialize
 * @param options - options on how to serialize
 * @param options.maxDepth - objects deeper than this, we throw an error
 * @param data - keep track of state
 * @param data.path - path to the object through properties from root
 * @param data.objNum - largest issued sequential guid
*/ 
function serializeObject (obj, options, data) {

  if (!data) throw 'Invalid data passed to serializeObject';

  if (data.path.length > options.maxDepth) {
    throw new Error('Error maximum depth of ' + options.maxDepth + 
      ' exceeded - increase maxDepth? - while attempting to serialize ' + data.path);
  }

  let str = "    ".repeat(data.path.length);

  const objType = objectType(obj, data);

  // console.log(str + `serializeObject enter ${objType}`);

  const objBehaviors = objectBehaviors[objType];
  const objSerialize = objBehaviors.serialize;
  const objIterate = objBehaviors.iterate;
  const objSetChild = objBehaviors.setValue;
  const objCanBeReferenced = ! isPrimitive(obj); // objBehaviors.canBeReferenced;

  if (objCanBeReferenced) {
    data.objToId.set(obj, ++data.objNum);
    obj._SAId = data.objNum;
    // console.log(str + `adding ${obj._SAId} to ${data.path} of type ${objType}`);
    // console.log(str + 'need to iterate ' + Object.keys(obj));
  } else {
    // console.log('cannot be referenced, ' + objType);
  }

  if (objIterate) {
    // console.log(str + `iterating ${objType}`);
    let savedObj = data.obj;
    let savedObjType = data.objType;
    let savedObjSetChild = data.objSetChild;
    data.obj = obj;
    data.objType = objType;
    data.objSetChild = objSetChild;
    objIterate(obj, serializeElement, data);
    data.obj = savedObj; // reset parent 
    data.objType = savedObjType;
    data.objSetChild = savedObjSetChild;
  }
  if (objSerialize) {
    // console.log(str + `  ${objType} serializing in place ...`);
    obj = objSerialize(obj, data);
    // console.log(str + `  ${objType} afer serializing, obj:`,obj);
  }
  return obj;
}

/**
 * serialize the input
 * @param {*} item - the item to serialize
 * @param [options]
 * @param {number} options.maxDepth - maximum object depth
 * @param {boolean} options.pretty - pretty output
 * @return {string}
 */
function serialize (item, options = undefined) {
  // console.log('serialize() item:', item);
  options = options || defaultOptions;
  if (typeof options.maxDepth === 'undefined') {
    options.maxDepth = defaultOptions.maxDepth;
  }
  if (typeof options.pretty === 'undefined') {
    options.pretty = defaultOptions.pretty;
  }

  let iCopy = deepCopy(item);

  // console.log('serialize deepCopy iCopy:',iCopy);

  let data = { // data to pass through recursion
    path: ['root'],     // keep track of what level we're at in object hierarchy
    objNum: 0,          // keep track of number of distinct objects encountered
    objToId: new Map(), // keep track of objNum for each distinct object
    options: options    // make options available to all processing
  };
  iCopy = serializeObject(iCopy, options, data);

  const saWrapper = {
    _Serialize_Any_Encoded: true,
    _SA_Content: iCopy
  };

  try {
    return options.pretty
      ? JSON.stringify(saWrapper, null, 2)
      : JSON.stringify(saWrapper);
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('circular')) {
      analyzeForCircular(saWrapper);
    } else console.log("uknown error from JSON.stringify: " + err);
    throw err;
  }

}

// deserialize children of object
const deserializeChildren = (obj, getCustomObject, data, objBehaviors) => {

  const objIterate = objBehaviors.iterate;
  if (!objIterate) { return; }

  const objSetChild = objBehaviors.setValue;

  objIterate(obj, (elInfo) => {
    const elType = elInfo.type;
    const elBehaviors = objectBehaviors[elType];
    if (!elBehaviors) throw new Error('no behaviors defined for ' + elType);
    const elDeserialize = elBehaviors.deserialize;
    const elIterate = elBehaviors.iterate;
    // debug
    // console.log('deserializing ' + elType);
    if (elIterate) {
      data.path.push[elInfo.key];
      elInfo.value = deserializeObject(elInfo.value, getCustomObject, data);
      data.path.pop();
    } else if (elDeserialize) {
      elInfo.value = elDeserialize(elInfo.value, getCustomObject, data);
    }
    objSetChild(obj, elInfo);
  }, data);
};

// recursively deserialize the object (breadth first)
function deserializeObject (obj, getCustomObject, data) {
  // debug
  let str = '    '; for (let i = 0; i < data.path.length - 1; i++) {str += '  ';}
  // console.log(str + 'deserializeObject obj:', obj);

  let objType = objectType(obj, data);

  // console.log(str + '  deserializeObject object type:', objType);

  let objBehaviors = objectBehaviors[objType];
  const objDeserialize = objBehaviors.deserialize;

  if (objDeserialize) {
    obj = objDeserialize(obj, getCustomObject, data);
    objType = objectType(obj, data);
    // console.log(str + ' object type is now ' + objType + (obj ? ' with props ' + Object.keys(obj) : ''));
    objBehaviors = objectBehaviors[objType];
    if (obj?._SAId) delete obj._SAId;
  }

  deserializeChildren(obj, getCustomObject, data, objBehaviors);

  return obj;
}


/**
 * deserialize data that was created from serialize
 * @param {string} jsonData - the data to deserialize
 * @param {function} [getCustomObject] - `SerAny.customObject`
 * @return {*} - the deserialized object
 */
function deserialize (jsonData, getCustomObject = undefined) {
  // console.log('deserialize item:', jsonData, ', getCustomObject:', getCustomObject);

  let iCopy = JSON.parse(jsonData);

  let data = { // data to pass through recursion
    path: ['root'], // keep track of path down through object/children
    objNum: 0, // keep track of number of distinct objects encountered
    idToObj: new Map() // keep track of obj for each id, in case more references
  };

  // check for our wrapper
  const iCopyType = objectType(iCopy, data);
  if (iCopyType !== 'Object' || !iCopy._Serialize_Any_Encoded) {
    throw 'Error: object was not serialized by serialize-any';
  }

  // strip off our wrapper
  iCopy = iCopy._SA_Content;

  return deserializeObject(iCopy, getCustomObject, data);
}

/**
 * This is for debugging any failures in the class to fully flatten
 *   a datastructure, i.e. if it leaves a circular reference, then why?
 * 
 * We simply breadth-first run through the object, printing property names as we go
 *   and looking for a circular reference.
 * @param {Object} obj 
 */
function analyzeForCircular(obj) {
  let objToId = new Map();
  let data = {objToId: objToId};

  console.log('analyzing object of type ' + obj.constructor.name + " with keys " + Object.keys(obj));

  function analyzeForCircularRecurse(obj, data, path) {
    let objType = objectType(obj, data);
    let behaviors = objectBehaviors[objType];
    console.log(path + '{' +
      (typeof obj == 'object' ? (obj?.constructor?.name ? obj.constructor.name : 'Object')
        : typeof obj) + '}' +
        (obj?._SAId ? '[' + obj._SAId + ']' : ''));
    if (obj instanceof Object) {      
      if (objToId.has(obj)) {
        console.log('DUPLICATE of object ' + obj._SAId + ' at ' + objToId.get(obj));
        return;
      }
      objToId.set(obj, path);
    }
    if (behaviors.iterate) {
      behaviors.iterate(obj, (elInfo, data) => {
        analyzeForCircularRecurse(elInfo.value, data, [...path, elInfo.key]);
      }, data);
    }
  }
  analyzeForCircularRecurse(obj, data, ['root'] /* path */);
}

// return true if the item is a primitive data type
const isPrimitive = (item) => {
  let type = typeof item;
  return type === 'number' || type === 'string' || type === 'boolean'
    || type === 'symbol' || item === null || item === undefined;
};

/**
 * Gets the type of an object for purposes of serializing and deserializing
 * @param {*} obj - obj to identify type
 * @param {*} data - extra data needed for identification
 * @param {Map} data.objToId - if already seen this obj -> type is reference
 * @returns {String} the type name:
 *   'primitive', 'undef', 'BigInt', '_SACustom*', '*_Serialized',
 *   '_SAObjectRef', <known constructor name, e.g. Array, Function, Date, ...>,
 *   'CustomArray', 'CustomObject', 'Object'
 */
const objectType = (obj, data) => {

  // console.log('        objectType() obj:',obj);

  let type = null;
  const consName = obj?.constructor?.name;

  // force undefined to a serializable type
  // because JSON.stringify strips out properties set to undefined
  if (typeof obj === 'undefined') type = 'undef';

  // match primitives right away
  else if (isPrimitive(obj) || !obj instanceof Object) type = 'primitive';

  // force BigInt to a serializable type
  // because JSON.stringify throws error on BigInt
  else if (typeof obj === 'bigint') type = 'BigInt';

  // return type of custom serialized objects
  else if (obj._SAType && obj._SAType.includes('_SACustom')) type = obj._SAType;

  // return type of serialized regular objects
  else if (typeof obj._SAType !== 'undefined') type = obj._SAType + '_Serialized';

  // is this a reference to an object we've already seen?
  else if (data.objToId?.has(obj)) type = '_SAObjectRef';

  // try to match object constructor name
  else if (typeof consName === 'string' && consName.length
    && objectBehaviors[consName])
    type = consName;

  // identify custom array
  else if (obj instanceof Array && consName !== 'Array') type = 'CustomArray';

  // identify custom object
  else if (obj instanceof Object && consName !== 'Object') type = 'CustomObject';

  // identify as vanilla Array
  else if (obj instanceof Array) type = 'CustomObject';

  // final choice is vanilla Object
  else type = 'Object';

  // console.log('          objectType for obj: ', obj, ' is "', type, '"');
  return type;
};

/**
 * define object behaviors
 */

const arrayIterate = (array, callback, data) => {
  const len = array.length;
  for (let i = 0; i < len; i++) {
    const val = array[i];
    const elInfo = {
      key: i,
      value: val,
      type: objectType(val, data)
    };
    callback(elInfo, data);
  }
};

/**
 * Define behaviors for each javascript type we know about
 * type: the object's native type, e.g. Array, Date, etc.
 * serialize: (src, data) => { return String; }
 *    data: passed through to help serialize or deserialize
 *          should include objToId / idToObj Map, respectively
 * deserialize: (String, data) => { return instantiated type (reverse of serialize) }
 * iterate: (obj, cb, data)
 *    obj - the object being iterated
 *    cb - (elInfo, data) - what to do with the iterated field
 *       elInfo - {key: name of the element, value: its value}
 *       data - see above
 *    data - see above
 * setValue: (obj, elInfo) - set a new iterable field
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
    iterate: arrayIterate,
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
    serialize: () => {
      return {
        _SAType: 'undef'
      }
    },
  },
  'undef_Serialized': {
    deserialize: () => {
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
        let vals = [];
        src.forEach(bigint => vals.push(bigint.toString()));
        return {
          _SAType: "BigInt64Array",
          _SAvalues: vals
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
        src.forEach(num => values.push(num.toString()));
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
      iterate: (map, callback, data) => {
        map.forEach((val, key) => {
          const elInfo = {
            key: key,
            value: val,
            type: objectType(val, data)
          };
          callback(elInfo, data);
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
      iterate: (set, callback, data) => {
        set.forEach((val) => {
          const elInfo = {
            key: null,
            value: val,
            originalValue: val,
            type: objectType(val, data)
          };
          callback(elInfo, data);
        });
      },
      setValue: (set, elInfo) => {
        // delete current value, then add new value - only do this if the new value != old value
        // delete/add while iterating set can cause infinite loop
        if (elInfo.originalValue != elInfo.value) {
          set.delete(elInfo.originalValue);
          set.add(elInfo.value);
          elInfo.originalValue = elInfo.value;
        }
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

// Error
if (typeof Error !== 'undefined') {
  Object.assign(objectBehaviors, {
    "Error" : {
      type: Error,
      serialize: (err) => {
        return {
          _SAType: "Error",
          _SAmessage: err.message,
          _SAstack: err.stack,
          _SAcause: err.cause
        }
      }
    },
    "Error_Serialized": {
      deserialize: (srcSer) => {
        const newErr = Error(srcSer._SAmessage);
        newErr.stack = srcSer._SAstack;
        newErr.cause = srcSer._SAcause;
        return newErr;
      }
    }
  });
}

const objectIterate = (obj, callback, data) => {
  const keys = Object.keys(obj);
  const len = keys.length;
  for (let i = 0; i < len; i++) {
    const key = keys[i];
    const value = obj[key];
    const elInfo = {
      key: key,
      value: value,
      type: objectType(value, data),
    };
    callback(elInfo, data);
  }
};

// Object, primitive, unknown
Object.assign(objectBehaviors, {
  'CustomArray': {
    serialize: (src) => {
      return {
        _SAType: '_SACustomArray',
        _SAconstructorName: src.constructor.name,
        _SAvalues: Array.from(src)
      };
    },
    iterate: arrayIterate,
    setValue: (array, elInfo) => {
      // console.log('setting custom array value for elInfo:',elInfo);
      array[elInfo.key] = elInfo.value;
    }
  },

  "CustomObject": {
    serialize: (obj, data) => {
      return {
        _SAType: "_SACustomObject",
        _SAconstructorName: obj.constructor.name,
        _SAobject: Object.assign({},obj)
      }
    },
    iterate: objectIterate,
    setValue: (obj, elInfo) => {
      // console.log('setting CustomObject value for elInfo:',elInfo);
      obj[elInfo.key] = elInfo.value;
    }
  },
  "Object": {
    type: Object,
    iterate: objectIterate,
    setValue: (obj, elInfo) => {
      // console.log('            setting Object value for elInfo:',elInfo);
      obj[elInfo.key] = elInfo.value;
    },
    deserialize: (srcSer, getCustomObject, data) => {
      data.idToObj.set(srcSer._SAId, srcSer);
      return srcSer;
    }
  },
  "_SAObjectRef": {
    // An additional reference to an object that we've seen before
    serialize: (obj, data) => {
      return {
        _SAType: "_SAObjectRef",
        _SAId: data.objToId.get(obj)
      }
    }
  },
  "_SAObjectRef_Serialized": {
    deserialize: (srcSer, getCustomObject, data) => {
      return data.idToObj.get(srcSer._SAId);
    }
  },
  "_SACustomObject": {
    // any object with a custom constructor name
    iterate: objectIterate,
    deserialize: (srcSer, getCustomObject, data) => {
      //console.log("deserializing...");
      const cName = srcSer._SAconstructorName;
      const srcObj = srcSer._SAobject;
      // const cNameDefined = eval('typeof ' + cName + ' !== "undefined"');
      const cConstructor = namedConstructor(cName);
      let cObj;
      if (cConstructor) {
        cObj = new cConstructor();
      } else {
        if (!getCustomObject) {
          throw 'Error: deserialize _SACustomObject - getCustomObject missing';
        }
        cObj = getCustomObject(cName);
        // console.log('got custom object ' + cObj);
      }
      if (!cObj) {
        throw new Error('unable to deserialize - "' + cName + '" undefined');
      }
      data.idToObj.set(srcObj._SAId, cObj);
      Object.assign(cObj, srcObj);
      delete cObj._SAId;
      return cObj;
    }
  },
  "_SACustomArray": {
    // any array with a custom constructor name
    deserialize: (srcSer, getCustomObject) => {
      const cName = srcSer._SAconstructorName;
      // const cNameDefined = eval('typeof ' + cName + ' !== "undefined"');
      let values = srcSer._SAvalues;
      const cConstructor = namedConstructor(cName);
      let array;
      if (cConstructor) {
        array = new cConstructor(cName);
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
