// Space Invaders — Arrow Left/Right + Space to shoot
let isActive = false;
let animFrame, tickId;

export function mount(container) {
  isActive = true;
  const canvas = document.createElement('canvas');
  canvas.id = 'invaders-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;display:block;z-index:-1;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let W, H;

  const SHIP_W = 30, SHIP_H = 16;
  let ship, bullets, aliens, alienBullets, alienDir, alienSpeed, score, dropTimer;

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; resetGame(); }

  function resetGame() {
    ship = { x: W / 2 }; bullets = []; alienBullets = []; score = 0; alienDir = 1; alienSpeed = 0.4; dropTimer = 0;
    aliens = [];
    const aCols = Math.min(Math.floor(W / 50), 14), aRows = 4;
    const startX = (W - aCols * 40) / 2;
    for (let r = 0; r < aRows; r++)
      for (let c = 0; c < aCols; c++)
        aliens.push({ x: startX + c * 40, y: 40 + r * 35, w: 24, h: 16, alive: true });
  }

  function tick() {
    if (!isActive) return;
    dropTimer++;
    // Move aliens
    let edgeHit = false;
    for (const a of aliens) {
      if (!a.alive) continue;
      a.x += alienDir * alienSpeed;
      if (a.x <= 5 || a.x + a.w >= W - 5) edgeHit = true;
    }
    if (edgeHit) {
      alienDir *= -1;
      for (const a of aliens) { if (a.alive) a.y += 15; }
    }

    // Alien shooting
    const alive = aliens.filter(a => a.alive);
    if (alive.length && Math.random() > 0.96) {
      const shooter = alive[Math.floor(Math.random() * alive.length)];
      alienBullets.push({ x: shooter.x + shooter.w / 2, y: shooter.y + shooter.h, vy: 3 });
    }

    // All dead -> reset wave
    if (!alive.length) { alienSpeed += 0.2; resetGame(); }

    // Alien reached bottom
    for (const a of alive) if (a.y + a.h > H - 50) resetGame();
  }

  function draw() {
    if (!isActive) return;
    ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);

    // Ship
    ctx.fillStyle = 'rgba(100, 255, 100, 0.5)';
    ctx.fillRect(ship.x - SHIP_W / 2, H - 40, SHIP_W, SHIP_H);

    // Player bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].y -= 6;
      if (bullets[i].y < 0) { bullets.splice(i, 1); continue; }
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(bullets[i].x - 1, bullets[i].y, 2, 8);

      // Hit aliens
      for (const a of aliens) {
        if (!a.alive) continue;
        if (bullets[i] && bullets[i].x > a.x && bullets[i].x < a.x + a.w && bullets[i].y > a.y && bullets[i].y < a.y + a.h) {
          a.alive = false; bullets.splice(i, 1); score++; break;
        }
      }
    }

    // Alien bullets
    for (let i = alienBullets.length - 1; i >= 0; i--) {
      alienBullets[i].y += alienBullets[i].vy;
      if (alienBullets[i].y > H) { alienBullets.splice(i, 1); continue; }
      ctx.fillStyle = 'rgba(255,100,100,0.5)'; ctx.fillRect(alienBullets[i].x - 1, alienBullets[i].y, 2, 8);
    }

    // Aliens
    for (const a of aliens) {
      if (!a.alive) continue;
      ctx.fillStyle = 'rgba(200, 100, 255, 0.45)';
      ctx.fillRect(a.x, a.y, a.w, a.h);
      // Eyes
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(a.x + 5, a.y + 5, 4, 4); ctx.fillRect(a.x + 15, a.y + 5, 4, 4);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.font = '16px monospace'; ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${score}`, W - 20, H - 10);

    animFrame = requestAnimationFrame(draw);
  }

  function onKey(e) {
    if (!isActive) return;
    if (e.key === 'ArrowLeft') ship.x = Math.max(SHIP_W / 2, ship.x - 20);
    if (e.key === 'ArrowRight') ship.x = Math.min(W - SHIP_W / 2, ship.x + 20);
    if ((e.key === ' ' || e.code === 'Space') && bullets.length < 4) { bullets.push({ x: ship.x, y: H - 42 }); e.preventDefault(); }
  }

  window.addEventListener('keydown', onKey); window.addEventListener('resize', resize);
  resize(); tickId = setInterval(tick, 50); draw();

  return () => { isActive = false; cancelAnimationFrame(animFrame); clearInterval(tickId); window.removeEventListener('keydown', onKey); window.removeEventListener('resize', resize); container.innerHTML = ''; };
}
