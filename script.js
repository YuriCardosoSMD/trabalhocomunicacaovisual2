// ==========================================
// IMAGENS DOS QUADRINHOS
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


// ==========================================
// TEXTOS DOS QUADRINHOS
// ==========================================

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
// QUADRINHO ATUAL
// ==========================================

let current = 0;


// ==========================================
// ELEMENTOS DO HTML
// ==========================================

const stage =
  document.getElementById(
    "hq-stage"
  );


const img =
  document.getElementById(
    "panel-img"
  );


const btnPrev =
  document.getElementById(
    "btn-prev"
  );


const btnNext =
  document.getElementById(
    "btn-next"
  );


const counter =
  document.getElementById(
    "page-counter"
  );


const panelText =
  document.getElementById(
    "panel-text"
  );


const mazePlayer =
  document.getElementById(
    "maze-player"
  );


const sandLayer =
  document.getElementById(
    "sand-layer"
  );


// ==========================================
// CONFIGURAÇÕES DA AMPULHETA
// ==========================================

/*
  O JavaScript começa contando os quadrinhos
  a partir de 0.

  Portanto:

  0 = quadrinho 1
  1 = quadrinho 2
  2 = quadrinho 3
  3 = quadrinho 4
  4 = quadrinho 5
  5 = quadrinho 6
  6 = quadrinho 7
*/

const MAZE_PANEL = 5;

const SAND_PANEL = 6;


// ==========================================
// POSIÇÃO INICIAL
// ==========================================

const MAZE_START = {
  x: 385,
  y: 45
};


const SAND_START = {
  x: 177.5,
  y: 18
};


function isChallengePanel() {
  return (
    current === MAZE_PANEL ||
    current === SAND_PANEL
  );
}


function getChallengeStart() {
  return current === SAND_PANEL
    ? SAND_START
    : MAZE_START;
}


// ==========================================
// TAMANHO DA BOLINHA
// ==========================================
//
// Como a bolinha visual agora possui
// 14px, usamos um raio menor também
// para a detecção de colisão.
//

const PLAYER_RADIUS = 6;


// ==========================================
// CANVAS INVISÍVEL
// ==========================================

const mazeCanvas =
  document.createElement(
    "canvas"
  );


const mazeContext =
  mazeCanvas.getContext(
    "2d",
    {
      willReadFrequently: true
    }
  );


let mazePixels = null;

let mazeWidth = 0;

let mazeHeight = 0;

let mazeReady = false;


// ==========================================
// ESTADO DO JOGADOR
// ==========================================

let mazeDragging = false;

let mazeCompleted = false;

let mazeLastPosition = null;

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

const SAND_EXIT_ZONES = [
  {
    left: 145,
    right: 210
  }
];


// ==========================================
// PREPARA O LABIRINTO
// ==========================================

function prepareMaze() {

  if (!isChallengePanel()) {
    return;
  }


  if (
    !img.complete ||
    !img.naturalWidth ||
    !img.naturalHeight
  ) {

    setTimeout(
      prepareMaze,
      50
    );

    return;
  }


  mazeWidth =
    img.naturalWidth;


  mazeHeight =
    img.naturalHeight;


  if (
    mazeWidth === 0 ||
    mazeHeight === 0
  ) {
    return;
  }


  mazeCanvas.width =
    mazeWidth;

  mazeCanvas.height =
    mazeHeight;


  mazeContext.clearRect(
    0,
    0,
    mazeWidth,
    mazeHeight
  );


  mazeContext.drawImage(
    img,
    0,
    0,
    mazeWidth,
    mazeHeight
  );


  mazePixels =
    mazeContext.getImageData(
      0,
      0,
      mazeWidth,
      mazeHeight
    ).data;


  mazeReady = true;

  mazeCompleted = false;

  if (current === SAND_PANEL) {
    createSand();
  } else {
    stopSand();
  }


  const challengeStart =
    getChallengeStart();


  mazeLastPosition = {
    x: challengeStart.x,
    y: challengeStart.y
  };


  positionPlayer(
    challengeStart.x,
    challengeStart.y
  );

}


