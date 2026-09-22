// ==========================================
// DADOS DA HQ (IMAGENS E TEXTOS)
// ==========================================
const panels = [
  "assets/quad1.gif",
  "assets/quad2.gif",
  "assets/quad3.gif",
  "assets/quad4.gif",
  "assets/quad5.gif",
  "assets/quad6.gif",
  "assets/quad7.gif",
  "assets/quad8.gif",
  "assets/quad9.gif",
  "assets/quad10.gif",
  "assets/quad11.gif",
  "assets/algas7.gif"
];

const panelTexts = {
  0: "",
  1: "Você usa \nquase as \nmesmas \nroupas",
  2: "Seu\nolhar\nanda\ncansado",
  3: "Desde então\nmuito tempo \nse passou",
  4: "Tempo o suficiente para lembrar o \nporquê não nos falamos",
  5: "Tempo o suficiente para lembrar\ndas tardes que o silêncio não existia",
  6: "Não deixo de pensar na tragédia\ndo passado",
  7: "O silêncio seria brutalmente\nassassinado",
  8: "Mostraríamos os dentes e\nberraríamos como hienas",
  9: "Que bom que agora nos resta\no silêncio e",
  10: "Nossos dentes estão escondidos\npelo cansaço"
};

// ==========================================
// VARIÁVEIS DE CONTROLE E ELEMENTOS DOM
// ==========================================
let current = 0; // Índice da cena atual (0 = quad1)

const stage = document.getElementById("hq-stage");
const img = document.getElementById("panel-img");
const btnPrev = document.getElementById("btn-prev");
const btnNext = document.getElementById("btn-next");
const counter = document.getElementById("page-counter");
const panelText = document.getElementById("panel-text");
const mazePlayer = document.getElementById("maze-player");
const sandLayer = document.getElementById("sand-layer");

// ==========================================
// CONFIGURAÇÕES DO LABIRINTO E AMPULHETA
// ==========================================
const MAZE_PANEL = 5; // Equivalente ao quadrinho 6
const SAND_PANEL = 6; // Equivalente ao quadrinho 7
const MAZE_START = { x: 385, y: 45 };
const SAND_START = { x: 177.5, y: 18 };
const PLAYER_RADIUS = 3; // Hitbox reduzida, bastante tolerante a esbarrões

// Propriedades do labirinto em escala
let mazeWidth = 0;
let mazeHeight = 0;
let mazeReady = false;

// Estado da Bolinha
let mazeDragging = false;
let mazeCompleted = false;
let mazeLastPosition = null;

// Variáveis da Ampulheta
let sandGrains = [];
let sandTimer = null;
let sandSpawnCounter = 0;
const SAND_TICK_MS = 64;
const SAND_GRAIN_RADIUS = 3.5;
const SAND_FALL_SPEED = 0.42;
const SAND_GRAVITY = 0.2;
const SAND_INITIAL_COUNT = 24;
const SAND_SPAWN_PER_TICK = 1;
const SAND_SPAWN_INTERVAL = 5;
const SAND_MAX_GRAINS = 1400;
const SAND_EXIT_ZONES = [{ left: 150 / 355, right: 205 / 355 }];

const SAND_LEFT_CHAMBER = [
  [8 / 355, 4 / 261], [150 / 355, 4 / 261], [158 / 355, 24 / 261],
  [158 / 355, 55 / 261], [146 / 355, 86 / 261], [146 / 355, 116 / 261],
  [160 / 355, 145 / 261], [165 / 355, 182 / 261], [160 / 355, 220 / 261],
  [150 / 355, 250 / 261], [8 / 355, 250 / 261]
];
const SAND_RIGHT_CHAMBER = SAND_LEFT_CHAMBER.map(([x, y]) => [1 - x, y]).reverse();

// ==========================================
// COLISÃO BASEADA NOS PIXELS REAIS DO QUADRINHO
// ==========================================
// Em vez de retângulos "chutados" (que não acompanhavam o desenho real
// do labirinto/ampulheta), lemos a própria imagem: traços escuros viram
// parede, fundo claro vira caminho livre. Isso garante que a colisão
// sempre corresponda exatamente ao que está desenhado na tela, mesmo que
// as imagens sejam substituídas ou redesenhadas no futuro.
const WALL_CELL = 8; // tamanho (em px da imagem original) de cada célula da grade
const WALL_DENSITY_THRESHOLD = 0.35; // fração de pixels escuros para considerar "parede"
const maskCanvas = document.createElement("canvas");
const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });

