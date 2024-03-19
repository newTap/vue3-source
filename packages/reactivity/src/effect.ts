import { isArray, isSymbol } from "@vue/shared";
import { TrackOpTypes, TriggerOpTypes } from "./constants";

type EffectOptions = {
 lazy?: boolean
 sch?:() => void
}

type ActiveEffectType= {
    (): void;
    fn: () => void;
    options: EffectOptions | undefined;
    id: number;
    _isEffect: boolean;
}

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
export function effect (fn: () => void, options?: EffectOptions):ActiveEffectType{
  const effectFn = function reactiveEffect(){
    // 防止effect函数的的报错，对代码逻辑的影响
    try{
      activeEffect = effectFn
      activeEffectPool.push(activeEffect)
      return fn()
    }finally{
      activeEffectPool.pop()
      activeEffect = activeEffectPool[activeEffectPool.length - 1]
    }
  }

  effectFn.fn = fn // 保存用户的原方法
  effectFn.options = options // 保存用户的原配置
  effectFn.id = uid++ // effect 的ID
  effectFn._isEffect = true // 标记是否为 effect
  if(!options?.lazy) effectFn();
  return effectFn
}

type Deps =  Set<ActiveEffectType>

type KeyToDepMap = Map<any, Deps>

// 用于存储依赖的集合
const targetActiveMap = new WeakMap<object, KeyToDepMap>()
// 依赖的收集
export function track(target:object, key: string | symbol, type: TrackOpTypes){
  console.log('开始收集依赖')
  // 只有在副作用函数调用期间才做依赖的收集
  if(!activeEffect) return false

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
  dep.add(activeEffect)
}

// 依赖是触发
export function trigger(target:object, key: string | symbol, type: TriggerOpTypes, value: unknown, oldValue: unknown){
  let targetMap = targetActiveMap.get(target)
  console.log('targetActiveMap', targetActiveMap, target, key, value)
  // 当前的修改没有依赖
  if(!targetMap) {
    console.log('没有当前的target依赖映射', target)
    return false
  }
  let deeps:Deps[] = []

  if(isArray(target) && key === 'length'){
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
      if(key === 'length' || (!isSymbol(key) &&  Number(key) >= Number(value))){
        deeps.push(dep)
      }
    });
  }else{
    // 可能是对象的操作
    let dep = targetMap.get(key)
    if(dep){
      deeps.push(dep)
    }
  }
  for (let dep of deeps) {
    if(dep){
      triggerEffects(dep)
    }
  }
}

function triggerEffects(dep:Deps){
  for (const effect of dep.keys()) {
    // computed函数携带的特俗字段sch
    // computed函数会根据get字段来调用对应的effect，所以不需要再trigger中调用
    if(effect.options?.sch){
      effect.options?.sch()
    }else{
       effect()
    }
  }
}