import { hasChange, isArray, isObj, isRef } from "@vue/shared"
import { TrackOpTypes, TriggerOpTypes } from "./constants"
import { track, trigger } from "./effect"
import { reactive } from "./reactive"
import { isObject } from '../../shared/src/index';

/**
 * 接受一个内部值，返回一个响应式的，可更改的ref对象，此对象只有一个指向内部的属性.value
 *
 * 如果将一个对象赋值给 ref，那么这个对象将通过 reactive() 转为具有深层次响应式的对象。
 *
 * @param   {unknown}  target  [target 任意数据]
 *
 * @return  {[type]}           [return 一个ref对象]
 */
export function ref(target: unknown){
  return createRef(target)
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
export function toRef(target: unknown, key?: string){
  return createToRef(target, key)
}


/**
 * 将一个响应式对象转换为一个普通对象，这个普通对象的每个属性都是指向源对象相应属性的 ref。
 *
 * @param   {unknown}  target  [target description]
 *
 * @return  {[type]}           [return description]
 */
export function toRefs<T extends object>(target: T){
  // 如果传入的不是一个基础数据类型，则警告
  // 如果传入的是一个ref的类型，但是value是一个基础数据类型，则警告
  if(!isObj(target) || (isRef(target) && (!isObj((target as any).__value)))){
    console.error("传入的必须是一个对象")
  }

  const map = isArray(target) ? new Array(target.length) : {}

  Object.keys(target).forEach((key: string) => {
    (map as any)[key] = createToRef(target, key)
  })

  return map
}



function createRef(target: unknown){
  if(isRef(target)) return target
  return new RefImpl(target)
}

class RefImpl<T> {
  private _value:T
  private _rawValue:T
  private __v_isShallow: boolean
  private readonly __v_isRef:boolean = true
  constructor(target: T, isShallow:boolean = false){
    console.log('isObj(target)', isObj(target))
  if(isObj(target)){
      // 若是对象，则需要通过reactive来收集依赖
      // !若是对象，对其属性修改，将无法触发内部的 setter函数，必须使用reactive来实现数据响应式
      let proxy = reactive(target)
      this._value = proxy as T
      this._rawValue = proxy as T
    }else{
      this._value = target
      this._rawValue = target
      // 普通数据类型，直接收集依赖
    }
   
    this.__v_isShallow = isShallow
  }

  get value() {
    // 依赖收集
    track(this, 'value', TrackOpTypes.GET)
    return this._value
  }

  set value(value){
    if(hasChange(this._value, value)){
      const oldValue = this._rawValue
      // 判断新值是否是对象类型
      // 如果是对象类型。则将该对象类型转换为响应式数据
      const newValue = isObj(value)?reactive(value): value

      this._value = newValue as T
      this._rawValue = newValue as T

      // 触发器
      trigger(this, 'value', TriggerOpTypes.SET, newValue, oldValue)
    }
  }
}

function createToRef(target: unknown, key?: string){
  if(isRef(target)) return target
  else if(isObject(target) && key) {
     return  new ObjectRefImpl(target, key)
  }else{
    return ref(target)
  }
}

class ObjectRefImpl<T>{
  private __v_isShallow = false
  private readonly __v_isRef:boolean = true
  constructor(private _target:T, private _key:string){
  }

  get value(){
    // 直接调用target的get，来捕获依赖
    return (this._target as any)[this._key]
  }

  set value(value){
    // 直接调用target的set，来触发依赖
    (this._target as any)[this._key] = value
  }
}