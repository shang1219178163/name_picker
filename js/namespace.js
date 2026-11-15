/* 点名器 · 全局命名空间：存储、皮肤注册表、监听清理器 */
(function () {
  'use strict';

  const NamePicker = window.NamePicker = window.NamePicker || {};

  /* ---------- 本地存储 ---------- */
  const storage = {
    getJSON(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (err) {
        return fallback;
      }
    },
    setJSON(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (err) {
        /* 隐私模式下写入失败可忽略 */
        return false;
      }
    }
  };

  /* ---------- 皮肤注册表 ---------- */
  const registry = new Map();

  const skins = {
    register(def) {
      if (!def || !def.id || typeof def.create !== 'function') {
        throw new Error('皮肤注册需要 id 与 create()');
      }
      registry.set(def.id, def);
    },
    get(id) {
      return registry.get(id) || null;
    },
    has(id) {
      return registry.has(id);
    },
    list() {
      return Array.from(registry.values()).map(def => ({ id: def.id, label: def.label || def.id }));
    }
  };

  /* ---------- 监听/定时器清理器 ---------- */
  function createDisposer() {
    const tasks = [];
    return {
      add(fn) {
        tasks.push(fn);
        return fn;
      },
      on(target, type, handler, options) {
        target.addEventListener(type, handler, options);
        tasks.push(() => target.removeEventListener(type, handler, options));
      },
      timer(id) {
        tasks.push(() => clearTimeout(id));
        return id;
      },
      interval(id) {
        tasks.push(() => clearInterval(id));
        return id;
      },
      dispose() {
        while (tasks.length) {
          const task = tasks.pop();
          try {
            task();
          } catch (err) {
            console.error(err);
          }
        }
      }
    };
  }

  /* ---------- 作用域查询 ---------- */
  function byRole(root, role) {
    return root.querySelector('[data-np-role="' + role + '"]');
  }

  function allByRole(root, role) {
    return Array.from(root.querySelectorAll('[data-np-role="' + role + '"]'));
  }

  NamePicker.storage = storage;
  NamePicker.skins = skins;
  NamePicker.createDisposer = createDisposer;
  NamePicker.byRole = byRole;
  NamePicker.allByRole = allByRole;
})();
