/* 点名器 · 简约皮肤：无星空/无彩带，专注姓名与记录 */
(function () {
  'use strict';

  const NamePicker = window.NamePicker;

  const TEMPLATE = `
    <div class="mp">
      <header class="mp-top">
        <div class="mp-brand">
          <h1>点名器</h1>
          <span class="mp-stat" data-np-role="roster-stat">名单 0 人</span>
        </div>
        <div class="mp-actions" data-np-role="top-actions">
          <button class="mp-gear" data-np-role="settings-trigger" type="button" aria-label="设置" aria-expanded="false" aria-controls="settingsMenu">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </header>

      <main class="mp-panel" data-np-role="panel">
        <div class="mp-name is-placeholder" data-np-role="name" aria-live="polite">准备开始</div>
      </main>

      <div class="mp-controls">
        <button class="mp-btn mp-primary" data-np-role="toggle" type="button" aria-pressed="false">开始随机</button>
        <button class="mp-btn" data-np-role="reset" type="button">重置记录</button>
      </div>

      <section class="mp-history">
        <h2>已点记录</h2>
        <div class="mp-chips" data-np-role="history"></div>
        <p class="mp-empty" data-np-role="history-empty">暂无记录</p>
      </section>

      <div class="mp-drop" data-np-role="drop-mask"><span>松开即可导入</span></div>
      <div class="toast" data-np-role="toast" role="status"></div>
    </div>
  `;

  function createMinimalSkin(ctx) {
    const disposer = NamePicker.createDisposer();
    let root = null;
    let els = {};
    let lastState = null;
    let toast = null;
    let settingsPanel = null;

    function createChip(name, isLatest) {
      const chip = document.createElement('span');
      chip.className = 'mp-chip' + (isLatest ? ' is-latest' : '');
      chip.textContent = name;
      return chip;
    }

    function renderHistory(state, animate) {
      els.history.innerHTML = '';
      state.picked.forEach((name, index) => {
        const chip = createChip(name, name === state.latest && index === state.picked.length - 1);
        if (!animate) chip.style.animation = 'none';
        els.history.appendChild(chip);
      });
      els.historyEmpty.style.display = state.picked.length ? 'none' : 'block';
    }

    function appendHistory(name) {
      els.history.querySelectorAll('.mp-chip.is-latest').forEach(chip => chip.classList.remove('is-latest'));
      els.history.appendChild(createChip(name, true));
      els.historyEmpty.style.display = 'none';
    }

    function showPlaceholder(text) {
      els.name.textContent = text;
      els.name.classList.add('is-placeholder');
      els.name.classList.remove('wrap');
      els.name.style.fontSize = '';
    }

    function showName(name) {
      els.name.textContent = name;
      els.name.classList.remove('is-placeholder');
    }

    function fitName() {
      NamePicker.ui.fitText(els.name, { min: 26, max: 88, step: 4, wrapClass: 'wrap' });
    }

    function render(state, change) {
      lastState = state;
      const reason = (change && change.reason) || 'init';

      els.stat.textContent = state.counts.names
        ? `名单 ${state.counts.names} 人 · 已点 ${state.counts.picked} 人`
        : '名单 0 人';

      els.toggle.textContent = state.rolling ? '停止选人' : '开始随机';
      els.toggle.classList.toggle('is-running', state.rolling);
      els.toggle.setAttribute('aria-pressed', String(state.rolling));
      els.panel.classList.toggle('is-rolling', state.rolling);
      // 切换皮肤时重放定格动画没有意义，只保留结果
      els.panel.classList.toggle('is-settled', state.phase === 'settled' && reason !== 'skin');

      if (state.rolling) {
        els.name.classList.remove('is-placeholder', 'wrap');
        els.name.style.fontSize = '';
      } else if (state.latest) {
        showName(state.latest);
        requestAnimationFrame(fitName);
      } else {
        showPlaceholder('准备开始');
      }

      if (reason === 'start') {
        els.history.querySelectorAll('.mp-chip.is-latest').forEach(chip => chip.classList.remove('is-latest'));
      } else if (reason === 'stop' && change && change.appendedName) {
        appendHistory(change.appendedName);
        requestAnimationFrame(() => NamePicker.ui.scrollIntoView(els.history.lastElementChild));
      } else {
        const animate = !['init', 'import', 'reset', 'cancel', 'skin'].includes(reason);
        renderHistory(state, animate);
      }
    }

    function mount(mountRoot) {
      root = mountRoot;
      root.innerHTML = TEMPLATE;

      els = {
        stat: NamePicker.byRole(root, 'roster-stat'),
        panel: NamePicker.byRole(root, 'panel'),
        name: NamePicker.byRole(root, 'name'),
        toggle: NamePicker.byRole(root, 'toggle'),
        reset: NamePicker.byRole(root, 'reset'),
        history: NamePicker.byRole(root, 'history'),
        historyEmpty: NamePicker.byRole(root, 'history-empty'),
        dropMask: NamePicker.byRole(root, 'drop-mask'),
        toast: NamePicker.byRole(root, 'toast'),
        topActions: NamePicker.byRole(root, 'top-actions'),
        settingsBtn: NamePicker.byRole(root, 'settings-trigger')
      };

      toast = NamePicker.ui.createToast(els.toast);

      settingsPanel = NamePicker.ui.createSettingsPanel({
        host: els.topActions,
        trigger: els.settingsBtn,
        title: '设置',
        importLabel: '导入 Excel',
        app: {
          listSkins: ctx.app.listSkins,
          currentSkinId: ctx.app.currentSkinId,
          selectSkin: ctx.app.selectSkin
        },
        onImport: ctx.app.pickFile
      });

      disposer.on(els.toggle, 'click', () => ctx.core.toggleRoll());
      disposer.on(els.reset, 'click', () => ctx.core.resetRecords());
      disposer.on(els.panel, 'click', () => {
        if (ctx.core.getSnapshot().rolling) ctx.core.stopRoll();
      });
      disposer.on(window, 'resize', () => {
        if (!lastState || !lastState.rolling) requestAnimationFrame(fitName);
      });
    }

    function unmount() {
      if (settingsPanel) {
        settingsPanel.destroy();
        settingsPanel = null;
      }
      disposer.dispose();
      if (toast) {
        toast.destroy();
        toast = null;
      }
      els = {};
      root = null;
      lastState = null;
    }

    return {
      id: 'minimal',
      mount,
      unmount,
      render,
      tick: showName,
      toast: (message, tone) => toast && toast(message, tone),
      setDropActive(active) {
        if (els.dropMask) els.dropMask.classList.toggle('is-active', !!active);
      }
    };
  }

  NamePicker.skins.register({
    id: 'minimal',
    label: '简约',
    css: 'css/skins/minimal.css',
    themeColor: '#f4f5f7',
    create: createMinimalSkin
  });
})();
