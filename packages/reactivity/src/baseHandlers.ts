import { hasOwn, isArray, isIntegerKey, isObject } from "@vue/shared"
import { reactive, readonly } from "./reactive"
import { track, trigger } from "./effect"
import { TrackOpTypes, TriggerOpTypes } from "./constants"

const get = createGetter()
const readonlyGet = createGetter(true)
const shallowReactiveGet = createGetter(false, true)
const shallowReadonlyGet = createGetter(true, true)

const set = createSetter()
const shallowSet = createSetter(true)

export const reactiveHandler = {
  get,
  set
}

export const readonlyHandler = {
 get: readonlyGet,
 set: function(){
  console.error('只读无法修改')
  return false
 }
}

export const shallowReactiveHandler = {
  get: shallowReactiveGet,
  set: shallowSet
}

export const shallowReadonlyHandler = {
  get: shallowReadonlyGet,
  set: function(){
   console.error('只读无法修改')
   return false
  }
}

function createGetter(isReadonly = false, isShallow = false) {
  return function get (target: object, key:string|symbol, receiver: object) {
      console.log(`get: `, key)
      const res = Reflect.get(target, key, receiver)
      // 收集 effect
      if(!isReadonly){
        console.log('收集 effect')
        track(target, key, TrackOpTypes.GET)
      }
      // 递归处理,为了实现深层次的响应式
      //! 只有调用到了get方法，才会进行递归，并没有将所有的子对象递归。属于优化
      if(!isShallow && isObject(res)) {
        console.log('调用递归', res)
        // !保证返回的对象是一个代理对象
        // !否则在第一次进行set操作的时候，会导致无法监听到set的操作
        return isReadonly? readonly(res as object) : reactive(res as object)
      }
      return res
    }
}

function createSetter(isShallow = false){
  return function set(target:object,key:string | symbol, value: unknown, receiver:object) {
      console.log(`set: `, key,  value, target)
      // !当对数组做操作(删除,或增加)，会先调用对应下标的set操作，然后再调用length的set操作
      // !当对数组做操作时，对应的key会被处理为string类型
      // !当对数组的length直接做操作时，会直接调用length的set操作，无法触发对应下标的set操作

      // 1.先区分属于与对象的操作
      // 2.再区分是修改操作，还是增加操作
      let hasKey = isArray(target) && isIntegerKey(key)?
       Number(key) < target.length : hasOwn(target, key)
      let oldValue = (target as any)[key]

      let ref = Reflect.set(target,key, value, receiver)

    // 执行 effect
      if(hasKey){
        // 修改操作
        console.log('修改操作')
        trigger(target, key, TriggerOpTypes.SET, value, oldValue)
      }else{
        // 新增操作
        console.log('新增操作')
        trigger(target, key, TriggerOpTypes.ADD, value, oldValue)
      }

      return ref
    }
}