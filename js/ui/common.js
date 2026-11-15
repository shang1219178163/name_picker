/* 点名器 · 皮肤共用 UI 工具 */
(function () {
  'use strict';

  const NamePicker = window.NamePicker;

  /* Toast：沿用原有 .toast / .show / .error 类名，外观由各皮肤 CSS 决定 */
  function createToast(node, duration) {
    const ttl = duration || 2600;
    let timer = null;

    function toast(message, tone) {
      if (!node) return;
      node.textContent = message;
      node.className = 'toast show' + (tone === 'error' ? ' error' : '');
      clearTimeout(timer);
      timer = setTimeout(() => {
        node.className = 'toast' + (tone === 'error' ? ' error' : '');
      }, ttl);
    }

    toast.destroy = () => clearTimeout(timer);
    return toast;
  }

  /* 长姓名自动缩小字号，仍放不下时换行（经典皮肤沿用原参数） */
  function fitText(node, options) {
    if (!node) return;
    const opts = options || {};
    const minSize = opts.min || 30;
    const maxFirst = opts.max || 64;
    const step = opts.step || 3;
    const wrapClass = opts.wrapClass || 'wrap';
    const skipClass = opts.skipClass || 'is-placeholder';

    node.style.fontSize = '';
    node.classList.remove(wrapClass);
    if (skipClass && node.classList.contains(skipClass)) return;

    const maxWidth = node.clientWidth;
    if (!maxWidth) return;

    let size = parseFloat(getComputedStyle(node).fontSize);
    let guard = 0;
    while (node.scrollWidth > maxWidth && size > minSize && guard++ < 80) {
      size -= step;
      node.style.fontSize = size + 'px';
    }
    if (node.scrollWidth > maxWidth + 1) {
      node.classList.add(wrapClass);
      node.style.fontSize = Math.max(28, Math.min(size, maxFirst)) + 'px';
    }
  }

  function scrollIntoView(node) {
    if (node) node.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  NamePicker.ui = Object.assign(NamePicker.ui || {}, {
    createToast,
    fitText,
    scrollIntoView
  });
})();
