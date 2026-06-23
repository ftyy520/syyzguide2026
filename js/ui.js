/* ============================================================
   ui.js — UI 交互控制
   包含：轮播、侧边栏、搜索面板、更多菜单、设置面板、
         返回顶部、浮动按钮、主题切换、Toast
   ============================================================ */

/* ══════════════════════════════════════════════
   1. 轮播控制器
══════════════════════════════════════════════ */
const CarouselController = (() => {
  let currentIndex  = 0;
  let totalCards    = 0;
  let cardWidth     = 0;
  let isDragging    = false;
  let startX        = 0;
  let currentX      = 0;
  let currentTranslate = 0;
  let prevTranslate    = 0;

  function getElements() {
    return {
      carousel : document.getElementById("cards-carousel"),
      wrapper  : document.querySelector(".cards-carousel-wrapper"),
      prevBtn  : document.getElementById("cards-prev"),
      nextBtn  : document.getElementById("cards-next"),
      dotsWrap : document.getElementById("cards-dots"),
    };
  }

  function getCardWidth() {
    const { carousel } = getElements();
    if (!carousel) return 300;
    const firstCard = carousel.querySelector(".section-card");
    if (!firstCard) return 300;
    const gap = parseInt(getComputedStyle(carousel).gap) || 20;
    return firstCard.offsetWidth + gap;
  }

  function updateCarousel(animate) {
    const { carousel, prevBtn, nextBtn, dotsWrap } = getElements();
    if (!carousel) return;

    cardWidth        = getCardWidth();
    currentTranslate = -(currentIndex * cardWidth);

    if (animate === false) {
      carousel.style.transition = "none";
    } else {
      carousel.style.transition =
        `transform ${getComputedStyle(document.documentElement)
          .getPropertyValue("--duration-slow").trim()} ${
          getComputedStyle(document.documentElement)
          .getPropertyValue("--ease-out-expo").trim()}`;
    }

    carousel.style.transform = `translateX(${currentTranslate}px)`;

    if (prevBtn) prevBtn.disabled = currentIndex === 0;
    if (nextBtn) nextBtn.disabled = currentIndex >= totalCards - 1;

    // 更新指示点
    if (dotsWrap) {
      dotsWrap.querySelectorAll(".cards-dot").forEach((dot, i) => {
        dot.classList.toggle("active", i === currentIndex);
      });
    }
  }

  function initDots() {
    const { dotsWrap, carousel } = getElements();
    if (!dotsWrap || !carousel) return;

    const cards = carousel.querySelectorAll(".section-card");
    totalCards  = cards.length;
    dotsWrap.innerHTML = "";

    cards.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = `cards-dot${i === 0 ? " active" : ""}`;
      dot.setAttribute("aria-label", `跳转到第 ${i + 1} 张`);
      dot.addEventListener("click", () => {
        currentIndex = i;
        updateCarousel();
      });
      dotsWrap.appendChild(dot);
    });
  }

  function initDrag() {
    const { wrapper, carousel } = getElements();
    if (!wrapper || !carousel) return;

    function onDragStart(clientX) {
      isDragging       = true;
      startX           = clientX;
      prevTranslate    = currentTranslate;
      carousel.style.transition = "none";
    }

    function onDragMove(clientX) {
      if (!isDragging) return;
      currentX         = clientX;
      const diff       = currentX - startX;
      currentTranslate = prevTranslate + diff;
      carousel.style.transform = `translateX(${currentTranslate}px)`;
    }

    function onDragEnd() {
      if (!isDragging) return;
      isDragging = false;

      const movedBy = currentX - startX;
      if (movedBy < -50 && currentIndex < totalCards - 1) {
        currentIndex++;
      } else if (movedBy > 50 && currentIndex > 0) {
        currentIndex--;
      }
      updateCarousel();
    }

    // 鼠标事件
    wrapper.addEventListener("mousedown",  (e) => onDragStart(e.clientX));
    window.addEventListener("mousemove",   (e) => { if (isDragging) onDragMove(e.clientX); });
    window.addEventListener("mouseup",     ()  => onDragEnd());

    // 触摸事件
   wrapper.addEventListener("touchstart", (e) => onDragStart(e.touches[0].clientX),
  { passive: false });
wrapper.addEventListener("touchmove",  (e) => {
  e.preventDefault();   // ★ 阻止浏览器默认手势和页面滚动
  onDragMove(e.touches[0].clientX);
}, { passive: false });
  }

  function init() {
    const { prevBtn, nextBtn, carousel } = getElements();
    if (!carousel) return;

    totalCards = carousel.querySelectorAll(".section-card").length;
    cardWidth  = getCardWidth();

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        if (currentIndex > 0) { currentIndex--; updateCarousel(); }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        if (currentIndex < totalCards - 1) { currentIndex++; updateCarousel(); }
      });
    }

    // 键盘支持
    document.addEventListener("keydown", (e) => {
      const homeView = document.getElementById("home-view");
      if (!homeView || homeView.style.display === "none") return;
      if (e.key === "ArrowLeft"  && currentIndex > 0)            { currentIndex--; updateCarousel(); }
      if (e.key === "ArrowRight" && currentIndex < totalCards - 1) { currentIndex++; updateCarousel(); }
    });

    // 窗口 resize 时重新计算
    window.addEventListener("resize", () => {
      cardWidth        = getCardWidth();
      currentTranslate = -(currentIndex * cardWidth);
      carousel.style.transition = "none";
      carousel.style.transform  = `translateX(${currentTranslate}px)`;
    });

    initDrag();
    updateCarousel(false);
  }

  return { init, initDots, updateCarousel };
})();

