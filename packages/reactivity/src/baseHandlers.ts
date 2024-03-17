import { isArray, isObject } from "@vue/shared"
import { reactive, readonly } from "./reactive"
import { track } from "./effect"
import { TrackOpTypes } from "./constants"

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
      console.log(`get: ${key as string}`)
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
  return function set(target:object, value:string | symbol, receiver:object) {
      console.log(`set: `, value)
      let ref = Reflect.set(target, value, receiver)
      // 1.先处理数组and修改
      if(isArray(target)){
        
      }
      // 执行 effect
      // 注意要区分  数组  与    对象
      // 注意区分 添加   与    修改
      return ref
    }
}