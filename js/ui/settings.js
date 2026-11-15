/* 点名器 · 皮肤共用设置弹窗：开合、导入入口、皮肤选择器、可插拔参数区 */
(function () {
  'use strict';

  const NamePicker = window.NamePicker;

  const TEMPLATE = `
    <div class="settings-head">
      <strong></strong>
      <button class="settings-close" id="settingsClose" data-np-role="settings-close" type="button" aria-label="关闭设置">×</button>
    </div>
    <button class="settings-action settings-import" id="importBtn" data-np-role="settings-import" type="button">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>
      </svg>
      <span data-np-role="settings-import-label"></span>
    </button>
    <div data-np-role="settings-sections"></div>
    <label class="setting setting-skin">
      <span>界面皮肤</span>
      <select class="settings-select" id="settingsSkin" data-np-role="skin-select"></select>
    </label>
    <button class="settings-action" id="settingsReset" data-np-role="settings-reset" type="button">恢复默认</button>
  `;

  function createSettingsPanel(config) {
    const cfg = config || {};
    const host = cfg.host;
    const trigger = cfg.trigger;
    if (!host || !trigger) throw new Error('设置面板需要 host 与 trigger');

    const menu = document.createElement('div');
    menu.className = 'settings-menu';
    menu.id = 'settingsMenu';
    menu.setAttribute('data-np-role', 'settings-panel');
    menu.hidden = true;
    menu.innerHTML = TEMPLATE;

    menu.querySelector('.settings-head strong').textContent = cfg.title || '设置';
    menu.querySelector('[data-np-role="settings-import-label"]').textContent = cfg.importLabel || '导入 Excel';

    host.appendChild(menu);

    const disposer = NamePicker.createDisposer();
    const closeBtn = menu.querySelector('[data-np-role="settings-close"]');
    const importBtn = menu.querySelector('[data-np-role="settings-import"]');
    const resetBtn = menu.querySelector('[data-np-role="settings-reset"]');
    const sectionsHost = menu.querySelector('[data-np-role="settings-sections"]');
    const skinSelect = menu.querySelector('[data-np-role="skin-select"]');
    const app = cfg.app || {};

    if (!cfg.onReset) resetBtn.remove();

    let sections = [];
    const api = { menu, open, close, refreshSkinOptions: renderSkinOptions, destroy };

    (cfg.sections || []).forEach(section => {
      const built = section && typeof section.build === 'function' ? section.build(sectionsHost, api) : null;
      if (built) sectionsHost.appendChild(built);
      sections.push(section);
    });

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
      const wasOpen = !menu.hidden;
      menu.hidden = !open;
      if (trigger) trigger.setAttribute('aria-expanded', String(open));
      if (open) {
        renderSkinOptions();
        if (typeof cfg.onOpen === 'function') cfg.onOpen();
      } else if (wasOpen && typeof cfg.onClose === 'function') {
        cfg.onClose();
      }
    }

    disposer.on(trigger, 'click', () => setOpen(menu.hidden));
    disposer.on(closeBtn, 'click', () => setOpen(false));
    disposer.on(importBtn, 'click', () => {
      // 先收起菜单，避免文件对话框关闭后弹窗仍盖在页面上
      setOpen(false);
      if (typeof cfg.onImport === 'function') cfg.onImport();
    });
    disposer.on(skinSelect, 'change', () => {
      if (typeof app.selectSkin === 'function') app.selectSkin(skinSelect.value);
    });
    if (cfg.onReset) {
      disposer.on(resetBtn, 'click', () => cfg.onReset());
    }
    disposer.on(document, 'click', event => {
      if (!menu.hidden && !menu.contains(event.target) && !trigger.contains(event.target)) setOpen(false);
    });
    disposer.on(document, 'keydown', event => {
      if (event.key === 'Escape' && !menu.hidden) setOpen(false);
    });

    function open() {
      setOpen(true);
    }

    function close() {
      setOpen(false);
    }

    function destroy() {
      if (!menu.hidden) setOpen(false);
      disposer.dispose();
      sections.forEach(section => {
        if (section && typeof section.destroy === 'function') section.destroy();
      });
      menu.remove();
    }

    return api;
  }

  NamePicker.ui = Object.assign(NamePicker.ui || {}, { createSettingsPanel });
})();
