// Tetris — playable with Arrow keys
let isActive = false;
let animFrame, tickId;

export function mount(container) {
  isActive = true;
  const canvas = document.createElement('canvas');
  canvas.id = 'tetris-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;display:block;z-index:-1;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let W, H;

  const CELL = 28;
  let cols, rows, board;
  let piece, pieceX, pieceY, score = 0;

  const SHAPES = [
    [[1,1,1,1]],
    [[1,1],[1,1]],
    [[0,1,0],[1,1,1]],
    [[1,0,0],[1,1,1]],
    [[0,0,1],[1,1,1]],
    [[1,1,0],[0,1,1]],
    [[0,1,1],[1,1,0]]
  ];
  const COLORS = ['#00f0f0','#f0f000','#a000f0','#0000f0','#f0a000','#00f000','#f00000'];

  function resize() {
    W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight;
    cols = Math.floor(W / CELL); rows = Math.floor(H / CELL);
    board = Array.from({ length: rows }, () => Array(cols).fill(0));
  }

  function spawn() {
    const idx = Math.floor(Math.random() * SHAPES.length);
    piece = { shape: SHAPES[idx].map(r => [...r]), color: COLORS[idx] };
    pieceX = Math.floor(cols / 2) - 1;
    pieceY = 0;
  }

  function collides(shape, px, py) {
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        if (shape[r][c]) {
          const nx = px + c, ny = py + r;
          if (nx < 0 || nx >= cols || ny >= rows) return true;
          if (ny >= 0 && board[ny][nx]) return true;
        }
    return false;
  }

  function lock() {
    for (let r = 0; r < piece.shape.length; r++)
      for (let c = 0; c < piece.shape[r].length; c++)
        if (piece.shape[r][c]) {
          const ny = pieceY + r;
          if (ny >= 0 && ny < rows) board[ny][pieceX + c] = piece.color;
        }
    // Clear lines
    for (let r = rows - 1; r >= 0; r--) {
      if (board[r].every(c => c)) { board.splice(r, 1); board.unshift(Array(cols).fill(0)); score++; r++; }
    }
    spawn();
    if (collides(piece.shape, pieceX, pieceY)) { board = Array.from({ length: rows }, () => Array(cols).fill(0)); score = 0; }
  }

  function rotate() {
    const s = piece.shape;
    const rotated = s[0].map((_, i) => s.map(row => row[i]).reverse());
    if (!collides(rotated, pieceX, pieceY)) piece.shape = rotated;
  }

  function tick() {
    if (!isActive) return;
    if (!collides(piece.shape, pieceX, pieceY + 1)) pieceY++;
    else lock();
  }

  function draw() {
    if (!isActive) return;
    ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 1;
    for (let x = 0; x <= cols; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, rows * CELL); ctx.stroke(); }
    for (let y = 0; y <= rows; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(cols * CELL, y * CELL); ctx.stroke(); }

    // Board
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (board[r][c]) {
          ctx.fillStyle = board[r][c]; ctx.globalAlpha = 0.4;
          ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
          ctx.globalAlpha = 1;
        }

    // Current piece
    if (piece) {
      ctx.fillStyle = piece.color; ctx.globalAlpha = 0.6;
      for (let r = 0; r < piece.shape.length; r++)
        for (let c = 0; c < piece.shape[r].length; c++)
          if (piece.shape[r][c])
            ctx.fillRect((pieceX + c) * CELL + 1, (pieceY + r) * CELL + 1, CELL - 2, CELL - 2);
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.font = '16px monospace'; ctx.textAlign = 'right';
    ctx.fillText(`LINES: ${score}`, W - 20, H - 20);

    animFrame = requestAnimationFrame(draw);
  }

  function onKey(e) {
    if (!isActive) return;
    if (e.key === 'ArrowLeft' && !collides(piece.shape, pieceX - 1, pieceY)) pieceX--;
    if (e.key === 'ArrowRight' && !collides(piece.shape, pieceX + 1, pieceY)) pieceX++;
    if (e.key === 'ArrowDown' && !collides(piece.shape, pieceX, pieceY + 1)) pieceY++;
    if (e.key === 'ArrowUp') rotate();
  }

  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', resize);
  resize(); spawn(); tickId = setInterval(tick, 500); draw();

  return () => { isActive = false; cancelAnimationFrame(animFrame); clearInterval(tickId); window.removeEventListener('keydown', onKey); window.removeEventListener('resize', resize); container.innerHTML = ''; };
}
