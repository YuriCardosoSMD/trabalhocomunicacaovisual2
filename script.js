// ==========================================
// IMAGENS DOS QUADRINHOS
// ==========================================

const panels = [

  "assets/quad1.gif",

  "assets/quad2.gif",

  "assets/quad3.gif",

  "assets/quad4.gif",

  "assets/algas7.gif"

];


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
    Os textos "EU", "Tô",
    "Vi" e "LA" aparecem
    somente no primeiro quadrinho.
  */
  stage.classList.toggle(
    "show-first-text",
    current === 0
  );

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
    Impede que o usuário passe
    dos limites da história.
  */
  if (
    next < 0 ||
    next >= panels.length
  ) {
    return;
  }


  /*
    Começa o efeito de desaparecimento.
  */
  img.classList.add(
    "fade-out"
  );


  /*
    Aguarda a animação antes
    de trocar a imagem.
  */
  setTimeout(() => {

    current = next;


    /*
      Troca o arquivo da imagem.
    */
    img.src =
      panels[current];


    /*
      Atualiza botões,
      contador e textos.
    */
    updateUI();


    /*
      Espera um pequeno momento
      antes de mostrar a nova imagem.
    */
    requestAnimationFrame(() => {

      img.classList.remove(
        "fade-out"
      );

    });

  }, 350);

}


// ==========================================
// CLIQUE — QUADRINHO ANTERIOR
// ==========================================

btnPrev.addEventListener(
  "click",
  () => {

    navigate(-1);

  }
);


// ==========================================
// CLIQUE — PRÓXIMO QUADRINHO
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
  Atualiza a interface.
*/
updateUI();