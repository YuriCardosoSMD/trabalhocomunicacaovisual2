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
const PLAYER_RADIUS = 6; // Área de detecção de colisão do jogador

// Configurações do canvas invisível (utilizado para ler colisões com o cenário)
const mazeCanvas = document.createElement("canvas");
const mazeContext = mazeCanvas.getContext("2d", { willReadFrequently: true });
let mazePixels = null;
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
let sandPileHeight = 0;
const SAND_TICK_MS = 120;
const SAND_GRAIN_RADIUS = 3.5;
const SAND_FALL_SPEED = 2.4;
const SAND_PILE_RISE = 0.65;
const SAND_GRAIN_COUNT = 72;
const SAND_SIDE_MARGIN = 18;
const SAND_SIDE_WIDTH = 122;
const SAND_HOLE_Y = 205;
const SAND_HOLE_LEFT_X = 151;
const SAND_HOLE_RIGHT_X = 204;
const SAND_EXIT_ZONES = [{ left: 145, right: 210 }];

// ==========================================
// FUNÇÕES UTILITÁRIAS DE CENA
// ==========================================

// Retorna se o quadrinho atual exige a interação do minigame
function isChallengePanel() {
  return (current === MAZE_PANEL || current === SAND_PANEL);
}

// Retorna as coordenadas iniciais dependendo de qual desafio está ativo
function getChallengeStart() {
  return current === SAND_PANEL ? SAND_START : MAZE_START;
}

// ==========================================
// PREPARAÇÃO DO LABIRINTO (CANVAS INVISÍVEL)
// ==========================================

// Gera um mapa de pixels invisível a partir da imagem atual para calcular colisões com as paredes escuras
function prepareMaze() {
  if (!isChallengePanel()) return;
  
  if (!img.complete || !img.naturalWidth || !img.naturalHeight) {
    setTimeout(prepareMaze, 50);
    return;
  }
  
  mazeWidth = img.naturalWidth;
  mazeHeight = img.naturalHeight;
  
  if (mazeWidth === 0 || mazeHeight === 0) return;
  
  mazeCanvas.width = mazeWidth;
  mazeCanvas.height = mazeHeight;
  mazeContext.clearRect(0, 0, mazeWidth, mazeHeight);
  mazeContext.drawImage(img, 0, 0, mazeWidth, mazeHeight);
  mazePixels = mazeContext.getImageData(0, 0, mazeWidth, mazeHeight).data;
  mazeReady = true;
  mazeCompleted = false;
  
  if (current === SAND_PANEL) {
    createSand();
  } else {
    stopSand();
  }
  
  const challengeStart = getChallengeStart();
  mazeLastPosition = { x: challengeStart.x, y: challengeStart.y };
  positionPlayer(challengeStart.x, challengeStart.y);
}

// ==========================================
// LÓGICA DA AREIA E FÍSICA
// ==========================================

// Interrompe e limpa a renderização da areia
function stopSand() {
  if (sandTimer) {
    clearInterval(sandTimer);
    sandTimer = null;
  }
  sandGrains = [];
  sandPileHeight = 0;
  sandLayer.replaceChildren();
}

// Inicia a geração das partículas de areia
function createSand() {
  stopSand();
  for (let i = 0; i < SAND_GRAIN_COUNT; i++) {
    const leftSide = i % 2 === 0;
    const columnOffset = (i * 37) % 105;
    const x = leftSide ? 28 + columnOffset : mazeWidth - 28 - columnOffset;
    const y = -((i * 53) % 180);
    const element = document.createElement("span");
    element.className = "sand-grain";
    sandLayer.append(element);
    
    sandGrains.push({
      x, y, element, vx: 0, vy: SAND_FALL_SPEED
    });
  }
  renderSand();
  sandTimer = setInterval(updateSand, SAND_TICK_MS);
}

