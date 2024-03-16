'use strict';

const isObject = (value) => typeof value === 'object' && value !== null;

// 使用WeakMap存储代理对象
// WeakMap的键是弱引用，不会影响垃圾回收
const reactiveMap = new WeakMap();
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
    return createReactiveObject(data);
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
    return createReactiveObject(data, true);
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
    return createReactiveObject(data, true, false);
}
function shallowReadonly(data) {
    return createReactiveObject(data, true, false);
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
function createReactiveObject(data, isReadonly = false, isShallow = true) {
    // 非对象类型直接返回
    if (!isObject(data)) {
        console.error('请给一个对象');
        return data;
    }
    // 校验是否已有代理对象
    if (reactiveMap.has(data))
        return reactiveMap.get(data);
    // 若目标已经是一个代理对象，则需要返回该对象 待完善
    const proxy = new Proxy(data, {
        set: function (target, value, receiver) {
            console.log(`set: `, value, isReadonly);
            if (isReadonly) {
                throw new Error("该对象是只读无法修改属性");
            }
            return Reflect.set(target, value, receiver);
        },
        get: function (target, key, receiver) {
            console.log(`get: ${key}`);
            const res = Reflect.get(target, key, receiver);
            // 递归处理,为了实现深层次的响应式
            //! 只有调用到了get方法，才会进行递归，并没有将所有的子对象递归。属于优化
            if (isShallow && isObject(res)) {
                console.log('调用递归', isReadonly);
                // !保证返回的对象是一个代理对象
                // !否则在第一次进行set操作的时候，会导致无法监听到set的操作
                return isReadonly ? readonly(res) : reactive(res);
            }
            return res;
        }
    });
    reactiveMap.set(data, proxy);
    return proxy;
}

exports.reactive = reactive;
exports.readonly = readonly;
exports.shallowReactive = shallowReactive;
exports.shallowReadonly = shallowReadonly;
//# sourceMappingURL=reactivity.cjs.js.map
