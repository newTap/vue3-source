// <div class={color: 'red', size: 'large'}/>
export default function pathStyle(el: HTMLElement, prevValue: any, nextValue?: any) {
  if (prevValue && nextValue) {
    // 两个数据做对比，
    for (var key in nextValue) {
      // 修改  和   添加 操作
      if (nextValue[key] != prevValue[key as any]) {
        el.style[key as any] = nextValue[key]
      }
    }
    for (var key in prevValue) {
      // 删除操作
      if (!(key in nextValue)) {
        el.style[key as any] = ''
      }
    }
  } else {
    // 设置样式
    if (!prevValue && nextValue) {
      for (var key in nextValue) {
        el.style[key as any] = nextValue[key]
      }
    } else {
      // 清除样式
      for (var key in prevValue) {
        el.style[key as any] = ''
      }
    }
  }

}