// Atualiza a gravidade e o acúmulo das partículas a cada tick
function updateSand() {
  if (current !== SAND_PANEL || !mazeReady) {
    stopSand();
    return;
  }
  
  sandPileHeight = Math.min(mazeHeight * 0.32, sandPileHeight + SAND_PILE_RISE);
  const floorY = mazeHeight - sandPileHeight - 7;
  
  sandGrains.forEach((grain) => {
    grain.vy = Math.min(5.5, grain.vy + 0.18);
    grain.y += grain.vy;
    
    if (grain.y >= SAND_HOLE_Y) {
      const holeX = grain.x < mazeWidth / 2 ? SAND_HOLE_LEFT_X : SAND_HOLE_RIGHT_X;
      const direction = holeX > grain.x ? 1 : -1;
      grain.vx += direction * 0.12;
      grain.vx *= 0.94;
      grain.x += grain.vx;
    }
    
    const atBottomHole = grain.y > mazeHeight - 18 && (Math.abs(grain.x - SAND_HOLE_LEFT_X) < 13 || Math.abs(grain.x - SAND_HOLE_RIGHT_X) < 13);
    
    if (grain.y >= floorY && !atBottomHole) {
      grain.y = floorY;
      grain.vy *= -0.18;
    }
    
    const leftLimit = grain.x < mazeWidth / 2 ? SAND_SIDE_MARGIN : mazeWidth - SAND_SIDE_MARGIN;
    const rightLimit = grain.x < mazeWidth / 2 ? SAND_SIDE_MARGIN + SAND_SIDE_WIDTH : mazeWidth - SAND_SIDE_MARGIN - SAND_SIDE_WIDTH;
    
    if (grain.y < SAND_HOLE_Y) {
      grain.x = grain.x < mazeWidth / 2 
        ? Math.min(rightLimit, Math.max(leftLimit, grain.x)) 
        : Math.max(rightLimit, Math.min(leftLimit, grain.x));
    }
  });
  
  resolveSandCollisions();
  
  sandGrains = sandGrains.filter((grain) => {
    const escapedLeft = grain.x < SAND_HOLE_LEFT_X + 10 && grain.x > SAND_HOLE_LEFT_X - 10 && grain.y > mazeHeight - 4;
    const escapedRight = grain.x < SAND_HOLE_RIGHT_X + 10 && grain.x > SAND_HOLE_RIGHT_X - 10 && grain.y > mazeHeight - 4;
    
    if (escapedLeft || escapedRight) {
      grain.element.remove();
      return false;
    }
    return true;
  });
  
  renderSand();
}

// Afasta as partículas para não se sobreporem umas às outras
function resolveSandCollisions() {
  const minimumDistance = SAND_GRAIN_RADIUS * 2 + 1;
  for (let firstIndex = 0; firstIndex < sandGrains.length; firstIndex++) {
    for (let secondIndex = firstIndex + 1; secondIndex < sandGrains.length; secondIndex++) {
      const first = sandGrains[firstIndex];
      const second = sandGrains[secondIndex];
      const deltaX = second.x - first.x;
      const deltaY = second.y - first.y;
      const distance = Math.hypot(deltaX, deltaY);
      
      if (distance === 0 || distance >= minimumDistance) continue;
      
      const push = (minimumDistance - distance) / distance / 2;
      first.x -= deltaX * push;
      first.y -= deltaY * push;
      second.x += deltaX * push;
      second.y += deltaY * push;
    }
  }
}

// Aplica as posições visuais atualizadas para a areia
function renderSand() {
  sandGrains.forEach((grain) => {
    positionElementAtImageCoordinates(grain.element, grain.x, grain.y);
  });
}

// ==========================================
// CONVERSÃO E POSICIONAMENTO DA TELA (CANVAS VS MOUSE)
// ==========================================

// Mapeia coordenadas reais de clique/toque para o grid da imagem
function getImageCoordinates(clientX, clientY) {
  const layout = getImageLayout();
  if (!layout) return null;
  
  const x = (clientX - layout.rect.left - layout.offsetX) / layout.scale;
  const y = (clientY - layout.rect.top - layout.offsetY) / layout.scale;
  
  return { x, y, scale: layout.scale };
}

// Calcula as escalas e o deslocamento causados pelo "object-fit: contain"
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

// Alinha qualquer elemento DOM (bolinha ou areia) baseado no mapa do labirinto
function positionElementAtImageCoordinates(element, imageX, imageY) {
  const layout = getImageLayout();
  if (!layout) return;
  
  const stageRect = stage.getBoundingClientRect();
  const x = layout.rect.left - stageRect.left + layout.offsetX + imageX * layout.scale;
  const y = layout.rect.top - stageRect.top + layout.offsetY + imageY * layout.scale;
  
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
}

