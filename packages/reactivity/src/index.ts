import { isObject } from "@vue/shared";
import { reactiveHandler, readonlyHandler, shallowReactiveHandler, shallowReadonlyHandler } from "./baseHandlers";

export type targetType<T> = T;
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
export function reactive<T extends object>(data:T):object{
  return createReactiveObject(data, false, false, reactiveHandler)
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
export function readonly<T extends object>(data:T):object{
  return createReactiveObject(data, true , false, readonlyHandler)
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
export function shallowReactive<T extends object>(data:T):object{
  return createReactiveObject(data, true, false, shallowReactiveHandler)
}

export function shallowReadonly<T extends object>(data:T):object{
  return createReactiveObject(data, true, false, shallowReadonlyHandler)
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
function createReactiveObject<T extends object>(data:T, isReadonly=false, isShallow=true, handlers:ProxyHandler<T>):T {
  // 非对象类型直接返回
  if(!isObject(data)) {
    console.error('请给一个对象')
    return data;
  }
  const proxyMap = isReadonly ? readonlyMap : reactiveMap
  // 校验是否已有代理对象
  if(proxyMap.has(data)) return proxyMap.get(data);
  // 若目标已经是一个代理对象，则需要返回该对象 待完善

  const proxy =  new Proxy(data, handlers);
  proxyMap.set(data, proxy)
  return proxy
}