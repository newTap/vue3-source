
import { hasChange, isFunction } from "@vue/shared"
import { effect } from "./effect"

type Getter<T> = () => T
type Setter<T> = (value: T) => void | undefined
type Options<T> = {
  get: Getter<T>
  set?:Setter<T>
}
type SetOrOptions<T> = Options<T> | Getter<T>

/**
 * 接受一个 getter 函数，返回一个只读的响应式 ref 对象。
 * 该 ref 通过 .value 暴露 getter 函数的返回值。
 * 它也可以接受一个带有 get 和 set 函数的对象来创建一个可写的 ref 对象。
 *
 * 特性：
 * 只有被读取的时候，computed 计算属性才会被执行
 * 当computed被执行后，会有缓存，所以多次调用computed不会执行多次
 * 只有当依赖的响应式对象发生改变时，才会重新执行
 *
 * @return  {[type]}  [return description]
 */
export function computed<T>(setOrOptions:  SetOrOptions<T>){
  let getter:Getter<T>,setter: Setter<T> | undefined
  if(isFunction(setOrOptions)){
    getter = setOrOptions
  }else{
    getter = setOrOptions.get
    setter = setOrOptions.set
  }

  return new ComputedRefImpl(getter, setter)
}

class ComputedRefImpl<T>{
  private _dirty:boolean = true
  private _value: any
  private _effect
  constructor(private _getter: Getter<T>, private readonly _setter?:Setter<T>){
    // !由于是使用的响应式数据，对数据的操作会触发对应的track和trigger函数
    // !但是我们没有对应的副作用函数(effect)，所以当触发trigger的时候，没有对应的副作用操作
    // !所以我们需要添加一个副作用函数(effect),在trigger的时候修改_dirty字段，并且在重新调用get时去执行对应的副作用函数
    this._effect =  effect(_getter,{lazy: true,
          sch:() => {
            if(!this._dirty) this._dirty = true
        } })
    }

  get value (){
    // 当dirty为true时，表示需要跟新值，为false时从缓存的取值
    if(this._dirty){
      // 需要更新数据，直接调用副作用函数
      this._value =  this._effect()
      this._dirty = false
    }
    return this._value
  }

  // !当值给了get函数的情况下，修改动态数据之后，是无法调用这个set方法。
  // !由于computed函数内使用的是响应式数据，所以依然会触发proxy的set方法来触发对应的trigger函数
  set value (newValue:T){
    if(hasChange(newValue, this._value)){
      this?._setter && this._setter(newValue)
    }
  }
}