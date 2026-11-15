/* 点名器 · 首屏皮肤预加载：在 body 渲染前启用正确的皮肤样式表，避免闪烁 */
(function () {
  'use strict';

  const links = Array.from(document.querySelectorAll('link[data-skin-css]'));
  if (!links.length) return;

  let skin = 'classic';
  try {
    const raw = localStorage.getItem('picker.skin');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        skin = typeof parsed === 'string' ? parsed : raw;
      } catch (err) {
        skin = raw;
      }
    }
  } catch (err) {
    /* 隐私模式下读取失败，回退默认皮肤 */
  }

  const known = links.some(link => link.getAttribute('data-skin-css') === skin);
  if (!known) skin = 'classic';

  links.forEach(link => {
    link.disabled = link.getAttribute('data-skin-css') !== skin;
  });
  document.documentElement.setAttribute('data-skin', skin);

  const activeLink = links.find(link => link.getAttribute('data-skin-css') === skin);
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const themeColor = activeLink && activeLink.getAttribute('data-skin-theme');
  if (themeMeta && themeColor) themeMeta.setAttribute('content', themeColor);
})();
