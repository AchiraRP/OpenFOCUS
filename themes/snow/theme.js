let animFrame;
let isActive = false;

export function mount(container) {
  isActive = true;
  container.innerHTML = '<canvas id="snow-canvas"></canvas>';
  const canvas = document.getElementById('snow-canvas');
  const ctx = canvas.getContext('2d');
  
  let width, height;
  let particles = [];
  
  function init() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    particles = [];
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 4 + 1,
        d: Math.random() * 150
      });
    }
  }
  
  function draw() {
    if (!isActive) return;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    for (let i = 0; i < particles.length; i++) {
      let p = particles[i];
      ctx.moveTo(p.x, p.y);
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2, true);
    }
    ctx.fill();
    update();
    animFrame = requestAnimationFrame(draw);
  }
  
  let angle = 0;
  function update() {
    angle += 0.01;
    for (let i = 0; i < particles.length; i++) {
      let p = particles[i];
      p.y += Math.cos(angle + p.d) + 1 + p.r / 2;
      p.x += Math.sin(angle) * 2;
      
      if (p.x > width + 5 || p.x < -5 || p.y > height) {
        if (i % 3 > 0) {
          particles[i] = { x: Math.random() * width, y: -10, r: p.r, d: p.d };
        } else {
          if (Math.sin(angle) > 0) {
            particles[i] = { x: -5, y: Math.random() * height, r: p.r, d: p.d };
          } else {
            particles[i] = { x: width + 5, y: Math.random() * height, r: p.r, d: p.d };
          }
        }
      }
    }
  }
  
  window.addEventListener('resize', init);
  init();
  draw();
  
  return () => {
    isActive = false;
    cancelAnimationFrame(animFrame);
    window.removeEventListener('resize', init);
    container.innerHTML = '';
  };
}
