// Shared sidebar — injected into <aside id="sidebar"></aside> on every page.
(function () {
  const NAV = [
    { id: 'home', emoji: '🏠', label: 'Home', href: 'index.html', isHome: true },
    {
      section: '基本理解',
      items: [
        { id: 'ch1', num: '1', emoji: '📦', label: '不動産仕入れって何?', href: 'pages/chapter1.html' },
      ],
    },
    {
      section: '誰が・なぜ・どう',
      items: [
        { id: 'ch2-1', num: '2-1', emoji: '👥', label: 'プレイヤー図鑑', href: 'pages/chapter2-1.html', isNew: true },
        { id: 'ch2-2', num: '2-2', emoji: '🚪', label: '出口別アプローチ', href: 'pages/chapter2-2.html' },
        { id: 'ch2-3', num: '2-3', emoji: '🛣️', label: '4つのフロー', href: 'pages/chapter2-3.html' },
        { id: 'ch2-4', num: '2-4', emoji: '⏰', label: '営業の1日', href: 'pages/chapter2-4.html' },
        { id: 'ch2-5', num: '2-5', emoji: '📂', label: '書類図鑑', href: 'pages/chapter2-5.html', isNew: true },
      ],
    },
    {
      section: 'WHEREはどこに効くのか',
      items: [
        { id: 'ch3-0', num: '3-0', emoji: '⚖️', label: 'ない世界 vs ある世界', href: 'pages/chapter3-0.html', isNew: true },
        { id: 'ch3-1', num: '3-1', emoji: '🧱', label: '業界の構造課題', href: 'pages/chapter3.html' },
        { id: 'ch3-2', num: '3-2', emoji: '🧭', label: '機能全容', href: 'pages/chapter4-0.html' },
        { id: 'ch3-3', num: '3-3', emoji: '✨', label: '3つのコア価値', href: 'pages/chapter4-1.html' },
        { id: 'ch3-4', num: '3-4', emoji: '🎯', label: 'ユースケース', href: 'pages/chapter4-2.html' },
        { id: 'ch3-5', num: '3-5', emoji: '💬', label: '顧客の声', href: 'pages/chapter4-3.html' },
      ],
    },
    {
      section: 'リファレンス',
      items: [
        { id: 'glossary', num: '4', emoji: '📚', label: '重要用語集', href: 'pages/glossary.html', isNew: true },
        { id: 'quiz', num: '5', emoji: '🎓', label: '理解度チェック', href: 'pages/quiz.html' },
        { id: 'memos', num: '*', emoji: '📝', label: 'メモ一覧', href: 'pages/memos.html' },
      ],
    },
  ];

  function getBase() {
    // Resolve href relative to repo root regardless of which page we're on.
    const path = window.location.pathname.replace(/\\/g, '/');
    return path.includes('/pages/') ? '../' : './';
  }

  function buildHtml(activeId) {
    const base = getBase();
    const linkTo = (href) => href === 'index.html' ? `${base}index.html` : `${base}${href}`;

    let html = `
      <div class="brand">
        <span class="logo">WHERE</span>
        <span class="sub">不動産仕入れ 徹底理解の巻物</span>
      </div>
      <nav>
    `;

    for (const entry of NAV) {
      if (entry.isHome) {
        const cls = activeId === entry.id ? 'nav-item is-active' : 'nav-item';
        html += `<a class="${cls}" href="${linkTo(entry.href)}"><span class="num">${entry.emoji}</span><span>${entry.label}</span></a>`;
      } else if (entry.section) {
        html += `<div class="nav-section">${entry.section}</div>`;
        for (const it of entry.items) {
          const cls = activeId === it.id ? 'nav-item is-active' : 'nav-item';
          const badge = it.isNew ? '<span class="badge-new">NEW</span>' : '';
          html += `<a class="${cls}" href="${linkTo(it.href)}"><span class="num">${it.num}</span><span>${it.emoji} ${it.label}</span>${badge}</a>`;
        }
      }
    }

    html += `
      </nav>
      <div class="footer-mini">© WHERE / Onboarding doc<br>v0.1 internal</div>
    `;
    return html;
  }

  function injectSidebar() {
    const aside = document.getElementById('sidebar');
    if (!aside) return;
    const activeId = aside.dataset.active || '';
    aside.className = 'sidebar';
    aside.innerHTML = buildHtml(activeId);

    // mobile toggle
    if (!document.querySelector('.sidebar-toggle')) {
      const btn = document.createElement('button');
      btn.className = 'sidebar-toggle';
      btn.setAttribute('aria-label', 'メニュー');
      btn.textContent = '☰';
      const scrim = document.createElement('div');
      scrim.className = 'scrim';
      document.body.appendChild(btn);
      document.body.appendChild(scrim);
      btn.addEventListener('click', () => {
        aside.classList.add('is-open');
        scrim.classList.add('is-open');
      });
      scrim.addEventListener('click', () => {
        aside.classList.remove('is-open');
        scrim.classList.remove('is-open');
      });
    }
  }

  function initReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || items.length === 0) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach((el) => io.observe(el));
  }

  document.addEventListener('DOMContentLoaded', () => {
    injectSidebar();
    initReveal();
  });
})();
