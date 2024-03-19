const isObject = (value) => typeof value === 'object' && value !== null;
const isArray = Array.isArray;
const isString = (val) => typeof val === 'string';
const isSymbol = (val) => typeof val === 'symbol';
const isObj = (val) => (!!val) && (typeof val === 'object');
const isIntegerKey = (key) => isString(key) && key[0] != '_' && parseInt(key, 10) + '' === key;
const hasOwn = (target, key) => target.hasOwnProperty(key);
const hasChange = (value, oldValue) => value !== oldValue;
const isRef = (val) => !!val.__v_isRef;

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
        effectFn();
    return effectFn;
}
// 用于存储依赖的集合
const targetActiveMap = new WeakMap();
// 依赖的收集
function track(target, key, type) {
    console.log('开始收集依赖');
    // 只有在副作用函数调用期间才做依赖的收集
    if (!activeEffect)
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
    dep.add(activeEffect);
}
// 依赖是触发
function trigger(target, key, type, value, oldValue) {
    let targetMap = targetActiveMap.get(target);
    console.log('targetActiveMap', targetActiveMap, target, key, value);
    // 当前的修改没有依赖
    if (!targetMap) {
        console.log('没有当前的target依赖映射', target);
        return false;
    }
    let deeps = [];
    if (isArray(target) && key === 'length') {
        // 单独对修改数组的length操作做处理
        // !当proxy对象没有代理length属性，却修改了数组的length，会导致没有对应的依赖
        //  effect(function () {
        //   app.innerText = `${proxy.list[2]}`
        // })
        // setTimeout(() => {
        //   proxy.list.length = 1
        // }, 1000)
        // 如果target是数组。并且当前的key是length。value的值大于target的length
        // 证明数组的长度发生了变化(变小了)
        targetMap.forEach((dep, key) => {
            if (key === 'length' || (!isSymbol(key) && Number(key) >= Number(value))) {
                deeps.push(dep);
            }
        });
    }
    else {
        // 可能是对象的操作
        let dep = targetMap.get(key);
        if (dep) {
            deeps.push(dep);
        }
    }
    for (let dep of deeps) {
        if (dep) {
            triggerEffects(dep);
        }
    }
}
function triggerEffects(dep) {
    for (const effect of dep.keys()) {
        effect();
    }
}

