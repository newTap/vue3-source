var VueReactivity = (function (exports) {
  'use strict';

  const isObject = (value) => typeof value === 'object' && value !== null;

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
          return Reflect.set(target, value, receiver);
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

  exports.reactive = reactive;
  exports.readonly = readonly;
  exports.shallowReactive = shallowReactive;
  exports.shallowReadonly = shallowReadonly;

  return exports;

})({});
//# sourceMappingURL=reactivity.global.js.map
