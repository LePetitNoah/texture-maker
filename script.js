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

  cellSize = Math.floor(704 / gridSize);

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

      if (gridActive) {
        ctx.strokeStyle = "#ffffffb9";
        ctx.lineWidth = 0.6;
        ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
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

function clearCanvas() {
  grid = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill("#00000000"),
  );
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

document.getElementById("export-btn").addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  const exportCtx = exportCanvas.getContext("2d");
  const exportCellSize = Math.max(16, Math.floor(512 / gridSize));
  exportCanvas.width = gridSize * exportCellSize;
  exportCanvas.height = gridSize * exportCellSize;

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      exportCtx.fillStyle = grid[row][col];
      exportCtx.fillRect(
        col * exportCellSize,
        row * exportCellSize,
        exportCellSize,
        exportCellSize,
      );
    }
  }

  const link = document.createElement("a");
  link.download = "texture.png";
  link.href = exportCanvas.toDataURL("image/png");
  link.click();
});

document.getElementById("trash-btn").addEventListener("click", () => {
  if (window.confirm("Êtes vous sûr de vouloir supprimer votre travail ?"))
    clearCanvas();
});

document.getElementById("grid-checkbox").addEventListener("click", () => {
  gridActive = !gridActive;
  render();
});

document.getElementById("grid-size").addEventListener("change", (e) => {
  gridSize = parseInt(e.target.value);
  init();
});

let TEMPLATES = [];

async function generateTemplates() {
  const templates = [];

  try {
    const response = await fetch("./manifest.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const manifest = await response.json();

    for (const template of manifest) {
      try {
        const imgResponse = await fetch(`./templates/${template.file}`);
        if (!imgResponse.ok) throw new Error(`HTTP ${imgResponse.status}`);
        const blob = await imgResponse.blob();
        const url = URL.createObjectURL(blob);
        templates.push({
          name: template.name,
          data: url,
        });
      } catch (err) {
        console.warn(`Failed to load template ${template.file}:`, err);
      }
    }
  } catch (err) {
    console.warn("Failed to load manifest", err);
  }

  return templates;
}

function loadPNGToGrid(imageSrc, targetGridSize) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext("2d");
        tempCtx.imageSmoothingEnabled = false;
        tempCtx.drawImage(img, 0, 0);

        const resizeCanvas = document.createElement("canvas");
        resizeCanvas.width = targetGridSize;
        resizeCanvas.height = targetGridSize;
        const resizeCtx = resizeCanvas.getContext("2d");
        resizeCtx.imageSmoothingEnabled = false;
        resizeCtx.drawImage(
          tempCanvas,
          0,
          0,
          img.width,
          img.height,
          0,
          0,
          targetGridSize,
          targetGridSize,
        );

        const imageData = resizeCtx.getImageData(
          0,
          0,
          targetGridSize,
          targetGridSize,
        );
        const data = imageData.data;
        const newGrid = [];

        for (let i = 0; i < targetGridSize; i++) {
          newGrid[i] = [];
          for (let j = 0; j < targetGridSize; j++) {
            const idx = (i * targetGridSize + j) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            const color =
              "#" +
              [r, g, b, a]
                .map((x) => x.toString(16).padStart(2, "0"))
                .join("")
                .toUpperCase();
            newGrid[i][j] = color;
          }
        }

        resolve(newGrid);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = imageSrc;
  });
}

function applyTemplate(newGridData) {
  grid = newGridData;
  render();
}

function initTemplateSystem() {
  const templatesBtn = document.getElementById("templates-btn");
  const modalOverlay = document.getElementById("templates-modal-overlay");
  const modalClose = document.getElementById("templates-modal-close");
  const templatesGallery = document.getElementById("templates-gallery");
  const templateUpload = document.getElementById("template-upload");

  templatesBtn.addEventListener("click", () => {
    modalOverlay.classList.add("active");
  });

  modalClose.addEventListener("click", () => {
    modalOverlay.classList.remove("active");
  });

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove("active");
    }
  });

  TEMPLATES.forEach((template, idx) => {
    const thumbnail = document.createElement("img");
    thumbnail.src = template.data;
    thumbnail.alt = template.name;
    thumbnail.className = "template-thumbnail";
    thumbnail.title = template.name;
    thumbnail.style.imageRendering = "pixelated";

    thumbnail.addEventListener("click", async () => {
      try {
        const newGrid = await loadPNGToGrid(template.data, gridSize);
        applyTemplate(newGrid);
        modalOverlay.classList.remove("active");
      } catch (err) {
        console.error("Failed to load template:", err);
        alert("Failed to load template");
      }
    });

    templatesGallery.appendChild(thumbnail);
  });

  templateUpload.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const newGrid = await loadPNGToGrid(event.target.result, gridSize);
          applyTemplate(newGrid);
          modalOverlay.classList.remove("active");
          templateUpload.value = "";
        } catch (err) {
          console.error("Failed to load custom template:", err);
          alert("Failed to load PNG. Make sure it's a valid PNG file.");
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error reading file:", err);
      alert("Error reading file");
    }
  });
}

init();

(async () => {
  TEMPLATES = await generateTemplates();
  initTemplateSystem();
})();