// ==========================================
// AREIA DA AMPULHETA
// ==========================================

function stopSand() {

  if (sandTimer) {
    clearInterval(sandTimer);
    sandTimer = null;
  }


  sandGrains = [];
  sandPileHeight = 0;
  sandLayer.replaceChildren();

}


function createSand() {

  stopSand();


  for (
    let i = 0;
    i < SAND_GRAIN_COUNT;
    i++
  ) {

    const leftSide = i % 2 === 0;
    const columnOffset = (i * 37) % 105;
    const x = leftSide
      ? 28 + columnOffset
      : mazeWidth - 28 - columnOffset;
    const y = -((i * 53) % 180);
    const element = document.createElement("span");


    element.className = "sand-grain";
    sandLayer.append(element);


    sandGrains.push({
      x,
      y,
      element,
      vx: 0,
      vy: SAND_FALL_SPEED
    });

  }


  renderSand();

  sandTimer = setInterval(
    updateSand,
    SAND_TICK_MS
  );

}


function updateSand() {

  if (
    current !== SAND_PANEL ||
    !mazeReady
  ) {
    stopSand();
    return;
  }


  sandPileHeight = Math.min(
    mazeHeight * 0.32,
    sandPileHeight + SAND_PILE_RISE
  );


  const floorY =
    mazeHeight - sandPileHeight - 7;


  sandGrains.forEach((grain) => {

    grain.vy = Math.min(
      5.5,
      grain.vy + 0.18
    );

    grain.y += grain.vy;


    if (grain.y >= SAND_HOLE_Y) {
      const holeX = grain.x < mazeWidth / 2
        ? SAND_HOLE_LEFT_X
        : SAND_HOLE_RIGHT_X;
      const direction = holeX > grain.x ? 1 : -1;


      grain.vx += direction * 0.12;
      grain.vx *= 0.94;
      grain.x += grain.vx;
    }


    const atBottomHole =
      grain.y > mazeHeight - 18 &&
      (
        Math.abs(grain.x - SAND_HOLE_LEFT_X) < 13 ||
        Math.abs(grain.x - SAND_HOLE_RIGHT_X) < 13
      );


    if (
      grain.y >= floorY &&
      !atBottomHole
    ) {
      grain.y = floorY;
      grain.vy *= -0.18;
    }


    const leftLimit =
      grain.x < mazeWidth / 2
        ? SAND_SIDE_MARGIN
        : mazeWidth - SAND_SIDE_MARGIN;
    const rightLimit =
      grain.x < mazeWidth / 2
        ? SAND_SIDE_MARGIN + SAND_SIDE_WIDTH
        : mazeWidth - SAND_SIDE_MARGIN - SAND_SIDE_WIDTH;


    if (grain.y < SAND_HOLE_Y) {
      grain.x = grain.x < mazeWidth / 2
        ? Math.min(rightLimit, Math.max(leftLimit, grain.x))
        : Math.max(rightLimit, Math.min(leftLimit, grain.x));
    }

  });


  resolveSandCollisions();


  sandGrains = sandGrains.filter((grain) => {
    const escapedLeft =
      grain.x < SAND_HOLE_LEFT_X + 10 &&
      grain.x > SAND_HOLE_LEFT_X - 10 &&
      grain.y > mazeHeight - 4;
    const escapedRight =
      grain.x < SAND_HOLE_RIGHT_X + 10 &&
      grain.x > SAND_HOLE_RIGHT_X - 10 &&
      grain.y > mazeHeight - 4;


    if (escapedLeft || escapedRight) {
      grain.element.remove();
      return false;
    }


    return true;
  });


  renderSand();

}


