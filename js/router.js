/* ============================================================
   router.js — 路由管理
   ============================================================ */
const Router = (() => {
  let currentSection = null;
  let currentArticle = null;
  let _onNavigate    = null;

  const ROUTE_HOME    = "";
  const ROUTE_SECTION = "section";
  const ROUTE_ARTICLE = "article";

  function initHistoryGuard() {
    history.replaceState({ type: "base" }, "", location.href);
    history.pushState({ type: "sentinel" }, "", location.href);
  }

  function parseHash(hash) {
    const raw = hash.replace(/^#\/?/, "");
    if (!raw) return { type: ROUTE_HOME };
    const parts = raw.split("/");
    if (parts[0] === "section" && parts[1]) return { type: ROUTE_SECTION, sectionId: parts[1] };
    if (parts[0] === "article" && parts[1] && parts[2]) return { type: ROUTE_ARTICLE, sectionId: parts[1], articleId: parts[2] };
    return { type: ROUTE_HOME };
  }

  function buildHash(type, sectionId, articleId) {
    if (type === ROUTE_HOME)    return "#";
    if (type === ROUTE_SECTION) return `#section/${sectionId}`;
    if (type === ROUTE_ARTICLE) return `#article/${sectionId}/${articleId}`;
    return "#";
  }

  function navigate(type, sectionId, articleId, options) {
    options = options || {};
    const hash     = buildHash(type, sectionId, articleId);
    const stateObj = { type, sectionId: sectionId || null, articleId: articleId || null };
    if (options.replace) history.replaceState(stateObj, "", hash);
    else history.pushState(stateObj, "", hash);

    currentSection = sectionId || null;
    currentArticle = articleId || null;

    if (_onNavigate) _onNavigate(type, sectionId, articleId);
    updateBreadcrumb(type, sectionId, articleId);
    updateSidebarActive(sectionId);

    if (type === ROUTE_HOME) renderHome();
    else if (type === ROUTE_SECTION) renderSection(sectionId);
    else if (type === ROUTE_ARTICLE) renderArticle(sectionId, articleId);
  }

  function goHome(options) { navigate(ROUTE_HOME, null, null, options); }
  function goSection(sectionId, options) { navigate(ROUTE_SECTION, sectionId, null, options); }
  function goArticle(sectionId, articleId, options) { navigate(ROUTE_ARTICLE, sectionId, articleId, options); }

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

    const homeItem = document.createElement("li");
    const homeBtn  = document.createElement("button");
    homeBtn.textContent = "首页";
    homeBtn.className   = "btn-text";
    homeBtn.style.cssText = "padding:0;font-size:0.75rem;";
    homeBtn.addEventListener("click", () => goHome());
    homeItem.appendChild(homeBtn);
    list.appendChild(homeItem);

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

  function updateSidebarActive(sectionId) {
    document.querySelectorAll(".sidebar-link-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.sectionId === sectionId);
    });
  }

  // 其他函数（buildToc, buildMobileToc, renderContent 等）保持不变，略...
  // 此处省略以节省篇幅，实际替换时需包含完整的原有函数

  function renderHome() {
    const homeView    = document.getElementById("home-view");
    const subpageView = document.getElementById("subpage-view");
    const siteHeader  = document.querySelector(".site-header");
    const fabHome     = document.getElementById("fab-home");
    const breadcrumb  = document.getElementById("breadcrumb");   // ★ 显式隐藏面包屑

    if (homeView)    homeView.style.display    = "";
    if (subpageView) subpageView.style.display = "none";
    if (siteHeader)  siteHeader.classList.remove("visible");
    if (fabHome)     fabHome.style.display     = "none";
    if (breadcrumb)  breadcrumb.style.display  = "none";        // ★ 双重保险

    document.title = SITE_CONTENT.site.name;
    window.scrollTo({ top: 0, behavior: "instant" });
    renderSectionCards();
  }

  function showSubpageChrome(title, subtitle, imageSrc) {
    // ... 原有逻辑不变，略
  }

  // ★ 修改 initRoute，在渲染后触发回调
  function initRoute() {
    const route = parseHash(location.hash);
    const { type, sectionId, articleId } = route;
    currentSection = sectionId || null;
    currentArticle = articleId || null;

    history.replaceState(
      { type, sectionId: sectionId || null, articleId: articleId || null },
      "",
      location.href
    );

    if (type === ROUTE_HOME)    renderHome();
    else if (type === ROUTE_SECTION) renderSection(sectionId);
    else if (type === ROUTE_ARTICLE) renderArticle(sectionId, articleId);

    updateBreadcrumb(type, sectionId, articleId);
    updateSidebarActive(sectionId);

    // ★ 初始加载也触发导航回调（用于欢迎弹窗控制）
    if (_onNavigate) _onNavigate(type, sectionId, articleId);
  }

  function initPopState() {
    window.addEventListener("popstate", (e) => {
      const state = e.state;
      if (!state || state.type === "sentinel") {
        history.pushState({ type: "sentinel" }, "", location.href);
        return;
      }
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

  return {
    init(onNavigate) {
      _onNavigate = onNavigate || null;
      initHistoryGuard();
      initPopState();
      initRoute();
    },
    goHome, goSection, goArticle,
    get currentSection() { return currentSection; },
    get currentArticle() { return currentArticle; },
  };
})();