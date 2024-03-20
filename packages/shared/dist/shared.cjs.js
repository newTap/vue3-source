'use strict';

const isObject = (value) => typeof value === 'object' && value !== null;
const isFunction = (value) => typeof value === 'function';
const isArray = Array.isArray;
const isString = (val) => typeof val === 'string';
const isSymbol = (val) => typeof val === 'symbol';
const isObj = (val) => (!!val) && (typeof val === 'object');
const isIntegerKey = (key) => isString(key) && key[0] != '_' && parseInt(key, 10) + '' === key;
const hasOwn = (target, key) => target.hasOwnProperty(key);
const hasChange = (value, oldValue) => value !== oldValue;
const isRef = (val) => !!val.__v_isRef;
const isOn = (val) => RegExp(/on[^a-z]/).test(val);
const ibBoolean = (val) => typeof val === 'boolean';
const getNow = () => Date.now();

exports.getNow = getNow;
exports.hasChange = hasChange;
exports.hasOwn = hasOwn;
exports.ibBoolean = ibBoolean;
exports.isArray = isArray;
exports.isFunction = isFunction;
exports.isIntegerKey = isIntegerKey;
exports.isObj = isObj;
exports.isObject = isObject;
exports.isOn = isOn;
exports.isRef = isRef;
exports.isString = isString;
exports.isSymbol = isSymbol;
//# sourceMappingURL=shared.cjs.js.map