/* ══════════════════════════════════════════════
   2. 侧边栏
══════════════════════════════════════════════ */
const SidebarController = (() => {
  let isOpen = false;

  function open() {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;
    isOpen = true;
    sidebar.classList.add("open");
    document.body.style.overflow = "hidden";
    sidebar.querySelector(".sidebar-nav")
      .setAttribute("aria-hidden", "false");
  }

  function close() {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;
    isOpen = false;
    sidebar.classList.remove("open");
    document.body.style.overflow = "";
    sidebar.querySelector(".sidebar-nav")
      .setAttribute("aria-hidden", "true");
  }

  function toggle() { isOpen ? close() : open(); }

  function init() {
    const menuBtn  = document.getElementById("menu-btn");
    const sidebar  = document.getElementById("sidebar");
    if (!menuBtn || !sidebar) return;

    menuBtn.addEventListener("click", toggle);

    // 点击遮罩关闭
    sidebar.querySelector(".sidebar-backdrop")
      ?.addEventListener("click", close);

    // ESC 关闭
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen) close();
    });

    // 填充侧边栏链接
    buildSidebarLinks();
  }

  function buildSidebarLinks() {
    const linksEl = document.getElementById("sidebar-links");
    if (!linksEl) return;

    linksEl.innerHTML = "";

    // 首页链接
    const homeItem = document.createElement("li");
    homeItem.className = "sidebar-link-item";
    const homeBtn  = document.createElement("button");
    homeBtn.className = "sidebar-link-btn";
    homeBtn.innerHTML = `
      <span class="sidebar-link-icon">🏠</span>
      <span>首页</span>
    `;
    homeBtn.addEventListener("click", () => {
      Router.goHome();
      close();
    });
    homeItem.appendChild(homeBtn);
    linksEl.appendChild(homeItem);

    // 板块链接
    SITE_CONTENT.sections.forEach(section => {
      const item = document.createElement("li");
      item.className = "sidebar-link-item";

      const btn = document.createElement("button");
      btn.className          = "sidebar-link-btn";
      btn.dataset.sectionId  = section.id;
      btn.innerHTML = `
        <span class="sidebar-link-icon">${section.icon}</span>
        <span>${section.title}</span>
      `;
      btn.addEventListener("click", () => {
        Router.goSection(section.id);
        close();
      });

      item.appendChild(btn);
      linksEl.appendChild(item);
    });
  }

  return { init, open, close, toggle };
})();

