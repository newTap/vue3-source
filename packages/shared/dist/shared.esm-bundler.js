const isObject = (value) => typeof value === 'object' && value !== null;
const isArray = Array.isArray;
const isString = (val) => typeof val === 'string';
const isSymbol = (val) => typeof val === 'symbol';
const isObj = (val) => (!!val) && (typeof val === 'object');
const isIntegerKey = (key) => isString(key) && key[0] != '_' && parseInt(key, 10) + '' === key;
const hasOwn = (target, key) => target.hasOwnProperty(key);
const hasChange = (value, oldValue) => value !== oldValue;
const isRef = (val) => !!val.__v_isRef;

export { hasChange, hasOwn, isArray, isIntegerKey, isObj, isObject, isRef, isString, isSymbol };
//# sourceMappingURL=shared.esm-bundler.js.map
