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

SerAny.customObject = function (name) {
  let typeExists = eval('typeof ' + name + '!== "undefined"' );
  return typeExists ? eval('new ' + name + '()') : null;
};