/* ══════════════════════════════════════════════
   3. 搜索面板
══════════════════════════════════════════════ */
const SearchController = (() => {
  let isOpen   = false;
  let debounce = null;

  function open() {
    const panel = document.getElementById("search-panel");
    if (!panel) return;
    isOpen = true;
    panel.classList.add("open");
    document.body.style.overflow = "hidden";
    setTimeout(() => {
      const input = document.getElementById("search-input");
      if (input) input.focus();
    }, 100);
  }

  function close() {
    const panel = document.getElementById("search-panel");
    if (!panel) return;
    isOpen = false;
    panel.classList.remove("open");
    document.body.style.overflow = "";
  }

  function toggle() { isOpen ? close() : open(); }

  function init() {
    const searchBtns = document.querySelectorAll(
      "#search-btn, #search-btn-sidebar"
    );
        searchBtns.forEach(btn => btn?.addEventListener("click", toggle));

    const closeBtn = document.getElementById("search-close-btn");
    if (closeBtn) closeBtn.addEventListener("click", close);

    const input = document.getElementById("search-input");
    if (input) {
      input.addEventListener("input", () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => doSearch(input.value.trim()), 200);
      });

      // ESC 关闭
      input.addEventListener("keydown", (e) => {
        if (e.key === "Escape") close();
      });
    }

    // 点击面板外部区域关闭
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen) close();
    });
  }

  function doSearch(query) {
    const resultsEl = document.getElementById("search-results");
    if (!resultsEl) return;

    if (!query) {
      resultsEl.innerHTML = `
        <div class="search-placeholder">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <circle cx="18" cy="18" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M26 26l6 6" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round"/>
          </svg>
          <span>输入关键词开始搜索</span>
        </div>
      `;
      return;
    }

    // 遍历所有板块和文章进行搜索
    const results = [];
    const lowerQuery = query.toLowerCase();

    SITE_CONTENT.sections.forEach(section => {
      // 匹配板块标题
      if (
        section.title.toLowerCase().includes(lowerQuery) ||
        (section.desc && section.desc.toLowerCase().includes(lowerQuery))
      ) {
        results.push({
          type    : "section",
          section : section,
          article : null,
          snippet : section.desc || section.subtitle || "",
        });
      }

      // 匹配文章
      (section.articles || []).forEach(article => {
        const titleMatch   = article.title.toLowerCase().includes(lowerQuery);
        const excerptMatch = article.excerpt && article.excerpt.toLowerCase().includes(lowerQuery);
        const contentMatch = article.content && article.content.toLowerCase().includes(lowerQuery);

        if (titleMatch || excerptMatch || contentMatch) {
          // 提取匹配片段
          let snippet = article.excerpt || "";
          if (contentMatch && !excerptMatch) {
            // 从正文中截取匹配上下文（剥离 HTML 标签）
            const plainText = (article.content || "")
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .trim();
            const idx = plainText.toLowerCase().indexOf(lowerQuery);
            if (idx !== -1) {
              const start = Math.max(0, idx - 40);
              const end   = Math.min(plainText.length, idx + query.length + 60);
              snippet = (start > 0 ? "…" : "") +
                        plainText.slice(start, end) +
                        (end < plainText.length ? "…" : "");
            }
          }
          results.push({
            type    : "article",
            section : section,
            article : article,
            snippet : snippet,
          });
        }
      });
    });

    if (results.length === 0) {
      resultsEl.innerHTML = `
        <div class="search-no-results">
          <p>没有找到与「${escapeHtml(query)}」相关的内容</p>
        </div>
      `;
      return;
    }

    // 渲染搜索结果
    resultsEl.innerHTML = "";

    // 分组：板块结果
    const sectionResults = results.filter(r => r.type === "section");
    const articleResults = results.filter(r => r.type === "article");

    if (sectionResults.length > 0) {
      const groupLabel = document.createElement("div");
      groupLabel.className   = "search-group-label";
      groupLabel.textContent = "板块";
      resultsEl.appendChild(groupLabel);

      sectionResults.forEach(r => {
        resultsEl.appendChild(buildResultItem(r, query));
      });
    }

    if (articleResults.length > 0) {
      const groupLabel = document.createElement("div");
      groupLabel.className   = "search-group-label";
      groupLabel.textContent = "文章";
      resultsEl.appendChild(groupLabel);

      articleResults.forEach(r => {
        resultsEl.appendChild(buildResultItem(r, query));
      });
    }
  }

  function buildResultItem(result, query) {
    const item = document.createElement("div");
    item.className = "search-result-item";
    item.setAttribute("role",    "button");
    item.setAttribute("tabindex", "0");

    const sectionLabel = result.type === "article"
      ? `${result.section.icon} ${result.section.title}`
      : "板块";

    const title   = result.type === "article"
      ? result.article.title
      : result.section.title;

    const snippet = highlightKeyword(escapeHtml(result.snippet), query);

    item.innerHTML = `
      <div class="search-result-section">${sectionLabel}</div>
      <div class="search-result-title">${highlightKeyword(escapeHtml(title), query)}</div>
      ${snippet ? `<div class="search-result-snippet">${snippet}</div>` : ""}
    `;

    item.addEventListener("click", () => {
      if (result.type === "section") {
        Router.goSection(result.section.id);
      } else {
        Router.goArticle(result.section.id, result.article.id);
      }
      close();
    });

    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        item.click();
      }
    });

    return item;
  }

  /* 高亮关键词 */
  function highlightKeyword(text, query) {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return text.replace(
      new RegExp(`(${escaped})`, "gi"),
      "<mark>$1</mark>"
    );
  }

  /* HTML 转义 */
  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  return { init, open, close, toggle };
})();