let wallGrid = null;
let wallGridCols = 0;
let wallGridRows = 0;

function buildWallGrid() {
  wallGrid = null;

  if (!mazeWidth || !mazeHeight) return;

  maskCanvas.width = mazeWidth;
  maskCanvas.height = mazeHeight;
  maskCtx.clearRect(0, 0, mazeWidth, mazeHeight);

  let data;
  try {
    maskCtx.drawImage(img, 0, 0, mazeWidth, mazeHeight);
    data = maskCtx.getImageData(0, 0, mazeWidth, mazeHeight).data;
  } catch (error) {
    // Se as imagens forem abertas via file:// (sem servidor local), o
    // canvas pode ficar "tainted" e getImageData falha por segurança.
    // Nesse caso, avisamos no console em vez de travar o jogo.
    console.warn("Não foi possível ler os pixels do quadrinho para calcular colisão (rode o projeto por um servidor local, não abrindo o HTML direto do disco).", error);
    return;
  }

  wallGridCols = Math.ceil(mazeWidth / WALL_CELL);
  wallGridRows = Math.ceil(mazeHeight / WALL_CELL);

  const cellCount = wallGridCols * wallGridRows;
  const darkCount = new Int32Array(cellCount);
  const totalCount = new Int32Array(cellCount);

  for (let y = 0; y < mazeHeight; y++) {
    const cellRow = (y / WALL_CELL) | 0;
    for (let x = 0; x < mazeWidth; x++) {
      const cellCol = (x / WALL_CELL) | 0;
      const cellIndex = cellRow * wallGridCols + cellCol;
      const pixelIndex = (y * mazeWidth + x) * 4;
      const luminance = (data[pixelIndex] + data[pixelIndex + 1] + data[pixelIndex + 2]) / 3;
      totalCount[cellIndex]++;
      if (luminance < 128) darkCount[cellIndex]++;
    }
  }

  const grid = new Uint8Array(cellCount);
  for (let i = 0; i < cellCount; i++) {
    grid[i] = (darkCount[i] / Math.max(totalCount[i], 1)) > WALL_DENSITY_THRESHOLD ? 1 : 0;
  }

  wallGrid = grid;
}

// ==========================================
// FUNÇÕES UTILITÁRIAS DE CENA
// ==========================================
function isChallengePanel() {
  return (current === MAZE_PANEL || current === SAND_PANEL);
}

function getChallengeStart() {
  return current === SAND_PANEL ? SAND_START : MAZE_START;
}

// ==========================================
// PREPARAÇÃO DO LABIRINTO
// ==========================================
function prepareMaze() {
  if (!isChallengePanel()) return;
  
  if (!img.complete || !img.naturalWidth || !img.naturalHeight) {
    setTimeout(prepareMaze, 50);
    return;
  }
  
  mazeWidth = img.naturalWidth;
  mazeHeight = img.naturalHeight;
  
  if (mazeWidth === 0 || mazeHeight === 0) {
    setTimeout(prepareMaze, 50);
    return;
  }

  buildWallGrid();

  mazeReady = true;
  mazeCompleted = false;
  
  if (current === SAND_PANEL) {
    createSand();
  } else {
    stopSand();
  }
  
  const challengeStart = getChallengeStart();
  mazeLastPosition = { x: challengeStart.x, y: challengeStart.y };
  
  requestAnimationFrame(() => {
    positionPlayer(challengeStart.x, challengeStart.y);
  });
}

// ==========================================
// LÓGICA DA AREIA E FÍSICA
// ==========================================
function stopSand() {
  if (sandTimer) {
    clearInterval(sandTimer);
    sandTimer = null;
  }
  sandGrains = [];
  sandSpawnCounter = 0;
  sandLayer.replaceChildren();
}

function createSand() {
  stopSand();
  for (let i = 0; i < SAND_INITIAL_COUNT; i++) spawnSandGrain();
  renderSand();
  sandTimer = setInterval(updateSand, SAND_TICK_MS);
}

