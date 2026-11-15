/* 点名器 · 皮肤共用设置抽屉：滑入开合、导入入口、皮肤选择器、可插拔参数区 */
(function () {
  'use strict';

  const NamePicker = window.NamePicker;

  const TEMPLATE = `
    <div class="settings-head">
      <strong></strong>
    </div>
    <button class="settings-action settings-import" id="importBtn" data-np-role="settings-import" type="button">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>
      </svg>
      <span data-np-role="settings-import-label"></span>
    </button>
    <label class="setting setting-skin">
      <span>界面皮肤</span>
      <select class="settings-select" id="settingsSkin" data-np-role="skin-select"></select>
    </label>
    <details class="settings-group" data-np-role="settings-group">
      <summary>皮肤设置</summary>
      <div data-np-role="settings-sections"></div>
      <button class="settings-action" id="settingsReset" data-np-role="settings-reset" type="button">恢复默认</button>
    </details>
  `;

  function createSettingsPanel(config) {
    const cfg = config || {};
    const host = cfg.host;
    const trigger = cfg.trigger;
    if (!host || !trigger) throw new Error('设置面板需要 host 与 trigger');

    const backdrop = document.createElement('div');
    backdrop.className = 'settings-backdrop';
    backdrop.setAttribute('data-np-role', 'settings-backdrop');
    backdrop.setAttribute('aria-hidden', 'true');

    const menu = document.createElement('aside');
    menu.className = 'settings-drawer';
    menu.id = 'settingsMenu';
    menu.setAttribute('data-np-role', 'settings-panel');
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-modal', 'true');
    menu.setAttribute('aria-label', cfg.title || '设置');
    menu.setAttribute('aria-hidden', 'true');
    menu.innerHTML = TEMPLATE;

    menu.querySelector('.settings-head strong').textContent = cfg.title || '设置';
    menu.querySelector('[data-np-role="settings-import-label"]').textContent = cfg.importLabel || '导入 Excel';

    document.body.appendChild(backdrop);
    document.body.appendChild(menu);

    const disposer = NamePicker.createDisposer();
    const importBtn = menu.querySelector('[data-np-role="settings-import"]');
    const resetBtn = menu.querySelector('[data-np-role="settings-reset"]');
    const sectionsHost = menu.querySelector('[data-np-role="settings-sections"]');
    const settingsGroup = menu.querySelector('[data-np-role="settings-group"]');
    const skinSelect = menu.querySelector('[data-np-role="skin-select"]');
    const app = cfg.app || {};
    let isOpen = false;

    if (!cfg.onReset) resetBtn.remove();

    let sections = [];
    const api = { menu, backdrop, open, close, refreshSkinOptions: renderSkinOptions, destroy };

    (cfg.sections || []).forEach(section => {
      const built = section && typeof section.build === 'function' ? section.build(sectionsHost, api) : null;
      if (built) sectionsHost.appendChild(built);
      sections.push(section);
    });

    // 没有可调参数也没有恢复默认时，不显示空的「皮肤设置」子菜单
    if (!sections.length && !cfg.onReset) settingsGroup.remove();

    function renderSkinOptions() {
      const skins = typeof app.listSkins === 'function' ? app.listSkins() : [];
      const current = typeof app.currentSkinId === 'function' ? app.currentSkinId() : '';
      skinSelect.innerHTML = '';
      skins.forEach(skin => {
        const option = document.createElement('option');
        option.value = skin.id;
        option.textContent = skin.label;
        if (skin.id === current) option.selected = true;
        skinSelect.appendChild(option);
      });
      const label = skinSelect.closest('.setting-skin');
      if (label) label.hidden = skins.length <= 1;
    }

    function setOpen(open) {
      if (open === isOpen) return;
      isOpen = open;

      if (open) {
        renderSkinOptions();
        if (typeof cfg.onOpen === 'function') cfg.onOpen();
      }

      // 先让抽屉进入可交互状态，再切换类名；强制一次样式计算，确保过渡从起始位置开始
      menu.inert = !open;
      menu.setAttribute('aria-hidden', String(!open));
      trigger.setAttribute('aria-expanded', String(open));
      document.documentElement.classList.toggle('settings-open', open);

      void menu.offsetWidth;
      void backdrop.offsetWidth;
      backdrop.classList.toggle('is-open', open);
      menu.classList.toggle('is-open', open);

      if (open) {
        importBtn.focus({ preventScroll: true });
      } else {
        if (typeof cfg.onClose === 'function') cfg.onClose();
        if (trigger.isConnected) trigger.focus({ preventScroll: true });
      }
    }

    function open() {
      setOpen(true);
    }

    function close() {
      setOpen(false);
    }

    disposer.on(trigger, 'click', () => setOpen(!isOpen));
    disposer.on(backdrop, 'click', () => setOpen(false));
    disposer.on(importBtn, 'click', () => {
      // 先收起抽屉，避免文件对话框关闭后抽屉仍盖在页面上
      setOpen(false);
      if (typeof cfg.onImport === 'function') cfg.onImport();
    });
    disposer.on(skinSelect, 'change', () => {
      if (typeof app.selectSkin === 'function') app.selectSkin(skinSelect.value);
    });
    if (cfg.onReset) {
      disposer.on(resetBtn, 'click', () => cfg.onReset());
    }
    disposer.on(document, 'keydown', event => {
      if (event.key === 'Escape' && isOpen) setOpen(false);
    });

    function destroy() {
      if (isOpen) setOpen(false);
      disposer.dispose();
      sections.forEach(section => {
        if (section && typeof section.destroy === 'function') section.destroy();
      });
      document.documentElement.classList.remove('settings-open');
      menu.remove();
      backdrop.remove();
    }

    return api;
  }

  NamePicker.ui = Object.assign(NamePicker.ui || {}, { createSettingsPanel });
})();