/* ══════════════════════════════════════════════
   4. 更多菜单
══════════════════════════════════════════════ */
const MoreMenuController = (() => {
  let isOpen = false;

  function open() {
    const menu = document.getElementById("more-menu");
    if (!menu) return;
    isOpen = true;
    menu.classList.add("open");
  }

  function close() {
    const menu = document.getElementById("more-menu");
    if (!menu) return;
    isOpen = false;
    menu.classList.remove("open");
  }

  function toggle() { isOpen ? close() : open(); }

  function init() {
    const moreBtn  = document.getElementById("more-btn");
    const backdrop = document.querySelector(".more-menu-backdrop");

    if (moreBtn)   moreBtn.addEventListener("click", (e) => { e.stopPropagation(); toggle(); });
    if (backdrop)  backdrop.addEventListener("click", close);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen) close();
    });

    // 菜单项点击
    document.querySelectorAll(".more-menu-item[data-action]").forEach(item => {
      item.addEventListener("click", () => {
        const action = item.dataset.action;
        handleAction(action);
        close();
      });
    });
  }

  function handleAction(action) {
    switch (action) {
      case "search":
        SearchController.open();
        break;
      case "theme":
        ThemeController.toggle();
        break;
      case "settings":
        OverlayController.open("settings");
        break;
      case "home":
        Router.goHome();
        break;
      default:
        break;
    }
  }

  return { init, open, close, toggle };
})();

/* ══════════════════════════════════════════════
  5. 弹窗（Overlay）控制器（升级版）
============================================================ */
const OverlayController = (() => {
  const panels = {};
  let activePanel = null;
  let previousActiveElement = null;

  function register(panelId) {
    const el = document.getElementById(`overlay-${panelId}`);
    const closeBtn = document.getElementById(`close-${panelId}`);
    if (!el) return;

    // 保存面板引用
    panels[panelId] = { el, closeBtn };

    // 关闭按钮事件
    if (closeBtn) {
      closeBtn.addEventListener("click", () => close(panelId));
    }

    // 点击背景关闭
    el.addEventListener("click", (e) => {
      if (e.target === el) close(panelId);
    });

    // 防止面板内部滚动穿透到底层
    const scrollable = el.querySelector("[data-overlay-scroll]");
    if (scrollable) {
      scrollable.addEventListener("touchmove", (e) => {
        // 允许面板内部滚动，但阻止传播到 body
        e.stopPropagation();
      }, { passive: false });
    }
  }

  function open(panelId) {
    if (activePanel) close(activePanel);

    const entry = panels[panelId];
    if (!entry) return;

    activePanel = panelId;
    previousActiveElement = document.activeElement;

    // 显示面板
    entry.el.classList.add("visible");
    entry.el.setAttribute("aria-hidden", "false");

    // 锁定 body 滚动
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    // 焦点管理：将焦点移到面板内第一个可聚焦元素
    setTimeout(() => {
      const focusable = entry.el.querySelector(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      );
      if (focusable) focusable.focus();
    }, 100);
  }

  function close(panelId) {
    const entry = panels[panelId];
    if (!entry) return;

    entry.el.classList.remove("visible");
    entry.el.setAttribute("aria-hidden", "true");

    // 解锁滚动
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";

    if (activePanel === panelId) activePanel = null;

    // 恢复焦点
    if (previousActiveElement) {
      previousActiveElement.focus();
      previousActiveElement = null;
    }
  }

  function init() {
    // 注册所有 overlay 面板
    ["welcome", "settings"].forEach(id => register(id));

    // ESC 关闭
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && activePanel) {
        close(activePanel);
      }
    });
  }

  return { init, open, close };
})();

/* ══════════════════════════════════════════════
   6. 主题控制器
══════════════════════════════════════════════ */
const ThemeController = (() => {
  const STORAGE_KEY = "theme";
  const DARK  = "dark";
  const LIGHT = "light";

  function get() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? DARK : LIGHT;
  }

  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
    updateToggleBtn(theme);
  }

  function toggle() {
    const current = get();
    apply(current === DARK ? LIGHT : DARK);
  }

  function updateToggleBtn(theme) {
    const btn  = document.getElementById("theme-toggle");
    const icon = document.getElementById("theme-icon");
    if (!btn) return;

    const isDark = theme === DARK;
    btn.setAttribute("aria-label", isDark ? "切换到浅色模式" : "切换到深色模式");
    btn.setAttribute("aria-pressed", String(isDark));

    if (icon) {
      icon.innerHTML = isDark
        ? /* 太阳图标 */ `
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M16.36 16.36l1.42 1.42
                   M2 12h2M20 12h2M4.22 19.78l1.42-1.42M16.36 7.64l1.42-1.42"
                stroke="currentColor" stroke-width="1.8"
                stroke-linecap="round" fill="none"/>
        `
        : /* 月亮图标 */ `
          <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"
                stroke="currentColor" stroke-width="1.8"
                stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        `;
    }

    // 同步设置面板中的主题标签
    const themeLabel = document.getElementById("theme-label");
    if (themeLabel) {
      themeLabel.textContent = isDark ? "深色模式" : "浅色模式";
    }
  }

  function init() {
    apply(get());

    const btn = document.getElementById("theme-toggle");
    if (btn) btn.addEventListener("click", toggle);

    // 监听系统主题变化（仅在用户未手动设置时生效）
    window.matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        if (!localStorage.getItem(STORAGE_KEY)) {
          apply(e.matches ? DARK : LIGHT);
        }
      });
  }

  return { init, toggle, get, apply };
})();

