(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.SerAny = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

// recursively serialize object in-place (depth first)
function serializeObject (obj, options, depth) {

  if (++depth > options.maxDepth) {
    throw 'Error maximum depth exceeded - possible circular reference';
  }

  let str = "    ";
  for (let i=0; i<depth; i++) {
    str += '  ';
  }

  const objType = objectType(obj);

  //console.log(str + `serializeObject enter ${objType}`);

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
      const elStartValue = elInfo.value;
      // console.log(str + `  ${objType} > ${elType} evaluating...`);
      if (elIterate) {
        // console.log(str + `    ${objType} > ${elType} going deeper...`);
        elInfo.value = serializeObject(elInfo.value, options, depth);
      } else if (elSerialize) {
        // console.log(str + `    ${objType} > ${elType} serializing...`);
        elInfo.value = elSerialize(elInfo.value);
      }
      const elHasChanged = (elInfo.value !== elStartValue);
      if (elHasChanged) {
        // console.log(str +
        //   `    ${objType} > ${elType} updating child in parent...`);
        objSetChild(obj, elInfo);
        // console.log(str +
        //   `      ${objType} > ${elType} parent is now:`, obj);
      }
    });
  }
  if (objSerialize) {
    // console.log(str + `  ${objType} serializing in place ...`);
    obj = objSerialize(obj);
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

  iCopy = serializeObject(iCopy, options, 0);

  const saWrapper = {
    _Serialize_Any_Encoded: true,
    _SA_Content: iCopy
  };

  return options.pretty
    ? JSON.stringify(saWrapper, null, 2)
    : JSON.stringify(saWrapper);

}

// deserialize children of object
const deserializeChildren = (obj, getCustomObject, depth, objBehaviors) => {

  const objIterate = objBehaviors.iterate;
  if (!objIterate) { return; }

  const objSetChild = objBehaviors.setValue;

  objIterate(obj, (elInfo) => {
    const elType = elInfo.type;
    const elBehaviors = objectBehaviors[elType];
    const elDeserialize = elBehaviors.deserialize;
    const elIterate = elBehaviors.iterate;
    if (elIterate) {
      elInfo.value = deserializeObject(elInfo.value, getCustomObject, depth);
    } else if (elDeserialize) {
      elInfo.value = elDeserialize(elInfo.value, getCustomObject);
      objSetChild(obj, elInfo);
    }
  });
};

// recursively deserialize the object (breadth first)
function deserializeObject (obj, getCustomObject, depth) {
  depth++;

  // debug
  // let str = '    '; for (let i = 0; i < depth; i++) {str += '  ';}
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

  deserializeChildren(obj, getCustomObject, depth, objBehaviors);

  return obj;
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
}

// return true if the item is a primitive data type
const isPrimitive = (item) => {
  let type = typeof item;
  return type === 'number' || type === 'string' || type === 'boolean'
    || type === 'symbol' || item === null;
};


const objectType = (obj) => {

  // console.log('        objectType() obj:',obj);

  let type = null;
  const consName = obj && obj.constructor && obj.constructor.name;

  // match primitives right away
  if (isPrimitive(obj) || !obj instanceof Object) {
    type = 'primitive';
  }

  // force undefined to a serializable type
  // because JSON.stringify strips out properties set to undefined
  else if (typeof obj === 'undefined') {
    type = 'undef';
  }

  // force BigInt to a serializable type
  // because JSON.stringify throws error on BigInt
  else if (typeof obj === 'bigint') {
    type = 'BigInt';
  }

  // return type of custom serialized objects
  else if (obj._SAType && obj._SAType.includes('_SACustom')) {
    type = obj._SAType;
  }

  // return type of serialized regular objects
  else if (typeof obj._SAType !== 'undefined') {
    type = obj._SAType + '_Serialized';
  }

  // try to match object constructor name
  else if (typeof consName === 'string' && consName.length
    && objectBehaviors[consName]) {
    type = consName;
  }

  // identify custom array
  else if (obj instanceof Array && consName !== 'Array') {
      type = 'CustomArray';
  }

  // identify custom object
  else if (obj instanceof Object && consName !== 'Object') {
    type = 'CustomObject';
  }

  // identify as vanilla Array
  else if (obj instanceof Array) {
    type = 'CustomObject';
  }

  // final choice is vanilla Object
  else {
    type = 'Object';
  }

  // console.log('          objectType for obj: ', obj, ' is "', type, '"');
  return type;
};

/**
 * define object behaviors
 */

const arrayIterate = (array, callback) => {
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
};

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

// Error
if (typeof Error !== 'undefined') {
  Object.assign(objectBehaviors, {
    "Error" : {
      type: Error,
      serialize: (err) => {
        return {
          _SAType: "Error",
          _SAmessage: err.message,
          _SAstack: err.stack
        }
      }
    },
    "Error_Serialized": {
      deserialize: (srcSer) => {
        const newErr = Error(srcSer._SAmessage);
        newErr.stack = srcSer._SAstack;
        return newErr;
      }
    }
  });
}

