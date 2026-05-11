const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let gridSize = 16;
let cellSize = 0;
let grid = [];

let currentColor = "#74bb4a";
let currentTool = "pen";
let isDrawing = false;
let gridActive = true;
let hue = 0;
let saturation = 100;
let brightness = 100;

let lastCell = null;

const MAX_HISTORY = 40;
let history = [];
let historyIndex = -1;

const MAX_RECENT_COLORS = 8;
let recentColors = [];

const custom_color = document.getElementById("custom-color");
custom_color.value = currentColor;

function saveState() {
  const state = grid.map((row) => [...row]);
  history = history.slice(0, historyIndex + 1);
  history.push(state);
  if (history.length > MAX_HISTORY) history.shift();
  historyIndex = history.length - 1;
}

function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    grid = history[historyIndex].map((row) => [...row]);
    render();
    showToast("Annulé", "undo", "info");
  }
}

function redo() {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    grid = history[historyIndex].map((row) => [...row]);
    render();
    showToast("Rétabli", "redo", "info");
  }
}

function addRecentColor(color) {
  if (color === "#00000000") return;
  const normalized = color.toUpperCase();
  recentColors = recentColors.filter((c) => c.toUpperCase() !== normalized);
  recentColors.unshift(color);
  if (recentColors.length > MAX_RECENT_COLORS) recentColors.pop();
  renderRecentColors();
}

function renderRecentColors() {
  const container = document.getElementById("recent-colors-swatches");
  container.replaceChildren();
  recentColors.forEach((color) => {
    const swatch = document.createElement("button");
    swatch.className = "recent-swatch";
    swatch.style.background = color;
    swatch.setAttribute("aria-label", `Couleur ${color}`);
    swatch.title = color;
    swatch.addEventListener("click", () => {
      currentColor = color;
      custom_color.value = color;
    });
    container.appendChild(swatch);
  });
}

function showToast(message, icon = "info", type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const iconMap = {
    success: "fa-check-circle",
    error: "fa-exclamation-circle",
    warning: "fa-exclamation-triangle",
    info: "fa-info-circle",
    undo: "fa-undo",
    redo: "fa-redo",
    trash: "fa-trash",
    download: "fa-download",
    image: "fa-image",
  };

  const i = document.createElement("i");
  i.className = `fas ${iconMap[icon] || iconMap.info}`;
  toast.appendChild(i);

  const span = document.createElement("span");
  span.textContent = message;
  toast.appendChild(span);

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("removing");
    setTimeout(() => toast.remove(), 250);
  }, 2500);
}

function init() {
  grid = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill("#00000000"),
  );
  cellSize = Math.floor(576 / gridSize);
  canvas.width = gridSize * cellSize;
  canvas.height = gridSize * cellSize;
  saveState();
  render();
  updateFilterValues();
  applyCanvasFilters();
  updateCanvasInfo();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const color = grid[row][col];
      ctx.fillStyle = color;
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);

      if (gridActive) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }
  }
}

function updateCanvasInfo() {
  const info = document.getElementById("canvas-info");
  const totalPixels = gridSize * gridSize;
  info.textContent = `${gridSize} × ${gridSize} · ${totalPixels} px`;
}

function getCanvasFilter() {
  return `hue-rotate(${hue}deg) saturate(${saturation}%) brightness(${brightness}%)`;
}

function applyCanvasFilters() {
  canvas.style.filter = getCanvasFilter();
}

function updateFilterValues() {
  document.getElementById("hue-value").textContent = `${hue}°`;
  document.getElementById("saturation-value").textContent = `${saturation}%`;
  document.getElementById("brightness-value").textContent = `${brightness}%`;
}

function resetFilters() {
  hue = 0;
  saturation = 100;
  brightness = 100;
  document.getElementById("hue-range").value = hue;
  document.getElementById("saturation-range").value = saturation;
  document.getElementById("brightness-range").value = brightness;
  updateFilterValues();
  applyCanvasFilters();
  showToast("Filtres réinitialisés", "undo", "success");
}

function getCellFromMouse(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
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
  }
}

function isInBounds(r, c) {
  return r >= 0 && r < gridSize && c >= 0 && c < gridSize;
}