function spawnSandGrain() {
  if (sandGrains.length >= SAND_MAX_GRAINS) return;

  const leftSide = sandGrains.length % 2 === 0;
  const chamber = leftSide ? SAND_LEFT_CHAMBER : SAND_RIGHT_CHAMBER;
  const bounds = chamber.reduce((result, [x, y]) => ({
    minX: Math.min(result.minX, x), maxX: Math.max(result.maxX, x),
    minY: Math.min(result.minY, y), maxY: Math.max(result.maxY, y)
  }), { minX: 1, maxX: 0, minY: 1, maxY: 0 });
  let x;
  let y;
  let attempts = 0;
  do {
    x = (bounds.minX + Math.random() * (bounds.maxX - bounds.minX)) * mazeWidth;
    y = (0.1 + Math.random() * 0.1) * mazeHeight;
    attempts++;
  } while ((!sandPointInChamber(x, y, chamber) || sandGrainHitsWall(x, y)) && attempts < 80);

  if (!sandPointInChamber(x, y, chamber) || sandGrainHitsWall(x, y)) return;

  const element = document.createElement("span");
  element.className = "sand-grain";
  sandLayer.append(element);
  sandGrains.push({ x, y, element, vx: 0, vy: SAND_FALL_SPEED });
}

function updateSand() {
  if (current !== SAND_PANEL || !mazeReady) {
    stopSand();
    return;
  }

  sandSpawnCounter++;
  if (sandSpawnCounter >= SAND_SPAWN_INTERVAL) {
    for (let i = 0; i < SAND_SPAWN_PER_TICK; i++) spawnSandGrain();
    sandSpawnCounter = 0;
  }

  sandGrains.forEach((grain) => {
    grain.vy = Math.min(6, grain.vy + SAND_GRAVITY);
    moveSandGrain(grain);
  });
  
  resolveSandCollisions();
  sandGrains.forEach(keepSandGrainInsideScreen);
  
  renderSand();
}

function keepSandGrainInsideScreen(grain) {
  const minimumX = SAND_GRAIN_RADIUS;
  const maximumX = mazeWidth - SAND_GRAIN_RADIUS;
  const maximumY = mazeHeight - SAND_GRAIN_RADIUS;

  grain.x = Math.max(minimumX, Math.min(maximumX, grain.x));
  if (grain.y > maximumY) {
    grain.y = maximumY;
    grain.vy = 0;
  }
}

function sandPointInChamber(x, y, chamber) {
  let inside = false;
  for (let i = 0, j = chamber.length - 1; i < chamber.length; j = i++) {
    const [currentX, currentY] = chamber[i];
    const [previousX, previousY] = chamber[j];
    const intersects = ((currentY * mazeHeight > y) !== (previousY * mazeHeight > y))
      && x < ((previousX - currentX) * mazeHeight * (y / mazeHeight - currentY) / (previousY - currentY) + currentX * mazeWidth);
    if (intersects) inside = !inside;
  }
  return inside;
}

function sandPositionAllowed(x, y) {
  if (y < 0) return true;
  if (y >= mazeHeight) {
    return true;
  }
  const isCentralDrain = y >= (242 / 261) * mazeHeight
    && SAND_EXIT_ZONES.some((zone) => x >= zone.left * mazeWidth && x <= zone.right * mazeWidth);
  if (isCentralDrain) return true;
  return sandPointInChamber(x, y, SAND_LEFT_CHAMBER) || sandPointInChamber(x, y, SAND_RIGHT_CHAMBER);
}

function sandGrainHitsWall(x, y) {
  const samples = 8;
  for (let i = 0; i < samples; i++) {
    const angle = (Math.PI * 2 * i) / samples;
    if (!sandPositionAllowed(x + Math.cos(angle) * SAND_GRAIN_RADIUS, y + Math.sin(angle) * SAND_GRAIN_RADIUS)) return true;
  }
  return !sandPositionAllowed(x, y);
}

