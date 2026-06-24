/* ============================================================
   app.js —— 应用入口
   负责：DOM 就绪检测、各模块初始化、欢迎弹窗控制
   ============================================================ */

(function () {
  "use strict";

  /* ── DOM 就绪后执行 ── */
  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  /* ── 填充静态文本内容 ── */
  function fillStaticContent() {
    const s = SITE_CONTENT.site;

    document.querySelectorAll("[data-site-name]").forEach(el => {
      el.textContent = s.name;
    });

    document.querySelectorAll("[data-site-tagline]").forEach(el => {
      el.textContent = s.tagline;
    });

    const heroTitle = document.getElementById("hero-title");
    if (heroTitle) {
      heroTitle.innerHTML = s.heroTitle
        .split("\n")
        .map(line => `<span>${line}</span>`)
        .join("<br>");
    }

    const heroSubtitle = document.getElementById("hero-subtitle");
    if (heroSubtitle) {
      heroSubtitle.textContent = s.heroSubtitle;
    }

    document.querySelectorAll("[data-logo]").forEach(logo => {
      if (logo.tagName === "IMG") {
        logo.src = s.logoPath;
        logo.alt = s.name;
      }
    });

    document.querySelectorAll("[data-year]").forEach(el => {
      el.textContent = s.year;
    });

    document.title = s.name;
  }

  /* ── 填充欢迎弹窗内容 ── */
  function fillWelcomeContent() {
    const w = SITE_CONTENT.welcome;

    const titleEl    = document.getElementById("welcome-title");
    const subtitleEl = document.getElementById("welcome-subtitle");
    const descEl     = document.getElementById("welcome-desc");
    const featuresEl = document.getElementById("welcome-features");

    if (titleEl)    titleEl.textContent    = w.title;
    if (subtitleEl) subtitleEl.textContent = w.subtitle;
    if (descEl)     descEl.textContent     = w.description;

    if (featuresEl && w.features) {
      featuresEl.innerHTML = "";
      w.features.forEach(feature => {
        const item = document.createElement("div");
        item.className = "welcome-feature-item";
        item.innerHTML = `
          <span class="welcome-feature-icon" role="img" aria-label="${feature.title}">${feature.icon}</span>
          <div>
            <div class="welcome-feature-title">${feature.title}</div>
            <div class="welcome-feature-desc">${feature.desc}</div>
          </div>
        `;
        featuresEl.appendChild(item);
      });
    }
  }

  /* ── 欢迎弹窗控制 ── */
  function handleWelcomeOverlay() {
    if (SettingsController.shouldShowWelcome()) {
      setTimeout(() => {
        OverlayController.open("welcome");
      }, 600);
    }

    const startBtn = document.getElementById("welcome-start-btn");
    if (startBtn) {
      startBtn.addEventListener("click", () => {
        OverlayController.close("welcome");
      });
    }

    const logoBtn = document.getElementById("logo-btn");
    if (logoBtn) {
      logoBtn.addEventListener("click", () => {
        OverlayController.open("welcome");
      });
    }
  }

  /* ── 卡片区标题填充 ── */
  function fillSectionHeader() {
    const titleEl    = document.getElementById("cards-section-title");
    const subtitleEl = document.getElementById("cards-section-subtitle");
    if (titleEl)    titleEl.textContent    = "探索各板块";
    if (subtitleEl) subtitleEl.textContent = `共 ${SITE_CONTENT.sections.length} 个板块，${countArticles()} 篇文章`;
  }

  function countArticles() {
    return SITE_CONTENT.sections.reduce(
      (sum, s) => sum + (s.articles ? s.articles.length : 0), 0
    );
  }

  /* ── 键盘全局快捷键 ── */
  function initGlobalShortcuts() {
    document.addEventListener("keydown", (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      switch (e.key) {
        case "/":
        case "s":
          e.preventDefault();
          SearchController.open();
          break;
        case "h":
          Router.goHome();
          break;
        case "t":
          ThemeController.toggle();
          break;
      }
    });
  }

  /* ── 页面可见性 API ── */
  function initVisibilityHandler() {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && MusicController.isPlaying) {
        MusicController.pause();
      }
    });
  }

  /* ── 微信分享 meta ── */
  function initShareMeta() {
    const site = SITE_CONTENT.site;
    let metaTitle = document.querySelector('meta[property="og:title"]');
    if (!metaTitle) {
      metaTitle = document.createElement("meta");
      metaTitle.setAttribute("property", "og:title");
      document.head.appendChild(metaTitle);
    }
    metaTitle.setAttribute("content", site.name);

    let metaDesc = document.querySelector('meta[property="og:description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("property", "og:description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", site.tagline);
  }

  /* ── 主初始化流程 ── */
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

    Router.init(function onNavigate() {
      SidebarController.close();
      MoreMenuController.close();
    });

    CarouselController.init();

    initGlobalShortcuts();
    initVisibilityHandler();
    initShareMeta();

    handleWelcomeOverlay();

    document.documentElement.classList.add("app-ready");
  });
})();