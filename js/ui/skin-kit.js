/* 点名器 · 轻量皮肤工厂：处理渲染、历史、设置入口与生命周期，皮肤只需提供模板和样式类名 */
(function () {
  'use strict';

  const NamePicker = window.NamePicker;

  function createSimpleSkin(config) {
    return function createSkin(ctx) {
      const disposer = NamePicker.createDisposer();
      const classes = config.classes || {};
      const chipClass = classes.chip || 'chip';
      const latestClass = classes.latest || 'is-latest';
      const panelRolling = classes.panelRolling || 'is-rolling';
      const panelSettled = classes.panelSettled || 'is-settled';
      const toggleRunning = classes.toggleRunning || 'is-running';
      const dropActive = classes.dropActive || 'is-active';

      let root = null;
      let els = {};
      let lastState = null;
      let toast = null;
      let settingsPanel = null;
      let celebrateTimer = null;

      function createChip(name, isLatest) {
        const chip = document.createElement('span');
        chip.className = chipClass + (isLatest ? ' ' + latestClass : '');
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
        els.history.querySelectorAll('.' + latestClass).forEach(chip => chip.classList.remove(latestClass));
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
        NamePicker.ui.fitText(els.name, Object.assign({ min: 26, max: 96, step: 4 }, config.fit || {}));
      }

      function render(state, change) {
        lastState = state;
        const reason = (change && change.reason) || 'init';

        els.rosterStat.textContent = state.counts.names
          ? `名单 ${state.counts.names} 人 · 已点 ${state.counts.picked} 人`
          : '名单 0 人';

        els.toggle.textContent = state.rolling ? '停止选人' : '开始随机';
        els.toggle.classList.toggle(toggleRunning, state.rolling);
        els.toggle.setAttribute('aria-pressed', String(state.rolling));

        els.panel.classList.toggle(panelRolling, state.rolling);
        // 切换皮肤时重放定格动画没有意义，只保留结果
        els.panel.classList.toggle(panelSettled, state.phase === 'settled' && reason !== 'skin');

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
          els.history.querySelectorAll('.' + latestClass).forEach(chip => chip.classList.remove(latestClass));
        } else if (reason === 'stop' && change && change.appendedName) {
          appendHistory(change.appendedName);
          requestAnimationFrame(() => NamePicker.ui.scrollIntoView(els.history.lastElementChild));
        } else {
          const animate = !['init', 'import', 'reset', 'cancel', 'skin'].includes(reason);
          renderHistory(state, animate);
        }
      }

      function tick(name) {
        showName(name);
      }

      function celebrate() {
        if (!config.celebrateClass || !els.panel) return;
        const cls = config.celebrateClass;
        els.panel.classList.remove(cls);
        void els.panel.offsetWidth;
        els.panel.classList.add(cls);
        clearTimeout(celebrateTimer);
        celebrateTimer = setTimeout(() => {
          if (els.panel) els.panel.classList.remove(cls);
        }, config.celebrateDuration || 700);
      }

      function mount(mountRoot) {
        root = mountRoot;
        root.innerHTML = config.template;

        els = {
          rosterStat: NamePicker.byRole(root, 'roster-stat'),
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
        disposer.add(() => clearTimeout(celebrateTimer));

        if (typeof config.onMount === 'function') {
          config.onMount({ ctx, els, disposer, toast, root });
        }
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
        clearTimeout(celebrateTimer);
        celebrateTimer = null;
        els = {};
        root = null;
        lastState = null;
      }

      const view = {
        id: config.id,
        mount,
        unmount,
        render,
        tick,
        toast: (message, tone) => toast && toast(message, tone),
        setDropActive(active) {
          if (els.dropMask) els.dropMask.classList.toggle(dropActive, !!active);
        }
      };

      if (config.celebrateClass) view.celebrate = celebrate;

      return view;
    };
  }

  NamePicker.createSimpleSkin = createSimpleSkin;
})();
