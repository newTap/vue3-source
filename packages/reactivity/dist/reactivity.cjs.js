'use strict';

const isObject = (value) => typeof value === 'object' && value !== null;

let uid = 0;
// 用于记录当前正在执行的副作用函数
let activeEffect;
// 用户基于当前正在执行的副作用函数队列
// !如果不适用队列形式存储，会导致effect嵌套时，activeEffect无法被正确获取
// effect(function () {
//   let name = proxy.name
//   effect(function () {
//     let name = proxy.name
//   })
//   let list = proxy.list
// })
let activeEffectPool = [];
// 副作用函数的触发
function effect(fn, options) {
    console.log('触发依赖');
    const effectFn = function reactiveEffect() {
        // 防止effect函数的的报错，对代码逻辑的影响
        try {
            activeEffect = fn;
            activeEffectPool.push(activeEffect);
            fn();
        }
        finally {
            activeEffectPool.pop();
            activeEffect = activeEffectPool[activeEffectPool.length - 1];
        }
    };
    effectFn.fn = fn; // 保存用户的原方法
    effectFn.options = options; // 保存用户的原配置
    effectFn.id = uid++; // effect 的ID
    effectFn._isEffect = true; // 标记是否为 effect
    if (!options?.lazy)
        fn();
    return effectFn;
}
// 用于存储依赖的集合
const targetActiveMap = new WeakMap();
// 依赖的收集
function track(target, key, type) {
    console.log('开始收集依赖');
    // 只有在副作用函数调用期间才做依赖的收集
    if (!activeEffectPool.length)
        return false;
    // 依赖集合的数据结构，第一层使用WeakMap，利用它的弱引用
    // target作为key值，依赖集合作为value值
    let targetMap = targetActiveMap.get(target);
    if (!targetMap)
        targetActiveMap.set(target, (targetMap = new Map()));
    // 第二层使用Map数据结构
    // key作为key值，依赖集合作为value值
    let dep = targetMap.get(key);
    // 第三层使用Set数据结构,当相同数据添加值set中会做自动去重操作
    // 用于存放对应的副作用函数
    if (!dep)
        targetMap.set(key, (dep = new Set()));
    // 为对应的key添加副作用函数
    dep.add(activeEffectPool[activeEffectPool.length - 1]);
}

var TrackOpTypes;
(function (TrackOpTypes) {
    TrackOpTypes["GET"] = "get";
    TrackOpTypes["HAS"] = "has";
})(TrackOpTypes || (TrackOpTypes = {}));

const get = createGetter();
const readonlyGet = createGetter(true);
const shallowReactiveGet = createGetter(false, true);
const shallowReadonlyGet = createGetter(true, true);
const set = createSetter();
const shallowSet = createSetter(true);
const reactiveHandler = {
    get,
    set
};
const readonlyHandler = {
    get: readonlyGet,
    set: function () {
        console.error('只读无法修改');
        return false;
    }
};
const shallowReactiveHandler = {
    get: shallowReactiveGet,
    set: shallowSet
};
const shallowReadonlyHandler = {
    get: shallowReadonlyGet,
    set: function () {
        console.error('只读无法修改');
        return false;
    }
};
function createGetter(isReadonly = false, isShallow = false) {
    return function get(target, key, receiver) {
        console.log(`get: ${key}`);
        const res = Reflect.get(target, key, receiver);
        // 收集 effect
        if (!isReadonly) {
            console.log('收集 effect');
            track(target, key, TrackOpTypes.GET);
        }
        // 递归处理,为了实现深层次的响应式
        //! 只有调用到了get方法，才会进行递归，并没有将所有的子对象递归。属于优化
        if (!isShallow && isObject(res)) {
            console.log('调用递归', res);
            // !保证返回的对象是一个代理对象
            // !否则在第一次进行set操作的时候，会导致无法监听到set的操作
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createSetter(isShallow = false) {
    return function set(target, value, receiver) {
        console.log(`set: `, value);
        let ref = Reflect.set(target, value, receiver);
        // 执行 effect
        // 注意要区分  数组  与    对象
        // 注意区分 添加   与    修改
        return ref;
    };
}

// 使用WeakMap存储代理对象
// WeakMap的键是弱引用，不会影响垃圾回收
const reactiveMap = new WeakMap();
const readonlyMap = new WeakMap();
/**
 * reactive
 *
 * [export description]
 *
 * 响应式转换是"成层"的: 他会影响到所有嵌套的属性。
 *
 * "深层"次的响应代理
 *
 * @param   {T}          data  [需要代理的对象]
 *
 * @return  {<T><data>}        [返回一个对象的响应式代理。]
 */
function reactive(data) {
    return createReactiveObject(data, false, false, reactiveHandler);
}
/**
 * [export description]
 *
 * 只读代理是深层的：对任何嵌套属性的访问都将是只读的
 *
 * "深层"次的响应代理，只读
 *
 * @param   {T}          data  [接受一个对象 (不论是响应式还是普通的) 或是一个 ref，]
 *
 * @return  {<T><data>}        [return 返回一个原值的只读代理]
 */
function readonly(data) {
    return createReactiveObject(data, true, false, readonlyHandler);
}
/**
 * [export description]
 *
 * reactive() 的浅层作用形式。
 * 这里没有深层级的转换：一个浅层响应式对象里只有根级别的属性是响应式的。属性的值会被原样存储和暴露
 *
 * "浅层"次的响应代理
 *
 * @param   {T}          data  [data 需要代理的对象]
 *
 * @return  {<T><data>}        [return 一个没有深度代理的响应对象]
 */
function shallowReactive(data) {
    return createReactiveObject(data, true, false, shallowReactiveHandler);
}
function shallowReadonly(data) {
    return createReactiveObject(data, true, false, shallowReadonlyHandler);
}
/**
 * [createReactiveObject description]
 *
 * @param   {T}  data        [监听的数据对象]
 * @param   {[type]}isReadonly  [是否只读]
 * @param   {[type]}isShallow   [是否深层代理]
 *
 * @return  {T}              [return 数据的代理对象]
 */
function createReactiveObject(data, isReadonly = false, isShallow = true, handlers) {
    // 非对象类型直接返回
    if (!isObject(data)) {
        console.error('请给一个对象');
        return data;
    }
    const proxyMap = isReadonly ? readonlyMap : reactiveMap;
    // 校验是否已有代理对象
    if (proxyMap.has(data))
        return proxyMap.get(data);
    // 若目标已经是一个代理对象，则需要返回该对象 待完善
    const proxy = new Proxy(data, handlers);
    proxyMap.set(data, proxy);
    return proxy;
}

exports.effect = effect;
exports.reactive = reactive;
exports.readonly = readonly;
exports.shallowReactive = shallowReactive;
exports.shallowReadonly = shallowReadonly;
//# sourceMappingURL=reactivity.cjs.js.map
