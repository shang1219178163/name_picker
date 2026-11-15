/* 点名器 · 经典星空皮肤：现有界面、星空/流星、彩带与动态参数 */
(function () {
  'use strict';

  const NamePicker = window.NamePicker;

  const LEGACY_MOTION_KEY = 'picker.motion';
  const SETTINGS_VERSION = 1;

  const TEMPLATE = `
    <div class="aurora" aria-hidden="true"><span></span><span></span><span></span></div>
    <canvas class="twinkles" id="twinkles" data-np-role="twinkles" aria-hidden="true"></canvas>
    <div class="meteors" aria-hidden="true"><span></span></div>

    <div class="app">
      <header class="topbar">
        <span class="roster-stat" id="rosterStat" data-np-role="roster-stat">名单 0 人</span>
        <h1 class="title">点名器</h1>
        <div class="top-actions" data-np-role="top-actions">
          <button class="icon-btn" id="settingsBtn" data-np-role="settings-trigger" type="button" aria-label="设置" aria-expanded="false" aria-controls="settingsMenu">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </header>

      <main class="panel" id="panel" data-np-role="panel">
        <div class="name" id="nameDisplay" data-np-role="name" aria-live="polite">准备开始</div>
      </main>

      <section class="controls" aria-label="点名操作">
        <button class="ctrl start" id="toggleBtn" data-np-role="toggle" type="button" aria-pressed="false">开始随机</button>
        <button class="ctrl reset" id="resetBtn" data-np-role="reset" type="button">重置记录</button>
      </section>

      <section class="history">
        <h2 class="history-title">已提问过的同学：</h2>
        <div class="history-list" id="historyList" data-np-role="history"></div>
        <p class="history-empty" id="historyEmpty" data-np-role="history-empty">暂无记录</p>
      </section>
    </div>

    <div class="drop-mask" id="dropMask" data-np-role="drop-mask">
      <div class="drop-box">
        <strong>松开即可导入</strong>
        <span>支持 .xlsx / .xls / .csv</span>
      </div>
    </div>

    <div class="toast" id="toast" data-np-role="toast" role="status"></div>
    <canvas class="confetti" id="confetti" data-np-role="confetti" aria-hidden="true"></canvas>
  `;

  const MOTION_DEFAULTS = {
    meteorCycle: 5,
    meteorHead: 9,
    starCount: 100,
    twinkleSpeed: 1,
    auroraSpeed: 1
  };

  // 背景星默认密度：约每 900px² 一颗（桌面约 1300 颗，手机约 280 颗）
  function defaultBaseStarCount() {
    const raw = Math.round((innerWidth * innerHeight) / 900 / 100) * 100;
    return Math.min(2000, Math.max(100, raw));
  }

  const MOTION_FIELDS = [
    { key: 'meteorCycle', label: '流星间隔', inputId: 'optMeteorCycle', outputId: 'valMeteorCycle', min: 3, max: 12, step: 0.5, format: v => v.toFixed(1) + 's' },
    { key: 'meteorHead', label: '流星头部大小', inputId: 'optMeteorHead', outputId: 'valMeteorHead', min: 4, max: 20, step: 1, format: v => v.toFixed(0) + 'px' },
    { key: 'baseStarCount', label: '背景星数量', inputId: 'optBaseStarCount', outputId: 'valBaseStarCount', min: 0, max: 2000, step: 100, format: v => v.toFixed(0) + ' 颗' },
    { key: 'starCount', label: '闪烁星数量', inputId: 'optStarCount', outputId: 'valStarCount', min: 100, max: 1000, step: 100, format: v => v.toFixed(0) + ' 颗' },
    { key: 'twinkleSpeed', label: '星点呼吸速度', inputId: 'optTwinkleSpeed', outputId: 'valTwinkleSpeed', min: 0.5, max: 2.5, step: 0.05, format: v => v.toFixed(2) + '×' },
    { key: 'auroraSpeed', label: '极光流动速度', inputId: 'optAuroraSpeed', outputId: 'valAuroraSpeed', min: 0.5, max: 2, step: 0.05, format: v => v.toFixed(2) + '×' }
  ];

  function loadMotion(storage) {
    // 新格式：picker.settings.classic = { version, effects: {...} }
    // 兼容旧版本：picker.motion = {...}
    const saved = NamePicker.settings.get('classic', null);
    const legacy = storage.getJSON(LEGACY_MOTION_KEY, {});
    const source = saved && saved.effects ? saved.effects : (saved || legacy);
    const stored = source && typeof source === 'object' ? source : {};

    const motion = Object.assign({}, MOTION_DEFAULTS, stored);
    // 兼容旧版本保存的星点数量（0/自动、200 以内）
    motion.starCount = Math.min(1000, Math.max(100, Math.round(motion.starCount) || 100));
    // 背景星：没保存过就按屏幕面积给默认值
    motion.baseStarCount = Number.isFinite(stored.baseStarCount)
      ? Math.min(2000, Math.max(0, Math.round(stored.baseStarCount)))
      : defaultBaseStarCount();
    return motion;
  }

  function createClassicSkin(ctx) {
    const storage = ctx.storage;
    const disposer = NamePicker.createDisposer();
    let root = null;
    let els = {};
    let lastState = null;
    let toast = null;
    let settingsPanel = null;
    let motionDirty = false;
    let twinkleResizeTimer = null;

    const motion = loadMotion(storage);

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
      els.historyList.innerHTML = '';
      state.picked.forEach((name, index) => {
        const chip = createChip(name, name === state.latest && index === state.picked.length - 1);
        if (!animate) chip.style.animation = 'none';
        els.historyList.appendChild(chip);
      });
      els.historyEmpty.style.display = state.picked.length ? 'none' : 'block';
    }

    function appendHistory(name) {
      els.historyList.querySelectorAll('.chip.latest').forEach(chip => chip.classList.remove('latest'));
      els.historyList.appendChild(createChip(name, true));
      els.historyEmpty.style.display = 'none';
    }

    function showPlaceholder(text) {
      els.nameDisplay.textContent = text;
      els.nameDisplay.classList.add('is-placeholder');
      els.nameDisplay.classList.remove('wrap');
      els.nameDisplay.style.fontSize = '';
    }

    function showName(name) {
      els.nameDisplay.textContent = name;
      els.nameDisplay.classList.remove('is-placeholder');
    }

    function fitName() {
      NamePicker.ui.fitText(els.nameDisplay);
    }

    function scrollLatestIntoView() {
      NamePicker.ui.scrollIntoView(els.historyList.lastElementChild);
    }

    function render(state, change) {
      lastState = state;
      const reason = (change && change.reason) || 'init';

      els.rosterStat.textContent = state.counts.names
        ? `名单 ${state.counts.names} 人 · 已点 ${state.counts.picked} 人`
        : '名单 0 人';

      els.toggleBtn.textContent = state.rolling ? '停止选人' : '开始随机';
      els.toggleBtn.classList.toggle('start', !state.rolling);
      els.toggleBtn.classList.toggle('stop', state.rolling);
      els.toggleBtn.setAttribute('aria-pressed', String(state.rolling));

      els.panel.classList.toggle('rolling', state.rolling);
      // 切换皮肤时重放定格动画没有意义，只保留结果
      els.panel.classList.toggle('settled', state.phase === 'settled' && reason !== 'skin');

      if (state.rolling) {
        els.nameDisplay.classList.remove('is-placeholder', 'wrap');
        els.nameDisplay.style.fontSize = '';
      } else if (state.latest) {
        showName(state.latest);
        requestAnimationFrame(fitName);
      } else {
        showPlaceholder('准备开始');
      }

      if (reason === 'start') {
        els.historyList.querySelectorAll('.chip.latest').forEach(chip => chip.classList.remove('latest'));
      } else if (reason === 'stop' && change && change.appendedName) {
        appendHistory(change.appendedName);
        requestAnimationFrame(scrollLatestIntoView);
      } else {
        const animate = !['init', 'import', 'reset', 'cancel', 'skin'].includes(reason);
        renderHistory(state, animate);
      }
    }

    function tick(name) {
      showName(name);
    }

    /* ---------- 动态参数 ---------- */
    function applyMotion() {
      const target = root || els.app;
      if (!target) return;
      target.style.setProperty('--meteor-cycle', motion.meteorCycle + 's');
      target.style.setProperty('--meteor-head', motion.meteorHead + 'px');
      target.style.setProperty('--twinkle-speed', String(motion.twinkleSpeed));
      target.style.setProperty('--aurora-speed', String(motion.auroraSpeed));
    }

    function saveMotion() {
      NamePicker.settings.set('classic', {
        version: SETTINGS_VERSION,
        effects: {
          meteorCycle: motion.meteorCycle,
          meteorHead: motion.meteorHead,
          baseStarCount: motion.baseStarCount,
          starCount: motion.starCount,
          twinkleSpeed: motion.twinkleSpeed,
          auroraSpeed: motion.auroraSpeed
        }
      });
      motionDirty = false;
    }

    const motionInputs = {};

    function buildMotionSection() {
      const frag = document.createDocumentFragment();
      MOTION_FIELDS.forEach(field => {
        const label = document.createElement('label');
        label.className = 'setting';

        const name = document.createElement('span');
        name.textContent = field.label;

        const output = document.createElement('output');
        output.id = field.outputId;
        output.textContent = field.format(motion[field.key]);

        const input = document.createElement('input');
        input.type = 'range';
        input.id = field.inputId;
        input.min = field.min;
        input.max = field.max;
        input.step = field.step;
        input.value = motion[field.key];

        input.addEventListener('input', () => {
          const value = Number(input.value);
          const isStarField = field.key === 'starCount' || field.key === 'baseStarCount';
          const starsChanged = isStarField && value !== motion[field.key];
          motion[field.key] = value;
          output.textContent = field.format(value);
          applyMotion();
          if (starsChanged) buildTwinkles();
          motionDirty = true;
        });

        motionInputs[field.key] = { input, output };
        label.append(name, output, input);
        frag.appendChild(label);
      });
      return frag;
    }

    function refreshMotionInputs() {
      MOTION_FIELDS.forEach(field => {
        const pair = motionInputs[field.key];
        if (!pair) return;
        pair.input.value = motion[field.key];
        pair.output.textContent = field.format(motion[field.key]);
      });
    }

    /* ---------- 彩带 ---------- */
    const confetti = {
      ctx: null,
      pieces: [],
      raf: null,
      dpr: Math.min(window.devicePixelRatio || 1, 2)
    };

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

    /* ---------- 呼吸星 ---------- */
    const twinkle = {
      canvas: null,
      ctx: null,
      sprite: null,
      baseCanvas: null,
      stars: [],
      width: 0,
      height: 0,
      raf: null,
      last: 0
    };

    function makeStarSprite() {
      const size = 64;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.24, 'rgba(255, 255, 255, 0.95)');
      gradient.addColorStop(0.5, 'rgba(198, 228, 255, 0.32)');
      gradient.addColorStop(1, 'rgba(170, 210, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
      return canvas;
    }

    function buildBaseStars() {
      const count = Math.round(motion.baseStarCount);
      if (!count) {
        twinkle.baseCanvas = null;
        return;
      }
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(twinkle.width * dpr);
      canvas.height = Math.round(twinkle.height * dpr);
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (let i = 0; i < count; i++) {
        const big = Math.random() < 0.08;
        const size = big ? 1.6 + Math.random() * 1.4 : 0.4 + Math.random() * 1;
        const draw = size * 4.2;
        ctx.globalAlpha = 0.4 + Math.random() * 0.6;
        ctx.drawImage(
          twinkle.sprite,
          Math.random() * twinkle.width - draw / 2,
          Math.random() * twinkle.height - draw / 2,
          draw,
          draw
        );
      }
      twinkle.baseCanvas = canvas;
    }

    function drawTwinkles(now, still) {
      const ctx = twinkle.ctx;
      if (!ctx) return;
      ctx.clearRect(0, 0, twinkle.width, twinkle.height);
      const t = (now / 1000) * motion.twinkleSpeed;

      if (twinkle.baseCanvas) {
        // 背景星：整层缓慢呼吸，一次性绘制离屏画布
        ctx.globalAlpha = still ? 0.8 : 0.6 + 0.28 * (0.5 + 0.5 * Math.sin(t * 0.7));
        ctx.drawImage(twinkle.baseCanvas, 0, 0, twinkle.width, twinkle.height);
      }

      for (let i = 0; i < twinkle.stars.length; i++) {
        const star = twinkle.stars[i];
        const breath = still ? 0.7 : 0.12 + 0.88 * (0.5 + 0.5 * Math.sin(t * star.speed + star.phase));
        const draw = star.size * 4.2 * (0.55 + 0.45 * breath);
        ctx.globalAlpha = breath;
        ctx.drawImage(twinkle.sprite, star.x - draw / 2, star.y - draw / 2, draw, draw);
      }
      ctx.globalAlpha = 1;
    }

    function twinkleFrame(now) {
      if (now - twinkle.last >= 33) {
        drawTwinkles(now, false);
        twinkle.last = now;
      }
      twinkle.raf = requestAnimationFrame(twinkleFrame);
    }

    function startTwinkles() {
      if (twinkle.raf) return;
      twinkle.raf = requestAnimationFrame(twinkleFrame);
    }

    function stopTwinkles() {
      if (twinkle.raf) cancelAnimationFrame(twinkle.raf);
      twinkle.raf = null;
    }

    function buildTwinkles() {
      if (!twinkle.canvas) return;
      twinkle.ctx = twinkle.ctx || twinkle.canvas.getContext('2d');
      twinkle.sprite = twinkle.sprite || makeStarSprite();

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      twinkle.width = innerWidth;
      twinkle.height = innerHeight;
      twinkle.canvas.width = Math.round(innerWidth * dpr);
      twinkle.canvas.height = Math.round(innerHeight * dpr);
      twinkle.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      buildBaseStars();

      const count = Math.round(motion.starCount);
      twinkle.stars.length = 0;
      for (let i = 0; i < count; i++) {
        const big = Math.random() < 0.1;
        twinkle.stars.push({
          x: Math.random() * twinkle.width,
          y: Math.random() * twinkle.height,
          size: big ? 2.2 + Math.random() * 1.6 : 0.7 + Math.random() * 1.1,
          speed: (Math.PI * 2) / (1.2 + Math.random() * 2.4),
          phase: Math.random() * Math.PI * 2
        });
      }

      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        stopTwinkles();
        drawTwinkles(0, true);
      } else {
        drawTwinkles(performance.now(), false);
        startTwinkles();
      }
    }

    /* ---------- 生命周期 ---------- */
    function cacheElements() {
      els = {
        app: root.querySelector('.app'),
        rosterStat: NamePicker.byRole(root, 'roster-stat'),
        panel: NamePicker.byRole(root, 'panel'),
        nameDisplay: NamePicker.byRole(root, 'name'),
        toggleBtn: NamePicker.byRole(root, 'toggle'),
        resetBtn: NamePicker.byRole(root, 'reset'),
        historyList: NamePicker.byRole(root, 'history'),
        historyEmpty: NamePicker.byRole(root, 'history-empty'),
        dropMask: NamePicker.byRole(root, 'drop-mask'),
        toast: NamePicker.byRole(root, 'toast'),
        confetti: NamePicker.byRole(root, 'confetti'),
        twinkles: NamePicker.byRole(root, 'twinkles'),
        topActions: NamePicker.byRole(root, 'top-actions'),
        settingsBtn: NamePicker.byRole(root, 'settings-trigger')
      };
      twinkle.canvas = els.twinkles;
    }

    function mount(mountRoot) {
      root = mountRoot;
      root.innerHTML = TEMPLATE;
      cacheElements();

      toast = NamePicker.ui.createToast(els.toast);
      applyMotion();
      buildTwinkles();

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
        sections: [{ build: buildMotionSection }],
        onImport: ctx.app.pickFile,
        onReset: () => {
          Object.assign(motion, MOTION_DEFAULTS);
          motion.baseStarCount = defaultBaseStarCount();
          refreshMotionInputs();
          applyMotion();
          buildTwinkles();
          motionDirty = true;
        },
        onClose: () => {
          if (motionDirty) saveMotion();
        }
      });

      disposer.on(els.toggleBtn, 'click', () => ctx.core.toggleRoll());
      disposer.on(els.resetBtn, 'click', () => ctx.core.resetRecords());
      disposer.on(els.panel, 'click', () => {
        if (ctx.core.getSnapshot().rolling) ctx.core.stopRoll();
      });

      disposer.on(window, 'resize', () => {
        resizeConfetti();
        if (!lastState || !lastState.rolling) requestAnimationFrame(fitName);
        clearTimeout(twinkleResizeTimer);
        twinkleResizeTimer = setTimeout(buildTwinkles, 180);
      });
      disposer.add(() => clearTimeout(twinkleResizeTimer));

      disposer.on(document, 'visibilitychange', () => {
        if (document.hidden) {
          if (motionDirty) saveMotion();
          stopTwinkles();
        } else if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
          startTwinkles();
        }
      });
      // 页面关闭/刷新前也落盘，避免未关闭抽屉就丢失改动
      disposer.on(window, 'pagehide', () => {
        if (motionDirty) saveMotion();
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
      stopTwinkles();
      twinkle.stars.length = 0;
      twinkle.baseCanvas = null;
      twinkle.sprite = null;
      twinkle.ctx = null;
      twinkle.canvas = null;
      els = {};
      root = null;
      lastState = null;
    }

    return {
      id: 'classic',
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
    id: 'classic',
    label: '经典星空',
    css: 'css/skins/classic.css',
    themeColor: '#0b1228',
    create: createClassicSkin
  });
})();
