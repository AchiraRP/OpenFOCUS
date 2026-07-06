// Pong — playable with Arrow Up/Down, AI opponent
let isActive = false;
let animFrame;

export function mount(container) {
  isActive = true;
  const canvas = document.createElement('canvas');
  canvas.id = 'pong-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;display:block;z-index:-1;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let W, H;

  const PADDLE_W = 12, PADDLE_H = 90, BALL_R = 6;
  let player = { y: 0 }, ai = { y: 0 };
  let ball = { x: 0, y: 0, vx: 4, vy: 3 };
  let pScore = 0, aScore = 0;

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; player.y = ai.y = H / 2 - PADDLE_H / 2; }

  function resetBall() {
    ball.x = W / 2; ball.y = H / 2;
    ball.vx = (Math.random() > 0.5 ? 1 : -1) * 4;
    ball.vy = (Math.random() - 0.5) * 6;
  }

  function draw() {
    if (!isActive) return;
    ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);

    // Center line
    ctx.setLineDash([8, 8]); ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke(); ctx.setLineDash([]);

    // AI
    const aiCenter = ai.y + PADDLE_H / 2;
    const diff = ball.y - aiCenter;
    ai.y += diff * 0.04;
    ai.y = Math.max(0, Math.min(H - PADDLE_H, ai.y));

    // Ball
    ball.x += ball.vx; ball.y += ball.vy;
    if (ball.y - BALL_R <= 0 || ball.y + BALL_R >= H) ball.vy *= -1;

    // Player paddle collision
    if (ball.x - BALL_R <= 30 + PADDLE_W && ball.y >= player.y && ball.y <= player.y + PADDLE_H && ball.vx < 0) {
      ball.vx = Math.abs(ball.vx) * 1.05; ball.vy += (Math.random() - 0.5) * 2;
    }
    // AI paddle collision
    if (ball.x + BALL_R >= W - 30 - PADDLE_W && ball.y >= ai.y && ball.y <= ai.y + PADDLE_H && ball.vx > 0) {
      ball.vx = -Math.abs(ball.vx) * 1.05; ball.vy += (Math.random() - 0.5) * 2;
    }

    // Score
    if (ball.x < 0) { aScore++; resetBall(); }
    if (ball.x > W) { pScore++; resetBall(); }

    // Speed cap
    ball.vx = Math.max(-10, Math.min(10, ball.vx));

    // Draw paddles
    ctx.fillStyle = 'rgba(100, 200, 255, 0.5)';
    ctx.fillRect(30, player.y, PADDLE_W, PADDLE_H);
    ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
    ctx.fillRect(W - 30 - PADDLE_W, ai.y, PADDLE_W, PADDLE_H);

    // Ball
    ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; ctx.fill();

    // Scores
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.font = '48px monospace'; ctx.textAlign = 'center';
    ctx.fillText(pScore, W / 2 - 60, 60); ctx.fillText(aScore, W / 2 + 60, 60);

    animFrame = requestAnimationFrame(draw);
  }

  function onKey(e) {
    if (!isActive) return;
    if (e.key === 'ArrowUp') player.y = Math.max(0, player.y - 30);
    if (e.key === 'ArrowDown') player.y = Math.min(H - PADDLE_H, player.y + 30);
  }

  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', resize);
  resize(); resetBall(); draw();

  return () => { isActive = false; cancelAnimationFrame(animFrame); window.removeEventListener('keydown', onKey); window.removeEventListener('resize', resize); container.innerHTML = ''; };
}
