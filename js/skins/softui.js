/* 点名器 · 新拟态 Soft UI 皮肤：浅色柔影 + 内外双向阴影 */
(function () {
  'use strict';

  const NamePicker = window.NamePicker;

  const TEMPLATE = `
    <div class="soft-app">
      <header class="soft-top">
        <span class="soft-stat" data-np-role="roster-stat">名单 0 人</span>
        <h1 class="soft-title">点名器</h1>
        <div class="soft-actions" data-np-role="top-actions">
          <button class="soft-icon" data-np-role="settings-trigger" type="button" aria-label="设置" aria-expanded="false" aria-controls="settingsMenu">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </header>

      <main class="soft-panel" data-np-role="panel">
        <div class="soft-screen">
          <div class="soft-name is-placeholder" data-np-role="name" aria-live="polite">准备开始</div>
        </div>
      </main>

      <section class="soft-controls" aria-label="点名操作">
        <button class="soft-btn soft-btn-primary" id="toggleBtn" data-np-role="toggle" type="button" aria-pressed="false">开始随机</button>
        <button class="soft-btn" id="resetBtn" data-np-role="reset" type="button">重置记录</button>
      </section>

      <section class="soft-history">
        <h2 class="soft-history-title">已提问过的同学</h2>
        <div class="soft-chips" data-np-role="history"></div>
        <p class="soft-empty" data-np-role="history-empty">暂无记录</p>
      </section>
    </div>

    <div class="soft-drop" data-np-role="drop-mask"><span>松开即可导入</span></div>
    <div class="toast" data-np-role="toast" role="status"></div>
  `;

  NamePicker.skins.register({
    id: 'softui',
    label: '新拟态',
    css: 'css/skins/softui.css',
    themeColor: '#e8ecf3',
    create: NamePicker.createSimpleSkin({
      id: 'softui',
      template: TEMPLATE,
      classes: { chip: 'soft-chip' },
      fit: { min: 28, max: 100, step: 4 },
      celebrateClass: 'is-celebrating'
    })
  });
})();
