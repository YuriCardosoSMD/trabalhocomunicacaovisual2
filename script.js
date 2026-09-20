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

  /*
    Primeiro quadrinho.

    Os textos "Eu", "te",
    "vi" e "lá" estão
    diretamente no HTML.
  */

  0: "",


  /*
    Quadrinho 2
  */

  1: "Você usa quase as mesmas roupas",


  /*
    Quadrinho 3

    Cada \n representa
    uma nova linha.
  */

  2: "Seu\nolhar\nanda\ncansado",


  /*
    Quadrinho 4
  */

  3: "Desde então\nmuito tempo se passou",


  /*
    Quadrinho 5
  */

  4: "Tempo o suficiente para lembrar\no porquê não nos falamos",


  /*
    Quadrinho 6
  */

  5: "Tempo o suficiente para lembrar\ndas tardes que o silêncio não existia",


  /*
    Quadrinho 7
  */

  6: "Não deixo de pensar na tragédia\ndo passado",


  /*
    Quadrinho 8
  */

  7: "O silêncio seria brutalmente\nassassinado",


  /*
    Quadrinho 9
  */

  8: "Mostraíamos os dentes e\nberraríamos como hienas",


  /*
    Quadrinho 10
  */

  9: "Que bom que agora nos resta\no silêncio e",


  /*
    Quadrinho 11
  */

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


// ==========================================
// ATUALIZA O TEXTO DO QUADRINHO
// ==========================================

function updatePanelText() {

  /*
    Remove todas as classes
    anteriores do texto.
  */

  panelText.className =
    "comic-text";


  /*
    Pega o texto correspondente
    ao quadrinho atual.
  */

  const text =
    panelTexts[current] || "";


  /*
    Se for o primeiro quadrinho,
    não usamos o panel-text.

    Os textos "Eu", "te",
    "vi" e "lá" estão no HTML.
  */

  if (current === 0) {

    panelText.textContent = "";

    return;

  }


  /*
    Se não houver texto cadastrado,
    não mostra nada.
  */

  if (!text) {

    panelText.textContent = "";

    return;

  }


  /*
    ========================================
    PARTE IMPORTANTE
    ========================================

    Transforma cada \n em <br>.

    Exemplo:

    "Seu\nolhar\nanda\ncansado"

    vira:

    Seu
    <br>
    olhar
    <br>
    anda
    <br>
    cansado

    Dessa maneira a quebra de linha
    é obrigatória.
  */

  panelText.innerHTML =
    text.replace(
      /\n/g,
      "<br>"
    );


  /*
    Adiciona a classe específica
    de cada quadrinho.

    current = 1
    → text-panel-2

    current = 2
    → text-panel-3

    etc.
  */

  panelText.classList.add(
    `text-panel-${current + 1}`
  );


  /*
    Torna o texto visível.
  */

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
    Mostra os textos do primeiro
    quadrinho somente nele.
  */

  stage.classList.toggle(
    "show-first-text",
    current === 0
  );


  /*
    Atualiza o texto dos demais
    quadrinhos.
  */

  updatePanelText();

}


// ==========================================
// TROCA DE QUADRINHO
// ==========================================

function navigate(direction) {

  /*
    Calcula qual será o próximo
    quadrinho.
  */

  const next =
    current + direction;


  /*
    Impede ultrapassar os limites
    da história.
  */

  if (
    next < 0 ||
    next >= panels.length
  ) {

    return;

  }


  /*
    Começa o fade-out.
  */

  img.classList.add(
    "fade-out"
  );


  /*
    Aguarda o final da animação
    antes de trocar a imagem.
  */

  setTimeout(() => {

    current = next;


    /*
      Troca a imagem.
    */

    img.src =
      panels[current];


    /*
      Atualiza textos,
      contador e botões.
    */

    updateUI();


    /*
      Mostra novamente
      a nova imagem.
    */

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
      Seta direita:
      próximo quadrinho.
    */

    if (
      event.key ===
      "ArrowRight"
    ) {

      navigate(1);

    }


    /*
      Seta esquerda:
      quadrinho anterior.
    */

    if (
      event.key ===
      "ArrowLeft"
    ) {

      navigate(-1);

    }

  }
);


// ==========================================
// INICIALIZAÇÃO
// ==========================================

/*
  Carrega o primeiro quadrinho.
*/

img.src =
  panels[0];


/*
  Atualiza toda a interface.
*/

updateUI();