const objectIterate = (obj, callback) => {
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
    serialize: (obj) => {
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
    }
  },
  "_SACustomObject": {
    // any object with a custom constructor name
    deserialize: (srcSer, getCustomObject) => {
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

},{"deep-copy-all":2}],2:[function(require,module,exports){
"use strict";const[isPrimitive,objectType,objectActions]=require("./object-library.js"),defaultOpts={goDeep:!0,includeNonEnumerable:!1,detectCircular:!0,maxDepth:20};function setMissingOptions(e){Object.keys(defaultOpts).forEach(t=>{void 0===e[t]&&(e[t]=defaultOpts[t])})}class Watcher{constructor(){this._seenMap=new WeakMap}setAsCopied(e,t){e instanceof Object&&this._seenMap.set(e,t)}wasCopied(e){return e instanceof Object&&this._seenMap.has(e)}getCopy(e){return this._seenMap.get(e)}}function copyElement(e,t,c){const{options:o,watcher:s}=c;let n;return t.mayDeepCopy?(n=t.makeEmpty(e),o.detectCircular&&s.setAsCopied(e,n)):n=t.makeShallow(e),n}function checkForExceededDepth(e,t){if(e>=t)throw`Error max depth of ${t} levels exceeded, possible circular reference`}const copyObjectContents=(e,t,c)=>{const{destObject:o,srcType:s,watcher:n,options:r}=t,p=r.detectCircular;checkForExceededDepth(++c,r.maxDepth);const i=objectActions(s);if(!i.mayDeepCopy)return;const a=i.addElement;i.iterate(e,r.includeNonEnumerable,e=>{const t=e.value,s=e.type,i=objectActions(s);let d,l=!1;p&&n.wasCopied(t)?(d=n.getCopy(t),l=!0):d=copyElement(t,i,{options:r,watcher:n}),a(o,e.key,d,e.descriptor),i.mayDeepCopy&&!l&&copyObjectContents(t,{destObject:d,srcType:s,watcher:n,options:r},c)})};function deepCopy(e,t=defaultOpts){if(setMissingOptions(t),isPrimitive(e))return e;const c=objectType(e),o=objectActions(c);if(!t.goDeep||!o.mayDeepCopy)return o.makeShallow(e);const s=t.detectCircular?new Watcher:null;let n=o.makeEmpty(e);return t.detectCircular&&s.setAsCopied(e,n),copyObjectContents(e,{destObject:n,srcType:c,watcher:s,options:t},0),n}module.exports=deepCopy;
},{"./object-library.js":3}],3:[function(require,module,exports){
// object library - specific behaviors for each object type

const objectBehaviors = {};

// return true if item is a primitive data type
const isPrimitive = (item) => {
  let type = typeof item;
  return type === 'number' || type === 'string' || type === 'boolean'
    || type === 'undefined' || type === 'bigint' || type === 'symbol'
    || item === null;
};

// establish a "type" keyword for an object
const objectType = (obj) => {

  // match primitives right away
  if (isPrimitive(obj) || !(obj instanceof Object)) {
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
};

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

const arrayAddElement = (array, key, value) =>
  Array.prototype.push.call(array, value);

const arrayMakeEmpty = source => {
  const newArray = [];
  Object.setPrototypeOf(newArray, Object.getPrototypeOf(source));
  return newArray;
};

const arrayMakeShallow = source => {
  const dest = [...source];
  Object.setPrototypeOf(dest, Object.getPrototypeOf(source));
  return dest;
};

const arrayIterate = (array, copyNonEnumerables, callback) => {
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
};

const addArrayBehavior = () => {
  Object.assign(objectBehaviors, {
    'array': {
      type: Array,
      mayDeepCopy: true,
      addElement: arrayAddElement,
      makeEmpty: arrayMakeEmpty,
      makeShallow: arrayMakeShallow,
      iterate: arrayIterate
    }
  });
};

const addDateBehavior = () => {
  Object.assign(objectBehaviors, {
    'date': {
      type: Date,
      makeShallow: date => new Date(date.getTime()),
    }
  });
};

const addRegExpBehavior = () => {
  Object.assign(objectBehaviors, {
    'regexp': {
      type: RegExp,
      makeShallow: src => new RegExp(src),
    }
  });
};

const addFunctionBehavior = () => {
  Object.assign(objectBehaviors, {
    'function': {
      type: Function,
      makeShallow: fn => fn,
    }
  });
};

const addErrorBehavior = () => {
  Object.assign(objectBehaviors, {
    'error': {
      type: Error,
      makeShallow: err => {
        const errCopy = new Error(err.message);
        errCopy.stack = err.stack;
        return errCopy;
      }
    }
  });
};

// in case they don't exist, perform existence checks on these
// types before adding them

// add a named TypedArray to objectBehaviors
const addTypedArrayBehavior = (name) => {
  let type = (typeof global !== 'undefined' && global[name])
    || (typeof window !== 'undefined' && window[name])
    || (typeof WorkerGlobalScope !== 'undefined' && WorkerGlobalScope[name]);
  if (typeof type !== 'undefined') {
    objectBehaviors[name.toLowerCase()] = {
      type,
      makeShallow: source => type.from(source)
    };
  }
};

const addAllTypedArrayBehaviors = () => {
  const typedArrayNames = [
    'Int8Array', 'Uint8Array', 'Uint8ClampedArray', 'Int16Array',
    'Uint16Array', 'Int32Array', 'Uint32Array', 'Float32Array',
    'Float32Array', 'Float64Array', 'BigInt64Array', 'BigUint64Array'
  ];
  typedArrayNames.forEach(name => addTypedArrayBehavior(name));
};

const addArrayBufferBehavior = () => {
  if (typeof ArrayBuffer !== 'undefined') {
    Object.assign(objectBehaviors, {
      'arraybuffer': {
        type: ArrayBuffer,
        makeShallow: buffer => buffer.slice(0)
      }
    });
  }
};

const addMapBehavior = () => {
  if (typeof Map === 'undefined') { return; }
  Object.assign(objectBehaviors, {
    'map': {
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
          };
          callback(elInfo);
        });
      }
    }
  });
};