function resolveSandCollisions() {

  const minimumDistance =
    SAND_GRAIN_RADIUS * 2 + 1;


  for (
    let firstIndex = 0;
    firstIndex < sandGrains.length;
    firstIndex++
  ) {

    for (
      let secondIndex = firstIndex + 1;
      secondIndex < sandGrains.length;
      secondIndex++
    ) {

      const first = sandGrains[firstIndex];
      const second = sandGrains[secondIndex];
      const deltaX = second.x - first.x;
      const deltaY = second.y - first.y;
      const distance = Math.hypot(deltaX, deltaY);


      if (
        distance === 0 ||
        distance >= minimumDistance
      ) {
        continue;
      }


      const push =
        (minimumDistance - distance) / distance / 2;

      first.x -= deltaX * push;
      first.y -= deltaY * push;
      second.x += deltaX * push;
      second.y += deltaY * push;

    }

  }

}


function renderSand() {

  sandGrains.forEach((grain) => {
    positionElementAtImageCoordinates(
      grain.element,
      grain.x,
      grain.y
    );
  });

}


// ==========================================
// CONVERTE COORDENADAS DO MOUSE
// PARA COORDENADAS DA IMAGEM
// ==========================================

function getImageCoordinates(
  clientX,
  clientY
) {

  const layout = getImageLayout();


  if (!layout) {
    return null;
  }


  const x =
    (
      clientX -
      layout.rect.left -
      layout.offsetX
    ) / layout.scale;


  const y =
    (
      clientY -
      layout.rect.top -
      layout.offsetY
    ) / layout.scale;


  return {
    x,
    y,
    scale: layout.scale
  };

}


// Retorna a area real da imagem dentro do palco, considerando contain.
function getImageLayout() {

  const rect =
    img.getBoundingClientRect();


  const naturalWidth =
    img.naturalWidth;

  const naturalHeight =
    img.naturalHeight;


  if (
    !naturalWidth ||
    !naturalHeight ||
    !rect.width ||
    !rect.height
  ) {
    return null;
  }


  const scale =
    Math.min(
      rect.width / naturalWidth,
      rect.height / naturalHeight
    );


  return {
    rect,
    scale,
    offsetX: (rect.width - naturalWidth * scale) / 2,
    offsetY: (rect.height - naturalHeight * scale) / 2
  };

}


function positionElementAtImageCoordinates(
  element,
  imageX,
  imageY
) {

  const layout = getImageLayout();


  if (!layout) {
    return;
  }


  const stageRect =
    stage.getBoundingClientRect();


  const x =
    layout.rect.left -
    stageRect.left +
    layout.offsetX +
    imageX * layout.scale;


  const y =
    layout.rect.top -
    stageRect.top +
    layout.offsetY +
    imageY * layout.scale;


  element.style.left = `${x}px`;
  element.style.top = `${y}px`;

}


// ==========================================
// POSICIONA A BOLINHA
// ==========================================

function positionPlayer(
  imageX,
  imageY
) {

  const layout = getImageLayout();


  if (!layout) {
    if (isChallengePanel()) {
      requestAnimationFrame(() => {
        positionPlayer(imageX, imageY);
      });
    }

    return;
  }


  positionElementAtImageCoordinates(
    mazePlayer,
    imageX,
    imageY
  );

}


// ==========================================
// VERIFICA SE UM PIXEL É PAREDE
// ==========================================

function isBlackPixel(
  x,
  y
) {

  if (!mazePixels) {
    return true;
  }


  if (
    x < 0 ||
    x >= mazeWidth ||
    y < 0 ||
    y >= mazeHeight
  ) {
    return true;
  }


  const pixelX =
    Math.floor(x);

  const pixelY =
    Math.floor(y);


  const index =
    (
      pixelY *
      mazeWidth +
      pixelX
    ) * 4;


  const red =
    mazePixels[index];


  const green =
    mazePixels[index + 1];


  const blue =
    mazePixels[index + 2];


  return (
    red < 60 &&
    green < 60 &&
    blue < 60
  );

}


