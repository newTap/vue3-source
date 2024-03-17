import { TrackOpTypes } from "./constants";

type EffectOptions = {
 lazy?: false
}

type ActiveEffectType= () => void
let uid = 0;
// 用于记录当前正在执行的副作用函数
let activeEffect: ActiveEffectType;
// 用户基于当前正在执行的副作用函数队列
// !如果不适用队列形式存储，会导致effect嵌套时，activeEffect无法被正确获取
// effect(function () {
//   let name = proxy.name
//   effect(function () {
//     let name = proxy.name
//   })
//   let list = proxy.list
// })
let activeEffectPool: ActiveEffectType[] = []

// 副作用函数的触发
export function effect (fn: () => void, options?: EffectOptions){
  console.log('触发依赖')
  const effectFn = function reactiveEffect(){
    // 防止effect函数的的报错，对代码逻辑的影响
    try{
      activeEffect = fn
      activeEffectPool.push(activeEffect)
      fn()
    }finally{
      activeEffectPool.pop()
      activeEffect = activeEffectPool[activeEffectPool.length - 1]
    }
  }
 
  effectFn.fn = fn // 保存用户的原方法
  effectFn.options = options // 保存用户的原配置
  effectFn.id = uid++ // effect 的ID
  effectFn._isEffect = true // 标记是否为 effect
  if(!options?.lazy) fn();
  return effectFn
}

// 用于存储依赖的集合
const targetActiveMap = new WeakMap()
// 依赖的收集
export function track(target:object, key: string | symbol, type: TrackOpTypes){
  console.log('开始收集依赖')
  // 只有在副作用函数调用期间才做依赖的收集
  if(!activeEffectPool.length) return false

  // 依赖集合的数据结构，第一层使用WeakMap，利用它的弱引用
  // target作为key值，依赖集合作为value值
  let targetMap = targetActiveMap.get(target)
  if(!targetMap) targetActiveMap.set(target, (targetMap = new Map()))
  // 第二层使用Map数据结构
  // key作为key值，依赖集合作为value值
  let dep = targetMap.get(key)
  // 第三层使用Set数据结构,当相同数据添加值set中会做自动去重操作
  // 用于存放对应的副作用函数
  if(!dep) targetMap.set(key, (dep = new Set()))

  // 为对应的key添加副作用函数
  dep.add(activeEffectPool[activeEffectPool.length-1])
}