// Atribui a posição específica à bolinha
function positionPlayer(imageX, imageY) {
  const layout = getImageLayout();
  if (!layout) {
    if (isChallengePanel()) {
      requestAnimationFrame(() => positionPlayer(imageX, imageY));
    }
    return;
  }
  positionElementAtImageCoordinates(mazePlayer, imageX, imageY);
}

// ==========================================
// LÓGICA DE COLISÃO DO JOGADOR
// ==========================================

// Identifica se uma coordenada cruza uma parede do labirinto (pixels pretos no canvas)
function isBlackPixel(x, y) {
  if (!mazePixels) return true;
  if (x < 0 || x >= mazeWidth || y < 0 || y >= mazeHeight) return true;
  
  const pixelX = Math.floor(x);
  const pixelY = Math.floor(y);
  const index = (pixelY * mazeWidth + pixelX) * 4;
  const red = mazePixels[index];
  const green = mazePixels[index + 1];
  const blue = mazePixels[index + 2];
  
  return (red < 60 && green < 60 && blue < 60);
}

// Checa bordas e centro da bolinha para validar impacto em paredes
function playerHitsWall(x, y, radius) {
  const samples = 32;
  for (let i = 0; i < samples; i++) {
    const angle = (Math.PI * 2 * i) / samples;
    const testX = x + Math.cos(angle) * radius;
    const testY = y + Math.sin(angle) * radius;
    if (isBlackPixel(testX, testY)) return true;
  }
  return isBlackPixel(x, y);
}

// Checa impacto da bolinha com os grãos de areia
function playerHitsSand(x, y, radius) {
  const collisionRadius = radius + SAND_GRAIN_RADIUS;
  return sandGrains.some((grain) => {
    return Math.hypot(grain.x - x, grain.y - y) <= collisionRadius;
  });
}

// Analisa a linha do movimento rápido do arrasto para garantir que as paredes não sejam atravessadas
function segmentHitsWall(fromX, fromY, toX, toY, radius) {
  const distance = Math.hypot(toX - fromX, toY - fromY);
  const steps = Math.max(1, Math.ceil(distance / 3));
  
  for (let i = 1; i <= steps; i++) {
    const progress = i / steps;
    const x = fromX + (toX - fromX) * progress;
    const y = fromY + (toY - fromY) * progress;
    
    if (playerHitsWall(x, y, radius) || playerHitsSand(x, y, radius)) {
      return true;
    }
  }
  return false;
}

// ==========================================
// CONDIÇÕES DE VITÓRIA / DERROTA
// ==========================================

function reachedMazeEnd(x, y) {
  if (current === SAND_PANEL) {
    const reachedExit = SAND_EXIT_ZONES.some((zone) => x >= zone.left && x <= zone.right);
    return reachedExit && y >= mazeHeight - PLAYER_RADIUS;
  }
  return y >= mazeHeight - PLAYER_RADIUS;
}

function sandBlocksExit(x, y) {
  const isNearExit = current === SAND_PANEL && SAND_EXIT_ZONES.some((zone) => x >= zone.left && x <= zone.right) && y >= mazeHeight - 42;
  return sandPileHeight > 18 && y >= mazeHeight - sandPileHeight - PLAYER_RADIUS && !isNearExit;
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
  
  try {
    mazePlayer.setPointerCapture(event.pointerId);
  } catch (error) {}
  
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
  try {
    mazePlayer.releasePointerCapture(event.pointerId);
  } catch (error) {}
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
    setTimeout(() => prepareMaze(), 0);
  } else {
    mazeDragging = false;
    mazeCompleted = false;
    mazeReady = false;
    stopSand();
  }
}

// Troca central de quadrinhos com transição
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
  if (isChallengePanel()) return; // Bloqueia skip durante o minigame
  if (event.key === "ArrowRight") navigate(1);
  if (event.key === "ArrowLeft") navigate(-1);
});

img.addEventListener("load", () => {
  if (isChallengePanel()) setTimeout(() => prepareMaze(), 0);
});

// Garante o alinhamento correto caso o usuário gire o celular ou mude a tela
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

window.addEventListener("orientationchange", () => {
  requestAnimationFrame(refreshMazePlayerPosition);
});

// ==========================================
// INICIALIZAÇÃO START
// ==========================================
img.src = panels[0];
updateUI();