function moveSandGrain(grain) {
  const nextY = grain.y + grain.vy;
  const nextX = grain.x + grain.vx;

  if (!sandGrainHitsWall(nextX, nextY)) {
    grain.x = nextX;
    grain.y = nextY;
    return;
  }

  grain.vy = 0;
  const towardCenter = grain.x < mazeWidth / 2 ? 1 : -1;
  const slideDirections = [towardCenter, -towardCenter];

  for (const direction of slideDirections) {
    const slideX = grain.x + direction * 1.6;
    const slideY = grain.y + 1.2;
    if (!sandGrainHitsWall(slideX, slideY)) {
      grain.x = slideX;
      grain.y = slideY;
      grain.vy = SAND_FALL_SPEED;
      return;
    }
  }

  for (const direction of slideDirections) {
    const slideX = grain.x + direction * 1.6;
    if (!sandGrainHitsWall(slideX, grain.y)) {
      grain.x = slideX;
      return;
    }
  }
}

function resolveSandCollisions() {
  const minimumDistance = SAND_GRAIN_RADIUS * 2 + 1;
  const cellSize = minimumDistance;
  const collisionPasses = 3;

  for (let pass = 0; pass < collisionPasses; pass++) {
    const buckets = new Map();
    const grainIndexes = new Map(sandGrains.map((grain, index) => [grain, index]));

    sandGrains.forEach((grain) => {
      const cellX = Math.floor(grain.x / cellSize);
      const cellY = Math.floor(grain.y / cellSize);
      const key = `${cellX},${cellY}`;
      const bucket = buckets.get(key) || [];
      bucket.push(grain);
      buckets.set(key, bucket);
    });

    sandGrains.forEach((first) => {
      const firstCellX = Math.floor(first.x / cellSize);
      const firstCellY = Math.floor(first.y / cellSize);
      const firstIndex = grainIndexes.get(first);

      for (let offsetY = -1; offsetY <= 1; offsetY++) {
        for (let offsetX = -1; offsetX <= 1; offsetX++) {
          const bucket = buckets.get(`${firstCellX + offsetX},${firstCellY + offsetY}`) || [];
          bucket.forEach((second) => {
            if (grainIndexes.get(second) <= firstIndex) return;

            const deltaX = second.x - first.x;
            const deltaY = second.y - first.y;
            const distance = Math.hypot(deltaX, deltaY);
            const safeDistance = Math.max(distance, 0.01);
            if (distance >= minimumDistance) return;

            const directionX = distance === 0 ? 1 : deltaX / safeDistance;
            const directionY = distance === 0 ? 0 : deltaY / safeDistance;
            const push = (minimumDistance - distance) / 2;
            const firstX = first.x - directionX * push;
            const firstY = first.y - directionY * push;
            const secondX = second.x + directionX * push;
            const secondY = second.y + directionY * push;

            if (!sandGrainHitsWall(firstX, firstY) && !sandGrainHitsWall(secondX, secondY)) {
              first.x = firstX;
              first.y = firstY;
              second.x = secondX;
              second.y = secondY;
            }
          });
        }
      }
    });
  }
}

function renderSand() {
  sandGrains.forEach((grain) => positionElementAtImageCoordinates(grain.element, grain.x, grain.y));
}

// ==========================================
// CONVERSÃO E POSICIONAMENTO DA TELA
// ==========================================
function getImageCoordinates(clientX, clientY) {
  const layout = getImageLayout();
  if (!layout) return null;
  const x = (clientX - layout.rect.left - layout.offsetX) / layout.scale;
  const y = (clientY - layout.rect.top - layout.offsetY) / layout.scale;
  return { x, y, scale: layout.scale };
}

function getImageLayout() {
  const rect = img.getBoundingClientRect();
  const naturalWidth = img.naturalWidth;
  const naturalHeight = img.naturalHeight;
  if (!naturalWidth || !naturalHeight || !rect.width || !rect.height) return null;
  
  const scale = Math.min(rect.width / naturalWidth, rect.height / naturalHeight);
  return {
    rect,
    scale,
    offsetX: (rect.width - naturalWidth * scale) / 2,
    offsetY: (rect.height - naturalHeight * scale) / 2
  };
}

