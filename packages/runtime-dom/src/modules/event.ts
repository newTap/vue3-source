import { getNow } from "@vue/shared"

// <div onClick/> <div onclick/>
const veiKey = Symbol('_vei')

type pathEventEl = HTMLElement & {[veiKey]: any}

export const pathEvent = (el:pathEventEl, key: string, nextValue: any, options?: EventListenerOptions,) => {
  let invokers = el[veiKey] || (el[veiKey] = {})
  let eventKey = key.slice(2).toLowerCase()
  let invoker = invokers[eventKey]

  // !当直接修改对应事件的函数事，并不能取消上一个函数的绑定
  // !因为addEventListener它允许为一个事件添加多个监听器
  // api: https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/addEventListener
  if(invoker && nextValue){
    // 事件更新
    invoker.value = nextValue
  }else{
    // 第一次设置事件
    if(!invoker){
      invoker = (invokers[eventKey] = createInvoker(nextValue))
      el.addEventListener(eventKey, invoker, options)
    }if(!nextValue){
      // 删除事件
      el.removeEventListener(eventKey, invoker, options)
    }
  }

  // 用于创建一个invoker函数，并且返回这个invoker函数
  // 这样可以方便直接更替对应事件函数，不在需要额外做删除与添加操作，只需要直接修改引用事件的函数即可
  function createInvoker(event:any){
     function invoker(...arg:unknown[]){
      if(typeof invoker.value === 'function'){
        invoker.value(...arg)
      }
    }
    invoker.value = event
    return invoker
  }
}