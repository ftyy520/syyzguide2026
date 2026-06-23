/* ============================================================
   app.js — 应用入口
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

    // 网站名称
    document.querySelectorAll("[data-site-name]").forEach(el => {
      el.textContent = s.name;
    });

    // 网站副标题
    document.querySelectorAll("[data-site-tagline]").forEach(el => {
      el.textContent = s.tagline;
    });

    // Hero 标题（支持 \n 换行）
    const heroTitle = document.getElementById("hero-title");
    if (heroTitle) {
      heroTitle.innerHTML = s.heroTitle
        .split("\n")
        .map(line => `<span>${line}</span>`)
        .join("<br>");
    }

    // Hero 副标题
    const heroSubtitle = document.getElementById("hero-subtitle");
    if (heroSubtitle) {
      heroSubtitle.textContent = s.heroSubtitle;
    }

    // Logo
    const logos = document.querySelectorAll("[data-logo]");
    logos.forEach(logo => {
      if (logo.tagName === "IMG") {
        logo.src = s.logoPath;
        logo.alt = s.name;
      }
    });

    // 页脚年份
    const yearEls = document.querySelectorAll("[data-year]");
    yearEls.forEach(el => { el.textContent = s.year; });

    // 页面标题
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
          <span class="welcome-feature-icon"
                role="img"
                aria-label="${feature.title}">
            ${feature.icon}
          </span>
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
    const shouldShow = SettingsController.shouldShowWelcome();

    if (shouldShow) {
      // 延迟 600ms
            setTimeout(() => {
        OverlayController.open("welcome");
      }, 600);
    }

    // 「开始探索」按钮
    const startBtn = document.getElementById("welcome-start-btn");
    if (startBtn) {
      startBtn.addEventListener("click", () => {
        OverlayController.close("welcome");
      });
    }

    // Header 上的 Logo / 站名点击 → 打开欢迎弹窗
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
      // 如果焦点在输入框内则忽略
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
        default:
          break;
      }
    });
  }

  /* ── 页面可见性 API：切换标签页时暂停音乐 ── */
  function initVisibilityHandler() {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && MusicController.isPlaying) {
        MusicController.pause();
      }
    });
  }

  /* ── 微信分享配置（如有需要可在此扩展） ── */
  function initShareMeta() {
    const site = SITE_CONTENT.site;
    // og:title
    let metaTitle = document.querySelector('meta[property="og:title"]');
    if (!metaTitle) {
      metaTitle = document.createElement("meta");
      metaTitle.setAttribute("property", "og:title");
      document.head.appendChild(metaTitle);
    }
    metaTitle.setAttribute("content", site.name);

    // og:description
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
    // 1. 填充静态内容（最先执行，避免页面空白闪烁）
    fillStaticContent();
    fillWelcomeContent();
    fillSectionHeader();

    // 2. 主题（尽早应用，避免闪白）
    ThemeController.init();

    // 3. UI 控制器
    OverlayController.init();
    SidebarController.init();
    SearchController.init();
    MoreMenuController.init();
    FabController.init();
    HeaderController.init();
    SettingsController.init();

    // 4. 音乐播放器
    MusicController.init();

    // 5. 路由（最后初始化，确保所有 UI 就绪后再渲染页面内容）
    Router.init(function onNavigate(type) {
      // 导航后关闭所有打开的面板
      SidebarController.close();
      MoreMenuController.close();
    });

    // 6. 轮播控制器（Router 渲染首页后再初始化）
    CarouselController.init();

    // 7. 辅助功能
    initGlobalShortcuts();
    initVisibilityHandler();
    initShareMeta();

    // 8. 欢迎弹窗
    handleWelcomeOverlay();

    // 9. 完成标记
    document.documentElement.classList.add("app-ready");
  });

})();