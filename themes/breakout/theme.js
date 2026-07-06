// Breakout — paddle with Arrow Left/Right, ball breaks bricks
let isActive = false;
let animFrame;

export function mount(container) {
  isActive = true;
  const canvas = document.createElement('canvas');
  canvas.id = 'breakout-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;display:block;z-index:-1;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let W, H;

  const PADDLE_W = 100, PADDLE_H = 10, BALL_R = 5;
  let paddle, ball, bricks, score, brickRows, brickCols, brickW, brickH;

  const BRICK_COLORS = ['#e63946','#f4a261','#e9c46a','#2a9d8f','#264653'];

  function resize() {
    W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight;
    resetGame();
  }

  function resetGame() {
    paddle = { x: W / 2 - PADDLE_W / 2 };
    ball = { x: W / 2, y: H - 60, vx: 3, vy: -3 };
    score = 0;
    brickCols = Math.floor(W / 70);
    brickRows = 5;
    brickW = (W - 20) / brickCols;
    brickH = 18;
    bricks = [];
    for (let r = 0; r < brickRows; r++)
      for (let c = 0; c < brickCols; c++)
        bricks.push({ x: 10 + c * brickW, y: 40 + r * (brickH + 4), w: brickW - 4, h: brickH, color: BRICK_COLORS[r], alive: true });
  }

  function draw() {
    if (!isActive) return;
    ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);

    // Ball
    ball.x += ball.vx; ball.y += ball.vy;
    if (ball.x <= BALL_R || ball.x >= W - BALL_R) ball.vx *= -1;
    if (ball.y <= BALL_R) ball.vy *= -1;
    if (ball.y >= H) { ball.x = W / 2; ball.y = H - 60; ball.vx = 3; ball.vy = -3; }

    // Paddle
    if (ball.y + BALL_R >= H - 30 && ball.y + BALL_R <= H - 20 && ball.x >= paddle.x && ball.x <= paddle.x + PADDLE_W && ball.vy > 0) {
      ball.vy *= -1;
      ball.vx += ((ball.x - (paddle.x + PADDLE_W / 2)) / PADDLE_W) * 3;
    }

    // Bricks
    for (const b of bricks) {
      if (!b.alive) continue;
      if (ball.x + BALL_R > b.x && ball.x - BALL_R < b.x + b.w && ball.y + BALL_R > b.y && ball.y - BALL_R < b.y + b.h) {
        b.alive = false; ball.vy *= -1; score++;
      }
    }

    // All bricks gone -> reset
    if (bricks.every(b => !b.alive)) resetGame();

    // Draw bricks
    for (const b of bricks) {
      if (!b.alive) continue;
      ctx.fillStyle = b.color; ctx.globalAlpha = 0.5;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.globalAlpha = 1;
    }

    // Paddle
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(paddle.x, H - 30, PADDLE_W, PADDLE_H);

    // Ball
    ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.font = '16px monospace'; ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${score}`, W - 20, H - 10);

    animFrame = requestAnimationFrame(draw);
  }

  function onKey(e) {
    if (!isActive) return;
    if (e.key === 'ArrowLeft') paddle.x = Math.max(0, paddle.x - 30);
    if (e.key === 'ArrowRight') paddle.x = Math.min(W - PADDLE_W, paddle.x + 30);
  }

  window.addEventListener('keydown', onKey); window.addEventListener('resize', resize);
  resize(); draw();

  return () => { isActive = false; cancelAnimationFrame(animFrame); window.removeEventListener('keydown', onKey); window.removeEventListener('resize', resize); container.innerHTML = ''; };
}