function lineCells(r0, c0, r1, c1) {
  const cells = [];
  const dr = Math.abs(r1 - r0);
  const dc = Math.abs(c1 - c0);
  const sr = r0 < r1 ? 1 : -1;
  const sc = c0 < c1 ? 1 : -1;
  let err = dr - dc;
  let r = r0;
  let c = c0;

  while (true) {
    if (isInBounds(r, c)) {
      cells.push({ row: r, col: c });
    }
    if (r === r1 && c === c1) break;
    const e2 = err * 2;
    if (e2 > -dr) {
      err -= dc;
      r += sr;
    }
    if (e2 < dc) {
      err += dr;
      c += sc;
    }
  }
  return cells;
}

function paintLine(r0, c0, r1, c1) {
  const cells = lineCells(r0, c0, r1, c1);
  for (const { row, col } of cells) {
    paintCell(row, col);
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
    lastCell = cell;
    if (currentTool === "color-picker") {
      pickColor(cell.row, cell.col);
    } else if (currentTool === "fill") {
      saveState();
      floodFill(cell.row, cell.col, currentColor);
    } else {
      saveState();
      paintCell(cell.row, cell.col);
      render();
    }
  }
});

canvas.addEventListener("mousemove", (e) => {
  const cell = getCellFromMouse(e);
  if (isDrawing && cell) {
    if (currentTool === "pen" || currentTool === "eraser") {
      if (lastCell && (lastCell.row !== cell.row || lastCell.col !== cell.col)) {
        paintLine(lastCell.row, lastCell.col, cell.row, cell.col);
      }
      lastCell = cell;
    }
  }
});

canvas.addEventListener("mouseup", () => {
  if (isDrawing && currentTool !== "fill" && currentTool !== "color-picker") {
    const penBtn = document.getElementById("pen");
    if (currentTool === "pen" && currentColor !== "#00000000") {
      addRecentColor(currentColor);
    }
  }
  isDrawing = false;
  lastCell = null;
});

canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
  lastCell = null;
});

custom_color.addEventListener("input", (e) => {
  currentColor = e.target.value;
});

document.getElementById("hue-range").addEventListener("input", (e) => {
  hue = parseInt(e.target.value, 10);
  updateFilterValues();
  applyCanvasFilters();
});

document.getElementById("saturation-range").addEventListener("input", (e) => {
  saturation = parseInt(e.target.value, 10);
  updateFilterValues();
  applyCanvasFilters();
});

document.getElementById("brightness-range").addEventListener("input", (e) => {
  brightness = parseInt(e.target.value, 10);
  updateFilterValues();
  applyCanvasFilters();
});

document.getElementById("reset-filters-btn").addEventListener("click", () => {
  resetFilters();
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
  exportCtx.filter = getCanvasFilter();

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
  showToast("Texture exportée", "download", "success");
});