function positionElementAtImageCoordinates(element, imageX, imageY) {
  const layout = getImageLayout();
  if (!layout) return;
  
  const stageRect = stage.getBoundingClientRect();
  const x = layout.rect.left - stageRect.left + layout.offsetX + imageX * layout.scale;
  const y = layout.rect.top - stageRect.top + layout.offsetY + imageY * layout.scale;
  
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
}

function positionPlayer(imageX, imageY) {
  const layout = getImageLayout();
  if (!layout) {
    if (isChallengePanel()) requestAnimationFrame(() => positionPlayer(imageX, imageY));
    return;
  }
  positionElementAtImageCoordinates(mazePlayer, imageX, imageY);
}

// ==========================================
// LÓGICA DE COLISÃO DO JOGADOR
// ==========================================

function isWall(x, y) {
  // Saiu dos limites da imagem inteira
  if (x < 0 || x >= mazeWidth || y < 0 || y >= mazeHeight) return true;

  // Sem a grade de colisão (ex.: falha ao ler os pixels), não bloqueia
  // para não travar o jogo — mas nesse caso vale checar o console.
  if (!wallGrid) return false;

  const cellCol = (x / WALL_CELL) | 0;
  const cellRow = (y / WALL_CELL) | 0;
  if (cellCol < 0 || cellCol >= wallGridCols || cellRow < 0 || cellRow >= wallGridRows) return true;

  return wallGrid[cellRow * wallGridCols + cellCol] === 1;
}

function playerHitsWall(x, y, radius) {
  const samples = 16; 
  for (let i = 0; i < samples; i++) {
    const angle = (Math.PI * 2 * i) / samples;
    const testX = x + Math.cos(angle) * radius;
    const testY = y + Math.sin(angle) * radius;
    if (isWall(testX, testY)) return true;
  }
  return isWall(x, y);
}

function playerHitsSand(x, y, radius) {
  const collisionRadius = radius + SAND_GRAIN_RADIUS;
  return sandGrains.some((grain) => Math.hypot(grain.x - x, grain.y - y) <= collisionRadius);
}

function segmentHitsWall(fromX, fromY, toX, toY, radius) {
  const distance = Math.hypot(toX - fromX, toY - fromY);
  const steps = Math.max(1, Math.ceil(distance / 5)); 
  
  for (let i = 1; i <= steps; i++) {
    const progress = i / steps;
    const x = fromX + (toX - fromX) * progress;
    const y = fromY + (toY - fromY) * progress;
    
    if (playerHitsWall(x, y, radius) || playerHitsSand(x, y, radius)) return true;
  }
  return false;
}

// ==========================================
// CONDIÇÕES DE VITÓRIA / DERROTA
// ==========================================
function reachedMazeEnd(x, y) {
  if (current === SAND_PANEL) {
    const reachedExit = SAND_EXIT_ZONES.some((zone) => x >= zone.left * mazeWidth && x <= zone.right * mazeWidth);
    return reachedExit && y >= mazeHeight - PLAYER_RADIUS;
  }
  return y >= mazeHeight - PLAYER_RADIUS;
}

function sandBlocksExit(x, y) {
  return sandGrains.some((grain) => Math.hypot(grain.x - x, grain.y - y) <= PLAYER_RADIUS + SAND_GRAIN_RADIUS);
}

function triggerGameOver() {
  if (mazeCompleted) return;
  mazeDragging = false;
  mazePlayer.classList.remove("dragging");
  
  setTimeout(() => {
    window.location.href = "gameover.html";
  }, 100);
}

function completeMaze() {
  if (mazeCompleted) return;
  mazeCompleted = true;
  mazeDragging = false;
  mazePlayer.classList.remove("dragging");
  
  setTimeout(() => {
    if (current === SAND_PANEL) {
      img.classList.add("fade-out");
      current = panels.length - 1;
      img.src = panels[current];
      updateUI();
      requestAnimationFrame(() => img.classList.remove("fade-out"));
      return;
    }
    navigate(1);
  }, 350);
}

