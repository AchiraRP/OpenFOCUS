// Asteroids — Arrow keys to rotate/thrust, Space to shoot
let isActive = false;
let animFrame;

export function mount(container) {
  isActive = true;
  const canvas = document.createElement('canvas');
  canvas.id = 'asteroids-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;display:block;z-index:-1;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let W, H;

  let ship, asteroids, bullets, score;
  const keys = {};

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }

  function resetGame() {
    ship = { x: W / 2, y: H / 2, angle: -Math.PI / 2, vx: 0, vy: 0 };
    asteroids = []; bullets = []; score = 0;
    for (let i = 0; i < 8; i++) spawnAsteroid();
  }

  function spawnAsteroid(x, y, r) {
    asteroids.push({
      x: x ?? Math.random() * W, y: y ?? Math.random() * H,
      vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
      r: r ?? Math.random() * 25 + 20, sides: Math.floor(Math.random() * 4) + 6
    });
  }

  function draw() {
    if (!isActive) return;
    ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);

    // Ship controls
    if (keys['ArrowLeft']) ship.angle -= 0.05;
    if (keys['ArrowRight']) ship.angle += 0.05;
    if (keys['ArrowUp']) { ship.vx += Math.cos(ship.angle) * 0.12; ship.vy += Math.sin(ship.angle) * 0.12; }
    ship.vx *= 0.99; ship.vy *= 0.99;
    ship.x += ship.vx; ship.y += ship.vy;
    ship.x = (ship.x + W) % W; ship.y = (ship.y + H) % H;

    // Draw ship
    ctx.save(); ctx.translate(ship.x, ship.y); ctx.rotate(ship.angle);
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-10, -8); ctx.lineTo(-6, 0); ctx.lineTo(-10, 8); ctx.closePath(); ctx.stroke();
    ctx.restore();

    // Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx; b.y += b.vy; b.life--;
      if (b.life <= 0 || b.x < 0 || b.x > W || b.y < 0 || b.y > H) { bullets.splice(i, 1); continue; }
      ctx.beginPath(); ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
    }

    // Asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx; a.y += a.vy;
      a.x = (a.x + W) % W; a.y = (a.y + H) % H;

      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let s = 0; s < a.sides; s++) {
        const ang = (s / a.sides) * Math.PI * 2;
        const px = a.x + Math.cos(ang) * a.r, py = a.y + Math.sin(ang) * a.r;
        s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.stroke();

      // Bullet-asteroid collision
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (Math.hypot(b.x - a.x, b.y - a.y) < a.r) {
          bullets.splice(j, 1); score++;
          if (a.r > 15) { spawnAsteroid(a.x, a.y, a.r * 0.6); spawnAsteroid(a.x, a.y, a.r * 0.6); }
          asteroids.splice(i, 1); break;
        }
      }
    }

    if (asteroids.length < 3) for (let i = 0; i < 5; i++) spawnAsteroid();

    ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.font = '16px monospace'; ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${score}`, W - 20, H - 20);

    animFrame = requestAnimationFrame(draw);
  }

  function onKey(e) { if (!isActive) return; keys[e.key] = true;
    if (e.key === ' ' || e.code === 'Space') { bullets.push({ x: ship.x + Math.cos(ship.angle) * 15, y: ship.y + Math.sin(ship.angle) * 15, vx: Math.cos(ship.angle) * 7, vy: Math.sin(ship.angle) * 7, life: 60 }); e.preventDefault(); }
  }
  function onKeyUp(e) { keys[e.key] = false; }

  window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKeyUp); window.addEventListener('resize', resize);
  resize(); resetGame(); draw();

  return () => { isActive = false; cancelAnimationFrame(animFrame); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp); window.removeEventListener('resize', resize); container.innerHTML = ''; };
}