document.getElementById("trash-btn").addEventListener("click", () => {
  showConfirm(
    "Effacer tout ?",
    "Cette action est irréversible.",
    () => {
      saveState();
      clearCanvas();
      showToast("Canvas effacé", "trash", "warning");
    },
  );
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
        templates.push({ name: template.name, data: url });
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
          0, 0, img.width, img.height,
          0, 0, targetGridSize, targetGridSize,
        );

        const imageData = resizeCtx.getImageData(0, 0, targetGridSize, targetGridSize);
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
    img.onerror = () => reject(new Error("Failed to load image"));
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

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOverlay.classList.contains("active")) {
      modalOverlay.classList.remove("active");
    }
  });

  TEMPLATES.forEach((template, idx) => {
    const thumbnail = document.createElement("img");
    thumbnail.src = template.data;
    thumbnail.alt = template.name;
    thumbnail.className = "template-thumbnail";
    thumbnail.title = template.name;
    thumbnail.loading = "lazy";

    thumbnail.addEventListener("click", async () => {
      try {
        const newGrid = await loadPNGToGrid(template.data, gridSize);
        saveState();
        applyTemplate(newGrid);
        modalOverlay.classList.remove("active");
        showToast(`Template "${template.name}" chargé`, "image", "success");
      } catch (err) {
        console.error("Failed to load template:", err);
        showToast("Échec du chargement du template", "error", "error");
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
          saveState();
          applyTemplate(newGrid);
          modalOverlay.classList.remove("active");
          templateUpload.value = "";
          showToast("PNG importé avec succès", "image", "success");
        } catch (err) {
          console.error("Failed to load custom template:", err);
          showToast("Échec du chargement du PNG", "error", "error");
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error reading file:", err);
      showToast("Erreur de lecture du fichier", "error", "error");
    }
  });
}

function showConfirm(title, message, onConfirm) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast warning";
  toast.style.cursor = "default";

  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.gap = "10px";
  wrapper.style.width = "100%";

  const textWrapper = document.createElement("div");
  textWrapper.style.display = "flex";
  textWrapper.style.alignItems = "center";
  textWrapper.style.gap = "10px";

  const i = document.createElement("i");
  i.className = "fas fa-exclamation-triangle";
  textWrapper.appendChild(i);

  const text = document.createElement("span");
  text.textContent = title;
  text.style.fontWeight = "600";
  textWrapper.appendChild(text);
  wrapper.appendChild(textWrapper);

  if (message) {
    const msg = document.createElement("div");
    msg.textContent = message;
    msg.style.fontSize = "0.75rem";
    msg.style.color = "var(--text-muted)";
    msg.style.paddingLeft = "26px";
    wrapper.appendChild(msg);
  }

  const btnRow = document.createElement("div");
  btnRow.style.display = "flex";
  btnRow.style.gap = "8px";
  btnRow.style.justifyContent = "flex-end";

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Annuler";
  cancelBtn.style.cssText =
    "padding:6px 14px;border:1px solid var(--border);border-radius:6px;background:var(--bg-surface);color:var(--text-secondary);cursor:pointer;font-size:0.75rem;font-family:var(--font-body)";
  cancelBtn.onmouseover = () => {
    cancelBtn.style.background = "var(--bg-hover)";
  };
  cancelBtn.onmouseout = () => {
    cancelBtn.style.background = "var(--bg-surface)";
  };
  cancelBtn.onclick = () => {
    toast.classList.add("removing");
    setTimeout(() => toast.remove(), 250);
  };

  const confirmBtn = document.createElement("button");
  confirmBtn.textContent = "Effacer";
  confirmBtn.style.cssText =
    "padding:6px 14px;border:none;border-radius:6px;background:var(--danger);color:#fff;cursor:pointer;font-size:0.75rem;font-weight:600;font-family:var(--font-body)";
  confirmBtn.onmouseover = () => {
    confirmBtn.style.filter = "brightness(1.15)";
  };
  confirmBtn.onmouseout = () => {
    confirmBtn.style.filter = "none";
  };
  confirmBtn.onclick = () => {
    toast.classList.add("removing");
    setTimeout(() => {
      toast.remove();
      onConfirm();
    }, 250);
  };

  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(confirmBtn);
  wrapper.appendChild(btnRow);
  toast.appendChild(wrapper);
  container.appendChild(toast);

  setTimeout(() => {
    if (toast.isConnected) {
      toast.classList.add("removing");
      setTimeout(() => toast.remove(), 250);
    }
  }, 8000);
}

const toolShortcuts = {
  p: () => document.getElementById("pen").click(),
  e: () => document.getElementById("eraser").click(),
  f: () => document.getElementById("fill").click(),
  i: () => document.getElementById("color-picker").click(),
  h: () => document.getElementById("grid-checkbox").click(),
};

document.addEventListener("keydown", (e) => {
  const isCtrl = e.ctrlKey || e.metaKey;
  const key = e.key;

  if (isCtrl) {
    if (key === "z") {
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
      return;
    }
    if (key === "y") {
      e.preventDefault();
      redo();
      return;
    }
    if (key === "s") {
      e.preventDefault();
      document.getElementById("export-btn").click();
      return;
    }
    return;
  }

  if (key === "Delete" || key === "Backspace") {
    if (!e.target.matches("input, select, textarea")) {
      e.preventDefault();
      document.getElementById("trash-btn").click();
    }
    return;
  }

  const handler = toolShortcuts[key.toLowerCase()];
  if (handler) handler();
});

init();

(async () => {
  TEMPLATES = await generateTemplates();
  initTemplateSystem();
})();