// ==========================================
// CONTROLES INTERATIVOS
// ==========================================
function moveMazePlayer(clientX, clientY) {
  if (!isChallengePanel() || !mazeDragging || !mazeReady || mazeCompleted) return;
  
  const coordinates = getImageCoordinates(clientX, clientY);
  if (!coordinates) return;
  
  const { x, y, scale } = coordinates;
  const radius = PLAYER_RADIUS / scale;
  
  if (reachedMazeEnd(x, y)) {
    mazeLastPosition = { x, y };
    positionPlayer(x, y);
    completeMaze();
    return;
  }
  
  if (sandBlocksExit(x, y) || x < 0 || y < 0 || x >= mazeWidth || y >= mazeHeight) {
    triggerGameOver();
    return;
  }
  
  if (mazeLastPosition && segmentHitsWall(mazeLastPosition.x, mazeLastPosition.y, x, y, radius)) {
    triggerGameOver();
    return;
  }
  
  mazeLastPosition = { x, y };
  positionPlayer(x, y);
}

mazePlayer.addEventListener("pointerdown", (event) => {
  if (!isChallengePanel() || !mazeReady || mazeCompleted) return;
  
  mazeDragging = true;
  mazePlayer.classList.add("dragging");
  
  const challengeStart = getChallengeStart();
  mazeLastPosition = { x: challengeStart.x, y: challengeStart.y };
  
  try { mazePlayer.setPointerCapture(event.pointerId); } catch (error) {}
  event.preventDefault();
});

mazePlayer.addEventListener("pointermove", (event) => {
  if (!mazeDragging) return;
  moveMazePlayer(event.clientX, event.clientY);
  event.preventDefault();
});

function stopMazeDragging(event) {
  mazeDragging = false;
  mazePlayer.classList.remove("dragging");
  try { mazePlayer.releasePointerCapture(event.pointerId); } catch (error) {}
}

mazePlayer.addEventListener("pointerup", stopMazeDragging);
mazePlayer.addEventListener("pointercancel", stopMazeDragging);

// ==========================================
// RENDERIZAÇÃO DA INTERFACE (TEXTOS E CENA)
// ==========================================
function updatePanelText() {
  panelText.className = "comic-text";
  const text = panelTexts[current] || "";
  
  if (current === 0 || !text) {
    panelText.textContent = "";
    return;
  }
  
  panelText.innerHTML = text.replace(/\n/g, "<br>");
  panelText.classList.add(`text-panel-${current + 1}`);
  panelText.classList.add("visible");
}

function updateUI() {
  btnPrev.classList.toggle("hidden", current === 0);
  btnNext.classList.toggle("hidden", current === panels.length - 1);
  counter.textContent = `${current + 1} / ${panels.length}`;
  stage.classList.toggle("show-first-text", current === 0);
  stage.classList.toggle("maze-active", isChallengePanel());
  
  updatePanelText();
  
  if (isChallengePanel()) {
    prepareMaze();
  } else {
    mazeDragging = false;
    mazeCompleted = false;
    mazeReady = false;
    wallGrid = null;
    stopSand();
  }
}

function navigate(direction) {
  if (mazeDragging) return;
  const next = current + direction;
  if (next < 0 || next >= panels.length) return;
  
  img.classList.add("fade-out");
  setTimeout(() => {
    current = next;
    img.src = panels[current];
    updateUI();
    requestAnimationFrame(() => img.classList.remove("fade-out"));
  }, 350);
}

// ==========================================
// EVENTOS DE DISPARO
// ==========================================
btnPrev.addEventListener("click", () => navigate(-1));
btnNext.addEventListener("click", () => navigate(1));

document.addEventListener("keydown", (event) => {
  if (isChallengePanel()) return; 
  if (event.key === "ArrowRight") navigate(1);
  if (event.key === "ArrowLeft") navigate(-1);
});

function refreshMazePlayerPosition() {
  if (isChallengePanel() && mazeReady && mazeLastPosition) {
    positionPlayer(mazeLastPosition.x, mazeLastPosition.y);
  }
}

if (typeof ResizeObserver !== "undefined") {
  const stageResizeObserver = new ResizeObserver(refreshMazePlayerPosition);
  stageResizeObserver.observe(stage);
} else {
  window.addEventListener("resize", refreshMazePlayerPosition);
}

window.addEventListener("orientationchange", () => requestAnimationFrame(refreshMazePlayerPosition));

// ==========================================
// INICIALIZAÇÃO START
// ==========================================
img.src = panels[0];
updateUI();