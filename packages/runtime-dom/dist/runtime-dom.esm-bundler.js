const isOn = (val) => RegExp(/on[^a-z]/).test(val);

// <div onClick/> <div onclick/>
const veiKey = Symbol('_vei');
const pathEvent = (el, key, nextValue, options) => {
    let invokers = el[veiKey] || (el[veiKey] = {});
    let eventKey = key.slice(2).toLowerCase();
    let invoker = invokers[eventKey];
    // !当直接修改对应事件的函数事，并不能取消上一个函数的绑定
    // !因为addEventListener它允许为一个事件添加多个监听器
    // api: https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/addEventListener
    if (invoker && nextValue) {
        // 事件更新
        invoker.value = nextValue;
    }
    else {
        // 第一次设置事件
        if (!invoker) {
            invoker = (invokers[eventKey] = createInvoker(nextValue));
            el.addEventListener(eventKey, invoker, options);
        }
        if (!nextValue) {
            // 删除事件
            el.removeEventListener(eventKey, invoker, options);
        }
    }
    // 用于创建一个invoker函数，并且返回这个invoker函数
    // 这样可以方便直接更替对应事件函数，不在需要额外做删除与添加操作，只需要直接修改引用事件的函数即可
    function createInvoker(event) {
        function invoker(...arg) {
            if (typeof invoker.value === 'function') {
                invoker.value(...arg);
            }
        }
        invoker.value = event;
        return invoker;
    }
};

// <div class={color: 'red', size: 'large'}/>
function pathStyle(el, prevValue, nextValue) {
    if (prevValue && nextValue) {
        // 两个数据做对比，
        for (var key in nextValue) {
            // 修改  和   添加 操作
            if (nextValue[key] != prevValue[key]) {
                el.style[key] = nextValue[key];
            }
        }
        for (var key in prevValue) {
            // 删除操作
            if (!(key in nextValue)) {
                el.style[key] = '';
            }
        }
    }
    else {
        // 设置样式
        if (!prevValue && nextValue) {
            for (var key in nextValue) {
                el.style[key] = nextValue[key];
            }
        }
        else {
            // 清除样式
            for (var key in prevValue) {
                el.style[key] = '';
            }
        }
    }
}

// <div data-name='xiaoMing'/>
function pathAttr(el, key, value, nextValue) {
    if (value === nextValue)
        return;
    if (!nextValue && nextValue != 0) {
        el.removeAttribute(key);
    }
    else {
        el.setAttribute(key, nextValue);
    }
}

// 属性  操作
function pathProps(el, key, value, nextValue) {
    console.log(key, isOn(key));
    if (key === 'class') {
        pathStyle(el, key, nextValue);
    }
    else if (key === 'style') {
        pathStyle(el, value, nextValue);
    }
    else if (isOn(key)) {
        pathEvent(el, key, nextValue);
    }
    else {
        pathAttr(el, key, value, nextValue);
    }
}

export { pathProps };
//# sourceMappingURL=runtime-dom.esm-bundler.js.map
