// Real Snow — CSS3 snowflake characters falling with wind sway (no jQuery needed)
let isActive = false;
let animFrame;

export function mount(container) {
  isActive = true;

  const el = document.createElement('div');
  el.id = 'real-snow-container';
  el.style.cssText = 'position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:-1;';
  container.appendChild(el);

  const chars = ['❄', '❅', '❆', '✦', '•'];
  const flakes = [];
  const COUNT = 60;

  for (let i = 0; i < COUNT; i++) {
    const span = document.createElement('span');
    const size = Math.random() * 24 + 8;
    const startX = Math.random() * 100;
    const delay = Math.random() * 5;
    const dur = Math.random() * 4 + 6;

    span.textContent = chars[Math.floor(Math.random() * chars.length)];
    span.style.cssText = `
      position: absolute;
      top: -40px;
      left: ${startX}%;
      font-size: ${size}px;
      color: rgba(255, 255, 255, ${Math.random() * 0.2 + 0.1});
      pointer-events: none;
      user-select: none;
      animation: realSnowFall ${dur}s linear ${delay}s infinite;
      filter: blur(${size < 14 ? 1 : 0}px);
    `;
    el.appendChild(span);
    flakes.push(span);
  }

  // Inject keyframes
  const style = document.createElement('style');
  style.id = 'real-snow-keyframes';
  style.textContent = `
    @keyframes realSnowFall {
      0% {
        transform: translateY(0) translateX(0) rotate(0deg);
        opacity: 1;
      }
      25% {
        transform: translateY(25vh) translateX(20px) rotate(90deg);
      }
      50% {
        transform: translateY(50vh) translateX(-15px) rotate(180deg);
      }
      75% {
        transform: translateY(75vh) translateX(25px) rotate(270deg);
        opacity: 0.8;
      }
      100% {
        transform: translateY(105vh) translateX(-10px) rotate(360deg);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  return () => {
    isActive = false;
    cancelAnimationFrame(animFrame);
    el.remove();
    style.remove();
  };
}
