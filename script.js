const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let gridSize = 16;
let cellSize = 0;
let grid = [];

let currentColor = "#74bb4a";
let currentTool = "pen";
let isDrawing = false;
let gridActive = true;

const custom_color = document.getElementById("custom-color");
custom_color.value = currentColor;

function init() {
  grid = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill("#00000000"),
  );

  cellSize = Math.floor(720 / gridSize);

  canvas.width = gridSize * cellSize;
  canvas.height = gridSize * cellSize;

  render();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const color = grid[row][col];
      ctx.fillStyle = color;
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);

      ctx.strokeStyle = "#ffffffb9";
      ctx.lineWidth = 0.6;
      ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
    }
  }
}

function getCellFromMouse(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left - 8; // Moins 8 à cause de la bordure du css qui ajoute 16px de largeur au canvas
  const y = e.clientY - rect.top - 8; // Moins 8 à cause de la bordure du css qui ajoute 16px de largeur au canvas
  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);

  if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
    return { row, col };
  }
  return null;
}

function paintCell(row, col) {
  if (currentTool === "pen") {
    grid[row][col] = currentColor;
  } else if (currentTool === "eraser") {
    grid[row][col] = "#00000000";
    ctx.clearRect(col * cellSize, row * cellSize, cellSize, cellSize);
  }
  render();
}

function pickColor(row, col) {
  currentColor = grid[row][col];
  const penBtn = document.getElementById("pen");
  penBtn.click();
  custom_color.value = currentColor;
  render();
}

function floodFill(row, col, newColor) {
  const targetColor = grid[row][col];
  if (targetColor === newColor) return;

  const stack = [[row, col]];

  while (stack.length > 0) {
    const [r, c] = stack.pop();

    if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) continue;
    if (grid[r][c] !== targetColor) continue;

    grid[r][c] = newColor;

    stack.push([r - 1, c]);
    stack.push([r + 1, c]);
    stack.push([r, c - 1]);
    stack.push([r, c + 1]);
  }
  render();
}

canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  const cell = getCellFromMouse(e);
  if (cell) {
    if (currentTool === "color-picker") {
      pickColor(cell.row, cell.col);
    } else if (currentTool === "fill") {
      floodFill(cell.row, cell.col, currentColor);
    } else {
      paintCell(cell.row, cell.col);
    }
  }
});

canvas.addEventListener("mousemove", (e) => {
  const cell = getCellFromMouse(e);

  if (isDrawing && currentTool !== "fill" && cell) {
    paintCell(cell.row, cell.col);
  } else {
    render();
  }
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
});

canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
  render();
});

custom_color.addEventListener("input", (e) => {
  currentColor = e.target.value;
});

document.querySelectorAll(".tool-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentTool = btn.dataset.tool;
    document
      .querySelectorAll(".tool-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

init();
