// main.js - 新生指南网站交互逻辑

(function() {
  'use strict';

  // ========== DOM 元素引用 ==========
  const body = document.body;
  const html = document.documentElement;

  // 弹窗相关
  const welcomeModal = document.getElementById('welcomeModal');
  const modalXBtn = document.getElementById('modalXBtn');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const dontShowAgain = document.getElementById('dontShowAgain');
  const showWelcomeBtn = document.getElementById('showWelcomeBtn');
  const sidebarWelcomeBtn = document.getElementById('sidebarWelcomeBtn');

  // 音乐相关
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

  // 主题相关
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeToggleBtn2 = document.getElementById('themeToggleBtn2');
  const sidebarThemeBtn = document.getElementById('sidebarThemeBtn');
  const themeIconSun = document.getElementById('themeIconSun');
  const themeIconMoon = document.getElementById('themeIconMoon');

  // 导航相关
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

  // 轮播相关
  const carouselTrack = document.getElementById('carouselTrack');
  const carouselLeft = document.getElementById('carouselLeft');
  const carouselRight = document.getElementById('carouselRight');
  const carouselDots = document.getElementById('carouselDots');
  const sectionCards = document.querySelectorAll('.section-card');

  // 音乐播放列表数据
  const trackList = [
    { name: '清晨微风', genre: '轻音乐', src: '' },    // 请替换为实际音频文件路径
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
    themeIconSun.style.display = isDark ? 'none' : '';
    themeIconMoon.style.display = isDark ? '' : 'none';
  }

  function closeMoreDropdown() {
    moreDropdown.classList.remove('open');
    moreBtn.classList.remove('active');
  }

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

  // 初始化时根据 localStorage 决定是否显示弹窗
  if (localStorage.getItem('hideWelcomeModal') !== 'true') {
    showModal();
  } else {
    hideModal();
  }

  modalXBtn.addEventListener('click', hideModal);
  modalCloseBtn.addEventListener('click', hideModal);
  if (showWelcomeBtn) showWelcomeBtn.addEventListener('click', showModal);
  if (sidebarWelcomeBtn) sidebarWelcomeBtn.addEventListener('click', () => {
    showModal();
    closeSidebar();
  });

  // 弹窗中的音乐开关
  modalMusicToggle.addEventListener('change', function() {
    if (this.checked) {
      modalMusicSelect.classList.add('visible');
      // 同步选中的电台到当前曲目
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

  // 弹窗中音乐选择
  musicChoiceRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.checked) {
        currentTrack = parseInt(this.value);
        if (modalMusicToggle.checked) {
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
      // 没有真实音频源，仅更新UI，不播放实际声音
      console.log('音频文件未配置，请替换 src 路径');
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
      iconPlay.style.display = 'none';
      iconPause.style.display = '';
      musicDisc.classList.add('spinning');
      modalMusicToggle.checked = true;
      modalMusicSelect.classList.add('visible');
    } else {
      iconPlay.style.display = '';
      iconPause.style.display = 'none';
      musicDisc.classList.remove('spinning');
    }
  }

  function updateMusicPlayerUI() {
    const track = trackList[currentTrack];
    currentTrackName.textContent = track.name;
    currentTrackGenre.textContent = track.genre;
    updatePlaylistActive();
  }

  function updatePlaylistActive() {
    playlistItems.forEach((item, idx) => {
      if (idx === currentTrack) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  musicPlayBtn.addEventListener('click', () => {
    if (isPlaying) {
      pauseMusic();
    } else {
      if (audioPlayer.src || trackList[currentTrack].src) {
        resumeMusic();
      } else {
        // 首次播放
        loadAndPlayTrack(currentTrack);
      }
    }
  });

  musicPrevBtn.addEventListener('click', () => {
    currentTrack = (currentTrack - 1 + trackList.length) % trackList.length;
    loadAndPlayTrack(currentTrack);
    updateMusicPlayerUI();
  });

  musicNextBtn.addEventListener('click', () => {
    currentTrack = (currentTrack + 1) % trackList.length;
    loadAndPlayTrack(currentTrack);
    updateMusicPlayerUI();
  });

  playlistItems.forEach(item => {
    item.addEventListener('click', () => {
      currentTrack = parseInt(item.dataset.track);
      loadAndPlayTrack(currentTrack);
      updateMusicPlayerUI();
    });
  });

  function openMusicPlayer() {
    musicPlayer.classList.add('open');
  }
  function closeMusicPlayer() {
    musicPlayer.classList.remove('open');
  }
  musicToggleBtn.addEventListener('click', openMusicPlayer);
  musicPlayerClose.addEventListener('click', closeMusicPlayer);
  if (showMusicBtn) showMusicBtn.addEventListener('click', () => {
    openMusicPlayer();
    closeMoreDropdown();
  });
  if (sidebarMusicBtn) sidebarMusicBtn.addEventListener('click', () => {
    openMusicPlayer();
    closeSidebar();
  });

  // ========== 主题切换 ==========
  function toggleTheme() {
    const current = html.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }

  // 初始化主题
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);

  themeToggleBtn.addEventListener('click', toggleTheme);
  if (themeToggleBtn2) themeToggleBtn2.addEventListener('click', () => {
    toggleTheme();
    closeMoreDropdown();
  });
  if (sidebarThemeBtn) sidebarThemeBtn.addEventListener('click', () => {
    toggleTheme();
    closeSidebar();
  });

  // ========== 搜索 ==========
  let searchOpen = false;
  function openSearch() {
    searchBarWrapper.classList.add('open');
    searchInput.focus();
    searchOpen = true;
    searchToggleBtn.classList.add('active');
  }
  function closeSearch() {
    searchBarWrapper.classList.remove('open');
    searchInput.value = '';
    searchResults.innerHTML = '';
    searchOpen = false;
    searchToggleBtn.classList.remove('active');
  }

  searchToggleBtn.addEventListener('click', () => {
    if (searchOpen) closeSearch();
    else openSearch();
  });

  // ESC 关闭搜索
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchOpen) {
      closeSearch();
    }
  });

  // 简易搜索逻辑（基于标题文本）
  searchInput.addEventListener('input', function() {
    const query = this.value.trim().toLowerCase();
    if (!query) {
      searchResults.innerHTML = '';
      return;
    }
    // 收集所有可搜索的内容块标题
    const blocks = document.querySelectorAll('.content-block .block-title, .section-card .card-title');
    const results = [];
    blocks.forEach(block => {
      const text = block.textContent || '';
      if (text.toLowerCase().includes(query)) {
        // 找到对应的区域或卡片锚点
        let anchor = '';
        const contentBlock = block.closest('.content-block');
        if (contentBlock && contentBlock.id) {
          anchor = '#' + contentBlock.id;
        } else {
          const card = block.closest('.section-card');
          if (card && card.dataset.target) {
            anchor = '#' + card.dataset.target;
          }
        }
        results.push({
          title: text,
          section: contentBlock ? contentBlock.closest('.content-section')?.querySelector('.content-section-title')?.textContent || '' : '',
          anchor: anchor
        });
      }
    });
    displaySearchResults(results);
  });

  function displaySearchResults(results) {
    if (results.length === 0) {
      searchResults.innerHTML = '<div class="search-no-result">未找到相关内容</div>';
      return;
    }
    searchResults.innerHTML = results.map(r => `
      <div class="search-result-item" data-anchor="${r.anchor}">
        <span class="search-result-icon">🔍</span>
        <div class="search-result-text">
          <span class="search-result-section">${r.section || '指南板块'}</span>
          <span class="search-result-title">${r.title}</span>
        </div>
      </div>
    `).join('');
    // 点击结果跳转
    document.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const anchor = item.dataset.anchor;
        if (anchor) {
          window.location.hash = anchor;
          closeSearch();
        }
      });
    });
  }

  // ========== 侧边栏 ==========
  function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  hamburgerBtn.addEventListener('click', () => {
    if (sidebar.classList.contains('open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });
  sidebarCloseBtn.addEventListener('click', closeSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);
  // 点击侧边栏内带有 data-close-sidebar 的链接自动关闭
  sidebar.addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-close-sidebar')) {
      closeSidebar();
    }
  });

  // ========== 更多下拉菜单 ==========
  moreBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    moreDropdown.classList.toggle('open');
    moreBtn.classList.toggle('active');
  });
  document.addEventListener('click', (e) => {
    if (!moreBtn.contains(e.target) && !moreDropdown.contains(e.target)) {
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
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ========== 头部阴影 ==========
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
    const cardWidth = 280 + 20; // card width + gap
    cardsPerView = Math.max(1, Math.floor(trackWidth / cardWidth));
    createDots();
    updateDots();
  }

  carouselLeft.addEventListener('click', () => {
    if (currentCardIndex > 0) {
      currentCardIndex = Math.max(0, currentCardIndex - cardsPerView);
      scrollToCard(currentCardIndex);
      updateDots();
    }
  });

  carouselRight.addEventListener('click', () => {
    if (currentCardIndex + cardsPerView < totalCards) {
      currentCardIndex = Math.min(totalCards - cardsPerView, currentCardIndex + cardsPerView);
      scrollToCard(currentCardIndex);
      updateDots();
    }
  });

  // 监听滚动更新当前页
  carouselTrack.addEventListener('scroll', function() {
    const scrollLeft = carouselTrack.scrollLeft;
    const cardWidth = 280 + 20;
    const page = Math.round(scrollLeft / (cardWidth * cardsPerView));
    currentCardIndex = page * cardsPerView;
    updateDots();
  }, { passive: true });

  // 窗口大小变化重新计算
  window.addEventListener('resize', updateCardsPerView);

  // 初始化轮播
  if (sectionCards.length > 0) {
    updateCardsPerView();
  }

  // 卡片点击跳转到对应内容区
  sectionCards.forEach(card => {
    card.addEventListener('click', () => {
      const targetId = card.dataset.target;
      if (targetId) {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
      }
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

  // ========== 初始检查返回顶部按钮状态 ==========
  checkBackToTop();

})();