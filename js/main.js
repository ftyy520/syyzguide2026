// main.js - 新生指南网站交互逻辑
(function() {
  'use strict';

  // ========== DOM 元素引用 ==========
  const body = document.body;
  const html = document.documentElement;

  // 弹窗
  const welcomeModal = document.getElementById('welcomeModal');
  const modalXBtn = document.getElementById('modalXBtn');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const dontShowAgain = document.getElementById('dontShowAgain');
  const showWelcomeBtn = document.getElementById('showWelcomeBtn');
  const sidebarWelcomeBtn = document.getElementById('sidebarWelcomeBtn');

  // 音乐
  const modalMusicToggle = document.getElementById('modalMusicToggle');
  const modalMusicSelect = document.getElementById('modalMusicSelect');
  const musicPlayer = document.getElementById('musicPlayer');
  const musicToggleBtn = document.getElementById('musicToggleBtn');
  const musicPlayerClose = document.getElementById('musicPlayerClose');
  const audioPlayer = document.getElementById('audioPlayer');
  const musicPlayBtn = document.getElementById('musicPlayBtn');
  const musicPrevBtn = document.getElementById('musicPrevBtn');
  const musicNextBtn = document.getElementById('musicNextBtn');
  const currentTrackName = document.getElementById('currentTrackName');
  const currentTrackGenre = document.getElementById('currentTrackGenre');
  const musicDisc = document.getElementById('musicDisc');
  const playlistItems = document.querySelectorAll('.playlist-item');
  const musicChoiceRadios = document.getElementsByName('musicChoice');
  const showMusicBtn = document.getElementById('showMusicBtn');
  const sidebarMusicBtn = document.getElementById('sidebarMusicBtn');

  // 主题
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeToggleBtn2 = document.getElementById('themeToggleBtn2');
  const sidebarThemeBtn = document.getElementById('sidebarThemeBtn');
  const themeIconSun = document.getElementById('themeIconSun');
  const themeIconMoon = document.getElementById('themeIconMoon');

  // 导航
  const siteHeader = document.getElementById('siteHeader');
  const searchToggleBtn = document.getElementById('searchToggleBtn');
  const searchBarWrapper = document.getElementById('searchBarWrapper');
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const sidebar = document.getElementById('sidebar');
  const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
  const moreBtn = document.getElementById('moreBtn');
  const moreDropdown = document.getElementById('moreDropdown');

  // 返回顶部
  const backToTop = document.getElementById('backToTop');

  // 轮播
  const carouselTrack = document.getElementById('carouselTrack');
  const carouselLeft = document.getElementById('carouselLeft');
  const carouselRight = document.getElementById('carouselRight');
  const carouselDots = document.getElementById('carouselDots');
  const sectionCards = document.querySelectorAll('.section-card');

  // SPA 视图
  const views = document.querySelectorAll('.view-panel');
  const navButtons = document.querySelectorAll('[data-nav]');

  // 音乐数据
  const trackList = [
    { name: '清晨微风', genre: '轻音乐', src: '' },
    { name: 'Lofi Study Beat', genre: 'Lofi Hip-hop', src: '' },
    { name: '钢琴晨曲', genre: '古典钢琴', src: '' },
    { name: 'Forest Ambient', genre: '环境音', src: '' }
  ];
  let currentTrack = 0;
  let isPlaying = false;

  // ========== 工具函数 ==========
  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeIcons(theme);
  }

  function updateThemeIcons(theme) {
    const isDark = theme === 'dark';
    if (themeIconSun) themeIconSun.style.display = isDark ? 'none' : '';
    if (themeIconMoon) themeIconMoon.style.display = isDark ? '' : 'none';
  }

  function closeMoreDropdown() {
    if (moreDropdown) moreDropdown.classList.remove('open');
    if (moreBtn) moreBtn.classList.remove('active');
  }

  // ========== SPA 视图切换 ==========
  function showPanel(panelName) {
    views.forEach(v => v.classList.remove('active'));
    const target = document.getElementById(`view-${panelName}`);
    if (target) {
      target.classList.add('active');
      window.location.hash = panelName === 'home' ? '' : panelName;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      closeSidebar();
      closeSearch();
    }
  }

  // 所有 data-nav 按钮
  navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const panel = btn.dataset.nav;
      if (panel) showPanel(panel);
      if (btn.hasAttribute('data-close-sidebar')) closeSidebar();
    });
  });

  // hash 路由监听（支持浏览器后退）
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(`view-${hash}`)) {
      showPanelSilent(hash);
    } else {
      showPanelSilent('home');
    }
  });

  function showPanelSilent(panelName) {
    views.forEach(v => v.classList.remove('active'));
    const target = document.getElementById(`view-${panelName}`);
    if (target) target.classList.add('active');
  }

  // 初始化
  function handleInitialHash() {
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(`view-${hash}`)) {
      showPanelSilent(hash);
    } else {
      showPanelSilent('home');
    }
  }
  handleInitialHash();

  // ========== 快速跳转（锚点） ==========
  document.querySelectorAll('.quick-nav-link[data-scroll]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.dataset.scroll;
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ========== 弹窗逻辑 ==========
  function showModal() {
    welcomeModal.classList.remove('hidden');
  }
  function hideModal() {
    welcomeModal.classList.add('hidden');
    if (dontShowAgain.checked) {
      localStorage.setItem('hideWelcomeModal', 'true');
    }
  }

  if (localStorage.getItem('hideWelcomeModal') !== 'true') {
    showModal();
  } else {
    hideModal();
  }

  if (modalXBtn) modalXBtn.addEventListener('click', hideModal);
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', hideModal);
  if (showWelcomeBtn) showWelcomeBtn.addEventListener('click', showModal);
  if (sidebarWelcomeBtn) sidebarWelcomeBtn.addEventListener('click', () => {
    showModal();
    closeSidebar();
  });

  // 弹窗音乐开关
  if (modalMusicToggle) {
    modalMusicToggle.addEventListener('change', function() {
      if (this.checked) {
        modalMusicSelect.classList.add('visible');
        const checkedRadio = document.querySelector('input[name="musicChoice"]:checked');
        if (checkedRadio) {
          currentTrack = parseInt(checkedRadio.value);
          updateMusicPlayerUI();
        }
      } else {
        modalMusicSelect.classList.remove('visible');
        pauseMusic();
      }
    });
  }

  // 弹窗音乐选择
  musicChoiceRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.checked) {
        currentTrack = parseInt(this.value);
        if (modalMusicToggle && modalMusicToggle.checked) {
          loadAndPlayTrack(currentTrack);
        }
        updatePlaylistActive();
        updateMusicPlayerUI();
      }
    });
  });

  // ========== 音乐播放器 ==========
  function loadAndPlayTrack(index) {
    const track = trackList[index];
    if (!track.src) {
      updateMusicPlayerUI();
      return;
    }
    audioPlayer.src = track.src;
    audioPlayer.load();
    audioPlayer.play().then(() => {
      isPlaying = true;
      updatePlayState();
    }).catch(() => {
      isPlaying = false;
      updatePlayState();
    });
  }

  function pauseMusic() {
    audioPlayer.pause();
    isPlaying = false;
    updatePlayState();
  }

  function resumeMusic() {
    if (!trackList[currentTrack].src) return;
    audioPlayer.play().then(() => {
      isPlaying = true;
      updatePlayState();
    }).catch(() => {});
  }

  function updatePlayState() {
    const iconPlay = document.getElementById('iconPlay');
    const iconPause = document.getElementById('iconPause');
    if (isPlaying) {
      if (iconPlay) iconPlay.style.display = 'none';
      if (iconPause) iconPause.style.display = '';
      if (musicDisc) musicDisc.classList.add('spinning');
      if (modalMusicToggle) {
        modalMusicToggle.checked = true;
        modalMusicSelect.classList.add('visible');
      }
    } else {
      if (iconPlay) iconPlay.style.display = '';
      if (iconPause) iconPause.style.display = 'none';
      if (musicDisc) musicDisc.classList.remove('spinning');
    }
  }

  function updateMusicPlayerUI() {
    const track = trackList[currentTrack];
    if (currentTrackName) currentTrackName.textContent = track.name;
    if (currentTrackGenre) currentTrackGenre.textContent = track.genre;
    updatePlaylistActive();
  }

  function updatePlaylistActive() {
    playlistItems.forEach((item, idx) => {
      if (idx === currentTrack) item.classList.add('active');
      else item.classList.remove('active');
    });
  }

  if (musicPlayBtn) {
    musicPlayBtn.addEventListener('click', () => {
      if (isPlaying) {
        pauseMusic();
      } else {
        if (audioPlayer.src || trackList[currentTrack].src) {
          resumeMusic();
        } else {
          loadAndPlayTrack(currentTrack);
        }
      }
    });
  }

  if (musicPrevBtn) {
    musicPrevBtn.addEventListener('click', () => {
      currentTrack = (currentTrack - 1 + trackList.length) % trackList.length;
      loadAndPlayTrack(currentTrack);
      updateMusicPlayerUI();
    });
  }

  if (musicNextBtn) {
    musicNextBtn.addEventListener('click', () => {
      currentTrack = (currentTrack + 1) % trackList.length;
      loadAndPlayTrack(currentTrack);
      updateMusicPlayerUI();
    });
  }

  playlistItems.forEach(item => {
    item.addEventListener('click', () => {
      currentTrack = parseInt(item.dataset.track);
      loadAndPlayTrack(currentTrack);
      updateMusicPlayerUI();
    });
  });

  function openMusicPlayer() {
    if (musicPlayer) musicPlayer.classList.add('open');
  }
  function closeMusicPlayer() {
    if (musicPlayer) musicPlayer.classList.remove('open');
  }
  if (musicToggleBtn) musicToggleBtn.addEventListener('click', openMusicPlayer);
  if (musicPlayerClose) musicPlayerClose.addEventListener('click', closeMusicPlayer);
  if (showMusicBtn) showMusicBtn.addEventListener('click', () => { openMusicPlayer(); closeMoreDropdown(); });
  if (sidebarMusicBtn) sidebarMusicBtn.addEventListener('click', () => { openMusicPlayer(); closeSidebar(); });

  // ========== 主题切换 ==========
  function toggleTheme() {
    const current = html.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }

  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);

  if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);
  if (themeToggleBtn2) themeToggleBtn2.addEventListener('click', () => { toggleTheme(); closeMoreDropdown(); });
  if (sidebarThemeBtn) sidebarThemeBtn.addEventListener('click', () => { toggleTheme(); closeSidebar(); });

  // ========== 搜索 ==========
  let searchOpen = false;
  function openSearch() {
    if (searchBarWrapper) searchBarWrapper.classList.add('open');
    if (searchInput) searchInput.focus();
    searchOpen = true;
    if (searchToggleBtn) searchToggleBtn.classList.add('active');
  }
  function closeSearch() {
    if (searchBarWrapper) searchBarWrapper.classList.remove('open');
    if (searchInput) searchInput.value = '';
    if (searchResults) searchResults.innerHTML = '';
    searchOpen = false;
    if (searchToggleBtn) searchToggleBtn.classList.remove('active');
  }

  if (searchToggleBtn) {
    searchToggleBtn.addEventListener('click', () => {
      if (searchOpen) closeSearch();
      else openSearch();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchOpen) {
      closeSearch();
    }
  });

  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const query = this.value.trim().toLowerCase();
      if (!query) {
        searchResults.innerHTML = '';
        return;
      }
      // 搜索标题、段落、标签、值
      const blocks = document.querySelectorAll('.content-block h3, .content-block p, .info-card-label, .info-card-value');
      const results = [];
      blocks.forEach(el => {
        const text = el.textContent || '';
        if (text.toLowerCase().includes(query)) {
          const contentBlock = el.closest('.content-block');
          const panel = el.closest('.view-panel');
          const panelName = panel ? panel.id.replace('view-', '') : '';
          const anchor = contentBlock ? contentBlock.id : '';
          results.push({
            title: text.substring(0, 60),
            section: panelName,
            anchor: anchor
          });
        }
      });
      displaySearchResults(results);
    });
  }

  function displaySearchResults(results) {
    if (!searchResults) return;
    if (results.length === 0) {
      searchResults.innerHTML = '<div class="search-no-result">未找到相关内容</div>';
      return;
    }
    searchResults.innerHTML = results.map(r => `
      <div class="search-result-item" data-panel="${r.section}" data-anchor="${r.anchor}">
        <span class="search-result-icon">◇</span>
        <div class="search-result-text">
          <span class="search-result-section">${r.section || '指南板块'}</span>
          <span class="search-result-title">${r.title}</span>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const panel = item.dataset.panel;
        const anchor = item.dataset.anchor;
        if (panel && document.getElementById(`view-${panel}`)) {
          showPanel(panel);
          if (anchor) {
            setTimeout(() => {
              document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 400);
          }
        }
        closeSearch();
      });
    });
  }

  // ========== 侧边栏 ==========
  function openSidebar() {
    if (sidebar) sidebar.classList.add('open');
    if (sidebarOverlay) sidebarOverlay.classList.add('open');
    body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('open');
    body.style.overflow = '';
  }
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', () => {
      if (sidebar && sidebar.classList.contains('open')) closeSidebar();
      else openSidebar();
    });
  }
  if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);
  if (sidebar) {
    sidebar.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-close-sidebar')) closeSidebar();
    });
  }

  // ========== 更多下拉 ==========
  if (moreBtn) {
    moreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (moreDropdown) moreDropdown.classList.toggle('open');
      moreBtn.classList.toggle('active');
    });
  }
  document.addEventListener('click', (e) => {
    if (moreBtn && moreDropdown && !moreBtn.contains(e.target) && !moreDropdown.contains(e.target)) {
      closeMoreDropdown();
    }
  });

  // ========== 返回顶部 ==========
  function checkBackToTop() {
    if (window.scrollY > 600) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  }
  window.addEventListener('scroll', checkBackToTop, { passive: true });
  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 头部阴影
  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      siteHeader.classList.add('scrolled');
    } else {
      siteHeader.classList.remove('scrolled');
    }
  }, { passive: true });

  // ========== 卡片轮播 ==========
  let currentCardIndex = 0;
  let cardsPerView = 1;
  let totalCards = sectionCards.length;
  let dotElements = [];

  function createDots() {
    carouselDots.innerHTML = '';
    const pages = Math.ceil(totalCards / cardsPerView);
    for (let i = 0; i < pages; i++) {
      const dot = document.createElement('button');
      dot.classList.add('carousel-dot');
      dot.setAttribute('aria-label', `第${i+1}页`);
      dot.addEventListener('click', () => goToPage(i));
      carouselDots.appendChild(dot);
    }
    dotElements = document.querySelectorAll('.carousel-dot');
  }

  function updateDots() {
    const pages = Math.ceil(totalCards / cardsPerView);
    const activePage = Math.floor(currentCardIndex / cardsPerView);
    dotElements.forEach((dot, i) => {
      if (i === activePage) dot.classList.add('active');
      else dot.classList.remove('active');
    });
  }

  function goToPage(pageIndex) {
    const maxPage = Math.ceil(totalCards / cardsPerView) - 1;
    const clamped = Math.max(0, Math.min(pageIndex, maxPage));
    currentCardIndex = clamped * cardsPerView;
    scrollToCard(currentCardIndex);
    updateDots();
  }

  function scrollToCard(index) {
    const card = sectionCards[index];
    if (card) {
      const trackRect = carouselTrack.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const offset = cardRect.left - trackRect.left + carouselTrack.scrollLeft - 16;
      carouselTrack.scrollTo({ left: offset, behavior: 'smooth' });
    }
  }

  function updateCardsPerView() {
    const trackWidth = carouselTrack.clientWidth;
    const cardWidth = 340 + 24; // 卡片宽度 + 间距
    cardsPerView = Math.max(1, Math.floor(trackWidth / cardWidth));
    createDots();
    updateDots();
  }

  if (carouselLeft) {
    carouselLeft.addEventListener('click', () => {
      if (currentCardIndex > 0) {
        currentCardIndex = Math.max(0, currentCardIndex - cardsPerView);
        scrollToCard(currentCardIndex);
        updateDots();
      }
    });
  }

  if (carouselRight) {
    carouselRight.addEventListener('click', () => {
      if (currentCardIndex + cardsPerView < totalCards) {
        currentCardIndex = Math.min(totalCards - cardsPerView, currentCardIndex + cardsPerView);
        scrollToCard(currentCardIndex);
        updateDots();
      }
    });
  }

  carouselTrack.addEventListener('scroll', function() {
    const scrollLeft = carouselTrack.scrollLeft;
    const cardWidth = 340 + 24;
    const page = Math.round(scrollLeft / (cardWidth * cardsPerView));
    currentCardIndex = page * cardsPerView;
    updateDots();
  }, { passive: true });

  window.addEventListener('resize', updateCardsPerView);

  if (sectionCards.length > 0) {
    updateCardsPerView();
  }

  // 卡片点击跳转
  sectionCards.forEach(card => {
    card.addEventListener('click', () => {
      const targetNav = card.dataset.nav;
      if (targetNav) showPanel(targetNav);
    });
  });

  // ========== 滚动入场动画 ==========
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  animatedElements.forEach(el => observer.observe(el));

  // ========== 页脚年份 ==========
  const yearSpan = document.getElementById('currentYear');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // 初始检查返回顶部
  checkBackToTop();

})();