const addSetBehavior = () => {
  if (typeof Set === 'undefined') { return; }
  Object.assign(objectBehaviors, {
    'set': {
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
          };
          callback(elInfo);
        });
      }
    }
  });
};

const addWeakSetBehavior = () => {
  if (typeof WeakSet === 'undefined') { return; }
  Object.assign(objectBehaviors, {
    'weakset': {
      type: WeakSet,
      makeShallow: wset => wset
    }
  });
};

const addWeakMapBehavior = () => {
  if (typeof WeakMap === 'undefined') { return; }
  Object.assign(objectBehaviors, {
    'weakmap': {
      type: WeakMap,
      makeShallow: wmap => wmap
    }
  });
};

// node.js Buffer
const addBufferBehavior = () => {
  if (typeof Buffer === 'undefined') { return; }
  Object.assign(objectBehaviors, {
    'buffer': {
      type: Buffer,
      makeShallow: buf => Buffer.from(buf)
    }
  });
};

// always include Object, primitive, unknown
const objectAddElement = (obj, key, value, descriptor = undefined) => {
  if (!descriptor) {
    obj[key] = value;
  } else {
    Object.defineProperty(obj, key, descriptor);
  }
};

const objectMakeEmpty = source => {
  const newObj = {};
  Object.setPrototypeOf(newObj, Object.getPrototypeOf(source));
  return newObj;
};

const objectMakeShallow = source => {
  const dest = Object.assign({}, source);
  Object.setPrototypeOf(dest, Object.getPrototypeOf(source));
  return dest;
};

const objectIterate = (obj, copyNonEnumerables, callback) => {
  const keys = copyNonEnumerables ?
    Object.getOwnPropertyNames(obj) : Object.keys(obj);
  const len = keys.length;
  for (let i = 0; i < len; i++) {
    const key = keys[i], value = obj[key], elInfo = {
      key, value, type: objectType(value)
    };
    if (copyNonEnumerables && !obj.propertyIsEnumerable(key)) {
      elInfo.descriptor = Object.getOwnPropertyDescriptor(obj, key);
    }
    callback(elInfo);
  }
};

const addObjectBehavior = () => {
  Object.assign(objectBehaviors, {
    'object': {
      type: Object,
      mayDeepCopy: true,
      addElement: objectAddElement,
      makeEmpty: objectMakeEmpty,
      makeShallow: objectMakeShallow,
      iterate: objectIterate
    }
  });
};

const addUnknownAndPrimitive = () => {
  Object.assign(objectBehaviors, {
    'unknown': {
      makeShallow: source => source
    },
    'primitive': {
      makeShallow: source => source
    }
  });
};

addArrayBehavior();
addDateBehavior();
addRegExpBehavior();
addFunctionBehavior();
addErrorBehavior();
addAllTypedArrayBehaviors();
addArrayBufferBehavior();
addMapBehavior();
addSetBehavior();
addWeakSetBehavior();
addWeakMapBehavior();
addBufferBehavior();
addObjectBehavior();
addUnknownAndPrimitive();

/**
 * object actions as defined in objectBehaviors { }
 * @typedef {Object} ObjectActions
 * @property {Boolean} mayDeepCopy
 * @property {Function} addElement
 * @property {Function} makeEmpty
 * @property {Function} makeShallow
 * @property {Function} iterate
 */
/**
 * return object actions for the named typed
 * @param {string} typeName
 * @return {ObjectActions}
 */
function objectActions(typeName) {
  return objectBehaviors[typeName];
}

module.exports = [
  isPrimitive,
  objectType,
  objectActions
];

},{}]},{},[1])(1)
});
