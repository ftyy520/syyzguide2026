/* ============================================================
   router.js — 路由管理
   处理：页面导航、History API、微信/QQ回退修复、面包屑、目录
   ============================================================ */

const Router = (() => {
  /* ── 状态 ── */
  let currentSection = null;   // 当前板块 id
  let currentArticle = null;   // 当前文章 id
  let _onNavigate    = null;   // 导航回调

  /* ── 常量 ── */
  const ROUTE_HOME    = "";
  const ROUTE_SECTION = "section";
  const ROUTE_ARTICLE = "article";

  /* ── 微信/QQ 回退保护 ──
   * 进入页面时压入一条额外 history 记录，
   * 这样在微信/QQ 内点击回退只消耗这条记录，不会直接关闭 webview。
   */
  function initHistoryGuard() {
    // 替换当前 state，标记为"基础层"
    history.replaceState({ type: "base" }, "", location.href);
    // 压入一条"哨兵"记录
    history.pushState({ type: "sentinel" }, "", location.href);
  }

  /* ── 解析 hash 路由 ── */
  function parseHash(hash) {
    // 格式：#section/板块id  或  #article/板块id/文章id
    const raw = hash.replace(/^#\/?/, "");
    if (!raw) return { type: ROUTE_HOME };

    const parts = raw.split("/");
    if (parts[0] === "section" && parts[1]) {
      return { type: ROUTE_SECTION, sectionId: parts[1] };
    }
    if (parts[0] === "article" && parts[1] && parts[2]) {
      return { type: ROUTE_ARTICLE, sectionId: parts[1], articleId: parts[2] };
    }
    return { type: ROUTE_HOME };
  }

  /* ── 构建 hash ── */
  function buildHash(type, sectionId, articleId) {
    if (type === ROUTE_HOME)    return "#";
    if (type === ROUTE_SECTION) return `#section/${sectionId}`;
    if (type === ROUTE_ARTICLE) return `#article/${sectionId}/${articleId}`;
    return "#";
  }

  /* ── 导航到指定路由 ── */
  function navigate(type, sectionId, articleId, options) {
    options = options || {};
    const hash     = buildHash(type, sectionId, articleId);
    const stateObj = { type, sectionId: sectionId || null, articleId: articleId || null };

    if (options.replace) {
      history.replaceState(stateObj, "", hash);
    } else {
      history.pushState(stateObj, "", hash);
    }

    currentSection = sectionId || null;
    currentArticle = articleId || null;

    if (_onNavigate) _onNavigate(type, sectionId, articleId);
    updateBreadcrumb(type, sectionId, articleId);
    updateSidebarActive(sectionId);
  }

  /* ── 便捷方法 ── */
  function goHome(options) {
    navigate(ROUTE_HOME, null, null, options);
  }

  function goSection(sectionId, options) {
    navigate(ROUTE_SECTION, sectionId, null, options);
      }

  function goArticle(sectionId, articleId, options) {
    navigate(ROUTE_ARTICLE, sectionId, articleId, options);
  }

  /* ── 面包屑更新 ── */
  function updateBreadcrumb(type, sectionId, articleId) {
    const breadcrumb = document.getElementById("breadcrumb");
    const list       = document.getElementById("breadcrumb-list");
    if (!breadcrumb || !list) return;

    list.innerHTML = "";

    if (type === ROUTE_HOME) {
      breadcrumb.style.display = "none";
      return;
    }

    breadcrumb.style.display = "block";

    // 首页
    const homeItem = document.createElement("li");
    const homeBtn  = document.createElement("button");
    homeBtn.textContent = "首页";
    homeBtn.className   = "btn-text";
    homeBtn.style.cssText = "padding:0;font-size:0.75rem;";
    homeBtn.addEventListener("click", () => goHome());
    homeItem.appendChild(homeBtn);
    list.appendChild(homeItem);

    // 板块
    const section = SITE_CONTENT.sections.find(s => s.id === sectionId);
    if (section) {
      const sectionItem = document.createElement("li");
      if (type === ROUTE_ARTICLE) {
        const sectionBtn = document.createElement("button");
        sectionBtn.textContent = section.title;
        sectionBtn.className   = "btn-text";
        sectionBtn.style.cssText = "padding:0;font-size:0.75rem;";
        sectionBtn.addEventListener("click", () => goSection(sectionId));
        sectionItem.appendChild(sectionBtn);
      } else {
        const sectionSpan = document.createElement("span");
        sectionSpan.textContent = section.title;
        sectionItem.appendChild(sectionSpan);
      }
      list.appendChild(sectionItem);
    }

    // 文章
    if (type === ROUTE_ARTICLE && articleId) {
      const article = section && section.articles.find(a => a.id === articleId);
      if (article) {
        const articleItem = document.createElement("li");
        const articleSpan = document.createElement("span");
        articleSpan.textContent = article.title;
        articleItem.appendChild(articleSpan);
        list.appendChild(articleItem);
      }
    }
  }

  /* ── 侧边栏高亮 ── */
  function updateSidebarActive(sectionId) {
    document.querySelectorAll(".sidebar-link-btn").forEach(btn => {
      const isActive = btn.dataset.sectionId === sectionId;
      btn.classList.toggle("active", isActive);
    });
  }

  /* ── 目录（TOC）生成 ── */
  function buildToc(contentEl) {
    const tocNav     = document.getElementById("toc-nav");
    const tocSidebar = document.getElementById("toc-sidebar");
    if (!tocNav) return;

    tocNav.innerHTML = "";

    const headings = contentEl.querySelectorAll("h1, h2, h3");
    if (headings.length < 2) {
      if (tocSidebar) tocSidebar.style.display = "none";
      return;
    }

    if (tocSidebar) tocSidebar.style.display = "";

    headings.forEach((heading, index) => {
      // 确保每个标题有 id
      if (!heading.id) {
        heading.id = `heading-${index}`;
      }

      const level = parseInt(heading.tagName.charAt(1), 10);
      const link  = document.createElement("button");
      link.className   = `toc-link level-${level}`;
      link.textContent = heading.textContent;
      link.dataset.targetId = heading.id;

      link.addEventListener("click", () => {
        const target = document.getElementById(heading.id);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });

      tocNav.appendChild(link);
    });

    /* IntersectionObserver 高亮当前章节 */
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            tocNav.querySelectorAll(".toc-link").forEach(link => {
              link.classList.toggle("active", link.dataset.targetId === id);
            });
          }
        });
      },
      {
        rootMargin: `-${56 + 24}px 0px -60% 0px`,
        threshold: 0,
      }
    );

    headings.forEach(h => observer.observe(h));
  }

  /* ── 移动端目录抽屉 ── */
  function buildMobileToc(contentEl) {
    const subpageContent = document.getElementById("subpage-content");
    if (!subpageContent) return;

    // 清除旧的移动端目录
    const oldTrigger = subpageContent.querySelector(".toc-mobile-trigger");
    const oldContent = subpageContent.querySelector(".toc-mobile-content");
    if (oldTrigger) oldTrigger.remove();
    if (oldContent) oldContent.remove();

    const headings = contentEl.querySelectorAll("h1, h2, h3");
    if (headings.length < 2) return;

    // 触发按钮
    const trigger = document.createElement("button");
    trigger.className = "toc-mobile-trigger";
    trigger.innerHTML = `
      <span>📋 文章目录</span>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    trigger.setAttribute("aria-expanded", "false");

    // 目录内容
    const tocContent = document.createElement("nav");
    tocContent.className    = "toc-mobile-content";
    tocContent.setAttribute("aria-label", "移动端文章目录");

    headings.forEach((heading, index) => {
      if (!heading.id) heading.id = `heading-${index}`;
      const level = parseInt(heading.tagName.charAt(1), 10);
      const link  = document.createElement("button");
      link.className   = `toc-link level-${level}`;
      link.textContent = heading.textContent;

      link.addEventListener("click", () => {
        heading.scrollIntoView({ behavior: "smooth", block: "start" });
        // 点击后收起目录
        tocContent.classList.remove("open");
        trigger.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
      });

      tocContent.appendChild(link);
    });

    trigger.addEventListener("click", () => {
      const isOpen = tocContent.classList.toggle("open");
      trigger.classList.toggle("open", isOpen);
      trigger.setAttribute("aria-expanded", String(isOpen));
    });

    // 插入到内容区顶部
    subpageContent.insertBefore(tocContent, subpageContent.firstChild);
    subpageContent.insertBefore(trigger, subpageContent.firstChild);
  }

  /* ── 图片占位符处理 ── */
  function processImagePlaceholders(contentEl) {
    contentEl.querySelectorAll(".image-placeholder-raw").forEach(el => {
      const caption = el.dataset.caption || "图片";
      const wrapper = document.createElement("div");
      wrapper.className = "image-placeholder";
      wrapper.innerHTML = `
        <span class="image-placeholder-icon">🖼️</span>
        <span>${caption}</span>
      `;
      el.replaceWith(wrapper);
    });
  }

  /* ── 渲染内容（将 content 字符串转为 DOM） ── */
  function renderContent(html) {
    // 将 <!-- IMAGE: 说明文字 --> 注释替换为占位元素
    const processed = html.replace(
      /<!--\s*IMAGE:\s*(.*?)\s*-->/gi,
      (_, caption) =>
        `<div class="image-placeholder-raw" data-caption="${caption.replace(/"/g, "&quot;")}"></div>`
    );

    const wrapper = document.createElement("div");
    wrapper.className = "article-body";
    wrapper.innerHTML = processed;

    // 处理图片占位
    processImagePlaceholders(wrapper);

    // 为所有外部链接添加 target="_blank" + rel
    wrapper.querySelectorAll("a[href]").forEach(a => {
      if (a.href && !a.href.startsWith(location.origin) && !a.href.startsWith("#")) {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel",    "noopener noreferrer");
      }
    });

    return wrapper;
  }

  /* ── 页面渲染：主页 ── */
  function renderHome() {
    const homeView    = document.getElementById("home-view");
    const subpageView = document.getElementById("subpage-view");
    const siteHeader  = document.querySelector(".site-header");
    const fabHome     = document.getElementById("fab-home");

    if (homeView)    homeView.style.display    = "";
    if (subpageView) subpageView.style.display = "none";
    if (siteHeader)  siteHeader.classList.remove("visible");
    if (fabHome)     fabHome.style.display     = "none";

    // 重置标题
    document.title = SITE_CONTENT.site.name;
    window.scrollTo({ top: 0, behavior: "instant" });

    // 填充卡片
    renderSectionCards();
  }

  /* ── 板块卡片渲染 ── */
  function renderSectionCards() {
    const carousel = document.getElementById("cards-carousel");
    if (!carousel || carousel.dataset.rendered === "1") return;

    carousel.innerHTML = "";

    SITE_CONTENT.sections.forEach(section => {
      const card = document.createElement("article");
      card.className            = "section-card";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", `进入 ${section.title}`);

      const articleCount = section.articles ? section.articles.length : 0;

      card.innerHTML = `
        <div class="card-image-area">
          ${section.image
            ? `<img src="${section.image}" alt="${section.title}" loading="lazy">`
            : `<div class="card-image-placeholder">${section.icon}</div>`
          }
        </div>
        <div class="card-body">
          <div class="card-tag">${section.icon} ${section.title}</div>
          <h3 class="card-title">${section.subtitle || section.title}</h3>
          <p class="card-desc">${section.desc || ""}</p>
          <div class="card-footer">
            <span class="card-articles-count">${articleCount} 篇文章</span>
            <span class="card-enter-btn">
              进入
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor"
                      stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          </div>
        </div>
      `;

      // 点击 / 键盘进入板块
      card.addEventListener("click",    () => goSection(section.id));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goSection(section.id);
        }
      });

      carousel.appendChild(card);
    });

    // 初始化轮播指示点
    CarouselController.initDots();
    carousel.dataset.rendered = "1";
  }

  /* ── 页面渲染：板块首页 ── */
  function renderSection(sectionId) {
    const section = SITE_CONTENT.sections.find(s => s.id === sectionId);
    if (!section) { goHome({ replace: true }); return; }

    showSubpageChrome(section.title, section.subtitle || "", section.image);

    const contentEl = document.getElementById("subpage-content");
    if (!contentEl) return;
    contentEl.innerHTML = "";

    // 文章列表
    const grid = document.createElement("div");
    grid.className = "articles-grid";

    (section.articles || []).forEach(article => {
      const card = document.createElement("article");
      card.className = "article-card";
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", article.title);

      card.innerHTML = `
        <h3 class="article-card-title">${article.title}</h3>
        <p class="article-card-excerpt">${article.excerpt || ""}</p>
        <div class="article-card-meta">
          <span>${section.icon}</span>
          <span>${section.title}</span>
        </div>
      `;

      card.addEventListener("click",    () => goArticle(sectionId, article.id));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goArticle(sectionId, article.id);
        }
      });

      grid.appendChild(card);
    });

    contentEl.appendChild(grid);
    contentEl.classList.add("entering");
    setTimeout(() => contentEl.classList.remove("entering"), 500);

    // 板块列表不显示目录
    const tocSidebar = document.getElementById("toc-sidebar");
    if (tocSidebar) tocSidebar.style.display = "none";

    document.title = `${section.title} — ${SITE_CONTENT.site.name}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ── 页面渲染：文章详情 ── */
  function renderArticle(sectionId, articleId) {
    const section = SITE_CONTENT.sections.find(s => s.id === sectionId);
    if (!section) { goHome({ replace: true }); return; }

    const article = section.articles && section.articles.find(a => a.id === articleId);
    if (!article) { goSection(sectionId, { replace: true }); return; }

    showSubpageChrome(article.title, section.title, article.image || section.image);

    const contentEl = document.getElementById("subpage-content");
    if (!contentEl) return;
    contentEl.innerHTML = "";

    const articleEl = renderContent(article.content || "");
    contentEl.appendChild(articleEl);
    contentEl.classList.add("entering");
    setTimeout(() => contentEl.classList.remove("entering"), 500);

    // 生成目录
    buildToc(articleEl);
    buildMobileToc(contentEl);

    document.title = `${article.title} — ${SITE_CONTENT.site.name}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ── 显示子页面 Chrome（header、hero 等） ── */
  function showSubpageChrome(title, subtitle, imageSrc) {
    const homeView    = document.getElementById("home-view");
    const subpageView = document.getElementById("subpage-view");
    const siteHeader  = document.querySelector(".site-header");
    const headerTitle = document.getElementById("header-title");
    const heroBg      = document.getElementById("subpage-hero-bg");
    const heroTitle   = document.getElementById("subpage-title");
    const heroSubtitle = document.getElementById("subpage-subtitle");
    const fabHome     = document.getElementById("fab-home");

    if (homeView)    homeView.style.display    = "none";
    if (subpageView) subpageView.style.display = "";
    if (siteHeader)  siteHeader.classList.add("visible");
    if (fabHome)     fabHome.style.display     = "";

    if (headerTitle) headerTitle.textContent  = title;
    if (heroTitle)   heroTitle.textContent    = title;
    if (heroSubtitle) heroSubtitle.textContent = subtitle;

    // 设置 Hero 背景图
    if (heroBg) {
      heroBg.innerHTML = "";
      if (imageSrc) {
        const img = document.createElement("img");
        img.src     = imageSrc;
        img.alt     = "";
        img.loading = "lazy";
        heroBg.appendChild(img);
      }
    }
  }

  /* ── 监听 popstate（浏览器前进/后退） ── */
  function initPopState() {
    window.addEventListener("popstate", (e) => {
      const state = e.state;

      // 哨兵记录被 pop：重新压回去，避免关闭 webview
      if (!state || state.type === "sentinel") {
        history.pushState({ type: "sentinel" }, "", location.href);
        return;
      }

      // 基础层：返回主页
      if (state.type === "base") {
        renderHome();
        if (_onNavigate) _onNavigate(ROUTE_HOME, null, null);
        return;
      }

      const { type, sectionId, articleId } = state;
      currentSection = sectionId;
      currentArticle = articleId;

      if (type === ROUTE_HOME)    renderHome();
      if (type === ROUTE_SECTION) renderSection(sectionId);
      if (type === ROUTE_ARTICLE) renderArticle(sectionId, articleId);

      updateBreadcrumb(type, sectionId, articleId);
      updateSidebarActive(sectionId);
      if (_onNavigate) _onNavigate(type, sectionId, articleId);
    });
  }

  /* ── 初始路由（根据初始 hash 决定渲染哪个页面） ── */
  function initRoute() {
    const route = parseHash(location.hash);
    const { type, sectionId, articleId } = route;

    currentSection = sectionId || null;
    currentArticle = articleId || null;

    // 替换当前 history 状态
    history.replaceState(
      { type, sectionId: sectionId || null, articleId: articleId || null },
      "",
      location.href
    );

    if (type === ROUTE_HOME)    renderHome();
    if (type === ROUTE_SECTION) renderSection(sectionId);
    if (type === ROUTE_ARTICLE) renderArticle(sectionId, articleId);

    updateBreadcrumb(type, sectionId, articleId);
    updateSidebarActive(sectionId);
  }

  /* ── 公开 API ── */
  return {
    init(onNavigate) {
      _onNavigate = onNavigate || null;
      initHistoryGuard();
      initPopState();
      initRoute();
    },
    goHome,
    goSection,
    goArticle,
    get currentSection() { return currentSection; },
    get currentArticle() { return currentArticle; },
  };

})();