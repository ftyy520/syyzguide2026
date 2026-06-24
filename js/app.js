/* ============================================================
   app.js —— 应用入口
   ============================================================ */
(function () {
  "use strict";

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  /* ── 填充静态文本 ── */
  function fillStaticContent() {
    const s = SITE_CONTENT.site;
    document.querySelectorAll("[data-site-name]").forEach(el => el.textContent = s.name);
    document.querySelectorAll("[data-site-tagline]").forEach(el => el.textContent = s.tagline);
    const heroTitle = document.getElementById("hero-title");
    if (heroTitle) heroTitle.innerHTML = s.heroTitle.split("\n").map(line => `<span>${line}</span>`).join("<br>");
    const heroSubtitle = document.getElementById("hero-subtitle");
    if (heroSubtitle) heroSubtitle.textContent = s.heroSubtitle;
    document.querySelectorAll("[data-logo]").forEach(logo => {
      if (logo.tagName === "IMG") { logo.src = s.logoPath; logo.alt = s.name; }
    });
    document.querySelectorAll("[data-year]").forEach(el => el.textContent = s.year);
    document.title = s.name;
  }

  /* ── 欢迎弹窗内容 ── */
  function fillWelcomeContent() {
    const w = SITE_CONTENT.welcome;
    const titleEl = document.getElementById("welcome-title");
    const subtitleEl = document.getElementById("welcome-subtitle");
    const descEl = document.getElementById("welcome-desc");
    const featuresEl = document.getElementById("welcome-features");
    if (titleEl) titleEl.textContent = w.title;
    if (subtitleEl) subtitleEl.textContent = w.subtitle;
    if (descEl) descEl.textContent = w.description;
    if (featuresEl && w.features) {
      featuresEl.innerHTML = "";
      w.features.forEach(feature => {
        const item = document.createElement("div");
        item.className = "welcome-feature-item";
        item.innerHTML = `<span class="welcome-feature-icon" role="img" aria-label="${feature.title}">${feature.icon}</span><div><div class="welcome-feature-title">${feature.title}</div><div class="welcome-feature-desc">${feature.desc}</div></div>`;
        featuresEl.appendChild(item);
      });
    }
  }

  /* ── 欢迎弹窗控制（仅绑定事件，不主动弹出） ── */
  function bindWelcomeEvents() {
    const startBtn = document.getElementById("welcome-start-btn");
    if (startBtn) startBtn.addEventListener("click", () => OverlayController.close("welcome"));
    const logoBtn = document.getElementById("logo-btn");
    if (logoBtn) logoBtn.addEventListener("click", () => OverlayController.open("welcome"));
  }

  /* ── 卡片区标题 ── */
  function fillSectionHeader() {
    const titleEl = document.getElementById("cards-section-title");
    const subtitleEl = document.getElementById("cards-section-subtitle");
    if (titleEl) titleEl.textContent = "探索各板块";
    if (subtitleEl) subtitleEl.textContent = `共 ${SITE_CONTENT.sections.length} 个板块，${countArticles()} 篇文章`;
  }
  function countArticles() {
    return SITE_CONTENT.sections.reduce((sum, s) => sum + (s.articles ? s.articles.length : 0), 0);
  }

  /* ── 快捷键 ── */
  function initGlobalShortcuts() {
    document.addEventListener("keydown", (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      switch (e.key) {
        case "/": case "s": e.preventDefault(); SearchController.open(); break;
        case "h": Router.goHome(); break;
        case "t": ThemeController.toggle(); break;
      }
    });
  }

  /* ── 页面隐藏时暂停音乐 ── */
  function initVisibilityHandler() {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && MusicController.isPlaying) MusicController.pause();
    });
  }

  /* ── 分享 meta ── */
  function initShareMeta() {
    const site = SITE_CONTENT.site;
    let metaTitle = document.querySelector('meta[property="og:title"]');
    if (!metaTitle) { metaTitle = document.createElement("meta"); metaTitle.setAttribute("property", "og:title"); document.head.appendChild(metaTitle); }
    metaTitle.setAttribute("content", site.name);
    let metaDesc = document.querySelector('meta[property="og:description"]');
    if (!metaDesc) { metaDesc = document.createElement("meta"); metaDesc.setAttribute("property", "og:description"); document.head.appendChild(metaDesc); }
    metaDesc.setAttribute("content", site.tagline);
  }

  /* ── SettingsController ── */
  const SettingsController = (() => {
    const STORAGE_NO_SHOW = "no_show_welcome";
    function init() {
      const noShowCheckbox = document.getElementById("no-show-checkbox");
      if (noShowCheckbox) {
        noShowCheckbox.checked = localStorage.getItem(STORAGE_NO_SHOW) === "1";
        noShowCheckbox.addEventListener("change", () => {
          localStorage.setItem(STORAGE_NO_SHOW, noShowCheckbox.checked ? "1" : "0");
        });
      }
    }
    function shouldShowWelcome() {
      return localStorage.getItem(STORAGE_NO_SHOW) !== "1";
    }
    return { init, shouldShowWelcome };
  })();

  /* ── 主初始化 ── */
  onReady(function () {
    fillStaticContent();
    fillWelcomeContent();
    fillSectionHeader();

    ThemeController.init();

    OverlayController.init();
    SidebarController.init();
    SearchController.init();
    MoreMenuController.init();
    FabController.init();
    HeaderController.init();
    SettingsController.init();

    MusicController.init();

    // 绑定欢迎弹窗相关按钮事件（但不自动弹出）
    bindWelcomeEvents();

    // 路由初始化，并通过回调控制首次弹窗
    Router.init(function onNavigate(type) {
      SidebarController.close();
      MoreMenuController.close();
      // 只有当前是首页时才弹出欢迎弹窗（并且用户未勾选不再显示）
      if (type === "" && SettingsController.shouldShowWelcome()) {
        setTimeout(() => OverlayController.open("welcome"), 600);
      }
    });

    CarouselController.init();

    initGlobalShortcuts();
    initVisibilityHandler();
    initShareMeta();

    document.documentElement.classList.add("app-ready");
  });
})();