/* ============================================================
   music.js —— 背景音乐播放器（侧边栏集成版）
   完全移除悬浮胶囊，控制按钮位于侧边栏底部
   ============================================================ */
const MusicController = (() => {
  let audio = null;
  let currentIndex = 0;
  let isPlaying = false;
  let volume = 0.6;
  let tracks = [];

  /* 侧边栏 DOM 缓存 */
  function sidebarEls() {
    return {
      title   : document.getElementById("sidebar-music-title"),
      playBtn : document.getElementById("sidebar-music-play"),
      prevBtn : document.getElementById("sidebar-music-prev"),
      nextBtn : document.getElementById("sidebar-music-next"),
      playIcon: document.getElementById("sidebar-play-icon"),
    };
  }

  function init() {
    tracks = SITE_CONTENT.music || [];
    if (tracks.length === 0) {
      const ctrl = document.getElementById("sidebar-music-control");
      if (ctrl) ctrl.style.display = "none";
      return;
    }

    const savedVolume = localStorage.getItem("music_volume");
    volume = savedVolume !== null ? savedVolume / 100 : 0.6;

    audio = new Audio();
    audio.volume = volume;
    audio.preload = "metadata";

    bindAudioEvents();
    bindSidebarUI();

    const savedIndex = parseInt(localStorage.getItem("music_track_index") || "0", 10);
    if (savedIndex >= 0 && savedIndex < tracks.length) {
      currentIndex = savedIndex;
      loadTrack(currentIndex, false);
    } else {
      loadTrack(0, false);
    }
  }

  function loadTrack(index, autoPlay) {
    if (!audio || !tracks[index]) return;
    currentIndex = index;
    const track = tracks[index];
    audio.src = track.file;
    audio.load();

    const { title } = sidebarEls();
    if (title) {
      title.textContent = track.composer
        ? `${track.title} · ${track.composer}`
        : track.title;
    }

    localStorage.setItem("music_track_index", String(index));

    if (autoPlay) play();
    else updatePlayBtn(false);
  }

  function play() {
    if (!audio) return;
    audio.play().then(() => {
      isPlaying = true;
      updatePlayBtn(true);
    }).catch(() => {
      isPlaying = false;
      updatePlayBtn(false);
    });
  }

  function pause() {
    if (!audio) return;
    audio.pause();
    isPlaying = false;
    updatePlayBtn(false);
  }

  function togglePlay() {
    isPlaying ? pause() : play();
  }

  function prev() {
    const newIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    loadTrack(newIndex, isPlaying);
  }

  function next() {
    const newIndex = (currentIndex + 1) % tracks.length;
    loadTrack(newIndex, isPlaying);
  }

  function setVolume(val) {
    volume = Math.max(0, Math.min(1, val));
    if (audio) audio.volume = volume;
  }

  function bindAudioEvents() {
    if (!audio) return;
    audio.addEventListener("ended", () => next());
    audio.addEventListener("error", () => {
      if (tracks.length > 1) setTimeout(() => next(), 500);
    });
  }

  function bindSidebarUI() {
    const { playBtn, prevBtn, nextBtn } = sidebarEls();
    if (playBtn) playBtn.addEventListener("click", togglePlay);
    if (prevBtn) prevBtn.addEventListener("click", prev);
    if (nextBtn) nextBtn.addEventListener("click", next);
  }

  function updatePlayBtn(playing) {
    const { playIcon } = sidebarEls();
    if (!playIcon) return;
    playIcon.innerHTML = playing
      ? `<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/>
         <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>`
      : `<polygon points="5,3 19,12 5,21" fill="currentColor"/>`;
  }

  return {
    init,
    play,
    pause,
    togglePlay,
    prev,
    next,
    setVolume,
    get isPlaying() { return isPlaying; },
    get currentTrack() { return tracks[currentIndex] || null; },
  };
})();