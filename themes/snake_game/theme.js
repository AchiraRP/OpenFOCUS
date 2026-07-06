// Snake Game — playable in the background with arrow keys
let isActive = false;
let animFrame;

export function mount(container) {
  isActive = true;

  const canvas = document.createElement('canvas');
  canvas.id = 'snake-game-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;display:block;z-index:-1;';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let width, height;

  // Grid settings
  const CELL = 20;
  let cols, rows;

  // Snake state
  let snake = [];
  let direction = { x: 1, y: 0 };
  let nextDirection = { x: 1, y: 0 };
  let apple = { x: 0, y: 0 };
  let score = 0;
  let gameOver = false;
  let tickInterval;
  const TICK_MS = 120; // speed

  // Colors from reference
  const COLORS = {
    bg: '#1a1a2e',
    grid: '#16213e',
    snakeHead: '#6abf4b',
    snakeBody: '#4a8f3b',
    snakeTail: '#3a7030',
    apple: '#e63946',
    gridLine: 'rgba(255, 255, 255, 0.04)',
    scoreText: 'rgba(255, 255, 255, 0.15)',
  };

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    cols = Math.floor(width / CELL);
    rows = Math.floor(height / CELL);
  }

  function resetGame() {
    const startX = Math.floor(cols / 4);
    const startY = Math.floor(rows / 2);
    snake = [];
    for (let i = 0; i < 5; i++) {
      snake.push({ x: startX - i, y: startY });
    }
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    gameOver = false;
    placeApple();
  }

  function placeApple() {
    let pos;
    do {
      pos = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
      };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    apple = pos;
  }

  function tick() {
    if (!isActive || gameOver) return;

    direction = { ...nextDirection };

    // Move head
    const head = {
      x: snake[0].x + direction.x,
      y: snake[0].y + direction.y,
    };

    // Wrap around edges
    if (head.x >= cols) head.x = 0;
    if (head.x < 0) head.x = cols - 1;
    if (head.y >= rows) head.y = 0;
    if (head.y < 0) head.y = rows - 1;

    // Self collision — restart
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      gameOver = true;
      setTimeout(() => {
        if (isActive) resetGame();
      }, 1500);
      return;
    }

    snake.unshift(head);

    // Eat apple
    if (head.x === apple.x && head.y === apple.y) {
      score++;
      placeApple();
    } else {
      snake.pop();
    }
  }

  function draw() {
    if (!isActive) return;

    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 1;
    for (let x = 0; x <= cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL, 0);
      ctx.lineTo(x * CELL, rows * CELL);
      ctx.stroke();
    }
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL);
      ctx.lineTo(cols * CELL, y * CELL);
      ctx.stroke();
    }

    // Draw snake
    for (let i = 0; i < snake.length; i++) {
      const seg = snake[i];
      const t = i / snake.length; // 0 = head, 1 = tail

      // Gradient from head to tail
      let color;
      if (i === 0) {
        color = COLORS.snakeHead;
      } else if (t < 0.5) {
        color = COLORS.snakeBody;
      } else {
        color = COLORS.snakeTail;
      }

      const gap = 1;
      ctx.fillStyle = color;
      ctx.fillRect(
        seg.x * CELL + gap,
        seg.y * CELL + gap,
        CELL - gap * 2,
        CELL - gap * 2
      );

      // Subtle inner highlight on head
      if (i === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(
          seg.x * CELL + gap + 3,
          seg.y * CELL + gap + 3,
          CELL - gap * 2 - 6,
          CELL - gap * 2 - 6
        );
      }
    }

    // Draw apple
    ctx.fillStyle = COLORS.apple;
    ctx.fillRect(
      apple.x * CELL + 1,
      apple.y * CELL + 1,
      CELL - 2,
      CELL - 2
    );
    // Apple shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(
      apple.x * CELL + 4,
      apple.y * CELL + 4,
      6,
      6
    );

    // Score display (subtle, bottom right)
    ctx.fillStyle = COLORS.scoreText;
    ctx.font = '16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${score}`, width - 20, height - 20);

    // Game over flash
    if (gameOver) {
      ctx.fillStyle = 'rgba(230, 57, 70, 0.15)';
      ctx.fillRect(0, 0, width, height);
    }

    animFrame = requestAnimationFrame(draw);
  }

  // Keyboard handler
  function onKeyDown(e) {
    if (!isActive) return;

    switch (e.key) {
      case 'ArrowUp':
        if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
        break;
      case 'ArrowDown':
        if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
        break;
      case 'ArrowLeft':
        if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
        break;
      case 'ArrowRight':
        if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
        break;
    }
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('resize', resize);

  resize();
  resetGame();
  tickInterval = setInterval(tick, TICK_MS);
  draw();

  return () => {
    isActive = false;
    cancelAnimationFrame(animFrame);
    clearInterval(tickInterval);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('resize', resize);
    container.innerHTML = '';
  };
}
