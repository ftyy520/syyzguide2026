/* ============================================================
   circularText.js — 圆形旋转文字效果
   将 “欢迎来到新的起点” 排列成圆圈并旋转，
   鼠标悬停时加速旋转。
   ============================================================ */
const CircularText = (() => {
  const containerId = "circular-text-container";
  let container = null;
  let rotation = 0;
  let speed = 0.02;          // 基础旋转速度
  let currentSpeed = speed;
  let animationId = null;
  let isHovering = false;

  function init() {
    container = document.getElementById(containerId);
    if (!container) return;

    // 从 SITE_CONTENT 获取 Hero 标题文字（去掉 \n）
    const raw = SITE_CONTENT.site.heroTitle.replace(/\n/g, "");
    const chars = raw.split(""); // 每个字拆分

    container.innerHTML = "";
    container.classList.add("circular-text");

    const radius = 100;           // 圆半径（px），可根据需要调整
    const total = chars.length;
    const angleStep = 360 / total;

    chars.forEach((char, i) => {
      const span = document.createElement("span");
      span.textContent = char;
      const angle = angleStep * i - 90; // 从顶部开始
      span.style.transform = `rotate(${angle}deg) translateY(-${radius}px)`;
      container.appendChild(span);
    });

    // 设置容器大小
    container.style.width = container.style.height = radius * 2 + "px";

    // 鼠标悬停事件
    container.addEventListener("mouseenter", () => {
      isHovering = true;
    });
    container.addEventListener("mouseleave", () => {
      isHovering = false;
    });

    // 开始旋转动画
    animate();
  }

  function animate() {
    if (!container) return;

    // 动态速度：悬停时加速到 4 倍
    const targetSpeed = isHovering ? speed * 4 : speed;
    currentSpeed += (targetSpeed - currentSpeed) * 0.1; // 平滑过渡

    rotation += currentSpeed;
    if (rotation >= 360) rotation -= 360;

    container.style.transform = `rotate(${rotation}deg)`;

    animationId = requestAnimationFrame(animate);
  }

  return { init };
})();