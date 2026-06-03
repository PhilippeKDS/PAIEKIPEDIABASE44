(() => {
  const $ = (id) => document.getElementById(id);
  const toast = (msg) => {
    const t = $("toast");
    if(!t) return;
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(()=>t.classList.remove("show"), 2200);
  };

  const toNum = (v) => {
    if (v === "" || v === null || v === undefined) return 0;
    const x = Number(String(v).replace(',', '.'));
    return Number.isFinite(x) ? x : 0;
  };

  const DEFAULTS = { threshold: 20, tauxCsg: 2.9, roundingMode: "final" };

  function load(){
    try {
      const threshold = toNum(localStorage.getItem("mns_threshold_pct")) || DEFAULTS.threshold;
      const tauxCsg = toNum(localStorage.getItem("mns_taux_csg_pct")) || DEFAULTS.tauxCsg;
      $("threshold").value = threshold;
      $("taux-csg").value = tauxCsg;
      const rm = localStorage.getItem("mns_rounding_mode") || DEFAULTS.roundingMode;
      const sel = $("rounding-mode");
      if(sel) sel.value = rm;
    } catch(e) {
      if($("threshold")) $("threshold").value = DEFAULTS.threshold;
      if($("taux-csg")) $("taux-csg").value = DEFAULTS.tauxCsg;
    }
  }

  function save(){
    const threshold = toNum($("threshold").value) || DEFAULTS.threshold;
    const tauxCsg = toNum($("taux-csg").value) || DEFAULTS.tauxCsg;
    const rmEl = $("rounding-mode");
    const roundingMode = (rmEl && rmEl.value) ? rmEl.value : DEFAULTS.roundingMode;
    try {
      localStorage.setItem("mns_threshold_pct", String(threshold));
      localStorage.setItem("mns_taux_csg_pct", String(tauxCsg));
      localStorage.setItem("mns_rounding_mode", String(roundingMode));
      toast("Paramètres enregistrés");
    } catch(e) {
      toast("Paramètres appliqués (stockage local indisponible)");
    }
  }

  function reset(){
    try {
      localStorage.setItem("mns_threshold_pct", String(DEFAULTS.threshold));
      localStorage.setItem("mns_taux_csg_pct", String(DEFAULTS.tauxCsg));
      localStorage.setItem("mns_rounding_mode", String(DEFAULTS.roundingMode));
    } catch(e) { /* stockage indisponible */ }
    load();
    toast("Paramètres réinitialisés");
  }

  $("btn-save").addEventListener("click", save);
  $("btn-reset-params").addEventListener("click", reset);

  load();
})();