// ==========================================
// VERIFICA COLISÃO DA BOLINHA
// ==========================================

function playerHitsWall(
  x,
  y,
  radius
) {

  const samples = 32;


  for (
    let i = 0;
    i < samples;
    i++
  ) {

    const angle =
      (
        Math.PI * 2 * i
      ) / samples;


    const testX =
      x +
      Math.cos(angle) *
      radius;


    const testY =
      y +
      Math.sin(angle) *
      radius;


    if (
      isBlackPixel(
        testX,
        testY
      )
    ) {

      return true;

    }

  }


  /*
    Também verifica o centro.
  */

  if (
    isBlackPixel(
      x,
      y
    )
  ) {

    return true;

  }


  return false;

}


function playerHitsSand(
  x,
  y,
  radius
) {

  const collisionRadius =
    radius + SAND_GRAIN_RADIUS;


  return sandGrains.some((grain) => {
    return Math.hypot(
      grain.x - x,
      grain.y - y
    ) <= collisionRadius;
  });

}


// ==========================================
// VERIFICA O CAMINHO ENTRE DOIS PONTOS
// ==========================================

function segmentHitsWall(
  fromX,
  fromY,
  toX,
  toY,
  radius
) {

  const distance =
    Math.hypot(
      toX - fromX,
      toY - fromY
    );


  const steps =
    Math.max(
      1,
      Math.ceil(
        distance / 3
      )
    );


  for (
    let i = 1;
    i <= steps;
    i++
  ) {

    const progress =
      i / steps;


    const x =
      fromX +
      (
        toX - fromX
      ) *
      progress;


    const y =
      fromY +
      (
        toY - fromY
      ) *
      progress;


    if (
      playerHitsWall(
        x,
        y,
        radius
      ) ||
      playerHitsSand(
        x,
        y,
        radius
      )
    ) {

      return true;

    }

  }


  return false;

}


// ==========================================
// VERIFICA SE CHEGOU AO FINAL
// ==========================================

function reachedMazeEnd(
  x,
  y
) {

  if (current === SAND_PANEL) {
    const reachedExit =
      SAND_EXIT_ZONES.some((zone) => {
        return (
          x >= zone.left &&
          x <= zone.right
        );
      });


    return (
      reachedExit &&
      y >= mazeHeight - PLAYER_RADIUS
    );
  }

  return (
    y >= mazeHeight - PLAYER_RADIUS
  );

}


function sandBlocksExit(
  x,
  y
) {

  const isNearExit =
    current === SAND_PANEL &&
    SAND_EXIT_ZONES.some((zone) => {
      return (
        x >= zone.left &&
        x <= zone.right
      );
    }) &&
    y >= mazeHeight - 42;


  return (
    sandPileHeight > 18 &&
    y >= mazeHeight - sandPileHeight - PLAYER_RADIUS &&
    !isNearExit
  );

}


// ==========================================
// GAME OVER
// ==========================================

function triggerGameOver() {

  if (mazeCompleted) {
    return;
  }


  mazeDragging = false;


  mazePlayer.classList.remove(
    "dragging"
  );


  setTimeout(() => {

    window.location.href =
      "gameover.html";

  }, 100);

}


// ==========================================
// CONCLUIU O LABIRINTO
// ==========================================

function completeMaze() {

  /*
    Impede que a função seja chamada
    várias vezes.
  */

  if (mazeCompleted) {
    return;
  }


  mazeCompleted = true;

  mazeDragging = false;


  mazePlayer.classList.remove(
    "dragging"
  );


  /*
    Pequena pausa para que a chegada
    fique perceptível.

    No quadrinho 7, a conclusão salta para
    algas7.gif para facilitar os testes.
  */

  setTimeout(() => {

    if (current === SAND_PANEL) {
      img.classList.add("fade-out");
      current = panels.length - 1;
      img.src = panels[current];
      updateUI();


      requestAnimationFrame(() => {
        img.classList.remove("fade-out");
      });

      return;
    }


    navigate(1);

  }, 350);

}


