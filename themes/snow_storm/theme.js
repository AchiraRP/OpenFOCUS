// Snow Storm — chaotic blizzard with fast, randomly-directed particles and motion streaks
let isActive = false;
let animFrame;

export function mount(container) {
  isActive = true;

  const canvas = document.createElement('canvas');
  canvas.id = 'snow-storm-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;display:block;pointer-events:none;z-index:-1;';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let width, height;

  const PARTICLE_COUNT = 400;
  let particles = [];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function createParticle(startRandom) {
    // Each particle gets its own random direction and speed
    const angle = Math.random() * Math.PI * 2;           // any direction
    const speed = Math.random() * 8 + 3;                 // fast: 3–11 px/frame
    const depth = Math.random();

    return {
      x: startRandom ? Math.random() * width : Math.random() * width,
      y: startRandom ? Math.random() * height : Math.random() * -height * 0.3,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + 2,                   // slight downward bias
      radius: depth * 1.8 + 0.3,                         // tiny dots 0.3–2.1
      opacity: depth * 0.25 + 0.08,                      // dim: 0.08–0.33
      trailLen: Math.random() > 0.5 ? depth * 12 + 4 : 0,// half have motion streaks
      life: 0,
      maxLife: Math.random() * 120 + 60,                  // frames before respawn
      // Random wobble for chaotic movement
      wobbleFreq: Math.random() * 0.15 + 0.05,
      wobbleAmp: Math.random() * 3 + 1,
      wobblePhase: Math.random() * Math.PI * 2,
    };
  }

  function init() {
    resize();
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle(true));
    }
  }

  function draw() {
    if (!isActive) return;

    // Semi-transparent clear for subtle ghosting/trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.life++;

      // Chaotic wobble added to velocity each frame
      const wobbleX = Math.sin(p.life * p.wobbleFreq + p.wobblePhase) * p.wobbleAmp;
      const wobbleY = Math.cos(p.life * p.wobbleFreq * 0.7 + p.wobblePhase) * p.wobbleAmp * 0.5;

      p.x += p.vx + wobbleX;
      p.y += p.vy + wobbleY;

      // Fade out near end of life
      let alpha = p.opacity;
      if (p.life > p.maxLife - 20) {
        alpha *= (p.maxLife - p.life) / 20;
      }

      // Draw motion streak if particle has one
      if (p.trailLen > 0) {
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const nx = (p.vx + wobbleX) / (speed + 0.01);
        const ny = (p.vy + wobbleY) / (speed + 0.01);

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - nx * p.trailLen, p.y - ny * p.trailLen);
        ctx.strokeStyle = `rgba(255, 200, 100, ${alpha * 0.5})`;
        ctx.lineWidth = p.radius * 0.6;
        ctx.stroke();
      }

      // Draw the dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 200, 100, ${alpha})`;
      ctx.fill();

      // Respawn if off screen or life expired
      if (p.x < -50 || p.x > width + 50 || p.y < -50 || p.y > height + 50 || p.life >= p.maxLife) {
        // Respawn from a random edge
        const edge = Math.random();
        const np = createParticle(false);
        if (edge < 0.4) {
          np.y = -10;
          np.x = Math.random() * width;
        } else if (edge < 0.6) {
          np.x = -10;
          np.y = Math.random() * height;
        } else if (edge < 0.8) {
          np.x = width + 10;
          np.y = Math.random() * height;
        } else {
          np.y = height + 10;
          np.x = Math.random() * width;
          np.vy = -(Math.abs(np.vy));  // move upward
        }
        particles[i] = np;
      }
    }

    animFrame = requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  init();
  draw();

  return () => {
    isActive = false;
    cancelAnimationFrame(animFrame);
    window.removeEventListener('resize', resize);
    container.innerHTML = '';
  };
}
