"use strict";

function parseDate(str) {
    return new Date(str);
}

function convertToBoolean(str) {
  str = str.toLowerCase();
  switch (str) {
      case "true":
      case "t":
      case "yes":
      case "y":
      case "1":
        return true;
      default:
        return false;
  }
}

function extend(a) {
    Array.prototype.slice.call(arguments, 1).forEach(function(b) {
        for ( var i in b ) {
            a[i] = b[i];
        }
    });
    return a;
}

/**
 * Recognizes regexps as NOT objects.
 */
function isObject(el) {
    return Object.prototype.toString.call(el) === "[object Object]";
}

function noop() {}

function prop(path) {
    var parts = path.split(".");

    return function(obj) {
        var p, rest_of_path = parts.slice();
        while ((p = rest_of_path.shift()))
            obj = obj[path];
        return obj;
    };
}

function getPathToThisPoint(path_parts, rest_of_path) {
    return path_parts.slice(0, path_parts.length-rest_of_path.length).join(".");
}

function getId(obj) {
    return obj._id;
}

/**
* Returns the type of the referred type ( truthy ) if reference, false otherwise.
*/
function isReference(schema) {
    var refd_type;
    // simple reference
    if ((refd_type = schema.options.ref)) return refd_type;
    // array of references
    if ((refd_type = schema.options.type && schema.options.type[0] && schema.options.type[0].ref)) return refd_type;
    return false;
}

function isArray(Types, schema) {
    if ( schema.constructor === Types.Array || schema.constructor === Types.DocumentArray )
        return true;
    else
        return false;
}

module.exports.parseDate = parseDate;
module.exports.convertToBoolean = convertToBoolean;
module.exports.extend = extend;
module.exports.isObject = isObject;
module.exports.noop = noop;
module.exports.prop = prop;
module.exports.getPathToThisPoint = getPathToThisPoint;
module.exports.getId = getId;
module.exports.isReference = isReference;
module.exports.isArray = isArray;
