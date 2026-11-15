/* 点名器 · AI 原生 UI 皮肤：浅色底 + 虹彩渐变与柔和光晕 */
(function () {
  'use strict';

  const NamePicker = window.NamePicker;

  const TEMPLATE = `
    <div class="ai-app">
      <div class="ai-aurora" aria-hidden="true"></div>

      <header class="ai-top">
        <span class="ai-stat" data-np-role="roster-stat">名单 0 人</span>
        <h1 class="ai-title"><span class="ai-mark" aria-hidden="true"></span>点名器</h1>
        <div class="ai-actions" data-np-role="top-actions">
          <button class="ai-icon" data-np-role="settings-trigger" type="button" aria-label="设置" aria-expanded="false" aria-controls="settingsMenu">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </header>

      <main class="ai-panel" data-np-role="panel">
        <div class="ai-ring" aria-hidden="true"></div>
        <div class="ai-name is-placeholder" data-np-role="name" aria-live="polite">准备开始</div>
      </main>

      <section class="ai-controls" aria-label="点名操作">
        <button class="ai-btn ai-btn-primary" id="toggleBtn" data-np-role="toggle" type="button" aria-pressed="false">开始随机</button>
        <button class="ai-btn ai-btn-ghost" id="resetBtn" data-np-role="reset" type="button">重置记录</button>
      </section>

      <section class="ai-history">
        <h2 class="ai-history-title">已提问过的同学</h2>
        <div class="ai-chips" data-np-role="history"></div>
        <p class="ai-empty" data-np-role="history-empty">暂无记录</p>
      </section>
    </div>

    <div class="ai-drop" data-np-role="drop-mask"><span>松开即可导入</span></div>
    <div class="toast" data-np-role="toast" role="status"></div>
  `;

  NamePicker.skins.register({
    id: 'ainative',
    label: 'AI 原生',
    css: 'css/skins/ainative.css',
    themeColor: '#f7f7fb',
    create: NamePicker.createSimpleSkin({
      id: 'ainative',
      template: TEMPLATE,
      classes: { chip: 'ai-chip' },
      fit: { min: 26, max: 98, step: 4 },
      celebrateClass: 'is-celebrating'
    })
  });
})();
