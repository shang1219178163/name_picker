/* 点名器 · 核心：名单状态、存储、导入解析、点名规则。不接触页面 DOM */
(function () {
  'use strict';

  const NamePicker = window.NamePicker;

  const STORAGE_KEYS = {
    names: 'picker.names',
    picked: 'picker.picked'
  };

  const NAME_HEADERS = [
    '姓名', '名字', '学生姓名', '学生名字', '学生', '学员', '学员姓名',
    'name', 'student', 'studentname', 'fullname'
  ];

  const SUPPORTED_FILE = /\.(xlsx|xls|csv)$/i;

  function cryptoRandomIndex(max) {
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
      // 无表头时，选取"文本内容最多"的一列，避免误取学号/序号列
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

  function sanitizeNames(list) {
    const names = [];
    const seen = new Set();
    (Array.isArray(list) ? list : []).forEach(value => {
      const name = String(value == null ? '' : value).trim();
      if (!name || seen.has(name)) return;
      seen.add(name);
      names.push(name);
    });
    return names.slice(0, 2000);
  }

  function createCore(options) {
    const opts = options || {};
    const storage = opts.storage || NamePicker.storage;
    const raf = opts.raf || window.requestAnimationFrame.bind(window);
    const caf = opts.caf || window.cancelAnimationFrame.bind(window);
    const randomIndex = opts.randomIndex || cryptoRandomIndex;

    const listeners = new Set();

    const state = {
      names: sanitizeNames(storage.getJSON(STORAGE_KEYS.names, [])),
      picked: storage.getJSON(STORAGE_KEYS.picked, []),
      latest: null,
      rolling: false,
      phase: 'idle',
      pool: [],
      raf: null
    };

    // 恢复时剔除名单里已不存在的历史记录
    const nameSet = new Set(state.names);
    state.picked = (Array.isArray(state.picked) ? state.picked : []).filter(name => nameSet.has(name));
    state.latest = state.picked.length ? state.picked[state.picked.length - 1] : null;

    function emit(event) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (err) {
          console.error(err);
        }
      });
    }

    function getSnapshot() {
      return {
        names: state.names.slice(),
        picked: state.picked.slice(),
        latest: state.latest,
        rolling: state.rolling,
        phase: state.phase,
        counts: {
          names: state.names.length,
          picked: state.picked.length,
          remaining: Math.max(0, state.names.length - state.picked.length)
        }
      };
    }

    function emitState(reason, extra) {
      const change = Object.assign({ reason }, extra || {});
      emit({ type: 'state', state: getSnapshot(), change });
    }

    function notify(message, tone) {
      emit({ type: 'toast', message, tone: tone || 'info' });
    }

    function save() {
      storage.setJSON(STORAGE_KEYS.names, state.names);
      storage.setJSON(STORAGE_KEYS.picked, state.picked);
    }

    function cancelLoop() {
      if (state.raf) caf(state.raf);
      state.raf = null;
      state.pool = [];
      state.rolling = false;
    }

    function startRoll() {
      if (state.rolling) return;
      if (!state.names.length) {
        notify('请先导入 Excel 名单', 'error');
        return;
      }

      const pool = state.names.filter(name => !state.picked.includes(name));
      if (!pool.length) {
        notify('全部同学都点过了，请重置记录', 'error');
        return;
      }

      state.pool = pool;
      state.rolling = true;
      state.phase = 'rolling';
      state.latest = null;
      emitState('start');

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
          emit({ type: 'tick', name: candidate });
        }
        state.raf = raf(tick);
      }
      state.raf = raf(tick);
    }

    function stopRoll() {
      if (!state.rolling) return;
      const pool = state.pool;
      if (state.raf) caf(state.raf);
      state.raf = null;
      state.rolling = false;

      const name = pool[randomIndex(pool.length)];
      state.pool = [];
      state.phase = 'settled';
      state.picked.push(name);
      state.latest = name;
      save();

      emitState('stop', { appendedName: name });
      emit({ type: 'celebrate' });
    }

    function cancelRoll() {
      if (!state.rolling) {
        if (state.raf) caf(state.raf);
        state.raf = null;
        return;
      }
      cancelLoop();
      state.phase = 'idle';
      emitState('cancel');
    }

    function toggleRoll() {
      if (state.rolling) {
        stopRoll();
      } else {
        startRoll();
      }
    }

    function resetRecords() {
      cancelLoop();
      if (!state.picked.length && !state.names.length) {
        notify('还没有导入名单');
        return;
      }
      state.picked = [];
      state.latest = null;
      state.phase = 'idle';
      save();
      emitState('reset');
      notify('已重置记录');
    }

    function importNames(names, source) {
      const clean = sanitizeNames(names);
      if (!clean.length) {
        notify('没有在表格中找到姓名，请检查第一张工作表', 'error');
        return;
      }
      cancelLoop();
      state.names = clean;
      state.picked = [];
      state.latest = null;
      state.phase = 'idle';
      save();
      emitState('import', { source: source || '' });
      notify(source ? `已从「${source}」导入 ${state.names.length} 人` : `已载入 ${state.names.length} 人`);
    }

    function importFile(file) {
      if (!window.XLSX) {
        notify('Excel 解析库未加载，请检查 vendor/xlsx.full.min.js', 'error');
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
            notify('没有在表格中找到姓名，请检查第一张工作表', 'error');
            return;
          }

          importNames(names, file.name);
        } catch (err) {
          console.error(err);
          notify('文件解析失败，请确认是有效的 Excel 文件', 'error');
        }
      };
      reader.onerror = () => notify('文件读取失败，请重试', 'error');
      reader.readAsArrayBuffer(file);
    }

    function subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }

    function destroy() {
      cancelLoop();
      listeners.clear();
    }

    return {
      getSnapshot,
      subscribe,
      startRoll,
      stopRoll,
      toggleRoll,
      cancelRoll,
      resetRecords,
      importNames,
      importFile,
      notify,
      destroy
    };
  }

  NamePicker.createCore = createCore;
  NamePicker.isSupportedFile = file => !!file && SUPPORTED_FILE.test(file.name);
})();