/* ══════════════════════════════════════════════
   7. 返回顶部 & 浮动按钮
══════════════════════════════════════════════ */
const FabController = (() => {
  let scrollThreshold = 400;

  function init() {
    const scrollTopBtn = document.getElementById("fab-scroll-top");
    const homeBtn      = document.getElementById("fab-home");

    // 返回顶部按钮
    if (scrollTopBtn) {
      scrollTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    // 返回首页按钮
    if (homeBtn) {
      homeBtn.addEventListener("click", () => Router.goHome());
    }

    // 监听滚动：控制返回顶部按钮显隐
    window.addEventListener("scroll", () => {
      const scrollY = window.scrollY;
      if (scrollTopBtn) {
        scrollTopBtn.style.opacity = scrollY > scrollThreshold ? "1" : "0";
        scrollTopBtn.style.pointerEvents = scrollY > scrollThreshold ? "auto" : "none";
      }
    }, { passive: true });

    // 初始隐藏
    if (scrollTopBtn) {
      scrollTopBtn.style.opacity      = "0";
      scrollTopBtn.style.pointerEvents = "none";
      scrollTopBtn.style.transition   = "opacity 0.3s ease";
    }
  }

  return { init };
})();

/* ══════════════════════════════════════════════
   8. Header 滚动行为
══════════════════════════════════════════════ */
const HeaderController = (() => {
  let lastScrollY  = 0;
  let ticking      = false;

  function init() {
    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          update();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  function update() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    const scrollY = window.scrollY;

    // 向下滚动超过 60px 时隐藏 header，向上滚动时显示
    if (scrollY > lastScrollY && scrollY > 60) {
      header.style.transform = "translateY(-100%)";
    } else {
      header.style.transform = "translateY(0)";
    }

    // 滚动超过 10px 时加背景模糊
    header.classList.toggle("scrolled", scrollY > 10);

    lastScrollY = scrollY;
  }

  return { init };
})();

/* ══════════════════════════════════════════════
   9. Toast 提示
══════════════════════════════════════════════ */
const Toast = (() => {
  function show(message, duration) {
    duration = duration || 2500;
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className   = "toast";
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("removing");
      toast.addEventListener("animationend", () => toast.remove(), { once: true });
    }, duration);
  }

  return { show };
})();

/* ══════════════════════════════════════════════
   10. 设置面板：音量滑块 & 不再显示逻辑
══════════════════════════════════════════════ */
const SettingsController = (() => {
  const STORAGE_NO_SHOW = "no_show_welcome";

  function init() {
    // 音量滑块
    const volumeSlider = document.getElementById("volume-slider");
    if (volumeSlider) {
      const saved = localStorage.getItem("music_volume");
      volumeSlider.value = saved !== null ? saved : "60";
      updateSliderTrack(volumeSlider);

      volumeSlider.addEventListener("input", () => {
        updateSliderTrack(volumeSlider);
        localStorage.setItem("music_volume", volumeSlider.value);
        MusicController.setVolume(volumeSlider.value / 100);
      });
    }

    // 不再显示欢迎弹窗
    const noShowCheckbox = document.getElementById("no-show-checkbox");
    if (noShowCheckbox) {
      noShowCheckbox.checked = localStorage.getItem(STORAGE_NO_SHOW) === "1";
      noShowCheckbox.addEventListener("change", () => {
        localStorage.setItem(STORAGE_NO_SHOW, noShowCheckbox.checked ? "1" : "0");
      });
    }
  }

  function updateSliderTrack(slider) {
    const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.background =
      `linear-gradient(to right, var(--accent) ${pct}%, var(--bg-tertiary) ${pct}%)`;
  }

  function shouldShowWelcome() {
    return localStorage.getItem(STORAGE_NO_SHOW) !== "1";
  }

  return { init, shouldShowWelcome };
})();