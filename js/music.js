/* ============================================================
   music.js — 背景音乐播放器
   功能：播放/暂停、切换曲目、音量控制、进度条、循环播放
   ============================================================ */

const MusicController = (() => {
  /* ── 状态 ── */
  let audio         = null;
  let currentIndex  = 0;
  let isPlaying     = false;
  let volume        = 0.6;
  let tracks        = [];

  /* ── DOM 元素缓存 ── */
  function els() {
    return {
      player     : document.getElementById("music-player"),
      playBtn    : document.getElementById("music-play-btn"),
      prevBtn    : document.getElementById("music-prev-btn"),
      nextBtn    : document.getElementById("music-next-btn"),
      trackName  : document.getElementById("music-track-name"),
      expandBtn  : document.getElementById("music-expand-btn"),
      playIcon   : document.getElementById("music-play-icon"),
    };
  }

  /* ── 初始化 ── */
  function init() {
    tracks = SITE_CONTENT.music || [];
    if (tracks.length === 0) {
      // 没有配置曲目则隐藏播放器
      const player = document.getElementById("music-player");
      if (player) player.style.display = "none";
      return;
    }

    // 读取保存的音量
    const savedVolume = localStorage.getItem("music_volume");
    volume = savedVolume !== null ? savedVolume / 100 : 0.6;

    // 创建 Audio 实例
    audio = new Audio();
    audio.volume = volume;
    audio.preload = "metadata";

    // 绑定事件
    bindAudioEvents();
    bindUIEvents();

    // 加载第一首曲目（但不自动播放）
    loadTrack(currentIndex, false);

    // 读取上次记录的曲目索引
    const savedIndex = parseInt(localStorage.getItem("music_track_index") || "0", 10);
    if (savedIndex >= 0 && savedIndex < tracks.length) {
      currentIndex = savedIndex;
      loadTrack(currentIndex, false);
    }
  }

  /* ── 加载曲目 ── */
  function loadTrack(index, autoPlay) {
    if (!audio || !tracks[index]) return;

    currentIndex = index;
    const track  = tracks[index];

    audio.src = track.file;
    audio.load();

    // 更新显示
    const { trackName } = els();
    if (trackName) {
      trackName.textContent = track.composer
        ? `${track.title} · ${track.composer}`
        : track.title;
    }

    // 保存当前曲目索引
    localStorage.setItem("music_track_index", String(index));

    if (autoPlay) play();
    else updatePlayBtn(false);
  }

  /* ── 播放 ── */
  function play() {
    if (!audio) return;
    const promise = audio.play();
    if (promise !== undefined) {
      promise
        .then(() => {
          isPlaying = true;
          updatePlayBtn(true);
          updatePlayerState(true);
        })
        .catch(() => {
          // 浏览器自动播放策略阻止：静默失败
          isPlaying = false;
          updatePlayBtn(false);
        });
    }
  }

  /* ── 暂停 ── */
  function pause() {
    if (!audio) return;
    audio.pause();
    isPlaying = false;
    updatePlayBtn(false);
    updatePlayerState(false);
  }

  /* ── 切换播放/暂停 ── */
  function togglePlay() {
    isPlaying ? pause() : play();
  }

  /* ── 上一首 ── */
  function prev() {
    const newIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    loadTrack(newIndex, isPlaying);
  }

  /* ── 下一首 ── */
  function next() {
    const newIndex = (currentIndex + 1) % tracks.length;
    loadTrack(newIndex, isPlaying);
  }

  /* ── 设置音量 ── */
  function setVolume(val) {
    volume = Math.max(0, Math.min(1, val));
    if (audio) audio.volume = volume;
  }

  /* ── 音频事件绑定 ── */
  function bindAudioEvents() {
    if (!audio) return;

    // 曲目播放结束 → 自动播放下一首
    audio.addEventListener("ended", () => {
      next();
    });

    // 加载错误时静默跳过
    audio.addEventListener("error", () => {
      if (tracks.length > 1) {
        setTimeout(() => next(), 500);
      }
    });
  }

  /* ── UI 事件绑定 ── */
  function bindUIEvents() {
    const { playBtn, prevBtn, nextBtn, expandBtn } = els();

    if (playBtn)   playBtn.addEventListener("click",   togglePlay);
    if (prevBtn)   prevBtn.addEventListener("click",   prev);
    if (nextBtn)   nextBtn.addEventListener("click",   next);

    // 展开/收起播放器
    if (expandBtn) {
      expandBtn.addEventListener("click", () => {
        const { player } = els();
        if (player) player.classList.toggle("expanded");
      });
    }
  }

  /* ── 更新播放按钮图标 ── */
  function updatePlayBtn(playing) {
    const { playIcon } = els();
    if (!playIcon) return;

    if (playing) {
      // 暂停图标
      playIcon.innerHTML = `
        <rect x="6" y="4" width="4" height="16" rx="1"
              fill="currentColor"/>
        <rect x="14" y="4" width="4" height="16" rx="1"
              fill="currentColor"/>
      `;
    } else {
      // 播放图标
      playIcon.innerHTML = `
        <polygon points="5,3 19,12 5,21"
                 fill="currentColor"/>
      `;
    }
  }

  /* ── 更新播放器外观状态 ── */
  function updatePlayerState(playing) {
    const { player } = els();
    if (!player) return;
    player.classList.toggle("playing", playing);
  }

  /* ── 公开 API ── */
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