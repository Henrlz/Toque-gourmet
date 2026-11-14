/* ===== Tema de Natal =====
   Liga sozinho entre INICIO e FIM e desliga depois — não precisa remover
   nada do site quando as festas acabarem. Para testar fora do período, abra
   a página com ?natal=1 (ou ?natal=0 para ver sem o tema).

   Textos e datas ficam todos aqui em cima, para facilitar a edição. */
(function(){
  var INICIO = { mes: 11, dia: 1 };   // 1º de novembro
  var FIM    = { mes: 1,  dia: 6 };   // 6 de janeiro (Dia de Reis)

  var TEXTOS = {
    faixaExtra: "Encomende para a ceia, o amigo secreto e a confraternização",
    selo: "Edição de Natal",
    presente: "Ideia de presente",
    eventosTitulo: "Natal e fim de ano",
    eventosTexto: "Lembrancinhas para amigo secreto, kits para a confraternização da empresa e baldes para a mesa da ceia. Peça com antecedência para garantir a sua data.",
    rodape: "Boas festas e um Ano Novo cheio de porções de felicidade!"
  };

  function dentroDoPeriodo(hoje){
    var m = hoje.getMonth() + 1, d = hoje.getDate();
    var depoisDoInicio = m > INICIO.mes || (m === INICIO.mes && d >= INICIO.dia);
    var antesDoFim     = m < FIM.mes    || (m === FIM.mes    && d <= FIM.dia);
    // o período atravessa a virada do ano
    return depoisDoInicio || antesDoFim;
  }

  var forcar = (location.search.match(/[?&]natal=([01])/) || [])[1];
  var hoje = new Date();
  var ativo = forcar ? forcar === "1" : dentroDoPeriodo(hoje);
  if(!ativo) return;

  document.documentElement.classList.add("natal");

  function mensagemDoDia(){
    var ano = hoje.getFullYear();
    var m = hoje.getMonth() + 1, d = hoje.getDate();
    if(m === 12 && d === 24) return "<strong>É véspera de Natal!</strong>";
    if(m === 12 && d === 25) return "<strong>Feliz Natal!</strong>";
    if(m === 12 && d > 25)   return "<strong>Boas festas!</strong> Pipoca para a virada do ano";
    if(m === 1)              return "<strong>Feliz Ano Novo!</strong>";
    var natal = new Date(ano, 11, 25);
    var meiaNoite = new Date(ano, hoje.getMonth(), d);
    var faltam = Math.round((natal - meiaNoite) / 86400000);
    return faltam === 1
      ? "<strong>Falta 1 dia</strong> para o Natal"
      : "<strong>Faltam " + faltam + " dias</strong> para o Natal";
  }

  var GORRO_SVG =
    '<svg class="natal-gorro" viewBox="0 0 64 52" aria-hidden="true">' +
      '<path d="M8 40 C10 22 22 8 40 6 C50 5 57 10 58 18 C54 14 48 14 46 20 C44 28 50 34 52 40 Z" fill="#c62a33"/>' +
      '<path d="M8 40 C10 22 22 8 40 6 C34 12 28 24 26 40 Z" fill="#a51f28"/>' +
      '<rect x="3" y="37" width="54" height="12" rx="6" fill="#fff"/>' +
      '<rect x="3" y="43" width="54" height="6" rx="3" fill="#e9e4da"/>' +
      '<circle cx="57" cy="21" r="6.5" fill="#fff"/>' +
      '<circle cx="55.5" cy="19.5" r="2" fill="#f1ede6"/>' +
    '</svg>';

  var ESTRELA_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7.1L12 17.3 5.8 21l1.6-7.1L2 9.2l7.1-.6z"/></svg>';
  var PRESENTE_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7h-2.2A3 3 0 0012 3.8 3 3 0 006.2 7H4a1 1 0 00-1 1v3a1 1 0 001 1h1v8a1 1 0 001 1h12a1 1 0 001-1v-8h1a1 1 0 001-1V8a1 1 0 00-1-1zM15 5a1 1 0 010 2h-2a2 2 0 012-2zM9 5a2 2 0 012 2H9a1 1 0 010-2zm-4 4h6v1H5zm2 3h4v7H7zm10 7h-4v-7h4zm2-9h-6V9h6z"/></svg>';

  function montarLuzes(varal){
    var largura = window.innerWidth;
    var qtd = Math.ceil(largura / 44) + 1;
    var html = "";
    for(var i = 0; i < qtd; i++) html += '<i style="left:' + (i * 44 + 22) + 'px"></i>';
    varal.innerHTML = html;
  }

  function nevar(){
    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var camada = document.createElement("div");
    camada.className = "natal-neve";
    camada.setAttribute("aria-hidden", "true");
    var qtd = window.innerWidth < 640 ? 12 : 22;
    var simbolos = ["❄", "❅", "❆", "•"];
    for(var i = 0; i < qtd; i++){
      var f = document.createElement("span");
      f.className = "natal-floco";
      f.textContent = simbolos[i % simbolos.length];
      f.style.left = (Math.random() * 100) + "vw";
      f.style.fontSize = (10 + Math.random() * 14) + "px";
      f.style.opacity = (0.55 + Math.random() * 0.45).toFixed(2);
      f.style.setProperty("--balanco", (Math.random() * 80 - 40) + "px");
      f.style.animationDuration = (12 + Math.random() * 14) + "s";
      // atraso negativo: a neve já começa espalhada pela tela, não toda no topo
      f.style.animationDelay = (-Math.random() * 26) + "s";
      camada.appendChild(f);
    }
    document.body.appendChild(camada);
  }

  function enfeitar(){
    var header = document.querySelector("header");
    if(header){
      var faixa = document.createElement("div");
      faixa.className = "natal-faixa";
      faixa.innerHTML = "<span>" + mensagemDoDia() + "</span>" +
        '<span class="natal-sep">•</span><span class="natal-extra">' + TEXTOS.faixaExtra + "</span>";
      header.insertBefore(faixa, header.firstChild);

      var varal = document.createElement("div");
      varal.className = "natal-luzes";
      varal.setAttribute("aria-hidden", "true");
      header.appendChild(varal);
      montarLuzes(varal);
      var t;
      window.addEventListener("resize", function(){
        clearTimeout(t);
        t = setTimeout(function(){ montarLuzes(varal); }, 150);
      });
    }

    var logo = document.querySelector(".brand .logo-round");
    if(logo) logo.insertAdjacentHTML("beforebegin", GORRO_SVG);

    // neve dentro do banner (home) e da foto (sobre)
    [".hero-image", ".about-hero-photo"].forEach(function(sel){
      var el = document.querySelector(sel);
      if(!el) return;
      var neve = document.createElement("div");
      neve.className = "natal-neve-banner";
      neve.setAttribute("aria-hidden", "true");
      el.appendChild(neve);
    });

    var painel = document.querySelector(".hero-panel");
    if(painel){
      painel.insertAdjacentHTML("afterbegin", '<div class="natal-selo">' + ESTRELA_SVG + TEXTOS.selo + ESTRELA_SVG + "</div>");
    }

    var tampaBaldes = document.querySelector("#tray-buckets .tray-badge");
    if(tampaBaldes){
      tampaBaldes.insertAdjacentHTML("afterbegin", '<span class="natal-presente">' + PRESENTE_SVG + TEXTOS.presente + "</span>");
    }

    var eventos = document.querySelector(".events-panel p");
    if(eventos){
      eventos.insertAdjacentHTML("afterend",
        '<div class="natal-eventos">' + PRESENTE_SVG +
        "<div><strong>" + TEXTOS.eventosTitulo + "</strong><span>" + TEXTOS.eventosTexto + "</span></div></div>");
    }

    var fine = document.querySelector(".footer-panel .fine");
    if(fine){
      var rodape = document.createElement("div");
      rodape.className = "natal-rodape";
      rodape.textContent = TEXTOS.rodape;
      fine.parentNode.insertBefore(rodape, fine);
    }

    nevar();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", enfeitar);
  } else {
    enfeitar();
  }
})();
