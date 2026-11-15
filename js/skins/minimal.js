/* 点名器 · 简约皮肤：深色扁平 + 金色边框（沿用旧版 name_picker 2 界面） */
(function () {
  'use strict';

  const NamePicker = window.NamePicker;

  const TEMPLATE = `
    <div class="app">
      <header class="topbar">
        <span class="roster-stat" data-np-role="roster-stat">名单 0 人</span>
        <h1 class="title">点名器</h1>
        <div class="top-actions" data-np-role="top-actions">
          <button class="icon-btn" data-np-role="settings-trigger" type="button" aria-label="设置" aria-expanded="false" aria-controls="settingsMenu">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </header>

      <main class="panel" data-np-role="panel">
        <div class="name is-placeholder" data-np-role="name" aria-live="polite">准备开始</div>
      </main>

      <section class="controls" aria-label="点名操作">
        <button class="ctrl start" id="toggleBtn" data-np-role="toggle" type="button" aria-pressed="false">开始随机</button>
        <button class="ctrl reset" id="resetBtn" data-np-role="reset" type="button">重置记录</button>
      </section>

      <section class="history">
        <h2 class="history-title">已提问过的同学：</h2>
        <div class="history-list" data-np-role="history"></div>
        <p class="history-empty" data-np-role="history-empty">暂无记录</p>
      </section>
    </div>

    <div class="drop-mask" data-np-role="drop-mask">
      <div class="drop-box">
        <strong>松开即可导入</strong>
        <span>支持 .xlsx / .xls / .csv</span>
      </div>
    </div>

    <div class="toast" data-np-role="toast" role="status"></div>
    <canvas class="confetti" data-np-role="confetti" aria-hidden="true"></canvas>
  `;

  function createMinimalSkin(ctx) {
    const disposer = NamePicker.createDisposer();
    let root = null;
    let els = {};
    let lastState = null;
    let toast = null;
    let settingsPanel = null;

    const confetti = {
      ctx: null,
      pieces: [],
      raf: null,
      dpr: Math.min(window.devicePixelRatio || 1, 2)
    };

    /* ---------- 渲染 ---------- */
    function createChip(name, isLatest) {
      const chip = document.createElement('div');
      chip.className = 'chip' + (isLatest ? ' latest' : '');
      const text = document.createElement('span');
      text.textContent = name;
      chip.appendChild(text);
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
      els.history.querySelectorAll('.chip.latest').forEach(chip => chip.classList.remove('latest'));
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
      NamePicker.ui.fitText(els.name);
    }

    function render(state, change) {
      lastState = state;
      const reason = (change && change.reason) || 'init';

      els.rosterStat.textContent = state.counts.names
        ? `名单 ${state.counts.names} 人 · 已点 ${state.counts.picked} 人`
        : '名单 0 人';

      els.toggle.textContent = state.rolling ? '停止选人' : '开始随机';
      els.toggle.classList.toggle('start', !state.rolling);
      els.toggle.classList.toggle('stop', state.rolling);
      els.toggle.setAttribute('aria-pressed', String(state.rolling));

      els.panel.classList.toggle('rolling', state.rolling);
      // 切换皮肤时重放定格动画没有意义，只保留结果
      els.panel.classList.toggle('settled', state.phase === 'settled' && reason !== 'skin');

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
        els.history.querySelectorAll('.chip.latest').forEach(chip => chip.classList.remove('latest'));
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

    /* ---------- 彩带 ---------- */
    function resizeConfetti() {
      if (!els.confetti) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      els.confetti.width = width * confetti.dpr;
      els.confetti.height = height * confetti.dpr;
      els.confetti.style.width = width + 'px';
      els.confetti.style.height = height + 'px';
      confetti.ctx = confetti.ctx || els.confetti.getContext('2d');
      confetti.ctx.setTransform(confetti.dpr, 0, 0, confetti.dpr, 0, 0);
    }

    function celebrate() {
      const colors = ['#f3cd49', '#5fc269', '#dc524b', '#4f80ee', '#855eee'];
      const width = window.innerWidth;
      const height = window.innerHeight;
      const originX = width / 2;
      const originY = height * 0.42;

      confetti.pieces = [];
      for (let i = 0; i < 100; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 5 + Math.random() * 10;
        confetti.pieces.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 6,
          size: 4 + Math.random() * 7,
          color: colors[i % colors.length],
          rotation: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 0.3,
          life: 0,
          ttl: 80 + Math.random() * 50
        });
      }

      if (confetti.raf) cancelAnimationFrame(confetti.raf);

      function frame() {
        const ctx = confetti.ctx;
        ctx.clearRect(0, 0, width, height);
        let alive = false;

        confetti.pieces.forEach(piece => {
          piece.life++;
          if (piece.life > piece.ttl) return;
          alive = true;
          piece.vy += 0.22;
          piece.vx *= 0.99;
          piece.vy *= 0.99;
          piece.x += piece.vx;
          piece.y += piece.vy;
          piece.rotation += piece.spin;

          const alpha = Math.max(0, 1 - piece.life / piece.ttl);
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(piece.x, piece.y);
          ctx.rotate(piece.rotation);
          ctx.fillStyle = piece.color;
          ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 0.6);
          ctx.restore();
        });

        if (alive) {
          confetti.raf = requestAnimationFrame(frame);
        } else {
          ctx.clearRect(0, 0, width, height);
          confetti.raf = null;
        }
      }

      resizeConfetti();
      confetti.raf = requestAnimationFrame(frame);
    }

    /* ---------- 生命周期 ---------- */
    function mount(mountRoot) {
      root = mountRoot;
      root.innerHTML = TEMPLATE;

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
        confetti: NamePicker.byRole(root, 'confetti'),
        topActions: NamePicker.byRole(root, 'top-actions'),
        settingsBtn: NamePicker.byRole(root, 'settings-trigger')
      };

      toast = NamePicker.ui.createToast(els.toast);
      resizeConfetti();

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
        resizeConfetti();
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
      if (confetti.raf) cancelAnimationFrame(confetti.raf);
      confetti.raf = null;
      confetti.pieces = [];
      confetti.ctx = null;
      els = {};
      root = null;
      lastState = null;
    }

    return {
      id: 'minimal',
      mount,
      unmount,
      render,
      tick,
      toast: (message, tone) => toast && toast(message, tone),
      celebrate,
      setDropActive(active) {
        if (els.dropMask) els.dropMask.classList.toggle('show', !!active);
      }
    };
  }

  NamePicker.skins.register({
    id: 'minimal',
    label: '简约',
    css: 'css/skins/minimal.css',
    themeColor: '#12172a',
    create: createMinimalSkin
  });
})();
