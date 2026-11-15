/* 点名器 · 便当盒网格皮肤：大小不一的模块卡片 */
(function () {
  'use strict';

  const NamePicker = window.NamePicker;

  const TEMPLATE = `
    <div class="bento-app">
      <header class="bento-top">
        <div class="bento-brand">
          <h1 class="bento-title">点名器</h1>
          <span class="bento-stat" data-np-role="roster-stat">名单 0 人</span>
        </div>
        <div class="bento-actions" data-np-role="top-actions">
          <button class="bento-icon" data-np-role="settings-trigger" type="button" aria-label="设置" aria-expanded="false" aria-controls="settingsMenu">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </header>

      <div class="bento-grid">
        <section class="bento-tile bento-name-tile" data-np-role="panel">
          <div class="bento-name is-placeholder" data-np-role="name" aria-live="polite">准备开始</div>
        </section>

        <section class="bento-tile bento-action-tile">
          <button class="bento-btn bento-btn-primary" id="toggleBtn" data-np-role="toggle" type="button" aria-pressed="false">开始随机</button>
          <button class="bento-btn bento-btn-ghost" id="resetBtn" data-np-role="reset" type="button">重置记录</button>
        </section>

        <section class="bento-tile bento-history-tile">
          <h2 class="bento-history-title">已提问过的同学</h2>
          <div class="bento-chips" data-np-role="history"></div>
          <p class="bento-empty" data-np-role="history-empty">暂无记录</p>
        </section>
      </div>
    </div>

    <div class="bento-drop" data-np-role="drop-mask"><span>松开即可导入</span></div>
    <div class="toast" data-np-role="toast" role="status"></div>
  `;

  NamePicker.skins.register({
    id: 'bento',
    label: '便当盒',
    css: 'css/skins/bento.css',
    themeColor: '#f5f5f7',
    create: NamePicker.createSimpleSkin({
      id: 'bento',
      template: TEMPLATE,
      classes: { chip: 'bento-chip' },
      fit: { min: 28, max: 104, step: 4 },
      celebrateClass: 'is-celebrating'
    })
  });
})();
