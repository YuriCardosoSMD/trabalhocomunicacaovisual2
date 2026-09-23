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
  "assets/trueending.gif"
];

const panelTexts = {
  0: "",
  1: "Você usa \nquase as \nmesmas \nroupas",
  2: "Seu\nolhar\nanda\ncansado",
  3: "Desde então\nmuito tempo \nse passou",
  4: "Tempo o suficiente \npara lembrar o porquê \nnão nos falamos",
  5: "Tempo \no \nsuficiente \npara \nlembrar\ndas \ntardes \nque \no \nsilêncio \nnão \nexistia",
  6: "Não \ndeixo \nde \npensar \nna \ntragédia\ndo \npassado",
  7: "O \nsilêncio \nseria \nbrutalmente\nassassinado",
  8: "Mostraríamos os dentes e\nberraríamos como hienas",
  9: "Que bom que agora nos resta\no silêncio e...",
  10: "Nossos dentes estão escondidos\npelo cansaço..."
};

// ==========================================
// VARIÁVEIS DE CONTROLE E ELEMENTOS DOM
// ==========================================
let current = 0;

const stage = document.getElementById("hq-stage");
const img = document.getElementById("panel-img");
const btnPrev = document.getElementById("btn-prev");
const btnNext = document.getElementById("btn-next");
const counter = document.getElementById("page-counter");
const panelText = document.getElementById("panel-text");
const mazePlayer = document.getElementById("maze-player");
const sandLayer = document.getElementById("sand-layer");

// ==========================================
// CONFIGURAÇÕES DOS DESAFIOS (QUADRINHOS)
// ==========================================
const MAZE_PANEL = 5;       // Quad 6 (Algas)
const SAND_PANEL = 6;       // Quad 7 (Ampulheta areia preta)
const BLOOD_PANEL = 7;      // Quad 8 (Ampulheta sangue vermelho)
const TEETH_PANEL = 8;      // Quad 9 (Dentes)
const DARK_MAZE_PANEL = 9;  // Quad 10 (Labirinto escuro com lâmpadas)

// Posições Iniciais
const MAZE_START = { x: 385, y: 45 };
const SAND_START = { x: 177.5, y: 18 };
const DARK_MAZE_START = { x: 190, y: 40 };

// Quad 9 (Dentes): Início na lacuna superior direita
const TEETH_START_RATIO = { x: 0.73, y: 0.055 };

const DARK_MAZE_LAMPS = [
  { x: 601, y: 97,  radius: 260 },
  { x: 150, y: 220, radius: 260 },
  { x: 330, y: 400, radius: 260 }
];

let lampStates = DARK_MAZE_LAMPS.map(() => ({ lit: false }));
const PLAYER_RADIUS = 3;

let mazeWidth = 0;
let mazeHeight = 0;
let mazeReady = false;
let mazeDragging = false;
let mazeCompleted = false;
let mazeLastPosition = null;

// ==========================================
// FÍSICA E PARTÍCULAS (AREIA E SANGUE)
// ==========================================
let sandGrains = [];
let sandTimer = null;
let sandSpawnCounter = 0;

const SAND_TICK_MS = 60;
const SAND_GRAIN_RADIUS = 3.5;
const BLOOD_GRAIN_RADIUS = 4.5;
const SAND_SPAWN_WALL_MARGIN = 3;
const SAND_FALL_SPEED = 0.45;
const SAND_GRAVITY = 0.22;
const SAND_INITIAL_COUNT = 24;
const SAND_SPAWN_PER_TICK = 1;
const SAND_SPAWN_INTERVAL = 4;
const SAND_MAX_GRAINS = 1200;

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
const WALL_CELL = 8;
const WALL_DENSITY_THRESHOLD = 0.35;

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
    console.warn("Não foi possível ler os pixels do quadrinho para calcular colisão.", error);
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

function isChallengePanel() {
  return (
    current === MAZE_PANEL ||
    current === SAND_PANEL ||
    current === BLOOD_PANEL ||
    current === TEETH_PANEL ||
    current === DARK_MAZE_PANEL
  );
}

