const isObject = (value) => typeof value === 'object' && value !== null;
const isArray = Array.isArray;
const isString = (val) => typeof val === 'string';
const isSymbol = (val) => typeof val === 'symbol';
const isIntegerKey = (key) => isString(key) && key[0] != '_' && parseInt(key, 10) + '' === key;
const hasOwn = (target, key) => target.hasOwnProperty(key);

export { hasOwn, isArray, isIntegerKey, isObject, isString, isSymbol };
//# sourceMappingURL=shared.esm-bundler.js.map