var TrackOpTypes;
(function (TrackOpTypes) {
    TrackOpTypes["GET"] = "get";
    TrackOpTypes["HAS"] = "has";
})(TrackOpTypes || (TrackOpTypes = {}));
var TriggerOpTypes;
(function (TriggerOpTypes) {
    TriggerOpTypes["SET"] = "set";
    TriggerOpTypes["ADD"] = "add";
})(TriggerOpTypes || (TriggerOpTypes = {}));

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
        console.log(`get: `, key);
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
    return function set(target, key, value, receiver) {
        console.log(`set: `, key, value, target);
        // !当对数组做操作(删除,或增加)，会先调用对应下标的set操作，然后再调用length的set操作
        // !当对数组做操作时，对应的key会被处理为string类型
        // !当对数组的length直接做操作时，会直接调用length的set操作，无法触发对应下标的set操作
        // 1.先区分属于与对象的操作
        // 2.再区分是修改操作，还是增加操作
        let hasKey = isArray(target) && isIntegerKey(key) ?
            Number(key) < target.length : hasOwn(target, key);
        target[key];
        let ref = Reflect.set(target, key, value, receiver);
        // 执行 effect
        if (hasKey) {
            // 修改操作
            console.log('修改操作');
            trigger(target, key, TriggerOpTypes.SET, value);
        }
        else {
            // 新增操作
            console.log('新增操作');
            trigger(target, key, TriggerOpTypes.ADD, value);
        }
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

/**
 * 接受一个内部值，返回一个响应式的，可更改的ref对象，此对象只有一个指向内部的属性.value
 *
 * 如果将一个对象赋值给 ref，那么这个对象将通过 reactive() 转为具有深层次响应式的对象。
 *
 * @param   {unknown}  target  [target 任意数据]
 *
 * @return  {[type]}           [return 一个ref对象]
 */
function ref(target) {
    return createRef(target);
}
/**
 * 也可以基于响应式对象上的一个属性，创建一个对应的 ref。这样创建的 ref 与其源属性保持同步：改变源属性的值将更新 ref 的值，反之亦然。
 *
 * target 传入单个数据，则直接变成响应式数据对象
 *
 * target 和 key都存在的话，target必须是响应式数据对象
 *
 * const state = reactive({
  *foo: 1,
 * bar: 2
  *})
  *const stateAsRefs = toRefs(state)
  *stateAsRefs 的类型：{
    *foo: Ref<number>,
    *bar: Ref<number>
  *}
 *
 * @param   {unknown}  target  [target 一个代理对象]
 *
 * @return  {[type]}           [return 一个ref对象]
 */
function toRef(target, key) {
    return createToRef(target, key);
}
/**
 * 将一个响应式对象转换为一个普通对象，这个普通对象的每个属性都是指向源对象相应属性的 ref。
 *
 * @param   {unknown}  target  [target description]
 *
 * @return  {[type]}           [return description]
 */
function toRefs(target) {
    // 如果传入的不是一个基础数据类型，则警告
    // 如果传入的是一个ref的类型，但是value是一个基础数据类型，则警告
    if (!isObj(target) || (isRef(target) && (!isObj(target.__value)))) {
        console.error("传入的必须是一个对象");
    }
    const map = isArray(target) ? new Array(target.length) : {};
    Object.keys(target).forEach((key) => {
        map[key] = createToRef(target, key);
    });
    return map;
}
function createRef(target) {
    if (isRef(target))
        return target;
    return new RefImpl(target);
}
class RefImpl {
    _value;
    _rawValue;
    __v_isShallow;
    __v_isRef = true;
    constructor(target, isShallow = false) {
        console.log('isObj(target)', isObj(target));
        if (isObj(target)) {
            // 若是对象，则需要通过reactive来收集依赖
            // !若是对象，对其属性修改，将无法触发内部的 setter函数，必须使用reactive来实现数据响应式
            let proxy = reactive(target);
            this._value = proxy;
            this._rawValue = proxy;
        }
        else {
            this._value = target;
            this._rawValue = target;
            // 普通数据类型，直接收集依赖
        }
        this.__v_isShallow = isShallow;
    }
    get value() {
        // 依赖收集
        track(this, 'value', TrackOpTypes.GET);
        return this._value;
    }
    set value(value) {
        if (hasChange(this._value, value)) {
            this._rawValue;
            // 判断新值是否是对象类型
            // 如果是对象类型。则将该对象类型转换为响应式数据
            const newValue = isObj(value) ? reactive(value) : value;
            this._value = newValue;
            this._rawValue = newValue;
            // 触发器
            trigger(this, 'value', TriggerOpTypes.SET, newValue);
        }
    }
}
function createToRef(target, key) {
    if (isRef(target))
        return target;
    else if (isObject(target) && key) {
        return new ObjectRefImpl(target, key);
    }
    else {
        return ref(target);
    }
}
class ObjectRefImpl {
    _target;
    _key;
    __v_isShallow = false;
    __v_isRef = true;
    constructor(_target, _key) {
        this._target = _target;
        this._key = _key;
    }
    get value() {
        // 直接调用target的get，来捕获依赖
        return this._target[this._key];
    }
    set value(value) {
        // 直接调用target的set，来触发依赖
        this._target[this._key] = value;
    }
}

export { effect, reactive, readonly, ref, shallowReactive, shallowReadonly, toRef, toRefs };
//# sourceMappingURL=reactivity.esm-bundler.js.map
