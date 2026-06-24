/* ============================================================
   ui.js — UI 交互控制
   包含：轮播、侧边栏、搜索面板、更多菜单、设置面板、
         返回顶部、浮动按钮、主题切换、Toast
   ============================================================ */

/* ============================================================
   1. 轮播控制器 (Apple-style momentum & snap)
============================================================ */
const CarouselController = (() => {
  let currentIndex = 0;
  let totalCards = 0;
  let cardWidth = 0;
  let isDragging = false;
  let startX = 0;
  let lastX = 0;
  let startTime = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;
  let animationID = null;
  let isInertiaScrolling = false;

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

  function updateCarousel(animate = true, callback) {
    const { carousel, prevBtn, nextBtn, dotsWrap } = getElements();
    if (!carousel) return;

    cardWidth = getCardWidth();
    currentIndex = Math.max(0, Math.min(totalCards - 1, currentIndex));
    currentTranslate = -(currentIndex * cardWidth);

    if (!animate) {
      carousel.style.transition = "none";
    } else {
      carousel.style.transition = `transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
    }

    carousel.style.transform = `translateX(${currentTranslate}px)`;

    if (prevBtn) prevBtn.disabled = currentIndex === 0;
    if (nextBtn) nextBtn.disabled = currentIndex >= totalCards - 1;

    if (dotsWrap) {
      dotsWrap.querySelectorAll(".cards-dot").forEach((dot, i) => {
        dot.classList.toggle("active", i === currentIndex);
      });
    }

    if (callback) {
      setTimeout(callback, animate ? 500 : 0);
    }
  }

  function initDots() {
    const { dotsWrap, carousel } = getElements();
    if (!dotsWrap || !carousel) return;

    const cards = carousel.querySelectorAll(".section-card");
    totalCards = cards.length;
    dotsWrap.innerHTML = "";

    cards.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = `cards-dot${i === 0 ? " active" : ""}`;
      dot.setAttribute("aria-label", `跳转到第 ${i + 1} 张`);
      dot.addEventListener("click", () => {
        currentIndex = i;
        updateCarousel(true);
      });
      dotsWrap.appendChild(dot);
    });
  }

  function startInertia(velocity) {
    if (isInertiaScrolling) return;
    isInertiaScrolling = true;

    let v = velocity;
    const friction = 0.95;
    const minVelocity = 0.5;

    function step() {
      if (Math.abs(v) < minVelocity) {
        isInertiaScrolling = false;
        snapToNearest();
        return;
      }

      currentTranslate += v;
      v *= friction;

      const minTranslate = -((totalCards - 1) * cardWidth);
      const maxTranslate = 0;
      if (currentTranslate > maxTranslate) {
        currentTranslate = maxTranslate;
        v *= 0.2;
      } else if (currentTranslate < minTranslate) {
        currentTranslate = minTranslate;
        v *= 0.2;
      }

      const { carousel } = getElements();
      if (carousel) {
        carousel.style.transition = "none";
        carousel.style.transform = `translateX(${currentTranslate}px)`;
      }

      animationID = requestAnimationFrame(step);
    }

    cancelAnimationFrame(animationID);
    animationID = requestAnimationFrame(step);
  }

  function snapToNearest() {
    const nearestIndex = Math.round(-currentTranslate / cardWidth);
    currentIndex = Math.max(0, Math.min(totalCards - 1, nearestIndex));
    updateCarousel(true);
  }

  function initDrag() {
    const { wrapper, carousel } = getElements();
    if (!wrapper || !carousel) return;

    function onDragStart(clientX) {
      if (isInertiaScrolling) {
        cancelAnimationFrame(animationID);
        isInertiaScrolling = false;
      }
      isDragging = true;
      startX = clientX;
      lastX = clientX;
      startTime = Date.now();
      prevTranslate = currentTranslate;
      carousel.style.transition = "none";
    }

    function onDragMove(clientX) {
      if (!isDragging) return;
      currentTranslate = prevTranslate + (clientX - startX);
      lastX = clientX;

      const minTranslate = -((totalCards - 1) * cardWidth);
      const maxTranslate = 0;
      if (currentTranslate > maxTranslate) {
        currentTranslate = maxTranslate + (currentTranslate - maxTranslate) * 0.3;
      } else if (currentTranslate < minTranslate) {
        currentTranslate = minTranslate + (currentTranslate - minTranslate) * 0.3;
      }

      carousel.style.transform = `translateX(${currentTranslate}px)`;
    }

    function onDragEnd() {
      if (!isDragging) return;
      isDragging = false;

      const endTime = Date.now();
      const timeDiff = endTime - startTime || 1;
      const moveDiff = currentTranslate - prevTranslate;
      const velocity = (moveDiff / timeDiff) * 15;

      if (Math.abs(velocity) > 1) {
        startInertia(velocity);
      } else {
        snapToNearest();
      }
    }

    wrapper.addEventListener("mousedown", (e) => onDragStart(e.clientX));
    window.addEventListener("mousemove", (e) => {
      if (isDragging) {
        e.preventDefault();
        onDragMove(e.clientX);
      }
    });
    window.addEventListener("mouseup", () => onDragEnd());

    wrapper.addEventListener("touchstart", (e) => onDragStart(e.touches[0].clientX), { passive: false });
    wrapper.addEventListener("touchmove", (e) => {
      if (isDragging) {
        e.preventDefault();
        onDragMove(e.touches[0].clientX);
      }
    }, { passive: false });
    wrapper.addEventListener("touchend", () => onDragEnd());
  }

  function init() {
    const { prevBtn, nextBtn, carousel } = getElements();
    if (!carousel) return;

    totalCards = carousel.querySelectorAll(".section-card").length;
    cardWidth = getCardWidth();

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        if (currentIndex > 0) {
          currentIndex--;
          updateCarousel(true);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        if (currentIndex < totalCards - 1) {
          currentIndex++;
          updateCarousel(true);
        }
      });
    }

    document.addEventListener("keydown", (e) => {
      const homeView = document.getElementById("home-view");
      if (!homeView || homeView.style.display === "none") return;
      if (e.key === "ArrowLeft" && currentIndex > 0) {
        currentIndex--;
        updateCarousel(true);
      }
      if (e.key === "ArrowRight" && currentIndex < totalCards - 1) {
        currentIndex++;
        updateCarousel(true);
      }
    });

    window.addEventListener("resize", () => {
      cardWidth = getCardWidth();
      currentTranslate = -(currentIndex * cardWidth);
      carousel.style.transition = "none";
      carousel.style.transform = `translateX(${currentTranslate}px)`;
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

    sidebar.querySelector(".sidebar-backdrop")
      ?.addEventListener("click", close);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen) close();
    });

    buildSidebarLinks();
  }

  function buildSidebarLinks() {
    const linksEl = document.getElementById("sidebar-links");
    if (!linksEl) return;

    linksEl.innerHTML = "";

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
    const searchBtns = document.querySelectorAll("#search-btn, #search-btn-sidebar");
    searchBtns.forEach(btn => btn?.addEventListener("click", toggle));

    const closeBtn = document.getElementById("search-close-btn");
    if (closeBtn) closeBtn.addEventListener("click", close);

    const input = document.getElementById("search-input");
    if (input) {
      input.addEventListener("input", () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => doSearch(input.value.trim()), 200);
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Escape") close();
      });
    }

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
            <path d="M26 26l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span>输入关键词开始搜索</span>
        </div>
      `;
      return;
    }

    const results = [];
    const lowerQuery = query.toLowerCase();

    SITE_CONTENT.sections.forEach(section => {
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

      (section.articles || []).forEach(article => {
        const titleMatch   = article.title.toLowerCase().includes(lowerQuery);
        const excerptMatch = article.excerpt && article.excerpt.toLowerCase().includes(lowerQuery);
        const contentMatch = article.content && article.content.toLowerCase().includes(lowerQuery);

        if (titleMatch || excerptMatch || contentMatch) {
          let snippet = article.excerpt || "";
          if (contentMatch && !excerptMatch) {
            const plainText = (article.content || "")
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .trim();
            const idx = plainText.toLowerCase().indexOf(lowerQuery);
            if (idx !== -1) {
              const start = Math.max(0, idx - 40);
              const end   = Math.min(plainText.length, idx + query.length + 60);
              snippet = (start > 0 ? "…" : "") + plainText.slice(start, end) + (end < plainText.length ? "…" : "");
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
      resultsEl.innerHTML = `<div class="search-no-results"><p>没有找到与「${escapeHtml(query)}」相关的内容</p></div>`;
      return;
    }

    resultsEl.innerHTML = "";

    const sectionResults = results.filter(r => r.type === "section");
    const articleResults = results.filter(r => r.type === "article");

    if (sectionResults.length > 0) {
      const groupLabel = document.createElement("div");
      groupLabel.className = "search-group-label";
      groupLabel.textContent = "板块";
      resultsEl.appendChild(groupLabel);
      sectionResults.forEach(r => resultsEl.appendChild(buildResultItem(r, query)));
    }

    if (articleResults.length > 0) {
      const groupLabel = document.createElement("div");
      groupLabel.className = "search-group-label";
      groupLabel.textContent = "文章";
      resultsEl.appendChild(groupLabel);
      articleResults.forEach(r => resultsEl.appendChild(buildResultItem(r, query)));
    }
  }

  function buildResultItem(result, query) {
    const item = document.createElement("div");
    item.className = "search-result-item";
    item.setAttribute("role", "button");
    item.setAttribute("tabindex", "0");

    const sectionLabel = result.type === "article"
      ? `${result.section.icon} ${result.section.title}`
      : "板块";

    const title = result.type === "article" ? result.article.title : result.section.title;
    const snippet = highlightKeyword(escapeHtml(result.snippet), query);

    item.innerHTML = `
      <div class="search-result-section">${sectionLabel}</div>
      <div class="search-result-title">${highlightKeyword(escapeHtml(title), query)}</div>
      ${snippet ? `<div class="search-result-snippet">${snippet}</div>` : ""}
    `;

    item.addEventListener("click", () => {
      if (result.type === "section") Router.goSection(result.section.id);
      else Router.goArticle(result.section.id, result.article.id);
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

  function highlightKeyword(text, query) {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return text.replace(new RegExp(`(${escaped})`, "gi"), "<mark>$1</mark>");
  }

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
      case "search": SearchController.open(); break;
      case "theme": ThemeController.toggle(); break;
      case "settings": OverlayController.open("settings"); break;
      case "home": Router.goHome(); break;
    }
  }

  return { init, open, close, toggle };
})();

/* ══════════════════════════════════════════════
   5. 弹窗（Overlay）控制器
══════════════════════════════════════════════ */
const OverlayController = (() => {
  const panels = {};
  let activePanel = null;
  let previousActiveElement = null;

  function register(panelId) {
    const el = document.getElementById(`overlay-${panelId}`);
    const closeBtn = document.getElementById(`close-${panelId}`);
    if (!el) return;

    panels[panelId] = { el, closeBtn };

    if (closeBtn) {
      closeBtn.addEventListener("click", () => close(panelId));
    }

    el.addEventListener("click", (e) => {
      if (e.target === el) close(panelId);
    });

    const scrollable = el.querySelector("[data-overlay-scroll]");
    if (scrollable) {
      scrollable.addEventListener("touchmove", (e) => {
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

    entry.el.classList.add("visible");
    entry.el.setAttribute("aria-hidden", "false");

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

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

    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";

    if (activePanel === panelId) activePanel = null;

    if (previousActiveElement) {
      previousActiveElement.focus();
      previousActiveElement = null;
    }
  }

  function init() {
    ["welcome", "settings"].forEach(id => register(id));

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
      // 使用 emoji 图标，清晰直观
      icon.textContent = isDark ? '☀️' : '🌙';
    }

    const themeLabel = document.getElementById("theme-label");
    if (themeLabel) {
      themeLabel.textContent = isDark ? "深色模式" : "浅色模式";
    }
  }

  function init() {
    apply(get());

    const btn = document.getElementById("theme-toggle");
    if (btn) btn.addEventListener("click", toggle);

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

    if (scrollTopBtn) {
      scrollTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    if (homeBtn) {
      homeBtn.addEventListener("click", () => Router.goHome());
    }

    window.addEventListener("scroll", () => {
      const scrollY = window.scrollY;
      if (scrollTopBtn) {
        scrollTopBtn.style.opacity = scrollY > scrollThreshold ? "1" : "0";
        scrollTopBtn.style.pointerEvents = scrollY > scrollThreshold ? "auto" : "none";
      }
    }, { passive: true });

    if (scrollTopBtn) {
      scrollTopBtn.style.opacity = "0";
      scrollTopBtn.style.pointerEvents = "none";
      scrollTopBtn.style.transition = "opacity 0.3s ease";
    }
  }

  return { init };
})();

/* ══════════════════════════════════════════════
   8. Header 滚动行为
══════════════════════════════════════════════ */
const HeaderController = (() => {
  let lastScrollY = 0;
  let ticking = false;

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

    if (scrollY > lastScrollY && scrollY > 60) {
      header.style.transform = "translateY(-100%)";
    } else {
      header.style.transform = "translateY(0)";
    }

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
    toast.className = "toast";
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("removing");
      toast.addEventListener("animationend", () => toast.remove(), { once: true });
    }, duration);
  }

  return { show };
})();

/* 注意：SettingsController 在 app.js 中定义，此处不再重复 */