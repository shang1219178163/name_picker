/* 课堂随机提问点名器 · 前端逻辑 */
(function () {
  'use strict';

  const STORAGE_KEYS = {
    names: 'picker.names',
    picked: 'picker.picked'
  };

  const NAME_HEADERS = [
    '姓名', '名字', '学生姓名', '学生名字', '学生', '学员', '学员姓名',
    'name', 'student', 'studentname', 'fullname'
  ];

  const el = {
    fileInput: document.getElementById('fileInput'),
    importBtn: document.getElementById('importBtn'),
    rosterStat: document.getElementById('rosterStat'),
    nameDisplay: document.getElementById('nameDisplay'),
    panel: document.getElementById('panel'),
    toggleBtn: document.getElementById('toggleBtn'),
    resetAllBtn: document.getElementById('resetAllBtn'),
    clearPickedBtn: document.getElementById('clearPickedBtn'),
    historyList: document.getElementById('historyList'),
    historyEmpty: document.getElementById('historyEmpty'),
    dropMask: document.getElementById('dropMask'),
    toast: document.getElementById('toast'),
    confetti: document.getElementById('confetti')
  };

  const state = {
    names: loadJSON(STORAGE_KEYS.names, []),
    picked: loadJSON(STORAGE_KEYS.picked, []),
    latest: null,
    rolling: false,
    raf: null,
    pool: []
  };

  /* ---------- 工具 ---------- */
  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEYS.names, JSON.stringify(state.names));
      localStorage.setItem(STORAGE_KEYS.picked, JSON.stringify(state.picked));
    } catch (err) {
      /* 隐私模式下写入失败可忽略 */
    }
  }

  function randomIndex(max) {
    if (max <= 0) return 0;
    if (window.crypto && window.crypto.getRandomValues) {
      const limit = Math.floor(0xFFFFFFFF / max) * max;
      const buffer = new Uint32Array(1);
      let value;
      do {
        window.crypto.getRandomValues(buffer);
        value = buffer[0];
      } while (value >= limit);
      return value % max;
    }
    return Math.floor(Math.random() * max);
  }

  let toastTimer = null;
  function toast(message, type) {
    el.toast.textContent = message;
    el.toast.className = 'toast show' + (type === 'error' ? ' error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.toast.className = 'toast' + (type === 'error' ? ' error' : '');
    }, 2600);
  }

  /* ---------- 渲染 ---------- */
  function updateStat() {
    el.rosterStat.textContent = state.names.length
      ? `名单 ${state.names.length} 人 · 已点 ${state.picked.length} 人`
      : '名单 0 人';
  }

  function createChip(name, isLatest) {
    const chip = document.createElement('div');
    chip.className = 'chip' + (isLatest ? ' latest' : '');
    const text = document.createElement('span');
    text.textContent = name;
    chip.appendChild(text);
    return chip;
  }

  function renderHistory(options) {
    const animate = !options || options.animate !== false;
    el.historyList.innerHTML = '';
    state.picked.forEach((name, index) => {
      const chip = createChip(name, name === state.latest && index === state.picked.length - 1);
      if (!animate) chip.style.animation = 'none';
      el.historyList.appendChild(chip);
    });
    el.historyEmpty.style.display = state.picked.length ? 'none' : 'block';
  }

  function appendHistory(name) {
    const chips = el.historyList.querySelectorAll('.chip');
    chips.forEach(chip => chip.classList.remove('latest'));
    el.historyList.appendChild(createChip(name, true));
    el.historyEmpty.style.display = 'none';
  }

  function showPlaceholder(text) {
    el.nameDisplay.textContent = text;
    el.nameDisplay.classList.add('is-placeholder');
    el.nameDisplay.classList.remove('wrap');
    el.nameDisplay.style.fontSize = '';
  }

  function showName(name) {
    el.nameDisplay.textContent = name;
    el.nameDisplay.classList.remove('is-placeholder');
  }

  // 长姓名自动缩小字号，仍放不下时换行显示
  function fitName() {
    const node = el.nameDisplay;
    node.style.fontSize = '';
    node.classList.remove('wrap');
    if (node.classList.contains('is-placeholder')) return;
    const maxWidth = node.clientWidth;
    if (!maxWidth) return;
    let size = parseFloat(getComputedStyle(node).fontSize);
    let guard = 0;
    while (node.scrollWidth > maxWidth && size > 30 && guard++ < 80) {
      size -= 3;
      node.style.fontSize = size + 'px';
    }
    if (node.scrollWidth > maxWidth + 1) {
      node.classList.add('wrap');
      node.style.fontSize = Math.max(28, Math.min(size, 64)) + 'px';
    }
  }

  function setButtonState() {
    el.toggleBtn.textContent = state.rolling ? '停止选人' : '开始随机';
    el.toggleBtn.classList.toggle('start', !state.rolling);
    el.toggleBtn.classList.toggle('stop', state.rolling);
    el.toggleBtn.setAttribute('aria-pressed', String(state.rolling));
  }

  /* ---------- 点名 ---------- */
  function startRoll() {
    if (state.rolling) return;
    if (!state.names.length) {
      toast('请先导入 Excel 名单', 'error');
      return;
    }

    const pool = state.names.filter(name => !state.picked.includes(name));
    if (!pool.length) {
      toast('全部同学都点过了，请重置名单', 'error');
      return;
    }

    state.pool = pool;
    state.rolling = true;
    state.latest = null;
    el.historyList.querySelectorAll('.chip.latest').forEach(chip => chip.classList.remove('latest'));
    el.panel.classList.remove('settled');
    el.panel.classList.add('rolling');
    el.nameDisplay.classList.remove('is-placeholder', 'wrap');
    el.nameDisplay.style.fontSize = '';
    setButtonState();

    let lastShown = '';
    let lastTick = 0;
    function tick(now) {
      if (!state.rolling) return;
      if (now - lastTick >= 55) {
        lastTick = now;
        let candidate = pool[randomIndex(pool.length)];
        if (pool.length > 1 && candidate === lastShown) {
          candidate = pool[(pool.indexOf(candidate) + 1) % pool.length];
        }
        lastShown = candidate;
        showName(candidate);
      }
      state.raf = requestAnimationFrame(tick);
    }
    state.raf = requestAnimationFrame(tick);
  }

  function cancelRoll() {
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = null;
    state.rolling = false;
    el.panel.classList.remove('rolling');
    setButtonState();
  }

  function stopRoll() {
    if (!state.rolling) return;
    const pool = state.pool;
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = null;
    state.rolling = false;

    const name = pool[randomIndex(pool.length)];
    el.panel.classList.remove('rolling');
    el.panel.classList.add('settled');
    setButtonState();

    showName(name);
    requestAnimationFrame(fitName);
    state.picked.push(name);
    state.latest = name;
    appendHistory(name);
    updateStat();
    save();
    celebrate();
    scrollLatestIntoView();
  }

  function scrollLatestIntoView() {
    const chip = el.historyList.lastElementChild;
    if (chip) chip.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function resetAll() {
    if (state.rolling) cancelRoll();
    if (!state.picked.length && !state.names.length) {
      toast('还没有导入名单');
      return;
    }
    state.picked = [];
    state.latest = null;
    el.panel.classList.remove('settled', 'rolling');
    showPlaceholder('准备开始');
    renderHistory({ animate: false });
    updateStat();
    save();
    toast('已重置全部名单');
  }

  function clearPicked() {
    if (state.rolling) cancelRoll();
    if (!state.picked.length) {
      toast('还没有已点记录');
      return;
    }
    state.picked = [];
    state.latest = null;
    renderHistory({ animate: false });
    updateStat();
    save();
    toast('已点记录已清空');
  }

  /* ---------- 彩带 ---------- */
  const confetti = {
    ctx: el.confetti.getContext('2d'),
    pieces: [],
    raf: null,
    dpr: Math.min(window.devicePixelRatio || 1, 2)
  };

  function resizeConfetti() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    el.confetti.width = width * confetti.dpr;
    el.confetti.height = height * confetti.dpr;
    el.confetti.style.width = width + 'px';
    el.confetti.style.height = height + 'px';
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

  /* ---------- Excel 导入 ---------- */
  function normalizeHeader(value) {
    return String(value || '').replace(/\s+/g, '').toLowerCase();
  }

  function looksLikeName(value) {
    const text = String(value == null ? '' : value).trim();
    if (!text || text.length > 24) return false;
    if (/^\d+(\.\d+)?$/.test(text)) return false;
    if (/^[\d\s\-/:年月日.]+$/.test(text)) return false;
    return /[一-龥a-zA-Z]/.test(text);
  }

  function parseNamesFromRows(rows) {
    if (!rows.length) return [];

    let nameColumn = -1;
    let startRow = 0;

    for (let r = 0; r < Math.min(rows.length, 8) && nameColumn === -1; r++) {
      const row = rows[r] || [];
      for (let c = 0; c < row.length; c++) {
        if (NAME_HEADERS.includes(normalizeHeader(row[c]))) {
          nameColumn = c;
          startRow = r + 1;
          break;
        }
      }
    }

    if (nameColumn === -1) {
      // 无表头时，选取“文本内容最多”的一列，避免误取学号/序号列
      const widths = [];
      rows.forEach(row => {
        (row || []).forEach((cell, c) => {
          widths[c] = widths[c] || 0;
          if (looksLikeName(cell) && !NAME_HEADERS.includes(normalizeHeader(cell))) {
            widths[c] += 1;
          }
        });
      });
      let best = 0;
      widths.forEach((score, c) => {
        if (score > (widths[best] || 0)) best = c;
      });
      nameColumn = best;
      const firstCell = (rows[0] || [])[nameColumn];
      if (NAME_HEADERS.includes(normalizeHeader(firstCell))) startRow = 1;
    }

    const names = [];
    const seen = new Set();
    for (let r = startRow; r < rows.length; r++) {
      const row = rows[r] || [];
      const value = row[nameColumn];
      if (!looksLikeName(value)) continue;
      const name = String(value).trim();
      if (NAME_HEADERS.includes(normalizeHeader(name))) continue;
      if (seen.has(name)) continue;
      seen.add(name);
      names.push(name);
    }
    return names;
  }

  function decodeText(buffer) {
    const bytes = new Uint8Array(buffer);
    if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
      return new TextDecoder('utf-8').decode(bytes.subarray(3));
    }
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch (err) {
      // 兼容 Excel 导出的 GBK 编码 CSV
      return new TextDecoder('gbk').decode(bytes);
    }
  }

  function readSheet(file) {
    if (!window.XLSX) {
      toast('Excel 解析库未加载，请检查 vendor/xlsx.full.min.js', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const isCsv = /\.csv$/i.test(file.name);
        const workbook = isCsv
          ? XLSX.read(decodeText(event.target.result), { type: 'string' })
          : XLSX.read(new Uint8Array(event.target.result), { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '', raw: false });
        const names = parseNamesFromRows(rows);

        if (!names.length) {
          toast('没有在表格中找到姓名，请检查第一张工作表', 'error');
          return;
        }

        importNames(names, file.name);
      } catch (err) {
        console.error(err);
        toast('文件解析失败，请确认是有效的 Excel 文件', 'error');
      }
    };
    reader.onerror = () => toast('文件读取失败，请重试', 'error');
    reader.readAsArrayBuffer(file);
  }

  function importNames(names, source) {
    if (state.rolling) cancelRoll();
    state.names = names.slice(0, 2000);
    state.picked = [];
    state.latest = null;
    el.panel.classList.remove('settled', 'rolling');
    showPlaceholder('准备开始');
    renderHistory({ animate: false });
    updateStat();
    save();
    toast(source ? `已从「${source}」导入 ${state.names.length} 人` : `已载入 ${state.names.length} 人`);
  }

  /* ---------- 事件 ---------- */
  el.importBtn.addEventListener('click', () => el.fileInput.click());

  el.fileInput.addEventListener('change', () => {
    const file = el.fileInput.files && el.fileInput.files[0];
    if (file) readSheet(file);
    el.fileInput.value = '';
  });

  el.toggleBtn.addEventListener('click', () => {
    if (state.rolling) {
      stopRoll();
    } else {
      startRoll();
    }
  });
  el.resetAllBtn.addEventListener('click', resetAll);
  el.clearPickedBtn.addEventListener('click', clearPicked);

  el.panel.addEventListener('click', () => {
    if (state.rolling) stopRoll();
  });

  document.addEventListener('keydown', event => {
    const tag = (event.target.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'SELECT' || event.target.isContentEditable) return;
    if (event.code === 'Space' || event.key === ' ') {
      event.preventDefault();
      if (state.rolling) {
        stopRoll();
      } else {
        startRoll();
      }
    }
  });

  /* 拖拽导入 */
  let dragDepth = 0;

  window.addEventListener('dragenter', event => {
    event.preventDefault();
    dragDepth++;
    el.dropMask.classList.add('show');
  });

  window.addEventListener('dragover', event => {
    event.preventDefault();
  });

  window.addEventListener('dragleave', event => {
    event.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (!dragDepth) el.dropMask.classList.remove('show');
  });

  window.addEventListener('drop', event => {
    event.preventDefault();
    dragDepth = 0;
    el.dropMask.classList.remove('show');
    const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    if (!file) return;
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      toast('请拖入 .xlsx / .xls / .csv 文件', 'error');
      return;
    }
    readSheet(file);
  });

  window.addEventListener('resize', () => {
    resizeConfetti();
    if (!state.rolling) fitName();
  });

  /* ---------- 初始化 ---------- */
  function init() {
    resizeConfetti();

    const nameSet = new Set(state.names);
    state.picked = state.picked.filter(name => nameSet.has(name));
    state.latest = state.picked.length ? state.picked[state.picked.length - 1] : null;

    renderHistory({ animate: false });
    updateStat();

    if (state.latest) {
      showName(state.latest);
      requestAnimationFrame(fitName);
    } else {
      showPlaceholder('准备开始');
    }

    setButtonState();
  }

  init();
})();
