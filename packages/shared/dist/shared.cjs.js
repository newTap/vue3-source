'use strict';

const isObject = (value) => typeof value === 'object' && value !== null;
const isArray = Array.isArray;
const isString = (val) => typeof val === 'string';
const isSymbol = (val) => typeof val === 'symbol';
const isIntegerKey = (key) => isString(key) && key[0] != '_' && parseInt(key, 10) + '' === key;
const hasOwn = (target, key) => target.hasOwnProperty(key);

exports.hasOwn = hasOwn;
exports.isArray = isArray;
exports.isIntegerKey = isIntegerKey;
exports.isObject = isObject;
exports.isString = isString;
exports.isSymbol = isSymbol;
//# sourceMappingURL=shared.cjs.js.map
