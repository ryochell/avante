/* =========================================================
   株式会社AVANTE コーポレートサイト 共通スクリプト
   - ヘッダー / フッターはDOMに1度だけ生成し、ページ遷移時も再描画しない
   - ページ遷移は fetch + history.pushState による軽量SPAルーティング
   - ニュースデータの一元管理（NEWS 配列を編集して更新）
========================================================= */

/* ---------- ニュースデータ（ここを編集して更新） ---------- */
const NEWS = [
  { date: '2026.06.20', tag: 'SHOP',    text: '北新地本店にて、夏の新メニューの提供を開始しました。' },
  { date: '2026.05.10', tag: 'EVENT',   text: 'ソムリエと巡るイタリアワイン会（6月開催）のご予約受付を開始しました。' },
  { date: '2026.04.15', tag: 'RECRUIT', text: '正社員（キッチン・ホール）の採用を強化しています。詳しくは採用情報をご覧ください。' },
  { date: '2026.04.01', tag: 'INFO',    text: 'ワイン卸売事業の取扱銘柄一覧を更新しました。お気軽にお問い合わせください。' },
  { date: '2026.03.01', tag: 'INFO',    text: 'コーポレートサイトを開設しました。今後とも宜しくお願い申し上げます。' },
];

/* ---------- フッターの年号を自動更新 ---------- */
(function updateFooterYear() {
  const copy = document.querySelector('.site-footer .copy');
  if (copy) copy.innerHTML = copy.innerHTML.replace(/\d{4}/, new Date().getFullYear());
})();

/* ---------- ヘッダーのスクロール挙動 ---------- */
const headerEl = document.getElementById('header');
let suspendScrollSync = false;
window.addEventListener('scroll', () => {
  if (suspendScrollSync) return;
  const y = window.scrollY;
  headerEl.classList.toggle('scrolled', y > 60);
}, { passive: true });