// ==========================================
// MOVE A BOLINHA
// ==========================================

function moveMazePlayer(
  clientX,
  clientY
) {

  if (
    !isChallengePanel() ||
    !mazeDragging ||
    !mazeReady ||
    mazeCompleted
  ) {
    return;
  }


  const coordinates =
    getImageCoordinates(
      clientX,
      clientY
    );


  if (!coordinates) {
    return;
  }


  const {
    x,
    y,
    scale
  } = coordinates;


  const radius =
    PLAYER_RADIUS /
    scale;


  /*
    A saída fica na borda inferior.
    Verifica antes de considerar a bolinha fora da imagem.
  */

  if (
    reachedMazeEnd(
      x,
      y
    )
  ) {

    mazeLastPosition = {
      x,
      y
    };


    positionPlayer(
      x,
      y
    );


    completeMaze();

    return;

  }


  if (
    sandBlocksExit(x, y)
  ) {
    triggerGameOver();
    return;
  }


  /*
    Se sair completamente da imagem,
    perde.
  */

  if (
    x < 0 ||
    y < 0 ||
    x >= mazeWidth ||
    y >= mazeHeight
  ) {

    triggerGameOver();

    return;

  }


  /*
    Verifica todo o caminho entre
    a posição anterior e a nova.
  */

  if (
    mazeLastPosition &&
    segmentHitsWall(
      mazeLastPosition.x,
      mazeLastPosition.y,
      x,
      y,
      radius
    )
  ) {

    triggerGameOver();

    return;

  }


  /*
    Atualiza a posição.
  */

  mazeLastPosition = {
    x,
    y
  };


  positionPlayer(
    x,
    y
  );

}


// ==========================================
// COMEÇA O ARRASTO
// ==========================================

mazePlayer.addEventListener(
  "pointerdown",
  (event) => {

    if (
      !isChallengePanel() ||
      !mazeReady ||
      mazeCompleted
    ) {
      return;
    }


    mazeDragging = true;


    mazePlayer.classList.add(
      "dragging"
    );


    const challengeStart =
      getChallengeStart();


    mazeLastPosition = {
      x: challengeStart.x,
      y: challengeStart.y
    };


    try {

      mazePlayer.setPointerCapture(
        event.pointerId
      );

    } catch (error) {

      // Ignora se não houver
      // suporte a pointer capture.

    }


    event.preventDefault();

  }
);


// ==========================================
// MOVIMENTO DO ARRASTO
// ==========================================

mazePlayer.addEventListener(
  "pointermove",
  (event) => {

    if (!mazeDragging) {
      return;
    }


    moveMazePlayer(
      event.clientX,
      event.clientY
    );


    event.preventDefault();

  }
);


// ==========================================
// TERMINA O ARRASTO
// ==========================================

function stopMazeDragging(
  event
) {

  mazeDragging = false;


  mazePlayer.classList.remove(
    "dragging"
  );


  try {

    mazePlayer.releasePointerCapture(
      event.pointerId
    );

  } catch (error) {

    // Ignora caso não exista
    // pointer capture.

  }

}


mazePlayer.addEventListener(
  "pointerup",
  stopMazeDragging
);


mazePlayer.addEventListener(
  "pointercancel",
  stopMazeDragging
);


// ==========================================
// ATUALIZA O TEXTO
// ==========================================

function updatePanelText() {

  panelText.className =
    "comic-text";


  const text =
    panelTexts[current] || "";


  if (current === 0) {

    panelText.textContent = "";

    return;

  }


  if (!text) {

    panelText.textContent = "";

    return;

  }


  panelText.innerHTML =
    text.replace(
      /\n/g,
      "<br>"
    );


  panelText.classList.add(
    `text-panel-${current + 1}`
  );


  panelText.classList.add(
    "visible"
  );

}


