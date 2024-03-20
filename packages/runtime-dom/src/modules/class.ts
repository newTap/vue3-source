// 处理class
// <div class="card"/>

export function pathClass(el: HTMLElement, prevValue:any, nextValue:any){
  if(!nextValue) nextValue = ""
  el.setAttribute('class', nextValue)
}