/* ---------- ハンバーガーメニュー ---------- */
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobile-menu');
burger.addEventListener('click', () => {
  const open = burger.classList.toggle('open');
  mobileMenu.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', open);
  document.body.style.overflow = open ? 'hidden' : '';
});
function closeMobileMenu() {
  burger.classList.remove('open');
  mobileMenu.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

/* ---------- スクロールリビール ---------- */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('show');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
function observeReveals(root) {
  root.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

/* ---------- ニュース描画（#news-list があるページで実行） ---------- */
function renderNews(root) {
  const list = root.querySelector('#news-list');
  if (!list) return;
  const limit = parseInt(list.dataset.limit || '0', 10);
  const items = limit > 0 ? NEWS.slice(0, limit) : NEWS;
  items.forEach((n, i) => {
    const li = document.createElement('li');
    li.className = 'news-item reveal';
    li.style.transitionDelay = (i * 0.08) + 's';
    li.innerHTML =
      '<time>' + n.date + '</time>' +
      '<span class="tag">' + n.tag + '</span>' +
      '<p>' + n.text + '</p>';
    list.appendChild(li);
    io.observe(li);
  });
}

/* ---------- ローダー（#loader があるページでのみ生成される） ---------- */
const loaderEl = document.getElementById('loader');
(function loaderCtrl() {
  const done = () => {
    if (loaderEl) loaderEl.classList.add('hide');
    document.body.classList.add('loaded');
  };
  if (!loaderEl) { document.body.classList.add('loaded'); return; }
  window.addEventListener('load', () => setTimeout(done, 1600));
  setTimeout(done, 4000); // フォールバック
})();

/* ---------- ローダー（ページ内遷移のたびに再生する短縮版） ---------- */
const NAV_LOADER_MS = 500;
function playNavLoader() {
  if (!loaderEl) return;
  loaderEl.classList.add('nav-transition');
  loaderEl.classList.remove('hide');
  // 再生中のCSSアニメーションを頭から再始動させるための強制リフロー
  void loaderEl.offsetWidth;
}
function hideNavLoader() {
  if (!loaderEl) return;
  loaderEl.classList.add('hide');
}

/* ---------- お問い合わせフォーム（contact.html） ---------- */
function bindContactForm(root) {
  const form = root.querySelector('#contact-form');
  if (!form) return;
  const msg = form.parentElement.querySelector('#form-message') || root.querySelector('#form-message');
  const show = (text, err) => {
    msg.textContent = text;
    msg.style.display = 'block';
    msg.style.color = err ? 'var(--wine)' : 'var(--gold)';
    msg.style.borderColor = err ? 'var(--wine)' : 'var(--gold)';
  };
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = form.querySelector('#f-name').value.trim();
    const email = form.querySelector('#f-email').value.trim();
    const body = form.querySelector('#f-body').value.trim();
    if (!name || !email || !body) { show('必須項目をご入力ください。', true); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { show('メールアドレスの形式をご確認ください。', true); return; }
    // 実際の送信処理（サーバー／フォームサービス連携）はここに実装します
    form.reset();
    show('お問い合わせを受け付けました。担当者よりご連絡いたします。', false);
  });
}

/* =========================================================
   ページルーター
   - <main> の中身・title・meta description のみを差し替え、
     header / footer は初回ロード時のDOMのまま維持する
========================================================= */
const mainEl = document.querySelector('main');
const metaDescEl = document.querySelector('meta[name="description"]');
const pcNavEl = document.querySelector('nav.pc');
const navLinks = document.querySelectorAll('.pc a, #mobile-menu a, footer.site-footer nav a');

function initMainContent(root) {
  observeReveals(root);
  renderNews(root);
  bindContactForm(root);
}
// 初回ロード分の main も同じ初期化経路を通す
initMainContent(mainEl);

function setActiveNav(page) {
  // current切り替えで新旧2本の下線が同時にスライドして見えるため、
  // ページ遷移によるcurrent変更時だけは下線アニメを止めて瞬時に切り替える。
  // ホバー時のアニメーションはこの間も別クラスなので影響を受けない。
  if (pcNavEl) pcNavEl.classList.add('no-anim');
  navLinks.forEach(a => {
    const isCurrent = a.getAttribute('href') === page;
    if (isCurrent) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  if (pcNavEl) {
    // 次フレームで解除し、以降のホバー操作は通常どおりアニメーションさせる
    requestAnimationFrame(() => requestAnimationFrame(() => pcNavEl.classList.remove('no-anim')));
  }
}

function applyPage(html, page) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const newMain = doc.querySelector('main');
  if (!newMain) return false;

  mainEl.innerHTML = newMain.innerHTML;
  document.title = doc.title;
  const newDesc = doc.querySelector('meta[name="description"]');
  if (metaDescEl && newDesc) metaDescEl.setAttribute('content', newDesc.getAttribute('content'));

  document.body.dataset.page = page;
  document.body.classList.toggle('subpage', page !== 'index.html');

  setActiveNav(page);
  initMainContent(mainEl);
  return true;
}

const pageCache = new Map();
function loadPage(page, { push, scrollTop } = { push: true, scrollTop: true }) {
  const cached = pageCache.get(page);
  const request = cached ? Promise.resolve(cached) : fetch(page).then(res => {
    if (!res.ok) throw new Error('page fetch failed: ' + page);
    return res.text();
  }).then(html => { pageCache.set(page, html); return html; });

  // スクロール位置とヘッダーの見た目（scrolled状態）は、コンテンツの差し替えと
  // 同時に確定させる。ここを差し替え後まで遅らせると、遷移先の描画が終わった
  // 一瞬だけ「移動元のスクロール位置に応じたヘッダー高さ・ロゴサイズ」が見えてしまい、
  // ヘッダーが2段階でサイズ変化するチラつきになる。
  // また scrollTo(instant) は実装によっては複数の scroll イベントに分割されるため、
  // その途中経過を scroll リスナーが拾って scrolled を再度付け直さないよう一時停止する。
  if (scrollTop) {
    suspendScrollSync = true;
    headerEl.classList.remove('scrolled');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // ローダーの短縮演出を再生。fetch がキャッシュ済みで即座に解決しても
  // フェードインの途中で消えて見えないよう、最低表示時間を確保してから閉じる。
  playNavLoader();
  const navLoaderTimer = new Promise(resolve => setTimeout(resolve, NAV_LOADER_MS));

  return Promise.all([request, navLoaderTimer]).then(([html]) => {
    const ok = applyPage(html, page);
    if (!ok) { window.location.href = page; return; }
    if (push) history.pushState({ page }, '', page);
    if (scrollTop) suspendScrollSync = false;
    hideNavLoader();
  }).catch(() => {
    // fetch できない場合（file:// での閲覧など）は通常遷移にフォールバック
    window.location.href = page;
  });
}

function isInternalPageLink(a) {
  if (a.hasAttribute('download') || a.target === '_blank') return false;
  const href = a.getAttribute('href') || '';
  if (!/^[a-zA-Z0-9_-]+\.html(#.*)?$/.test(href)) return false;
  return true;
}

document.addEventListener('click', e => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest('a');
  if (!a || !isInternalPageLink(a)) return;

  const href = a.getAttribute('href');
  const [page, hash] = href.split('#');
  const targetPage = page || document.body.dataset.page;

  if (targetPage === document.body.dataset.page) {
    // 同一ページ内アンカー等はブラウザ標準の挙動に任せる
    if (mobileMenu.classList.contains('open')) closeMobileMenu();
    return;
  }

  e.preventDefault();
  closeMobileMenu();
  loadPage(targetPage).then(() => {
    if (hash) {
      const target = document.getElementById(hash);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

function pageFromLocation() {
  const file = location.pathname.split('/').pop();
  return file && file.endsWith('.html') ? file : 'index.html';
}

window.addEventListener('popstate', e => {
  const page = (e.state && e.state.page) || pageFromLocation();
  loadPage(page, { push: false, scrollTop: true });
});

// 初回表示分のHTMLをキャッシュし、履歴エントリにも現在ページを記録しておく
pageCache.set(document.body.dataset.page, document.documentElement.outerHTML);
history.replaceState({ page: document.body.dataset.page }, '', location.href);
