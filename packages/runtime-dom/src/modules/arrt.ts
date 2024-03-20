// <div data-name='xiaoMing'/>

export function pathAttr(el:Element, key: string, value: any, nextValue: any){
  if(value === nextValue) return
  if(!nextValue && nextValue != 0 ){
    el.removeAttribute(key);
  }else{
    el.setAttribute(key, nextValue)
  }
}