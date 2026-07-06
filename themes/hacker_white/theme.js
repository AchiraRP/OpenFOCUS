let isActive = false;
let intervalId;

export function mount(container) {
  isActive = true;
  container.innerHTML = `
    <div id="plw"><div id="plc"></div></div>
    <div id="hero-container">
      <canvas id="hero-matrix-canvas"></canvas>
    </div>
  `;
  
  const canvas = document.getElementById('hero-matrix-canvas');
  const ctx = canvas.getContext('2d');

  const fontSize = 14;
  const font = 'monospace';
  let width, height, columns;
  let drops = [];

  const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリグズブヅプエェケセテネヘメレゲゼデベペオォコソトノホモロヲゴゾドボポヴッン';
  const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numsAlphabet = '0123456789';
  const alphabet = katakana + latin + numsAlphabet;

  function getRandomChar() {
    return alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  function init() {
    if (!isActive) return;
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    columns = Math.floor(width / fontSize);

    drops = [];
    for (let x = 0; x < columns; x++) {
      drops[x] = Math.random() * -100;
    }
  }

  function draw() {
    if (!isActive) return;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, width, height);
    
    ctx.font = fontSize + 'px ' + font;

    for (let i = 0; i < drops.length; i++) {
      const text = getRandomChar();
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      
      drops[i]++;
    }
  }

  window.addEventListener('resize', init);
  init();
  intervalId = setInterval(draw, 33);

  return () => {
    isActive = false;
    clearInterval(intervalId);
    window.removeEventListener('resize', init);
    container.innerHTML = '';
  };
}