function isParticlePanel() {
  return (current === SAND_PANEL || current === BLOOD_PANEL);
}

function getChallengeStart() {
  if (current === SAND_PANEL || current === BLOOD_PANEL) {
    const scaleFactorX = mazeWidth ? mazeWidth / 355 : 1;
    const scaleFactorY = mazeHeight ? mazeHeight / 261 : 1;
    return { x: SAND_START.x * scaleFactorX, y: SAND_START.y * scaleFactorY };
  }
  if (current === TEETH_PANEL) {
    return {
      x: (mazeWidth || 720) * TEETH_START_RATIO.x,
      y: (mazeHeight || 500) * TEETH_START_RATIO.y
    };
  }
  if (current === DARK_MAZE_PANEL) return DARK_MAZE_START;
  return MAZE_START;
}

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

  if (isParticlePanel()) {
    createSand();
  } else {
    stopSand();
  }

  if (current === DARK_MAZE_PANEL) {
    initDarkMaze();
  } else {
    teardownDarkMaze();
  }

  const challengeStart = getChallengeStart();
  mazeLastPosition = { x: challengeStart.x, y: challengeStart.y };
  requestAnimationFrame(() => {
    positionPlayer(challengeStart.x, challengeStart.y);
  });
}

// ==========================================
// LÓGICA DE AREIA, SANGUE E LÍQUIDO
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
  const isBlood = (current === BLOOD_PANEL);
  const grainRadius = isBlood ? BLOOD_GRAIN_RADIUS : SAND_GRAIN_RADIUS;

  const bounds = chamber.reduce((result, [x, y]) => ({
    minX: Math.min(result.minX, x), maxX: Math.max(result.maxX, x),
    minY: Math.min(result.minY, y), maxY: Math.max(result.maxY, y)
  }), { minX: 1, maxX: 0, minY: 1, maxY: 0 });

  let x, y, attempts = 0;
  do {
    x = (bounds.minX + Math.random() * (bounds.maxX - bounds.minX)) * mazeWidth;
    y = (0.08 + Math.random() * 0.12) * mazeHeight;
    attempts++;
  } while ((!sandPointInChamber(x, y, chamber) || sandGrainHitsWall(x, y, grainRadius + SAND_SPAWN_WALL_MARGIN)) && attempts < 80);

  if (!sandPointInChamber(x, y, chamber) || sandGrainHitsWall(x, y, grainRadius + SAND_SPAWN_WALL_MARGIN)) return;

  const element = document.createElement("span");
  element.className = isBlood ? "sand-grain blood-grain" : "sand-grain";
  sandLayer.append(element);

  sandGrains.push({
    x,
    y,
    element,
    radius: grainRadius,
    vx: isBlood ? (Math.random() - 0.5) * 0.3 : 0,
    vy: isBlood ? 0.6 : SAND_FALL_SPEED
  });
}

function updateSand() {
  if (!isParticlePanel() || !mazeReady) {
    stopSand();
    return;
  }

  sandSpawnCounter++;
  if (sandSpawnCounter >= SAND_SPAWN_INTERVAL) {
    for (let i = 0; i < SAND_SPAWN_PER_TICK; i++) spawnSandGrain();
    sandSpawnCounter = 0;
  }

  const isBlood = (current === BLOOD_PANEL);

  sandGrains.forEach((grain) => {
    grain.vy = Math.min(isBlood ? 5.2 : 6, grain.vy + SAND_GRAVITY);
    moveSandGrain(grain);
  });

  resolveSandCollisions();
  sandGrains.forEach(keepSandGrainInsideScreen);
  renderSand();
}

function keepSandGrainInsideScreen(grain) {
  const r = grain.radius || SAND_GRAIN_RADIUS;
  const minimumX = r;
  const maximumX = mazeWidth - r;
  const maximumY = mazeHeight - r;

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
  if (y >= mazeHeight) return true;

  const isCentralDrain = y >= (242 / 261) * mazeHeight
    && SAND_EXIT_ZONES.some((zone) => x >= zone.left * mazeWidth && x <= zone.right * mazeWidth);

  if (isCentralDrain) return true;
  return sandPointInChamber(x, y, SAND_LEFT_CHAMBER) || sandPointInChamber(x, y, SAND_RIGHT_CHAMBER);
}

