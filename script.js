const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let gridSize = 16;
let cellSize = 0;
let grid = [];

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

init();
