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


// ==========================================
// CONFIGURAÇÕES DO LABIRINTO
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


// ==========================================
// POSIÇÃO INICIAL
// ==========================================

const MAZE_START = {
  x: 385,
  y: 45
};


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


// ==========================================
// PREPARA O LABIRINTO
// ==========================================

function prepareMaze() {

  if (current !== MAZE_PANEL) {
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


  mazeLastPosition = {
    x: MAZE_START.x,
    y: MAZE_START.y
  };


  positionPlayer(
    MAZE_START.x,
    MAZE_START.y
  );

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


// ==========================================
// POSICIONA A BOLINHA
// ==========================================

function positionPlayer(
  imageX,
  imageY
) {

  const layout = getImageLayout();


  if (!layout) {
    if (current === MAZE_PANEL) {
      requestAnimationFrame(() => {
        positionPlayer(imageX, imageY);
      });
    }

    return;
  }


  const stageRect =
    stage.getBoundingClientRect();


  const x =
    (
      layout.rect.left -
      stageRect.left +
      layout.offsetX +
      imageX * layout.scale
    );


  const y =
    (
      layout.rect.top -
      stageRect.top +
      layout.offsetY +
      imageY * layout.scale
    );


  mazePlayer.style.left =
    `${x}px`;


  mazePlayer.style.top =
    `${y}px`;

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
  y
) {

  return (
    y >= mazeHeight - PLAYER_RADIUS
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

    Depois:

    current = 5

    navigate(1)

    passa para:

    current = 6

    que corresponde ao
    quadrinho 7.
  */

  setTimeout(() => {

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
    current !== MAZE_PANEL ||
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
      current !== MAZE_PANEL ||
      !mazeReady ||
      mazeCompleted
    ) {
      return;
    }


    mazeDragging = true;


    mazePlayer.classList.add(
      "dragging"
    );


    mazeLastPosition = {
      x: MAZE_START.x,
      y: MAZE_START.y
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
    current === MAZE_PANEL
  );


  /*
    Atualiza os textos.
  */

  updatePanelText();


  /*
    Prepara o labirinto.
  */

  if (
    current === MAZE_PANEL
  ) {

    setTimeout(() => {

      prepareMaze();

    }, 0);

  } else {

    mazeDragging = false;

    mazeCompleted = false;

    mazeReady = false;

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
      current === MAZE_PANEL
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
      current === MAZE_PANEL
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
    current === MAZE_PANEL &&
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