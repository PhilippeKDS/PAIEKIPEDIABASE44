
(function () {
  const $ = (sel, root=document) => root.querySelector(sel);

  function sanitizeExpression(expr){
    // allow digits, dot, comma, spaces and operators + - * / ( )
    return (expr || "")
      .replace(/,/g, ".")
      .replace(/[^0-9+\-*/().\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function safeEval(expr){
    const s = sanitizeExpression(expr);
    if(!s) return "";
    // Prevent weird stuff like "**" or "//" or leading operators that can create surprises
    if (/[*\/]{2,}/.test(s)) throw new Error("Expression invalide");
    if (/[+\-*/.]$/.test(s)) throw new Error("Expression incomplète");
    // eslint-disable-next-line no-new-func
    const res = Function('"use strict"; return (' + s + ')')();
    if (typeof res !== "number" || !isFinite(res)) throw new Error("Résultat invalide");
    return res;
  }

  function buildUI(){
    // if already present, do nothing
    if ($("#calc-float")) return;

    const btn = document.createElement("button");
    btn.id = "btn-calc";
    btn.type = "button";
    btn.className = "btn btn-rose btn-calc-fab";
    btn.title = "Calculatrice";
    btn.setAttribute("aria-label","Ouvrir la calculatrice");
    btn.innerHTML = `<span class="calc-icon" aria-hidden="true">🧮</span><span class="calc-label">Calculatrice</span>`;
    document.body.appendChild(btn);

    const panel = document.createElement("div");
    panel.id = "calc-float";
    panel.className = "floating-panel hidden";
    panel.innerHTML = `
      <div class="floating-header" id="calc-drag-handle">
        <div class="floating-title">Calculatrice</div>
        <button type="button" class="floating-close" id="calc-close" aria-label="Fermer">✕</button>
      </div>
      <div class="calc-body">
        <input id="calc-display" class="calc-display" type="text" inputmode="decimal" placeholder="0" aria-label="Expression" />
        <div class="calc-grid">
          <button type="button" class="calc-btn calc-fn" data-k="C">C</button>
          <button type="button" class="calc-btn calc-fn" data-k="⌫">⌫</button>
          <button type="button" class="calc-btn calc-op" data-k="(">(</button>
          <button type="button" class="calc-btn calc-op" data-k=")">)</button>

          <button type="button" class="calc-btn" data-k="7">7</button>
          <button type="button" class="calc-btn" data-k="8">8</button>
          <button type="button" class="calc-btn" data-k="9">9</button>
          <button type="button" class="calc-btn calc-op" data-k="/">÷</button>

          <button type="button" class="calc-btn" data-k="4">4</button>
          <button type="button" class="calc-btn" data-k="5">5</button>
          <button type="button" class="calc-btn" data-k="6">6</button>
          <button type="button" class="calc-btn calc-op" data-k="*">×</button>

          <button type="button" class="calc-btn" data-k="1">1</button>
          <button type="button" class="calc-btn" data-k="2">2</button>
          <button type="button" class="calc-btn" data-k="3">3</button>
          <button type="button" class="calc-btn calc-op" data-k="-">−</button>

          <button type="button" class="calc-btn calc-zero" data-k="0">0</button>
          <button type="button" class="calc-btn" data-k=".">.</button>
          <button type="button" class="calc-btn calc-eq" data-k="=">=</button>
          <button type="button" class="calc-btn calc-op" data-k="+">+</button>
        </div>
        <div class="calc-hint">Glisse l’en-tête pour déplacer la fenêtre.</div>
      </div>
    `;
    document.body.appendChild(panel);
  }

  function init(){
    buildUI();

    const btn = $("#btn-calc");
    const panel = $("#calc-float");
    const close = $("#calc-close");
    const display = $("#calc-display");
    const grid = $(".calc-grid", panel);
    const handle = $("#calc-drag-handle");

    // default position
    panel.style.left = "unset";
    panel.style.top = "unset";
    panel.style.right = "16px";
    panel.style.bottom = "76px";

    function open(){
      panel.classList.remove("hidden");
      display.focus();
    }
    function hide(){
      panel.classList.add("hidden");
    }

    btn.addEventListener("click", () => {
      if (panel.classList.contains("hidden")) open();
      else hide();
    });
    close.addEventListener("click", hide);

    function push(txt){
      display.value = sanitizeExpression((display.value || "") + txt);
    }

    grid.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-k]");
      if(!b) return;
      const k = b.getAttribute("data-k");
      if(k === "C"){ display.value=""; display.focus(); return; }
      if(k === "⌫"){ display.value = (display.value||"").slice(0,-1); display.focus(); return; }
      if(k === "="){
        try{
          const r = safeEval(display.value);
          display.value = (r === "" ? "" : String(Math.round((r + Number.EPSILON) * 1000000000) / 1000000000));
        }catch(err){
          display.value = "Erreur";
          setTimeout(() => { display.value=""; }, 800);
        }
        display.focus();
        return;
      }
      push(k);
      display.focus();
    });

    display.addEventListener("keydown", (e) => {
      if(e.key === "Enter"){
        e.preventDefault();
        grid.querySelector('[data-k="="]').click();
      }else if(e.key === "Escape"){
        hide();
      }
    });

    // Draggable panel
    let dragging=false, startX=0, startY=0, startLeft=0, startTop=0;

    function getRect(){
      return panel.getBoundingClientRect();
    }

    handle.addEventListener("mousedown", (e) => {
      if(panel.classList.contains("hidden")) return;
      dragging = true;
      const r = getRect();
      startX = e.clientX;
      startY = e.clientY;
      startLeft = r.left;
      startTop = r.top;
      panel.style.right = "unset";
      panel.style.bottom = "unset";
      panel.style.left = startLeft + "px";
      panel.style.top = startTop + "px";
      document.body.classList.add("no-select");
    });

    window.addEventListener("mousemove", (e) => {
      if(!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      panel.style.left = (startLeft + dx) + "px";
      panel.style.top = (startTop + dy) + "px";
    });

    window.addEventListener("mouseup", () => {
      if(!dragging) return;
      dragging=false;
      document.body.classList.remove("no-select");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