function sandGrainHitsWall(x, y, radius = SAND_GRAIN_RADIUS) {
  const samples = 8;
  for (let i = 0; i < samples; i++) {
    const angle = (Math.PI * 2 * i) / samples;
    if (!sandPositionAllowed(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius)) return true;
  }
  return !sandPositionAllowed(x, y);
}

function moveSandGrain(grain) {
  const nextY = grain.y + grain.vy;
  const nextX = grain.x + grain.vx;
  const r = grain.radius || SAND_GRAIN_RADIUS;

  if (!sandGrainHitsWall(nextX, nextY, r)) {
    grain.x = nextX;
    grain.y = nextY;
    return;
  }

  if (!sandGrainHitsWall(grain.x + grain.vx, grain.y, r)) {
    grain.x += grain.vx;
  }

  grain.vy = 0;
  if (nextY > mazeHeight - r) {
    grain.y = mazeHeight - r;
  }
}

function resolveSandCollisions() {
  const isBlood = (current === BLOOD_PANEL);
  const baseRadius = isBlood ? BLOOD_GRAIN_RADIUS : SAND_GRAIN_RADIUS;
  const minimumDistance = baseRadius * 2;
  const cellSize = minimumDistance + 1;
  const collisionPasses = isBlood ? 4 : 3;

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

            const combinedRadius = (first.radius || baseRadius) + (second.radius || baseRadius);

            if (distance >= combinedRadius) return;

            const directionX = distance === 0 ? 1 : deltaX / safeDistance;
            const directionY = distance === 0 ? 0 : deltaY / safeDistance;
            const push = (combinedRadius - distance) / 2;

            if (isBlood) {
              const horizontalDirection = first.x <= second.x ? 1 : -1;
              const lateralSpread = Math.max(push * 1.5, 0.7);

              const sepX1 = first.x - horizontalDirection * lateralSpread;
              const sepX2 = second.x + horizontalDirection * lateralSpread;
              const sepY1 = first.y - directionY * (push * 0.4);
              const sepY2 = second.y + directionY * (push * 0.4);

              if (!sandGrainHitsWall(sepX1, sepY1, first.radius) && !sandGrainHitsWall(sepX2, sepY2, second.radius)) {
                first.x = sepX1; first.y = sepY1;
                second.x = sepX2; second.y = sepY2;
                return;
              }
            }

            const firstX = first.x - directionX * push;
            const firstY = first.y - directionY * push;
            const secondX = second.x + directionX * push;
            const secondY = second.y + directionY * push;

            if (!sandGrainHitsWall(firstX, firstY, first.radius) && !sandGrainHitsWall(secondX, secondY, second.radius)) {
              first.x = firstX; first.y = firstY;
              second.x = secondX; second.y = secondY;
              return;
            }

            const horizontalDirection = first.x <= second.x ? 1 : -1;
            const horizontalPush = Math.max(push, 0.8);
            const separatedFirstX = first.x - horizontalDirection * horizontalPush;
            const separatedSecondX = second.x + horizontalDirection * horizontalPush;

            if (!sandGrainHitsWall(separatedFirstX, first.y, first.radius) && !sandGrainHitsWall(separatedSecondX, second.y, second.radius)) {
              first.x = separatedFirstX;
              second.x = separatedSecondX;
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
// CÁLCULOS DE POSICIONAMENTO E COORDENADAS
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
    rect, scale,
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
// TESTES DE COLISÃO DO JOGADOR
// ==========================================
function isWall(x, y) {
  if (x < 0 || x >= mazeWidth || y < 0 || y >= mazeHeight) return true;
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
  if (!isParticlePanel()) return false;
  return sandGrains.some((grain) => {
    const collisionRadius = radius + (grain.radius || SAND_GRAIN_RADIUS);
    return Math.hypot(grain.x - x, grain.y - y) <= collisionRadius;
  });
}

function segmentHitsWall(fromX, fromY, toX, toY, radius) {
  const distance = Math.hypot(toX - fromX, toY - fromY);
  const steps = Math.max(1, Math.ceil(distance / 4));

  for (let i = 1; i <= steps; i++) {
    const progress = i / steps;
    const x = fromX + (toX - fromX) * progress;
    const y = fromY + (toY - fromY) * progress;
    if (playerHitsWall(x, y, radius) || playerHitsSand(x, y, radius)) return true;
  }
  return false;
}

function reachedMazeEnd(x, y) {
  // Ampulhetas (Quad 7 e 8): precisam sair pelo bocal central inferior
  if (current === SAND_PANEL || current === BLOOD_PANEL) {
    const reachedExit = SAND_EXIT_ZONES.some((zone) => x >= zone.left * mazeWidth && x <= zone.right * mazeWidth);
    return reachedExit && y >= mazeHeight - PLAYER_RADIUS;
  }
  
  // Todos os labirintos (incluindo o Quadrinho 9 - Dentes): basta alcançar a base da tela
  return y >= mazeHeight - PLAYER_RADIUS;
}

function sandBlocksExit(x, y) {
  if (!isParticlePanel()) return false;
  return sandGrains.some((grain) => {
    const r = grain.radius || SAND_GRAIN_RADIUS;
    return Math.hypot(grain.x - x, grain.y - y) <= PLAYER_RADIUS + r;
  });
}

function triggerGameOver() {
  if (mazeCompleted) return;
  mazeDragging = false;
  mazePlayer.classList.remove("dragging");
  setTimeout(() => {
    window.location.href = "fakeending.html";
  }, 100);
}

function completeMaze() {
  if (mazeCompleted) return;
  mazeCompleted = true;
  mazeDragging = false;
  mazePlayer.classList.remove("dragging");
  setTimeout(() => {
    navigate(1);
  }, 350);
}

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

// ==========================================
// EVENTOS DE ARRASTAR (POINTER EVENTS)
// ==========================================
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
// NAVEGAÇÃO E ATUALIZAÇÃO DE INTERFACE
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
  stage.classList.toggle("dark-maze-active", current === DARK_MAZE_PANEL);

  updatePanelText();

  if (isChallengePanel()) {
    prepareMaze();
  } else {
    mazeDragging = false;
    mazeCompleted = false;
    mazeReady = false;
    wallGrid = null;
    stopSand();
    teardownDarkMaze();
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
    updateSoundtrack();
    requestAnimationFrame(() => img.classList.remove("fade-out"));
  }, 350);
}

