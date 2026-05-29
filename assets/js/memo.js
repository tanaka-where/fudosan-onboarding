// Per-page memo widget — saves to localStorage under `memo:{page-id}`.
(function () {
  const PREFIX = 'memo:';
  const INDEX_KEY = 'memo:_index';

  function getPageId() {
    const body = document.body;
    if (body && body.dataset.pageId) return body.dataset.pageId;
    const path = window.location.pathname.replace(/\\/g, '/');
    const file = path.split('/').pop() || 'index.html';
    return file.replace(/\.html$/, '') || 'index';
  }

  function getPageTitle() {
    return document.title || getPageId();
  }

  function readIndex() {
    try { return JSON.parse(localStorage.getItem(INDEX_KEY) || '{}'); }
    catch (_) { return {}; }
  }
  function writeIndex(idx) {
    localStorage.setItem(INDEX_KEY, JSON.stringify(idx));
  }

  function buildUi(pageId) {
    const fab = document.createElement('button');
    fab.className = 'memo-fab';
    fab.type = 'button';
    fab.innerHTML = '📝 メモ';

    const panel = document.createElement('aside');
    panel.className = 'memo-panel';
    panel.innerHTML = `
      <header>
        <h3>📝 このページのメモ</h3>
        <button class="close-btn" type="button" aria-label="閉じる">×</button>
      </header>
      <textarea placeholder="メモを書いてください…（自動保存）"></textarea>
      <footer>
        <span class="status">未保存</span>
        <a href="#" class="memos-link">📚 全メモ一覧</a>
      </footer>
    `;
    document.body.appendChild(fab);
    document.body.appendChild(panel);

    const textarea = panel.querySelector('textarea');
    const status = panel.querySelector('.status');
    const closeBtn = panel.querySelector('.close-btn');
    const memosLink = panel.querySelector('.memos-link');

    const memosHref = window.location.pathname.includes('/pages/') ? 'memos.html' : 'pages/memos.html';
    memosLink.href = memosHref;

    // Load existing
    textarea.value = localStorage.getItem(PREFIX + pageId) || '';
    if (textarea.value) status.textContent = '保存済み';

    fab.addEventListener('click', () => {
      panel.classList.add('is-open');
      setTimeout(() => textarea.focus(), 250);
    });
    closeBtn.addEventListener('click', () => panel.classList.remove('is-open'));

    let t = null;
    textarea.addEventListener('input', () => {
      status.textContent = '入力中…';
      clearTimeout(t);
      t = setTimeout(() => {
        const val = textarea.value;
        if (val.trim() === '') {
          localStorage.removeItem(PREFIX + pageId);
          const idx = readIndex();
          delete idx[pageId];
          writeIndex(idx);
          status.textContent = '空（保存なし）';
        } else {
          localStorage.setItem(PREFIX + pageId, val);
          const idx = readIndex();
          idx[pageId] = {
            title: getPageTitle(),
            updatedAt: new Date().toISOString(),
            href: window.location.pathname.split('/').slice(-2).join('/'),
          };
          writeIndex(idx);
          status.textContent = '保存済み ✓';
        }
      }, 400);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const pageId = getPageId();
    buildUi(pageId);
  });
})();
