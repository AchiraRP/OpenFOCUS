// Flappy Bird — press Space to flap
let isActive = false;
let animFrame;

export function mount(container) {
  isActive = true;
  const canvas = document.createElement('canvas');
  canvas.id = 'flappy-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;display:block;z-index:-1;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let W, H;

  let bird, pipes, score, frame;
  const GRAVITY = 0.3, FLAP = -5.5, PIPE_W = 50, GAP = 160, PIPE_SPEED = 2;

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; resetGame(); }

  function resetGame() {
    bird = { x: W * 0.2, y: H / 2, vy: 0, r: 12 };
    pipes = []; score = 0; frame = 0;
  }

  function draw() {
    if (!isActive) return;
    frame++;
    ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);

    // Bird
    bird.vy += GRAVITY;
    bird.y += bird.vy;
    if (bird.y > H || bird.y < 0) resetGame();

    ctx.fillStyle = 'rgba(255, 200, 50, 0.6)';
    ctx.beginPath(); ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI * 2); ctx.fill();

    // Pipes
    if (frame % 100 === 0) {
      const gapY = Math.random() * (H - GAP - 100) + 50;
      pipes.push({ x: W, gapY, scored: false });
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i];
      p.x -= PIPE_SPEED;
      if (p.x + PIPE_W < 0) { pipes.splice(i, 1); continue; }

      // Draw pipes
      ctx.fillStyle = 'rgba(50, 200, 100, 0.4)';
      ctx.fillRect(p.x, 0, PIPE_W, p.gapY);
      ctx.fillRect(p.x, p.gapY + GAP, PIPE_W, H - p.gapY - GAP);

      // Collision
      if (bird.x + bird.r > p.x && bird.x - bird.r < p.x + PIPE_W) {
        if (bird.y - bird.r < p.gapY || bird.y + bird.r > p.gapY + GAP) resetGame();
      }

      // Score
      if (!p.scored && p.x + PIPE_W < bird.x) { score++; p.scored = true; }
    }

    ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.font = '32px monospace'; ctx.textAlign = 'center';
    ctx.fillText(score, W / 2, 50);

    animFrame = requestAnimationFrame(draw);
  }

  function onKey(e) {
    if (!isActive) return;
    if (e.key === ' ' || e.code === 'Space') { bird.vy = FLAP; e.preventDefault(); }
  }

  window.addEventListener('keydown', onKey); window.addEventListener('resize', resize);
  resize(); draw();

  return () => { isActive = false; cancelAnimationFrame(animFrame); window.removeEventListener('keydown', onKey); window.removeEventListener('resize', resize); container.innerHTML = ''; };
}
