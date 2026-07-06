// Minesweeper — click to reveal, right-click to flag
let isActive = false;

export function mount(container) {
  isActive = true;
  const canvas = document.createElement('canvas');
  canvas.id = 'mine-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;display:block;z-index:-1;cursor:crosshair;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let W, H;

  const CELL = 28;
  let cols, rows, board, revealed, flagged, mines, gameOver, firstClick;
  const MINE_RATIO = 0.12;
  const NUM_COLORS = ['','#64b5f6','#81c784','#e57373','#7986cb','#a1887f','#4dd0e1','#333','#aaa'];

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; resetGame(); }

  function resetGame() {
    cols = Math.floor(W / CELL); rows = Math.floor(H / CELL);
    mines = Math.floor(cols * rows * MINE_RATIO);
    board = Array.from({ length: rows }, () => Array(cols).fill(0));
    revealed = Array.from({ length: rows }, () => Array(cols).fill(false));
    flagged = Array.from({ length: rows }, () => Array(cols).fill(false));
    gameOver = false; firstClick = true;
  }

  function placeMines(safeR, safeC) {
    let placed = 0;
    while (placed < mines) {
      const r = Math.floor(Math.random() * rows), c = Math.floor(Math.random() * cols);
      if (board[r][c] === -1 || (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1)) continue;
      board[r][c] = -1; placed++;
    }
    // Count neighbors
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (board[r][c] !== -1) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc] === -1) count++;
          }
          board[r][c] = count;
        }
  }

  function reveal(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols || revealed[r][c] || flagged[r][c]) return;
    revealed[r][c] = true;
    if (board[r][c] === 0)
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) reveal(r + dr, c + dc);
  }

  function drawBoard() {
    if (!isActive) return;
    ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);

    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const x = c * CELL, y = r * CELL;
        if (revealed[r][c]) {
          ctx.fillStyle = 'rgba(20,20,40,0.6)'; ctx.fillRect(x, y, CELL - 1, CELL - 1);
          if (board[r][c] === -1) {
            ctx.fillStyle = 'rgba(230,57,70,0.5)'; ctx.fillRect(x + 4, y + 4, CELL - 9, CELL - 9);
          } else if (board[r][c] > 0) {
            ctx.fillStyle = NUM_COLORS[board[r][c]] || '#fff'; ctx.globalAlpha = 0.5;
            ctx.font = '14px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(board[r][c], x + CELL / 2, y + CELL / 2);
            ctx.globalAlpha = 1;
          }
        } else {
          ctx.fillStyle = 'rgba(40,40,70,0.5)'; ctx.fillRect(x, y, CELL - 1, CELL - 1);
          if (flagged[r][c]) {
            ctx.fillStyle = 'rgba(255,200,50,0.5)'; ctx.font = '14px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('⚑', x + CELL / 2, y + CELL / 2);
          }
        }
      }

    if (gameOver) {
      ctx.fillStyle = 'rgba(230,57,70,0.1)'; ctx.fillRect(0, 0, W, H);
    }

    requestAnimationFrame(drawBoard);
  }

  function onClick(e) {
    if (gameOver) { resetGame(); return; }
    const c = Math.floor(e.clientX / CELL), r = Math.floor(e.clientY / CELL);
    if (r < 0 || r >= rows || c < 0 || c >= cols || flagged[r][c]) return;

    if (firstClick) { placeMines(r, c); firstClick = false; }

    if (board[r][c] === -1) {
      // Reveal all mines
      for (let rr = 0; rr < rows; rr++) for (let cc = 0; cc < cols; cc++) if (board[rr][cc] === -1) revealed[rr][cc] = true;
      gameOver = true;
    } else {
      reveal(r, c);
    }
  }

  function onContextMenu(e) {
    e.preventDefault();
    if (gameOver) return;
    const c = Math.floor(e.clientX / CELL), r = Math.floor(e.clientY / CELL);
    if (r >= 0 && r < rows && c >= 0 && c < cols && !revealed[r][c]) flagged[r][c] = !flagged[r][c];
  }

  canvas.addEventListener('click', onClick);
  canvas.addEventListener('contextmenu', onContextMenu);
  window.addEventListener('resize', resize);
  resize(); drawBoard();

  return () => { isActive = false; canvas.removeEventListener('click', onClick); canvas.removeEventListener('contextmenu', onContextMenu); window.removeEventListener('resize', resize); container.innerHTML = ''; };
}
