// Dino Runner — Space/ArrowUp to jump
let isActive = false;
let animFrame;

export function mount(container) {
  isActive = true;
  const canvas = document.createElement('canvas');
  canvas.id = 'dino-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;display:block;z-index:-1;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let W, H;

  const GROUND_Y_OFFSET = 80;
  let dino, obstacles, score, speed, groundY, frame;
  const GRAVITY = 0.6, JUMP = -11;

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; groundY = H - GROUND_Y_OFFSET; resetGame(); }

  function resetGame() {
    dino = { x: 80, y: groundY, vy: 0, w: 24, h: 30, grounded: true };
    obstacles = []; score = 0; speed = 4; frame = 0;
  }

  function draw() {
    if (!isActive) return;
    frame++;
    ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);

    // Ground line
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, groundY + dino.h); ctx.lineTo(W, groundY + dino.h); ctx.stroke();

    // Ground dots
    for (let x = (frame * speed) % 40; x < W; x += 40) {
      ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(W - x, groundY + dino.h + 5, 2, 1);
    }

    // Dino physics
    dino.vy += GRAVITY;
    dino.y += dino.vy;
    if (dino.y >= groundY) { dino.y = groundY; dino.vy = 0; dino.grounded = true; }

    // Draw dino (pixel art style)
    ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
    ctx.fillRect(dino.x, dino.y, dino.w, dino.h);
    // Eye
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(dino.x + 16, dino.y + 4, 4, 4);
    // Legs (animated)
    if (dino.grounded) {
      const legOffset = Math.floor(frame / 6) % 2;
      ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
      ctx.fillRect(dino.x + 4, dino.y + dino.h, 5, 6 + legOffset * 2);
      ctx.fillRect(dino.x + 14, dino.y + dino.h, 5, 6 + (1 - legOffset) * 2);
    }

    // Obstacles
    if (frame % Math.max(40, 80 - Math.floor(score / 5)) === 0) {
      const h = Math.random() * 20 + 20;
      const isDouble = Math.random() > 0.7;
      obstacles.push({ x: W + 20, w: isDouble ? 24 : 14, h });
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      if (o.x + o.w < 0) { obstacles.splice(i, 1); score++; continue; }

      ctx.fillStyle = 'rgba(150, 150, 150, 0.4)';
      ctx.fillRect(o.x, groundY + dino.h - o.h, o.w, o.h);

      // Collision
      if (dino.x + dino.w > o.x + 3 && dino.x < o.x + o.w - 3 && dino.y + dino.h > groundY + dino.h - o.h + 3) {
        resetGame();
      }
    }

    speed = 4 + score * 0.1;

    ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.font = '16px monospace'; ctx.textAlign = 'right';
    ctx.fillText(`${String(score).padStart(5, '0')}`, W - 20, 30);

    animFrame = requestAnimationFrame(draw);
  }

  function onKey(e) {
    if (!isActive) return;
    if ((e.key === ' ' || e.code === 'Space' || e.key === 'ArrowUp') && dino.grounded) { dino.vy = JUMP; dino.grounded = false; e.preventDefault(); }
    if (e.key === 'ArrowDown') { dino.h = 16; dino.y = groundY + 14; } // duck
  }
  function onKeyUp(e) {
    if (e.key === 'ArrowDown') { dino.h = 30; dino.y = Math.min(dino.y, groundY); }
  }

  window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKeyUp); window.addEventListener('resize', resize);
  resize(); draw();

  return () => { isActive = false; cancelAnimationFrame(animFrame); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp); window.removeEventListener('resize', resize); container.innerHTML = ''; };
}
