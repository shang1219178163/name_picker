/* 点名器 · 引导层：创建核心、挂载/切换皮肤、全局键盘与拖拽 */
(function () {
  'use strict';

  const NamePicker = window.NamePicker;
  const storage = NamePicker.storage;

  const root = document.getElementById('np-root');
  const cssLinks = Array.from(document.querySelectorAll('link[data-skin-css]'));
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  const core = NamePicker.createCore({ storage });

  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'file';
  hiddenInput.accept = '.xlsx,.xls,.csv';
  hiddenInput.hidden = true;
  document.body.appendChild(hiddenInput);

  hiddenInput.addEventListener('change', () => {
    const file = hiddenInput.files && hiddenInput.files[0];
    if (file) core.importFile(file);
    hiddenInput.value = '';
  });

  let activeSkin = null;
  let activeId = null;

  function listSkins() {
    return NamePicker.skins.list();
  }

  function currentSkinId() {
    return activeId;
  }

  function pickFile() {
    hiddenInput.click();
  }

  function setSkinCss(id) {
    cssLinks.forEach(link => {
      link.disabled = link.getAttribute('data-skin-css') !== id;
    });
    document.documentElement.setAttribute('data-skin', id);
  }

  function updateThemeColor(color) {
    if (themeMeta && color) themeMeta.setAttribute('content', color);
  }

  const ctx = {
    core: {
      getSnapshot: core.getSnapshot,
      startRoll: core.startRoll,
      stopRoll: core.stopRoll,
      toggleRoll: core.toggleRoll,
      cancelRoll: core.cancelRoll,
      resetRecords: core.resetRecords,
      importFile: core.importFile
    },
    app: {
      listSkins,
      currentSkinId,
      selectSkin: id => activateSkin(id),
      pickFile
    },
    storage,
    ui: NamePicker.ui
  };

  function activateSkin(id, options) {
    const opts = options || {};
    let meta = NamePicker.skins.get(id);
    if (!meta) {
      id = 'classic';
      meta = NamePicker.skins.get(id);
      if (!meta) {
        console.error('没有可用的皮肤');
        return;
      }
    }
    if (activeSkin && activeId === id) return;

    // 切换前取消滚动，旧皮肤会先收到 cancel 事件再被卸载
    core.cancelRoll();

    if (activeSkin) {
      try {
        activeSkin.unmount();
      } catch (err) {
        console.error(err);
      }
      activeSkin = null;
      activeId = null;
    }
    root.replaceChildren();

    setSkinCss(id);
    updateThemeColor(meta.themeColor);

    try {
      const skin = meta.create(ctx);
      skin.mount(root, ctx);
      skin.render(core.getSnapshot(), { reason: opts.initial ? 'init' : 'skin' });
      activeSkin = skin;
      activeId = id;
      storage.setJSON('picker.skin', id);
    } catch (err) {
      console.error(err);
      activeSkin = null;
      activeId = null;
      root.replaceChildren();
      if (id !== 'classic' && !opts.fallback) {
        activateSkin('classic', { initial: true, fallback: true });
      } else {
        setSkinCss('classic');
        storage.setJSON('picker.skin', 'classic');
      }
    }
  }

  core.subscribe(event => {
    const skin = activeSkin;
    if (!skin) return;
    if (event.type === 'state') {
      skin.render(event.state, event.change);
    } else if (event.type === 'tick') {
      if (skin.tick) skin.tick(event.name);
    } else if (event.type === 'toast') {
      if (skin.toast) skin.toast(event.message, event.tone);
    } else if (event.type === 'celebrate') {
      if (skin.celebrate) skin.celebrate();
    }
  });

  /* ---------- 全局键盘：空格开始/停止 ---------- */
  document.addEventListener('keydown', event => {
    const tag = (event.target.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'SELECT' || event.target.isContentEditable) return;
    if (event.code === 'Space' || event.key === ' ') {
      event.preventDefault();
      core.toggleRoll();
    }
  });

  /* ---------- 拖拽导入：遮罩由当前皮肤渲染 ---------- */
  let dragDepth = 0;

  function setDropActive(active) {
    if (activeSkin && activeSkin.setDropActive) activeSkin.setDropActive(active);
  }

  window.addEventListener('dragenter', event => {
    event.preventDefault();
    dragDepth++;
    setDropActive(true);
  });

  window.addEventListener('dragover', event => {
    event.preventDefault();
  });

  window.addEventListener('dragleave', event => {
    event.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (!dragDepth) setDropActive(false);
  });

  window.addEventListener('drop', event => {
    event.preventDefault();
    dragDepth = 0;
    setDropActive(false);
    const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    if (!file) return;
    if (!NamePicker.isSupportedFile(file)) {
      core.notify('请拖入 .xlsx / .xls / .csv 文件', 'error');
      return;
    }
    core.importFile(file);
  });

  /* ---------- 启动 ---------- */
  const saved = storage.getJSON('picker.skin', 'classic');
  activateSkin(NamePicker.skins.has(saved) ? saved : 'classic', { initial: true });

  NamePicker.app = {
    listSkins,
    currentSkinId,
    selectSkin: id => activateSkin(id)
  };
})();
