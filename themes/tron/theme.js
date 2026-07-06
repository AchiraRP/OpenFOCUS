// Tron Light Cycles — Arrow keys to steer, neon trails
let isActive = false;
let animFrame, tickId;

export function mount(container) {
  isActive = true;
  const canvas = document.createElement('canvas');
  canvas.id = 'tron-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;display:block;z-index:-1;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let W, H;

  const CELL = 4;
  let cols, rows, player, ai, playerTrail, aiTrail, gameOver;

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; cols = Math.floor(W / CELL); rows = Math.floor(H / CELL); resetGame(); }

  function resetGame() {
    player = { x: Math.floor(cols * 0.3), y: Math.floor(rows / 2), dx: 1, dy: 0 };
    ai = { x: Math.floor(cols * 0.7), y: Math.floor(rows / 2), dx: -1, dy: 0 };
    playerTrail = new Set(); aiTrail = new Set();
    playerTrail.add(`${player.x},${player.y}`); aiTrail.add(`${ai.x},${ai.y}`);
    gameOver = false;
  }

  function aiThink() {
    const ahead = `${ai.x + ai.dx},${ai.y + ai.dy}`;
    const blocked = playerTrail.has(ahead) || aiTrail.has(ahead) || ai.x + ai.dx < 0 || ai.x + ai.dx >= cols || ai.y + ai.dy < 0 || ai.y + ai.dy >= rows;
    if (blocked) {
      const dirs = [{dx:0,dy:-1},{dx:0,dy:1},{dx:-1,dy:0},{dx:1,dy:0}].filter(d => !(d.dx === -ai.dx && d.dy === -ai.dy));
      const free = dirs.filter(d => { const k = `${ai.x+d.dx},${ai.y+d.dy}`; return !playerTrail.has(k) && !aiTrail.has(k) && ai.x+d.dx>=0 && ai.x+d.dx<cols && ai.y+d.dy>=0 && ai.y+d.dy<rows; });
      if (free.length) { const pick = free[Math.floor(Math.random() * free.length)]; ai.dx = pick.dx; ai.dy = pick.dy; }
    }
  }

  function tick() {
    if (!isActive || gameOver) return;
    // Move player
    player.x += player.dx; player.y += player.dy;
    ai.x += ai.dx; ai.y += ai.dy;
    aiThink();

    const pk = `${player.x},${player.y}`, ak = `${ai.x},${ai.y}`;
    const pDead = player.x < 0 || player.x >= cols || player.y < 0 || player.y >= rows || playerTrail.has(pk) || aiTrail.has(pk);
    const aDead = ai.x < 0 || ai.x >= cols || ai.y < 0 || ai.y >= rows || aiTrail.has(ak) || playerTrail.has(ak);

    if (pDead || aDead) { gameOver = true; setTimeout(() => { if (isActive) resetGame(); }, 2000); return; }
    playerTrail.add(pk); aiTrail.add(ak);
  }

  function draw() {
    if (!isActive) return;
    ctx.fillStyle = 'rgba(5,5,15,0.1)'; ctx.fillRect(0, 0, W, H);

    // Player trail
    ctx.fillStyle = 'rgba(0, 200, 255, 0.4)';
    for (const k of playerTrail) { const [x, y] = k.split(',').map(Number); ctx.fillRect(x * CELL, y * CELL, CELL, CELL); }
    // Player head glow
    ctx.fillStyle = 'rgba(0, 200, 255, 0.9)';
    ctx.fillRect(player.x * CELL - 1, player.y * CELL - 1, CELL + 2, CELL + 2);

    // AI trail
    ctx.fillStyle = 'rgba(255, 80, 80, 0.4)';
    for (const k of aiTrail) { const [x, y] = k.split(',').map(Number); ctx.fillRect(x * CELL, y * CELL, CELL, CELL); }
    ctx.fillStyle = 'rgba(255, 80, 80, 0.9)';
    ctx.fillRect(ai.x * CELL - 1, ai.y * CELL - 1, CELL + 2, CELL + 2);

    animFrame = requestAnimationFrame(draw);
  }

  function onKey(e) {
    if (!isActive) return;
    if (e.key === 'ArrowUp' && player.dy !== 1) { player.dx = 0; player.dy = -1; }
    if (e.key === 'ArrowDown' && player.dy !== -1) { player.dx = 0; player.dy = 1; }
    if (e.key === 'ArrowLeft' && player.dx !== 1) { player.dx = -1; player.dy = 0; }
    if (e.key === 'ArrowRight' && player.dx !== -1) { player.dx = 1; player.dy = 0; }
  }

  window.addEventListener('keydown', onKey); window.addEventListener('resize', resize);
  resize(); tickId = setInterval(tick, 40); draw();

  return () => { isActive = false; cancelAnimationFrame(animFrame); clearInterval(tickId); window.removeEventListener('keydown', onKey); window.removeEventListener('resize', resize); container.innerHTML = ''; };
}
