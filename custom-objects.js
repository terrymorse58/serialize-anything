/**
 * serialize-any callback function to support custom objects
 *
 * `SerAny.deserialize()` will call this whenever it enounters
 * an object type it does not recognize
 *
 */

/**
 * copy the code below and paste it into a JavaScript file where:
 * - SerAny has been loaded
 * = the custom object type(s) are vsible
 */

// copied from `custom-objects.js` to handle custom objects
SerAny._custom = function (name) {
  let typeExists = eval('typeof ' + name + '!== "undefined"' );
  return typeExists ? eval('new ' + name + '()') : null;
};
SerAny._ds = SerAny.deserialize;
SerAny.deserialize = source => SerAny._ds(source, SerAny._custom);