btnPrev.addEventListener("click", () => navigate(-1));
btnNext.addEventListener("click", () => navigate(1));

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") navigate(1);
  if (event.key === "ArrowLeft") navigate(-1);
});

function refreshMazePlayerPosition() {
  if (isChallengePanel() && mazeReady && mazeLastPosition) {
    positionPlayer(mazeLastPosition.x, mazeLastPosition.y);
  }
  if (current === DARK_MAZE_PANEL) repositionDarkMazeElements();
}

if (typeof ResizeObserver !== "undefined") {
  const stageResizeObserver = new ResizeObserver(refreshMazePlayerPosition);
  stageResizeObserver.observe(stage);
} else {
  window.addEventListener("resize", refreshMazePlayerPosition);
}

window.addEventListener("orientationchange", () => requestAnimationFrame(refreshMazePlayerPosition));

// ==========================================
// LABIRINTO ESCURO (QUAD 10) - CANVAS
// ==========================================
let darkOverlay = null;
let lampElements = [];

function initDarkMaze() {
  lampStates = DARK_MAZE_LAMPS.map(() => ({ lit: false }));
  teardownDarkMaze();

  darkOverlay = document.createElement("canvas");
  darkOverlay.id = "dark-overlay";
  stage.appendChild(darkOverlay);

  lampElements = DARK_MAZE_LAMPS.map((lamp, i) => {
    const el = document.createElement("div");
    el.className = "lamp-hitbox";
    el.setAttribute("aria-label", "Lâmpada – clique para acender");
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.dataset.index = i;
    el.addEventListener("click", () => toggleLamp(i));
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") toggleLamp(i); });
    stage.appendChild(el);
    return el;
  });

  requestAnimationFrame(repositionDarkMazeElements);
}

