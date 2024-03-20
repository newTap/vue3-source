import { isOn } from "@vue/shared";
import { pathEvent } from "./modules/event";
import pathStyle from "./modules/style";
import pathClass from "./modules/style";
import { pathAttr } from "./modules/arrt";

// 属性  操作
export function pathProps(el: any, key:string, value:any, nextValue: any){
  console.log(key, isOn(key))
  if(key === 'class'){
    pathClass(el, key, nextValue)
  }else if (key === 'style'){
    pathStyle(el, value, nextValue)
  }else if(isOn(key)){
    pathEvent(el, key, nextValue)
  }else{
    pathAttr(el, key, value, nextValue)
  }
}