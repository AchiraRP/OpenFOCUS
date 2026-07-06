// Conway's Game of Life — click cells to toggle, press Space to pause/play
let isActive = false;
let animFrame, tickId;

export function mount(container) {
  isActive = true;
  const canvas = document.createElement('canvas');
  canvas.id = 'life-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;display:block;z-index:-1;cursor:crosshair;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let W, H;

  const CELL = 10;
  let cols, rows, grid, running = true;

  function resize() {
    W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight;
    cols = Math.floor(W / CELL); rows = Math.floor(H / CELL);
    grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => Math.random() > 0.85 ? 1 : 0));
  }

  function countNeighbors(g, r, c) {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = (r + dr + rows) % rows, nc = (c + dc + cols) % cols;
        count += g[nr][nc];
      }
    return count;
  }

  function step() {
    if (!running) return;
    const next = Array.from({ length: rows }, () => Array(cols).fill(0));
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const n = countNeighbors(grid, r, c);
        if (grid[r][c]) next[r][c] = (n === 2 || n === 3) ? 1 : 0;
        else next[r][c] = n === 3 ? 1 : 0;
      }
    grid = next;
  }

  function draw() {
    if (!isActive) return;
    ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);

    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (grid[r][c]) {
          ctx.fillStyle = 'rgba(0, 255, 136, 0.3)';
          ctx.fillRect(c * CELL, r * CELL, CELL - 1, CELL - 1);
        }

    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.font = '14px monospace'; ctx.textAlign = 'right';
    ctx.fillText(running ? 'RUNNING (Space=pause)' : 'PAUSED (Space=play)', W - 20, H - 20);

    animFrame = requestAnimationFrame(draw);
  }

  function onClick(e) {
    const c = Math.floor(e.clientX / CELL), r = Math.floor(e.clientY / CELL);
    if (r >= 0 && r < rows && c >= 0 && c < cols) grid[r][c] = grid[r][c] ? 0 : 1;
  }

  function onKey(e) {
    if (e.key === ' ' || e.code === 'Space') { running = !running; e.preventDefault(); }
  }

  canvas.addEventListener('click', onClick);
  window.addEventListener('keydown', onKey); window.addEventListener('resize', resize);
  resize(); tickId = setInterval(step, 150); draw();

  return () => { isActive = false; cancelAnimationFrame(animFrame); clearInterval(tickId); canvas.removeEventListener('click', onClick); window.removeEventListener('keydown', onKey); window.removeEventListener('resize', resize); container.innerHTML = ''; };
}
