// 操作节点 增 删 改 查

export const nodeOps = {
  // 创建元素
  createElement: document.createElement,
  // 删除元素
  remove:(el:Node)=> {
    let parent = el.parentNode;
    if(parent){
      parent.removeChild(el);
    }
  },
  // 插入元素
  insert:(parent:Node, el: Node, anchor:any)=> {
    parent.insertBefore(el, anchor);
  },
  // 选择元素
  querySelector: document.querySelector,
  // 设置元素文本内容
  setElementText: (el:Node, text:string) => el.textContent = text ,
  // 创建文本
  createText: document.createTextNode,
  // 设置文本
  setText: (el: Node, text:string) => el.nodeValue = text
}