function teardownDarkMaze() {
  if (darkOverlay) { darkOverlay.remove(); darkOverlay = null; }
  lampElements.forEach(el => el.remove());
  lampElements = [];
}

function toggleLamp(index) {
  if (!lampStates[index]) return;
  lampStates[index].lit = !lampStates[index].lit;
  updateDarkOverlay();
}

function updateDarkOverlay() {
  if (!darkOverlay || current !== DARK_MAZE_PANEL) return;
  const layout = getImageLayout();
  if (!layout) return;

  const stageRect = stage.getBoundingClientRect();
  const stageW = stageRect.width;
  const stageH = stageRect.height;

  if (darkOverlay.width !== stageW || darkOverlay.height !== stageH) {
    darkOverlay.width = stageW;
    darkOverlay.height = stageH;
  }

  const ctx = darkOverlay.getContext("2d");
  ctx.clearRect(0, 0, stageW, stageH);
  ctx.fillStyle = "rgba(0, 0, 0, 0.96)";
  ctx.fillRect(0, 0, stageW, stageH);

  const getLampCoords = (lamp) => {
    const cx = layout.rect.left - stageRect.left + layout.offsetX + lamp.x * layout.scale;
    const cy = layout.rect.top - stageRect.top + layout.offsetY + lamp.y * layout.scale;
    return { cx, cy };
  };

  DARK_MAZE_LAMPS.forEach((lamp, i) => {
    const { cx, cy } = getLampCoords(lamp);
    const isLit = lampStates[i].lit;
    const radius = isLit ? lamp.radius * layout.scale : 80 * layout.scale;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);

    if (isLit) {
      gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
      gradient.addColorStop(0.6, "rgba(0, 0, 0, 0.4)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    } else {
      gradient.addColorStop(0, "rgba(0, 0, 0, 0.5)");
      gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.1)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    }

    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalCompositeOperation = "source-over";
}

function repositionDarkMazeElements() {
  if (current !== DARK_MAZE_PANEL) return;
  const layout = getImageLayout();
  if (!layout) { requestAnimationFrame(repositionDarkMazeElements); return; }

  const stageRect = stage.getBoundingClientRect();
  DARK_MAZE_LAMPS.forEach((lamp, i) => {
    const el = lampElements[i];
    if (!el) return;
    const cx = layout.rect.left - stageRect.left + layout.offsetX + lamp.x * layout.scale;
    const cy = layout.rect.top - stageRect.top + layout.offsetY + lamp.y * layout.scale;
    el.style.left = `${cx}px`;
    el.style.top  = `${cy}px`;
  });
  updateDarkOverlay();
}

// ==========================================
// TRILHA SONORA
// ==========================================
const hqAudio = document.getElementById("hq-audio");
const audioToggle = document.getElementById("audio-toggle");
let audioEnabled = true;

function isSilentPanel(panelIndex) {
  return false;
}

function updateAudioUI() {
  if (!audioToggle) return;
  audioToggle.setAttribute("aria-pressed", String(audioEnabled));
  audioToggle.setAttribute("aria-label", audioEnabled ? "Desativar trilha sonora" : "Ativar trilha sonora");
}

async function updateSoundtrack() {
  if (!hqAudio || !audioEnabled) return;
  try {
    await hqAudio.play();
  } catch (error) {
    console.warn("O navegador bloqueou a reprodução automática da trilha.", error);
  }
  updateAudioUI();
}

if (audioToggle && hqAudio) {
  audioToggle.addEventListener("click", async () => {
    audioEnabled = !audioEnabled;
    if (!audioEnabled) {
      hqAudio.pause();
      hqAudio.currentTime = 0;
    } else {
      try { await hqAudio.play(); } catch (error) { console.warn("Não foi possível iniciar a trilha.", error); }
    }
    updateAudioUI();
  });
  hqAudio.addEventListener("play", updateAudioUI);
  hqAudio.addEventListener("pause", updateAudioUI);
}

// Inicialização
img.src = panels[0];
updateUI();
updateSoundtrack();