// ==========================================
// ATUALIZA A INTERFACE
// ==========================================

function updateUI() {

  /*
    Mostra o botão voltar
    a partir do segundo quadrinho.
  */

  btnPrev.classList.toggle(
    "hidden",
    current === 0
  );


  /*
    Esconde o botão avançar
    no último quadrinho.
  */

  btnNext.classList.toggle(
    "hidden",
    current === panels.length - 1
  );


  /*
    Atualiza o contador.
  */

  counter.textContent =
    `${current + 1} / ${panels.length}`;


  /*
    Textos do primeiro quadrinho.
  */

  stage.classList.toggle(
    "show-first-text",
    current === 0
  );


  /*
    Ativa o modo labirinto
    somente no quadrinho 6.
  */

  stage.classList.toggle(
    "maze-active",
    isChallengePanel()
  );


  /*
    Atualiza os textos.
  */

  updatePanelText();


  /*
    Prepara o labirinto.
  */

  if (
    isChallengePanel()
  ) {

    setTimeout(() => {

      prepareMaze();

    }, 0);

  } else {

    mazeDragging = false;

    mazeCompleted = false;

    mazeReady = false;

    stopSand();

  }

}


// ==========================================
// TROCA DE QUADRINHO
// ==========================================

function navigate(
  direction
) {

  /*
    Durante o arrasto não permite
    mudar manualmente de quadrinho.
  */

  if (mazeDragging) {
    return;
  }


  const next =
    current + direction;


  if (
    next < 0 ||
    next >= panels.length
  ) {

    return;

  }


  img.classList.add(
    "fade-out"
  );


  setTimeout(() => {

    current = next;


    img.src =
      panels[current];


    updateUI();


    requestAnimationFrame(() => {

      img.classList.remove(
        "fade-out"
      );

    });

  }, 350);

}


// ==========================================
// CLIQUE — VOLTAR
// ==========================================

btnPrev.addEventListener(
  "click",
  () => {

    navigate(-1);

  }
);


// ==========================================
// CLIQUE — AVANÇAR
// ==========================================

btnNext.addEventListener(
  "click",
  () => {

    navigate(1);

  }
);


// ==========================================
// CONTROLE PELO TECLADO
// ==========================================

document.addEventListener(
  "keydown",
  (event) => {

    /*
      Durante o labirinto,
      não permite passar de página
      pelas setas.
    */

    if (
      isChallengePanel()
    ) {

      return;

    }


    if (
      event.key ===
      "ArrowRight"
    ) {

      navigate(1);

    }


    if (
      event.key ===
      "ArrowLeft"
    ) {

      navigate(-1);

    }

  }
);


// ==========================================
// QUANDO A IMAGEM TERMINAR DE CARREGAR
// ==========================================

img.addEventListener(
  "load",
  () => {

    if (
      isChallengePanel()
    ) {

      setTimeout(() => {

        prepareMaze();

      }, 0);

    }

  }
);


// Mantem a bolinha alinhada quando o palco muda de tamanho.
function refreshMazePlayerPosition() {

  if (
    isChallengePanel() &&
    mazeReady &&
    mazeLastPosition
  ) {
    positionPlayer(
      mazeLastPosition.x,
      mazeLastPosition.y
    );
  }

}


if (typeof ResizeObserver !== "undefined") {

  const stageResizeObserver =
    new ResizeObserver(
      refreshMazePlayerPosition
    );


  stageResizeObserver.observe(stage);

}


window.addEventListener(
  "resize",
  refreshMazePlayerPosition
);


window.addEventListener(
  "orientationchange",
  () => {

    requestAnimationFrame(
      refreshMazePlayerPosition
    );

  }
);


// ==========================================
// INICIALIZAÇÃO
// ==========================================

img.src =
  panels[0];


updateUI();