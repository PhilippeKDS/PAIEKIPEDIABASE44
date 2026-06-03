/* Simulateur réintégration sociale & fiscale — saisie cumulée (YTD)
   Autonome, sans dépendances. */
(() => {
  const nf = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
  const nfd = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
  const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  // PASS (valeurs usuelles)
  const PASS_BY_YEAR = (() => {
    const hardcoded = { 2024: 46368, 2025: 47100, 2026: 48060 };
    try {
      const P = window.PARAMS;
      if (P && P.data) {
        const entry = P.data['pass.annual'] || P.data['pass'];
        if (entry && entry.versions) {
          const result = { ...hardcoded };
          entry.versions.forEach(v => {
            const y = parseInt(v.from);
            if (y && v.value) result[y] = v.value;
          });
          return result;
        }
      }
    } catch(e) { /* fallback */ }
    return hardcoded;
  })();

  // Coefficients BOSS (Bulletin Officiel de la Sécurité Sociale)
  // Référence: BOSS, rubrique plafonds d'exonération retraite/prévoyance
  const COEF = {
    // Retraite supplémentaire - Social
    SOCIAL_RET_BASE_PCT: 0.05,           // 5% du PASS ou de la rémunération
    SOCIAL_RET_REM_CAP_MULTIPLIER: 5,    // Plafond à 5 × PASS
    
    // Prévoyance - Social
    SOCIAL_PREV_PASS_PCT: 0.06,          // 6% du PASS
    SOCIAL_PREV_REM_PCT: 0.015,          // 1,5% de la rémunération
    SOCIAL_PREV_CAP_PCT: 0.12,           // Plafond max à 12% du PASS
    
    // Retraite supplémentaire - Fiscal
    FISCAL_RET_BASE_PCT: 0.08,           // 8% de la rémunération
    FISCAL_RET_REM_CAP_MULTIPLIER: 8,    // Plafond à 8 × PASS
    
    // Prévoyance - Fiscal
    FISCAL_PREV_PASS_PCT: 0.05,          // 5% du PASS
    FISCAL_PREV_REM_PCT: 0.02,           // 2% de la rémunération
    FISCAL_PREV_CAP_MULTIPLIER: 8,       // Pour calcul du plafond max
    FISCAL_PREV_CAP_PCT: 0.02,           // 2% pour le plafond max
  };

  
  // ===== Cas tests (non-régression) =====
  // Objectif : fournir des scénarios reproductibles pour valider les règles et éviter les régressions.
  // Remarque : les valeurs attendues restent à valider par vos soins (doctrine KDS), puis pourront être figées.
  const TEST_CASES = [
    {
      id: 'T01',
      name: "Aucun excédent (base)",
      goal: "Vérifier qu'aucune réintégration n'apparaît avec des cotisations modestes.",
      inputs: { year: 2026, period: 1, rsoc: 3200, rfisc: 3200, ret_sal: 60, ret_pat: 120, prev_sal: 20, prev_pat_hors_fs: 40, prev_pat_fs: 60, applied_soc: 0, applied_fisc: 0 }
    },
    {
      id: 'T02',
      name: "Frais de santé seul",
      goal: "Vérifier le rappel fiscal : frais de santé hors plafonds d'excédents (mais imposable dès le 1er euro).",
      inputs: { year: 2026, period: 1, rsoc: 2800, rfisc: 2800, prev_pat_fs: 150, applied_soc: 0, applied_fisc: 0 }
    },
    {
      id: 'T03',
      name: "Excédent fiscal prévoyance (hors santé)",
      goal: "Provoquer un excédent fiscal sur la prévoyance (hors frais de santé).",
      inputs: { year: 2026, period: 2, rsoc: 6000, rfisc: 6000, prev_pat_hors_fs: 900, prev_sal: 150, applied_soc: 0, applied_fisc: 0 }
    },
    {
      id: 'T04',
      name: "Excédent social retraite",
      goal: "Provoquer un excédent social sur la retraite supplémentaire.",
      inputs: { year: 2026, period: 3, rsoc: 12000, rfisc: 12000, ret_pat: 1500, ret_sal: 400, applied_soc: 0, applied_fisc: 0 }
    },
    {
      id: 'T05',
      name: "Haut salaire (cap rémunération)",
      goal: "Valider les plafonds avec rémunération élevée (bornes 5 PASS / 8 PASS).",
      inputs: { year: 2026, period: 6, rsoc: 120000, rfisc: 120000, ret_pat: 8000, ret_sal: 2500, prev_pat_hors_fs: 2500, prev_pat_fs: 1200, applied_soc: 0, applied_fisc: 0 }
    },
    {
      id: 'T06',
      name: "Rfisc ≠ Rsoc",
      goal: "Valider la séparation des bases (rfisc inférieur).",
      inputs: { year: 2026, period: 4, rsoc: 18000, rfisc: 16500, ret_pat: 1800, prev_pat_hors_fs: 600, prev_pat_fs: 200, applied_soc: 0, applied_fisc: 0 }
    },
    {
      id: 'T07',
      name: "Delta négatif (correction)",
      goal: "Déjà réintégré supérieur au cumul à date → delta négatif (si option activée).",
      inputs: { year: 2026, period: 2, rsoc: 7000, rfisc: 7000, ret_pat: 400, prev_pat_hors_fs: 200, applied_soc: 600, applied_fisc: 500, allowNegative: true }
    },
    {
      id: 'T08',
      name: "Mode annuel",
      goal: "Comparer le mode 'annuel' au mode progressif.",
      inputs: { year: 2026, period: 2, capMode: 'annual', rsoc: 7000, rfisc: 7000, ret_pat: 1200, prev_pat_hors_fs: 500, prev_pat_fs: 250, applied_soc: 0, applied_fisc: 0 }
    },
    {
      id: 'T09',
      name: "Expert : CET versé retraite",
      goal: "Tester les champs périphériques (Expert) : CET affecté à la retraite.",
      inputs: { year: 2026, period: 5, rsoc: 22000, rfisc: 22000, ret_pat: 1200, ret_cet_to_ret: 900, applied_soc: 0, applied_fisc: 0, viewMode: 'expert' }
    },
    {
      id: 'T10',
      name: "Expert : abondement PERECO",
      goal: "Tester les champs périphériques (Expert) : abondement employeur PERCO/PERE-CO.",
      inputs: { year: 2026, period: 5, rsoc: 22000, rfisc: 22000, ret_pat: 1200, ret_abond_perco: 1200, applied_soc: 0, applied_fisc: 0, viewMode: 'expert' }
    },
    {
      id: 'T11',
      name: "Prévy + santé + ventilation",
      goal: "Tester la ventilation fiscale sal/pat avec frais de santé.",
      inputs: { year: 2026, period: 7, rsoc: 26000, rfisc: 26000, prev_sal: 300, prev_pat_hors_fs: 1400, prev_pat_fs: 450, applied_soc: 0, applied_fisc: 0 }
    },
    {
      id: 'T12',
      name: "Historique : déjà réintégré",
      goal: "Tester la logique YTD - déjà réintégré → delta du mois.",
      inputs: { year: 2026, period: 8, rsoc: 32000, rfisc: 32000, ret_pat: 2600, prev_pat_hors_fs: 1600, prev_pat_fs: 600, applied_soc: 900, applied_fisc: 700 }
    },
  ];

const $ = (id) => document.getElementById(id);

  // ===== Fonctions de calcul (formules BOSS) =====
  
  /**
   * Calcule la réintégration sociale pour la retraite supplémentaire
   * Formule BOSS: Limite = max(5% PASS ; 5% × min(Rs ; 5×PASS)) − abondement PERCO
   * 
   * @param {number} Rs - Rémunération brute sociale (cumul YTD)
   * @param {number} passCap - PASS retenu (proratisé ou annuel selon mode)
   * @param {Object} cotisations - Cotisations retraite
   * @param {number} cotisations.pat - Part patronale article 83
   * @param {number} cotisations.pereobPat - Part patronale PERE-OB
   * @param {number} cotisations.cetToRet - CET affecté retraite
   * @param {number} cotisations.abondPerco - Abondement PERCO/PERE-CO (à déduire)
   * @returns {Object} { limit, limitBase, component, excess }
   */
  function calcSocialRetirement(Rs, passCap, cotisations) {
    const { pat, pereobPat, cetToRet, abondPerco } = cotisations;
    
    const limBase1 = COEF.SOCIAL_RET_BASE_PCT * passCap;
    const limBase2 = COEF.SOCIAL_RET_BASE_PCT * Math.min(Rs, COEF.SOCIAL_RET_REM_CAP_MULTIPLIER * passCap);
    const socLimRetBase = Math.max(limBase1, limBase2);
    const socLimRet = clamp0(socLimRetBase - clamp0(abondPerco));
    
    const socCmpRet = clamp0(pat) + clamp0(pereobPat) + clamp0(cetToRet);
    const socExcRet = clamp0(socCmpRet - socLimRet);
    
    return {
      limit: socLimRet,
      limitBase: socLimRetBase,
      component: socCmpRet,
      excess: socExcRet
    };
  }

  /**
   * Calcule la réintégration sociale pour la prévoyance complémentaire
   * Formule BOSS: Limite = min(6% PASS + 1,5% Rs ; 12% PASS)
   * 
   * @param {number} Rs - Rémunération brute sociale (cumul YTD)
   * @param {number} passCap - PASS retenu (proratisé ou annuel selon mode)
   * @param {Object} cotisations - Cotisations prévoyance
   * @param {number} cotisations.patFs - Part patronale frais de santé
   * @param {number} cotisations.patHorsFs - Part patronale hors frais de santé
   * @param {number} cotisations.cse - Participation CSE
   * @returns {Object} { limit, limitRaw, component, excess }
   */
  function calcSocialPrevoyance(Rs, passCap, cotisations) {
    const { patFs, patHorsFs, cse } = cotisations;
    
    const socLimPrevRaw = COEF.SOCIAL_PREV_PASS_PCT * passCap + COEF.SOCIAL_PREV_REM_PCT * Rs;
    const socLimPrev = Math.min(socLimPrevRaw, COEF.SOCIAL_PREV_CAP_PCT * passCap);
    
    const socCmpPrev = clamp0(patFs) + clamp0(patHorsFs) + clamp0(cse);
    const socExcPrev = clamp0(socCmpPrev - socLimPrev);
    
    return {
      limit: socLimPrev,
      limitRaw: socLimPrevRaw,
      component: socCmpPrev,
      excess: socExcPrev
    };
  }

  /**
   * Calcule la réintégration fiscale pour la retraite supplémentaire
   * Formule BOSS: Limite = 8% × min(Rf ; 8×PASS) − abondement − CET IR exonéré
   * 
   * @param {number} Rf - Rémunération imposable de référence (cumul YTD)
   * @param {number} passCap - PASS retenu (proratisé ou annuel selon mode)
   * @param {Object} cotisations - Cotisations retraite
   * @param {number} cotisations.sal - Part salariale
   * @param {number} cotisations.pat - Part patronale
   * @param {number} cotisations.pereobSal - Part salariale PERE-OB
   * @param {number} cotisations.pereobPat - Part patronale PERE-OB
   * @param {number} cotisations.cetToRet - CET affecté retraite
   * @param {number} cotisations.abondPerco - Abondement PERCO/PERE-CO (à déduire)
   * @param {number} cotisations.cetIrExempt - CET exonéré IR (à déduire)
   * @returns {Object} { limit, limitBase, component, excess, empPart, erPart, excessSal, excessPat }
   */
  function calcFiscalRetirement(Rf, passCap, cotisations) {
    const { sal, pat, pereobSal, pereobPat, cetToRet, abondPerco, cetIrExempt } = cotisations;
    
    const fisLimRetBase = COEF.FISCAL_RET_BASE_PCT * Math.min(Rf, COEF.FISCAL_RET_REM_CAP_MULTIPLIER * passCap);
    const fisLimRet = clamp0(fisLimRetBase - clamp0(abondPerco) - clamp0(cetIrExempt));
    
    const retEmpPart = clamp0(sal) + clamp0(pereobSal);
    const retErPart = clamp0(pat) + clamp0(pereobPat) + clamp0(cetToRet);
    const retCmpTotal = retEmpPart + retErPart;
    
    const fisExcRet = clamp0(retCmpTotal - fisLimRet);
    
    // Ventilation proportionnelle sal/pat
    const fisRetSalPart = (fisExcRet > 0 && retCmpTotal > 0) ? fisExcRet * (retEmpPart / retCmpTotal) : 0;
    const fisRetPatPart = (fisExcRet > 0 && retCmpTotal > 0) ? fisExcRet * (retErPart / retCmpTotal) : 0;
    
    return {
      limit: fisLimRet,
      limitBase: fisLimRetBase,
      component: retCmpTotal,
      excess: fisExcRet,
      empPart: retEmpPart,
      erPart: retErPart,
      excessSal: fisRetSalPart,
      excessPat: fisRetPatPart
    };
  }

  /**
   * Calcule la réintégration fiscale pour la prévoyance complémentaire
   * Formule BOSS: Limite = min(5% PASS + 2% Rf ; 2% × 8×PASS)
   * Note: Part patronale frais de santé toujours imposable (hors plafond)
   * 
   * @param {number} Rf - Rémunération imposable de référence (cumul YTD)
   * @param {number} passCap - PASS retenu (proratisé ou annuel selon mode)
   * @param {Object} cotisations - Cotisations prévoyance
   * @param {number} cotisations.sal - Part salariale
   * @param {number} cotisations.patHorsFs - Part patronale hors frais de santé
   * @param {number} cotisations.cse - Participation CSE
   * @returns {Object} { limit, limitRaw, component, excess, empPart, erPart, excessSal, excessPat }
   */
  function calcFiscalPrevoyance(Rf, passCap, cotisations) {
    const { sal, patHorsFs, cse } = cotisations;
    
    const fisLimPrevRaw = COEF.FISCAL_PREV_PASS_PCT * passCap + COEF.FISCAL_PREV_REM_PCT * Rf;
    const fisLimPrev = Math.min(fisLimPrevRaw, COEF.FISCAL_PREV_CAP_PCT * COEF.FISCAL_PREV_CAP_MULTIPLIER * passCap);
    
    const prevEmpPart = clamp0(sal);
    const prevErPart = clamp0(patHorsFs) + clamp0(cse);
    const prevCmpTotal = prevEmpPart + prevErPart;
    
    const fisExcPrev = clamp0(prevCmpTotal - fisLimPrev);
    
    // Ventilation proportionnelle sal/pat
    const fisPrevSalPart = (fisExcPrev > 0 && prevCmpTotal > 0) ? fisExcPrev * (prevEmpPart / prevCmpTotal) : 0;
    const fisPrevPatPart = (fisExcPrev > 0 && prevCmpTotal > 0) ? fisExcPrev * (prevErPart / prevCmpTotal) : 0;
    
    return {
      limit: fisLimPrev,
      limitRaw: fisLimPrevRaw,
      component: prevCmpTotal,
      excess: fisExcPrev,
      empPart: prevEmpPart,
      erPart: prevErPart,
      excessSal: fisPrevSalPart,
      excessPat: fisPrevPatPart
    };
  }

  function showFatal(err){
    try{
      const box = $('fatalError');
      const pre = $('fatalErrorPre');
      if(box){
        box.style.display='block';
        const msg = (err && (err.stack || err.message)) ? String(err.stack || err.message) : String(err || 'Erreur inconnue');
        if(pre) pre.textContent = msg;
        window.scrollTo({top:0, behavior:'smooth'});
      }
    }catch(_e){ /* no-op */ }
  }

  // Filet de sécurité : si une erreur JS survient, afficher un bandeau explicite
  window.addEventListener('error', (e)=>{ showFatal(e.error || e.message || e); });
  window.addEventListener('unhandledrejection', (e)=>{ showFatal(e.reason || e); });

  const clamp0 = (x) => Math.max(0, Number.isFinite(x) ? x : 0);
  const num = (v) => {
    const x = Number(String(v ?? '').replace(',','.').trim());
    return Number.isFinite(x) ? x : 0;
  };

  // Affichage de toasts (notifications temporaires)
  function showToast(message, type = 'info') {
    try {
      const n = document.createElement('div');
      n.className = `toast toast--${type}`;
      n.textContent = message;
      document.body.appendChild(n);
      setTimeout(() => { n.classList.add('show'); }, 10);
      setTimeout(() => { n.classList.remove('show'); }, type === 'error' ? 4000 : 2400);
      setTimeout(() => { n.remove(); }, type === 'error' ? 4500 : 2900);
    } catch(_) { /* ignore */ }
  }

  // Debounce pour optimiser les recalculs sur saisie rapide
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function defaultYear(){
    const y = new Date().getFullYear();
    return PASS_BY_YEAR[y] ? y : 2026;
  }
  function defaultPeriod(){
    return (new Date().getMonth() + 1);
  }

  const STORAGE_KEY = 'kds_reintegration_v5';

  const defaultState = () => ({
    viewMode: 'essential', // 'essential' | 'expert'
    year: defaultYear(),
    pass: PASS_BY_YEAR[defaultYear()] ?? 48060,
    pass_overridden: false,
    period: defaultPeriod(),
    syncR: true,
    // P1 - qualification (par défaut : actives pour éviter toute régression sur anciens cas/tests)
    qual_prev_oblig: true,
    qual_ret_oblig: true,
    capMode: 'progressive',
    allowNegative: false,
    caseId: null,
    caseLabel: null,

    // cumul rémunération
    rsoc: 0,
    rfisc: 0,

    // cumul retraite
    ret_sal: 0,
    ret_pat: 0,
    ret_pereob_sal: 0,
    ret_pereob_pat: 0,
    ret_cet_to_ret: 0,
    ret_abond_perco: 0,
    ret_cet_ir_exempt: 0,

    // cumul prévoyance
    prev_sal: 0,
    prev_pat_hors_fs: 0,
    prev_pat_fs: 0,
    prev_cse: 0,

    // déjà opérés (cumul jusqu'au mois précédent)
    applied_soc: 0,
    applied_fisc: 0,
    applied_fisc_sal: null,
    applied_fisc_pat: null,

    // option plafonds (bases cumulées avant réintégration)
    base_vieill_plaf: 0,
    base_chom: 0,
  });

  const state = defaultState();

  // ===== Persistence =====
  function applyState(parsed, fromHash){
    if(!parsed || typeof parsed !== 'object') return;

    const assignNum = (k) => {
      if(parsed[k] != null) state[k] = clamp0(num(parsed[k]));
    };

    if(parsed.year) state.year = Number(parsed.year) || state.year;
    if(parsed.pass != null) state.pass = clamp0(num(parsed.pass));
    if(parsed.pass_overridden != null) state.pass_overridden = !!parsed.pass_overridden;
    if(parsed.period) state.period = Math.min(12, Math.max(1, Number(parsed.period) || state.period));
    if(parsed.syncR != null) state.syncR = !!parsed.syncR;
    if(parsed.qual_prev_oblig != null) state.qual_prev_oblig = !!parsed.qual_prev_oblig;
    if(parsed.qual_ret_oblig != null) state.qual_ret_oblig = !!parsed.qual_ret_oblig;
    if(parsed.capMode) state.capMode = (parsed.capMode === 'annual' ? 'annual' : 'progressive');
    if(parsed.allowNegative != null) state.allowNegative = !!parsed.allowNegative;
    if(parsed.viewMode) state.viewMode = (parsed.viewMode === 'expert') ? 'expert' : 'essential';

    [
      'rsoc','rfisc',
      'ret_sal','ret_pat','ret_pereob_sal','ret_pereob_pat','ret_cet_to_ret','ret_abond_perco','ret_cet_ir_exempt',
      'prev_sal','prev_pat_hors_fs','prev_pat_fs','prev_cse',
      'applied_soc','applied_fisc','base_vieill_plaf','base_chom'
    ].forEach(assignNum);

    // optional: fiscal split already applied
    if(parsed.applied_fisc_sal == null || parsed.applied_fisc_sal === '') state.applied_fisc_sal = null;
    else state.applied_fisc_sal = clamp0(num(parsed.applied_fisc_sal));

    if(parsed.applied_fisc_pat == null || parsed.applied_fisc_pat === '') state.applied_fisc_pat = null;
    else state.applied_fisc_pat = clamp0(num(parsed.applied_fisc_pat));

    if(!fromHash){
      if(!state.pass_overridden && PASS_BY_YEAR[state.year]) state.pass = PASS_BY_YEAR[state.year];
    }
  }

  function load(){
    // 1) try hash
    const hash = (location.hash || '').replace(/^#/, '');
    if(hash.startsWith('data=')){
      try{
        const b64 = decodeURIComponent(hash.slice(5));
        const json = atob(b64);
        const parsed = JSON.parse(json);
        applyState(parsed, true);
        return;
      }catch(_){/* ignore */}
    }

    // 2) localStorage
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return;
      applyState(JSON.parse(raw), false);
    }catch(_){/* ignore */}
  }

  function save(){
    try { 
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); 
    } catch(err) {
      console.error('Erreur sauvegarde localStorage:', err);
      showToast('⚠️ Impossible de sauvegarder vos données localement. Vos modifications pourraient être perdues.', 'error');
    }
  }

  
  // ===== Cas tests UI =====
  function initTestCases(){
    const sel = $('caseSelect');
    if(!sel) return;
    // populate once
    if(sel.dataset.populated) return;
    TEST_CASES.forEach(tc => {
      const opt = document.createElement('option');
      opt.value = tc.id;
      opt.textContent = `${tc.id} — ${tc.name}`;
      sel.appendChild(opt);
    });
    sel.dataset.populated = '1';

    sel.addEventListener('change', () => {
      const id = sel.value;
      if(!id) return;
      const tc = TEST_CASES.find(x => x.id === id);
      if(!tc) return;
      // Apply inputs (only known keys)
      const fresh = defaultState();
      Object.keys(fresh).forEach(k => state[k] = fresh[k]); // start from a clean baseline
      Object.entries(tc.inputs || {}).forEach(([k,v]) => {
        if(k in state) state[k] = v;
      });
      // Ensure sync behavior: if syncR true, rfisc should follow rsoc immediately
      if(state.syncR) state.rfisc = state.rsoc;

      state.caseId = tc.id;
      state.caseLabel = tc.name;
      save();
      hydrate();
      render();
    selfCheck();
      showToast(`Cas test chargé : ${tc.id} — ${tc.name}`);
    });

    // restore selection
    if(state.caseId){
      sel.value = state.caseId;
    }
  }

// ===== UI =====
  function setViewMode(mode){
    const m = (mode === 'expert') ? 'expert' : 'essential';
    state.viewMode = m;
    document.body.classList.toggle('is-expert', m === 'expert');
    const bE = $('btnViewEssential');
    const bX = $('btnViewExpert');
    if(bE && bX){
      bE.classList.toggle('seg--active', m === 'essential');
      bX.classList.toggle('seg--active', m === 'expert');
    }
  }

  function openModal(id){
    const el = $(id);
    if(!el) return;
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
  }

  function closeModal(id){
    const el = $(id);
    if(!el) return;
    el.classList.remove('is-open');
    el.setAttribute('aria-hidden', 'true');
  }

  function initHelpModals(){
    // Exemple cumul
    const btnExample = $('btnExample');
    if(btnExample){
      btnExample.addEventListener('click', () => openModal('exampleModal'));
    }
    const example = $('exampleModal');
    if(example){
      example.addEventListener('click', (e) => {
        const t = e.target;
        if(t && t.getAttribute && t.getAttribute('data-close') === 'modal') closeModal('exampleModal');
      });
    }

    // Modal aides (boutons ⓘ)
    const help = $('helpModal');
    if(help){
      help.addEventListener('click', (e) => {
        const t = e.target;
        if(t && t.getAttribute && t.getAttribute('data-close') === 'help') closeModal('helpModal');
      });
    }
    document.querySelectorAll('button.info[data-help-title]').forEach(btn => {
      // Tooltip au survol (custom, charte) : on expose une version courte du texte d’aide.
      try{
        const raw = (btn.getAttribute('data-help-html') || '').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
        const titleTxt = (btn.getAttribute('data-help-title') || 'Aide');
        const short = raw.length > 160 ? (raw.slice(0,160) + '…') : raw;
        btn.setAttribute('data-tooltip', short || titleTxt);
        btn.setAttribute('aria-label', titleTxt);
        // On évite le tooltip natif (souvent peu esthétique) : le CSS affiche une bulle au survol.
        btn.removeAttribute('title');
      }catch(_){ }
      btn.addEventListener('click', () => {
        const title = btn.getAttribute('data-help-title') || 'Aide';
        const html = btn.getAttribute('data-help-html') || '';
        const hT = $('helpTitle');
        const hB = $('helpBody');
        if(hT) hT.textContent = title;
        if(hB) hB.innerHTML = html;
        openModal('helpModal');
      });
    });

    // ESC
    document.addEventListener('keydown', (e) => {
      if(e.key === 'Escape'){
        closeModal('helpModal');
        closeModal('exampleModal');
        closeDrawer();
        closeCalc();
      }
    });
  }

  // Drawer
  function openDrawer(tab){
    const d = $('drawer');
    if(!d) return;
    d.classList.add('is-open');
    d.setAttribute('aria-hidden','false');
    setDrawerTab(tab || 'steps');
  }
  function closeDrawer(){
    const d = $('drawer');
    if(!d) return;
    d.classList.remove('is-open');
    d.setAttribute('aria-hidden','true');
  }
  function setDrawerTab(tab){
    const isRules = tab === 'rules';
    const tabSteps = $('tabSteps');
    const tabRules = $('tabRules');
    const secSteps = $('drawerSteps');
    const secRules = $('drawerRules');
    if(tabSteps && tabRules){
      tabSteps.classList.toggle('tab--active', !isRules);
      tabRules.classList.toggle('tab--active', isRules);
      tabSteps.setAttribute('aria-selected', String(!isRules));
      tabRules.setAttribute('aria-selected', String(isRules));
    }
    if(secSteps && secRules){
      secSteps.style.display = isRules ? 'none' : '';
      secRules.style.display = isRules ? '' : 'none';
    }
  }
  
  // Export PDF (détails + règles) via impression du navigateur
  
function initDrawer(){
    const bDetails = $('btnOpenDetails');
    const bRules = $('btnOpenRules');
    if(bDetails) bDetails.addEventListener('click', () => openDrawer('steps'));
    if(bRules) bRules.addEventListener('click', () => openDrawer('rules'));
    const closeBtn = $('drawerClose');
    if(closeBtn) closeBtn.addEventListener('click', closeDrawer);
    const overlay = $('drawerOverlay');
    if(overlay) overlay.addEventListener('click', closeDrawer);
    const tabSteps = $('tabSteps');
    const tabRules = $('tabRules');
    if(tabSteps) tabSteps.addEventListener('click', () => setDrawerTab('steps'));
    if(tabRules) tabRules.addEventListener('click', () => setDrawerTab('rules'));

    const pdfBtn = $('drawerPdf');
    if(pdfBtn) pdfBtn.addEventListener('click', () => {
      if(window.KDS_Addons && typeof window.KDS_Addons.exportPdf === 'function'){
        window.KDS_Addons.exportPdf();
      } else {
        alert("Export PDF indisponible (module non chargé).");
      }
    });

    const xlsBtn2 = $('drawerExcel');
    if(xlsBtn2){
      xlsBtn2.addEventListener('click', () => {
        const out = calc();
        const xml = buildExcelXml(out);
        const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `kds_reintegration_${state.year}_${String(state.period).padStart(2,'0')}.xml`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
    }




  }

  // Calculatrice
  function openCalc(){
    const c = $('calc');
    if(!c) return;
    c.classList.add('is-open');
    c.setAttribute('aria-hidden', 'false');
  }
  function closeCalc(){
    const c = $('calc');
    if(!c) return;
    c.classList.remove('is-open');
    c.setAttribute('aria-hidden', 'true');
  }
  function initCalculator(){
    const fab = $('fabCalc');
    const close = $('calcClose');
    if(fab) fab.addEventListener('click', () => {
      const c = $('calc');
      if(!c) return;
      if(c.classList.contains('is-open')) closeCalc(); else openCalc();
    });
    if(close) close.addEventListener('click', closeCalc);

    const display = $('calcDisplay');
    const keys = document.querySelectorAll('.calc-btn');
    if(!display || !keys.length) return;
    let expr = '';

    const setDisplay = (v) => { display.value = v; };
    const normalize = (s) => s.replace(/,/g,'.');

    function evalExpr(){
      const safe = normalize(expr).replace(/[^0-9+\-*/().%]/g,'');
      if(!safe) return 0;
      // % : interprété comme /100
      const pct = safe.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
      // eslint-disable-next-line no-new-func
      const r = Function(`"use strict";return (${pct});`)();
      return Number.isFinite(r) ? r : 0;
    }

    function press(code){
      if(code === 'AC'){
        expr = '';
        setDisplay('0');
        return;
      }
      if(code === 'DEL'){
        expr = expr.slice(0, -1);
        setDisplay(expr || '0');
        return;
      }
      if(code === '='){
        try{
          const r = evalExpr();
          expr = String(r);
          setDisplay(nfd.format(r));
        }catch(_){
          expr = '';
          setDisplay('Erreur');
        }
        return;
      }
      const mapped = (code === '÷') ? '/' : (code === '×') ? '*' : code;
      if(code === ',' || code === '.'){
        expr += '.';
      }else{
        expr += mapped;
      }
      setDisplay(expr);
    }

    keys.forEach(b => b.addEventListener('click', () => press(b.getAttribute('data-c') || b.textContent)));

    // Drag
    const drag = $('calcDrag');
    const calc = $('calc');
    if(drag && calc){
      let isDown = false; let sx=0; let sy=0; let ox=0; let oy=0;
      drag.addEventListener('mousedown', (e) => {
        isDown = true;
        const rect = calc.getBoundingClientRect();
        ox = rect.left; oy = rect.top;
        sx = e.clientX; sy = e.clientY;
        e.preventDefault();
      });
      window.addEventListener('mousemove', (e) => {
        if(!isDown) return;
        const nx = ox + (e.clientX - sx);
        const ny = oy + (e.clientY - sy);
        calc.style.left = `${Math.max(8, Math.min(window.innerWidth - 340, nx))}px`;
        calc.style.top  = `${Math.max(8, Math.min(window.innerHeight - 420, ny))}px`;
        calc.style.right = 'auto';
        calc.style.bottom = 'auto';
      });
      window.addEventListener('mouseup', () => { isDown = false; });
    }
  }

  function initSelectors(){
    const yearSel = $('year');
    yearSel.innerHTML = '';
    Object.keys(PASS_BY_YEAR).map(Number).sort((a,b)=>a-b).forEach(y => {
      const opt = document.createElement('option');
      opt.value = String(y);
      opt.textContent = String(y);
      yearSel.appendChild(opt);
    });

    // P1 : année obligatoire et PASS verrouillé (pas de saisie libre)

    const periodSel = $('period');
    periodSel.innerHTML = '';
    MONTHS.forEach((m, idx) => {
      const opt = document.createElement('option');
      opt.value = String(idx+1);
      opt.textContent = m;
      periodSel.appendChild(opt);
    });
  }

  function hydrate(){
    const yearSel = $('year');
    const y = String(state.year);
    if([...yearSel.options].some(o => o.value === y)) yearSel.value = y;
    else{
      state.year = defaultYear();
      yearSel.value = String(state.year);
    }

    // P1 : PASS verrouillé sur l'année
    if(PASS_BY_YEAR[state.year]){
      state.pass = PASS_BY_YEAR[state.year];
      state.pass_overridden = false;
    }
    const passEl = $('pass');
    passEl.value = String(state.pass || 0);
    passEl.readOnly = true;
    passEl.title = 'PASS verrouillé (P1) : dépend de l\'année.';
    $('period').value = String(state.period);
    $('syncR').checked = state.syncR;
    const qPrev = $('qualPrev');
    const qRet = $('qualRet');
    if(qPrev) qPrev.checked = !!state.qual_prev_oblig;
    if(qRet)  qRet.checked  = !!state.qual_ret_oblig;
    $('capMode').value = state.capMode || 'progressive';
    $('allowNegative').checked = !!state.allowNegative;

    setViewMode(state.viewMode || 'essential');

    const set = (id, v) => { $(id).value = (v && v !== 0) ? String(v) : ''; };

    set('rsoc', state.rsoc);
    set('rfisc', state.rfisc);

    set('ret_sal', state.ret_sal);
    set('ret_pat', state.ret_pat);
    set('ret_pereob_sal', state.ret_pereob_sal);
    set('ret_pereob_pat', state.ret_pereob_pat);
    set('ret_cet_to_ret', state.ret_cet_to_ret);
    set('ret_abond_perco', state.ret_abond_perco);
    set('ret_cet_ir_exempt', state.ret_cet_ir_exempt);

    set('prev_sal', state.prev_sal);
    set('prev_pat_hors_fs', state.prev_pat_hors_fs);
    set('prev_pat_fs', state.prev_pat_fs);
    set('prev_cse', state.prev_cse);

    set('applied_soc', state.applied_soc);
    set('applied_fisc', state.applied_fisc);

    // optional split
    $('applied_fisc_sal').value = (state.applied_fisc_sal != null && state.applied_fisc_sal !== 0) ? String(state.applied_fisc_sal) : '';
    $('applied_fisc_pat').value = (state.applied_fisc_pat != null && state.applied_fisc_pat !== 0) ? String(state.applied_fisc_pat) : '';

    set('base_vieill_plaf', state.base_vieill_plaf);
    set('base_chom', state.base_chom);
  }

  // ===== Calculs =====

  // P1 : garde-fous bloquants (conformité BOSS - prévoyance / retraite sup.)
  function validateP1(){
    const errors = [];
    const y = Number(state.year);
    if(!y || !PASS_BY_YEAR[y]){
      errors.push("Année obligatoire : sélectionnez une année disponible (PASS connu).");
    }

    // PASS suggéré selon l'année (mais modifiable par l'utilisateur)
    if(PASS_BY_YEAR[y] && !state.pass_overridden){
      state.pass = PASS_BY_YEAR[y];
      const passEl = $('pass');
      if(passEl){
        passEl.value = String(state.pass);
        passEl.readOnly = false;
      }
    }

    // Qualification obligatoire (au moins une brique)
    const qPrev = !!state.qual_prev_oblig;
    const qRet  = !!state.qual_ret_oblig;
    if(!qPrev && !qRet){
      errors.push('Qualification obligatoire : cochez au moins "Prévoyance collective et obligatoire" ou "Retraite supplémentaire (article 83 / PERO)".');
    }

    // Cohérence minimale : pas de cotisations avec R=0 (sinon résultat non interprétable)
    const Rs = clamp0(num(state.rsoc));
    const Rf = clamp0(num(state.rfisc));

    const cotTot =
      clamp0(num(state.ret_pat)) + clamp0(num(state.ret_sal)) + clamp0(num(state.ret_pereob_pat)) + clamp0(num(state.ret_pereob_sal)) + clamp0(num(state.ret_cet_to_ret)) +
      clamp0(num(state.prev_pat_hors_fs)) + clamp0(num(state.prev_pat_fs)) + clamp0(num(state.prev_cse)) + clamp0(num(state.prev_sal));
    if((Rs <= 0.005 && Rf <= 0.005) && cotTot > 0.005){
      errors.push("R_soc et R_fisc à 0 avec des cotisations saisies : vérifiez vos bases cumulées (sinon le résultat n'est pas interprétable).");
    }

    // Cohérence R_soc / R_fisc si synchronisation désactivée
    if(!state.syncR && Rs > 0.005 && Rf <= 0.005){
      errors.push("R_fisc à 0 alors que R_soc est renseigné : activez la synchronisation ou saisissez R_fisc.");
    }

    return { ok: errors.length === 0, errors };
  }

  function escapeHtml(str){
    return String(str)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#39;');
  }

  function renderBlocking(v){
    const box = $('blockingBox');
    const list = $('blockingList');
    if(!box || !list) return;
    if(!v.ok){
      list.innerHTML = v.errors.map(e => `<li class="warn">${escapeHtml(e)}</li>`).join('');
      box.style.display = '';
    }else{
      box.style.display = 'none';
      list.innerHTML = '';
    }
  }

  function blankOut(){
    const PASS = clamp0(num(PASS_BY_YEAR[state.year] || state.pass));
    const PMSS = PASS / 12;
    const period = Math.min(12, Math.max(1, Number(state.period) || 1));
    return {
      PASS, PMSS, period,
      capMode: (state.capMode === 'annual') ? 'annual' : 'progressive',
      passCap: 0,
      allowNeg: !!state.allowNegative,
      soc: {
        ytd: 0, delta: 0, over: 0,
        appliedPrevYtd: clamp0(num(state.applied_soc)),
        parts: { ret: 0, prev: 0 },
        limits: { ret: 0, prev: 0, retBase: 0, prevRaw: 0 },
        cmp: { ret: 0, prev: 0 },
        components: { Rs: clamp0(num(state.rsoc)), Rf: clamp0(num(state.rfisc)) }
      },
      fis: {
        ytd: 0, ytdSal: 0, ytdPat: 0,
        delta: 0, deltaSal: 0, deltaPat: 0,
        over: 0,
        onlySalProvided: false, onlyPatProvided: false,
        appliedPrevYtd: clamp0(num(state.applied_fisc)),
        appliedPrevYtdSal: state.applied_fisc_sal != null ? clamp0(num(state.applied_fisc_sal)) : null,
        appliedPrevYtdPat: state.applied_fisc_pat != null ? clamp0(num(state.applied_fisc_pat)) : null,
        parts: { ret: 0, prev: 0 },
        limits: { ret: 0, prev: 0, retBase: 0, prevRaw: 0 },
        cmp: { ret: 0, prev: 0 },
        splits: {
          retEmpPart: 0, retErPart: 0, retCmpTotal: 0,
          prevEmpPart: 0, prevErPart: 0, prevCmpTotal: 0,
        }
      },
      healthYtd: clamp0(num(state.prev_pat_fs)),
      caps: { capVieill: 0, capChom: 0, headroomVieill: 0, headroomChom: 0, ceilVieill: 0, ceilChom: 0 }
    };
  }
  function calc(){
    const PASS = clamp0(num(state.pass));
    const PMSS = PASS / 12;
    const period = Math.min(12, Math.max(1, Number(state.period) || 1));
    const capMode = (state.capMode === 'annual') ? 'annual' : 'progressive';
    const passCap = (capMode === 'annual') ? PASS : (PASS * (period / 12));
    const allowNeg = !!state.allowNegative;

    // Qualification des dispositifs (P1)
    const QRET = !!state.qual_ret_oblig;
    const QPREV = !!state.qual_prev_oblig;

    const Rs = clamp0(num(state.rsoc));
    const Rf = clamp0(num(state.rfisc));

    // SOCIAL — Retraite (employeur uniquement)
    const socRet = QRET ? calcSocialRetirement(Rs, passCap, {
      pat: num(state.ret_pat),
      pereobPat: num(state.ret_pereob_pat),
      cetToRet: num(state.ret_cet_to_ret),
      abondPerco: num(state.ret_abond_perco)
    }) : { limit: 0, limitBase: 0, component: 0, excess: 0 };

    // SOCIAL — Prévoyance (employeur uniquement)
    const socPrev = QPREV ? calcSocialPrevoyance(Rs, passCap, {
      patFs: num(state.prev_pat_fs),
      patHorsFs: num(state.prev_pat_hors_fs),
      cse: num(state.prev_cse)
    }) : { limit: 0, limitRaw: 0, component: 0, excess: 0 };

    const socYtd = socRet.excess + socPrev.excess;

    // FISCAL — Retraite (toutes parts)
    const fisRet = QRET ? calcFiscalRetirement(Rf, passCap, {
      sal: num(state.ret_sal),
      pat: num(state.ret_pat),
      pereobSal: num(state.ret_pereob_sal),
      pereobPat: num(state.ret_pereob_pat),
      cetToRet: num(state.ret_cet_to_ret),
      abondPerco: num(state.ret_abond_perco),
      cetIrExempt: num(state.ret_cet_ir_exempt)
    }) : { limit: 0, limitBase: 0, component: 0, excess: 0, empPart: 0, erPart: 0, excessSal: 0, excessPat: 0 };

    // FISCAL — Prévoyance (hors part patronale frais de santé)
    const fisPrev = QPREV ? calcFiscalPrevoyance(Rf, passCap, {
      sal: num(state.prev_sal),
      patHorsFs: num(state.prev_pat_hors_fs),
      cse: num(state.prev_cse)
    }) : { limit: 0, limitRaw: 0, component: 0, excess: 0, empPart: 0, erPart: 0, excessSal: 0, excessPat: 0 };

    const fisYtd = fisRet.excess + fisPrev.excess;
    const fisYtdSal = fisRet.excessSal + fisPrev.excessSal;
    const fisYtdPat = fisRet.excessPat + fisPrev.excessPat;

    // Déjà opérés (YTD précédent)
    const appliedSoc = clamp0(num(state.applied_soc));
    const appliedFis = clamp0(num(state.applied_fisc));

    // Delta social du mois
    const rawSocDelta = socYtd - appliedSoc;
    const socDelta = allowNeg ? rawSocDelta : (rawSocDelta >= 0 ? rawSocDelta : 0);
    const socOver  = rawSocDelta < 0 ? Math.abs(rawSocDelta) : 0;

    // Delta fiscal du mois
    const rawFisDelta = fisYtd - appliedFis;
    const fisDelta = allowNeg ? rawFisDelta : (rawFisDelta >= 0 ? rawFisDelta : 0);
    const fisOver  = rawFisDelta < 0 ? Math.abs(rawFisDelta) : 0;

    // Ventilation fiscal du delta
    let fisDeltaSal = 0;
    let fisDeltaPat = 0;

    const appliedSalProvided = state.applied_fisc_sal != null;
    const appliedPatProvided = state.applied_fisc_pat != null;
    const onlySalProvided = appliedSalProvided && !appliedPatProvided;
    const onlyPatProvided = appliedPatProvided && !appliedSalProvided;

    if(appliedSalProvided || appliedPatProvided){
      const appliedSal = clamp0(num(state.applied_fisc_sal ?? 0));
      const appliedPat = clamp0(num(state.applied_fisc_pat ?? 0));
      const rawSalDelta = fisYtdSal - appliedSal;
      const rawPatDelta = fisYtdPat - appliedPat;

      fisDeltaSal = allowNeg ? rawSalDelta : (rawSalDelta >= 0 ? rawSalDelta : 0);
      fisDeltaPat = allowNeg ? rawPatDelta : (rawPatDelta >= 0 ? rawPatDelta : 0);

      // Si l'utilisateur a fourni un seul des deux, on ajuste l'autre pour rester cohérent avec le total
      if(onlySalProvided){
        fisDeltaPat = fisDelta - fisDeltaSal;
      }
      if(onlyPatProvided){
        fisDeltaSal = fisDelta - fisDeltaPat;
      }
    }else{
      const ratioSal = fisYtd > 0 ? (fisYtdSal / fisYtd) : 0;
      fisDeltaSal = fisDelta * ratioSal;
      fisDeltaPat = fisDelta - fisDeltaSal;
    }

// Option plafonds (estimation)
    const ceilVieill = PMSS * period;
    const ceilChom = 4 * PMSS * period;
    const headroomVieill = clamp0(ceilVieill - clamp0(num(state.base_vieill_plaf)));
    const headroomChom = clamp0(ceilChom - clamp0(num(state.base_chom)));
    const capVieill = Math.min(socDelta, headroomVieill);
    const capChom = Math.min(socDelta, headroomChom);

    return {
      PASS, PMSS, period,
      capMode,
      passCap,
      allowNeg,

      soc: {
        ytd: socYtd,
        delta: socDelta,
        over: socOver,
        appliedPrevYtd: appliedSoc,

        parts: { ret: socRet.excess, prev: socPrev.excess },
        limits: {
          ret: socRet.limit,
          prev: socPrev.limit,
          retBase: socRet.limitBase,
          prevRaw: socPrev.limitRaw
        },
        cmp: { ret: socRet.component, prev: socPrev.component },
        components: { Rs, Rf }
      },

      fis: {
        ytd: fisYtd, ytdSal: fisYtdSal, ytdPat: fisYtdPat,
        delta: fisDelta, deltaSal: fisDeltaSal, deltaPat: fisDeltaPat,
        over: fisOver,
        onlySalProvided, onlyPatProvided,
        appliedPrevYtd: appliedFis,
        appliedPrevYtdSal: state.applied_fisc_sal != null ? clamp0(num(state.applied_fisc_sal)) : null,
        appliedPrevYtdPat: state.applied_fisc_pat != null ? clamp0(num(state.applied_fisc_pat)) : null,

        parts: { ret: fisRet.excess, prev: fisPrev.excess },
        limits: {
          ret: fisRet.limit,
          prev: fisPrev.limit,
          retBase: fisRet.limitBase,
          prevRaw: fisPrev.limitRaw
        },
        cmp: { ret: fisRet.component, prev: fisPrev.component },
        splits: {
          retEmpPart: fisRet.empPart,
          retErPart: fisRet.erPart,
          retCmpTotal: fisRet.component,
          prevEmpPart: fisPrev.empPart,
          prevErPart: fisPrev.erPart,
          prevCmpTotal: fisPrev.component
        }
      },

      healthYtd: clamp0(num(state.prev_pat_fs)),
      caps: { capVieill, capChom, headroomVieill, headroomChom, ceilVieill, ceilChom }
    };
  }

  
  function renderSteps(out){
    const box = $('stepsBox');
    if(!box) return;

    const PASS = out.PASS;
    const passCap = out.passCap;
    const period = out.period;

    const Rs = out.soc.components.Rs;
    const Rf = out.soc.components.Rf;

    const soc = out.soc;
    const fis = out.fis;

    const fmtPct = (x) => (nfd.format(x*100) + ' %');

    const rows = (arr) => arr.map(r => `<div class="row"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('');

    // Paramètres
    const params = `
      <div class="step">
        <h3>Paramètres</h3>
        ${rows([
          ['Mois contrôlé', `${period} / 12`],
          ['Mode de plafonds', out.capMode === 'annual' ? 'annuel' : 'progressif'],
          ['Delta négatif', out.allowNeg ? 'autorisé' : 'non'],
          ['PASS annuel', nf.format(PASS)],
          [out.capMode === 'annual' ? 'PASS retenu (annuel)' : 'PASS retenu (proratisé)', nf.format(passCap)],
          ['PMSS', nf.format(out.PMSS)],
          ['Rémunération brute social (cumul)', nf.format(Rs)],
          ['Rémunération brute fiscale de référence (cumul)', nf.format(Rf)],
        ])}
      </div>
    `;

    // Social — Retraite
    const socRetLim1 = 0.05*passCap;
    const socRetLim2 = 0.05*Math.min(Rs, 5*passCap);
    const socRetLimBase = soc.limits.retBase;
    const socRetAbond = soc.components.retAbondPerco;

    const socRet = `
      <div class="step">
        <h3>Social — Retraite supplémentaire</h3>
        <p class="muted tiny">Limite = max(5% PASS ; 5% × min(Rsoc ; 5×PASS)) − abondement PERCO/PERE-CO.</p>
        ${rows([
          ['5% PASS retenu', nf.format(socRetLim1)],
          ['5% × min(Rsoc ; 5×PASS)', nf.format(socRetLim2)],
          ['Base retenue', nf.format(socRetLimBase)],
          ['− Abondement PERCO/PERE-CO', nf.format(socRetAbond)],
          ['Limite sociale retraite (cumul)', nf.format(soc.limits.ret)],
          ['Contributions employeur à comparer', nf.format(soc.cmp.ret)],
          ['Excédent social retraite', nf.format(soc.parts.ret)],
        ])}
      </div>
    `;

    // Social — Prévoyance
    const socPrevRaw = soc.limits.prevRaw;
    const socPrevCap = 0.12*passCap;
    const socPrev = `
      <div class="step">
        <h3>Social — Prévoyance complémentaire</h3>
        <p class="muted tiny">Limite = min(6% PASS + 1,5% Rsoc ; 12% PASS).</p>
        ${rows([
          ['6% PASS retenu', nf.format(0.06*passCap)],
          ['+ 1,5% Rsoc', nf.format(0.015*Rs)],
          ['Limite calculée', nf.format(socPrevRaw)],
          ['Plafond max 12% PASS', nf.format(socPrevCap)],
          ['Limite sociale prévoyance (cumul)', nf.format(soc.limits.prev)],
          ['Contributions employeur à comparer (FS inclus)', nf.format(soc.cmp.prev)],
          ['Excédent social prévoyance', nf.format(soc.parts.prev)],
        ])}
      </div>
    `;

    const socSum = `
      <div class="step">
        <h3>Social — Réintégration</h3>
        ${rows([
          ['Réintégration sociale cumulée', nf.format(soc.ytd)],
          ['Déjà réintégré (YTD mois précédent)', nf.format(soc.appliedPrevYtd)],
          ['À opérer sur le mois (delta)', nf.format(soc.delta)],
        ])}
        ${soc.over > 0.005 ? `<p class="warn inline">Vous avez déjà réintégré ${nf.format(soc.over)} de plus que le cumul calculé à date.</p>` : ''}
      </div>
    `;

    // Fiscal — Retraite
    const fisRetLimBase = fis.limits.retBase;
    const fisRet = `
      <div class="step">
        <h3>Fiscal — Retraite supplémentaire</h3>
        <p class="muted tiny">Limite = 8% × min(Rfisc ; 8×PASS) − abondement PERCO/PERE-CO − CET exonéré IR (si affecté).</p>
        ${rows([
          ['8% × min(Rfisc ; 8×PASS)', nf.format(fisRetLimBase)],
          ['Limite fiscale retraite (cumul)', nf.format(fis.limits.ret)],
          ['Cotisations retraite à comparer (sal + pat)', nf.format(fis.cmp.ret)],
          ['Excédent fiscal retraite', nf.format(fis.parts.ret)],
          ['Ventilation excédent retraite (salarié)', nf.format((fis.parts.ret>0 && fis.splits.retCmpTotal>0)?(fis.parts.ret*(fis.splits.retEmpPart/fis.splits.retCmpTotal)):0)],
          ['Ventilation excédent retraite (employeur)', nf.format((fis.parts.ret>0 && fis.splits.retCmpTotal>0)?(fis.parts.ret*(fis.splits.retErPart/fis.splits.retCmpTotal)):0)],
        ])}
      </div>
    `;

    // Fiscal — Prévoyance
    const fisPrevRaw = fis.limits.prevRaw;
    const fisPrevCap = 0.02*8*passCap;
    const fisPrev = `
      <div class="step">
        <h3>Fiscal — Prévoyance complémentaire</h3>
        <p class="muted tiny">Limite = min(5% PASS + 2% Rfisc ; 2% × 8×PASS). La part patronale « frais de santé » est imposable dès le 1er euro et n’entre pas dans cet excédent.</p>
        ${rows([
          ['5% PASS retenu', nf.format(0.05*passCap)],
          ['+ 2% Rfisc', nf.format(0.02*Rf)],
          ['Limite calculée', nf.format(fisPrevRaw)],
          ['Plafond max (2% × 8×PASS)', nf.format(fisPrevCap)],
          ['Limite fiscale prévoyance (cumul)', nf.format(fis.limits.prev)],
          ['Cotisations prévoyance à comparer (sal + pat hors FS + CSE)', nf.format(fis.cmp.prev)],
          ['Excédent fiscal prévoyance', nf.format(fis.parts.prev)],
          ['Ventilation excédent prévoyance (salarié)', nf.format((fis.parts.prev>0 && fis.splits.prevCmpTotal>0)?(fis.parts.prev*(fis.splits.prevEmpPart/fis.splits.prevCmpTotal)):0)],
          ['Ventilation excédent prévoyance (employeur)', nf.format((fis.parts.prev>0 && fis.splits.prevCmpTotal>0)?(fis.parts.prev*(fis.splits.prevErPart/fis.splits.prevCmpTotal)):0)],
        ])}
      </div>
    `;

    // Fiscal — Delta
    const appliedSalTxt = (fis.appliedPrevYtdSal==null && fis.appliedPrevYtdPat==null)
      ? 'Non renseigné (ventilation automatique)'
      : `Sal. ${nf.format(fis.appliedPrevYtdSal ?? 0)} / Pat. ${nf.format(fis.appliedPrevYtdPat ?? 0)}`;

    const fisSum = `
      <div class="step">
        <h3>Fiscal — Réintégration</h3>
        ${rows([
          ['Réintégration fiscale cumulée', nf.format(fis.ytd)],
          ['… dont part « salarié » (cotis. non déductibles)', nf.format(fis.ytdSal)],
          ['… dont part « employeur » (complément imposable)', nf.format(fis.ytdPat)],
          ['Déjà réintégré (YTD mois précédent)', nf.format(fis.appliedPrevYtd)],
          ['Déjà réintégré — détail sal./pat.', appliedSalTxt],
          ['À opérer sur le mois (delta)', nf.format(fis.delta)],
          ['… dont sal. sur le mois', nf.format(fis.deltaSal)],
          ['… dont pat. sur le mois', nf.format(fis.deltaPat)],
        ])}
        ${fis.over > 0.005 ? `<p class="warn inline">Vous avez déjà réintégré ${nf.format(fis.over)} de plus que le cumul calculé à date.</p>` : ''}
      </div>
    `;

    box.innerHTML = params + socRet + socPrev + socSum + fisRet + fisPrev + fisSum;
  }

function renderRules(out){
    const box = $('rulesBox');
    const PASS = out.PASS;
    const passCap = out.passCap;

    box.innerHTML = `
      <div class=\"step\">
        <h3>PASS, bases et périmètre</h3>
        <div class=\"row\"><span>Année</span><b>${out.year}</b></div>
        <div class=\"row\"><span>PASS annuel</span><b>${nf.format(PASS)}</b></div>
        <div class=\"row\"><span>Mode de plafonds</span><b>${out.capMode === 'annual' ? 'annuel' : 'progressif (prorata)'}</b></div>
        <div class=\"row\"><span>PASS retenu (plafonds)</span><b>${nf.format(passCap)}</b></div>
        <div class=\"row\"><span>PMSS</span><b>${nf.format(out.PMSS)}</b></div>
        <div class=\"muted tiny\" style=\"margin-top:8px\">R<sub>soc</sub> = rémunération soumise (assiette sociale). R<sub>fisc</sub> = rémunération fiscale de référence pour les plafonds de déduction (peut différer).</div>
      </div>

      <div class=\"step\">
        <h3>Éléments périphériques (mode Expert)</h3>
        <div class=\"muted tiny\">Ces champs sont proposés en <b>Expert</b> car leur traitement peut varier selon le contexte (statut, paramétrage paie, dispositifs). Ils sont conservés pour le contrôle, mais doivent être utilisés avec prudence.</div>
        <table class=\"mini-table\" style=\"margin-top:10px\">
          <thead><tr><th>Élément</th><th>Où le retrouver</th><th>Impact dans ce simulateur</th><th>Prudence</th></tr></thead>
          <tbody>
            <tr><td>CET affecté à retraite/PERE‑OB</td><td>Rubrique de conversion CET / abondement</td><td>Ajouté aux contributions employeur “retraite” (social & fiscal)</td><td>Vérifier la qualification et l’assiette retenue dans votre paie.</td></tr>
            <tr><td>Abondement employeur PERCO/PERE‑CO</td><td>Rubrique abondement</td><td>Déduit des limites retenues (selon doctrine KDS)</td><td>Peut varier selon dispositifs et paramétrages : contrôler.</td></tr>
            <tr><td>Participation CSE (prévoyance)</td><td>Participation employeur/CSE</td><td>Intégrée aux contributions employeur “prévoyance”</td><td>Contrôler le périmètre (hors frais de santé).</td></tr>
            <tr><td>Jours CET/repos exonérés IR affectés</td><td>Rubrique spécifique (exonération IR)</td><td>Champ informatif (non intégré aux calculs à date)</td><td>À utiliser pour vos contrôles internes si besoin.</td></tr>
          </tbody>
        </table>
      </div>

      <div class=\"step\">
        <h3>Réintégration sociale — Retraite supplémentaire</h3>
        <div class=\"row\"><span>Limite cumulée retenue</span><b>max(5% PASS ; 5% × min(R<sub>soc</sub> ; 5×PASS))</b></div>
        <div class=\"row\"><span>Éléments comparés</span><b>contributions employeur (ret. pat + PERE-OB pat + CET versé)</b></div>
        <div class=\"muted tiny\" style=\"margin-top:8px\">Décision KDS validée : utilisation de la formule “max”. Les éléments périphériques (abondements, etc.) sont en mode Expert avec avertissement. </div>
      </div>

      <div class=\"step\">
        <h3>Réintégration sociale — Prévoyance</h3>
        <div class=\"row\"><span>Limite cumulée</span><b>min(6% PASS + 1,5% R<sub>soc</sub> ; 12% PASS)</b></div>
        <div class=\"row\"><span>Éléments comparés</span><b>contributions employeur (frais de santé + hors FS + CSE)</b></div>
      </div>

      <div class=\"step\">
        <h3>Réintégration fiscale — Retraite supplémentaire</h3>
        <div class=\"row\"><span>Limite cumulée</span><b>8% × min(R<sub>fisc</sub> ; 8×PASS)</b></div>
        <div class=\"row\"><span>Éléments comparés</span><b>cotisations salarié + employeur (+ CET versé)</b></div>
        <div class=\"row\"><span>Ventilation du delta</span><b>au prorata sal./pat. des cotisations retraite comparées</b></div>
      </div>

      <div class=\"step\">
        <h3>Réintégration fiscale — Prévoyance</h3>
        <div class=\"row\"><span>Limite cumulée</span><b>min(5% PASS + 2% R<sub>fisc</sub> ; 2% × 8 × PASS)</b></div>
        <div class=\"row\"><span>Éléments comparés</span><b>cotisations sal. (FS incl.) + cotisations pat. (hors FS) + CSE</b></div>
        <div class=\"row\"><span>Ventilation</span><b>au prorata sal./pat. (hors part patronale “frais de santé”)</b></div>
        <div class=\"muted tiny\" style=\"margin-top:8px\">Rappel : la part patronale “frais de santé” est souvent imposable dès le 1er euro (selon contexte) et peut déjà être intégrée au net imposable. Ce simulateur calcule les excédents au-delà des limites. </div>
      </div>

      <div class=\"step\">
        <h3>Logique “delta du mois”</h3>
        <div class=\"row\"><span>Réintégration cumulée à date</span><b>excédent calculé sur montants cumulés (YTD)</b></div>
        <div class=\"row\"><span>Montant à opérer sur le mois</span><b>cumul à date − cumul déjà réintégré (mois précédent)</b></div>
      </div>

      <div class=\"step\">
        <h3>Limites et cas particuliers (à connaître)</h3>
        <ul class=\"bullets\">
          <li>Entrée/sortie en cours d’année, multi-contrats, temps partiel : la proratisation peut nécessiter un ajustement.</li>
          <li>Paramétrages spécifiques, statuts particuliers, taux dérogatoires : peuvent modifier les bases et l’interprétation des montants.</li>
          <li>Les éléments périphériques (abondements, CET, dispositifs spécifiques) sont volontairement cantonnés au mode Expert : utilisez-les avec prudence.</li>
        </ul>
      </div>
    `;
  }

  function render(){
    // sync period/pass/year
    state.period = Math.min(12, Math.max(1, Number($('period').value || state.period)));
    state.capMode = ($('capMode')?.value === 'annual') ? 'annual' : 'progressive';
    state.allowNegative = !!$('allowNegative')?.checked;
    state.qual_prev_oblig = !!$('qualPrev')?.checked;
    state.qual_ret_oblig  = !!$('qualRet')?.checked;

    const p1 = validateP1();
    renderBlocking(p1);
    const out = p1.ok ? calc() : blankOut();

    const setKpi = (id, val) => {
      const el = $(id);
      if(!el) return;
      el.textContent = nf.format(val);
      el.classList.toggle('neg', val < -0.005);
    };

    setKpi('kpiSocialMonth', out.soc.delta);
    setKpi('kpiFiscalMonth', out.fis.delta);
    $('kpiFiscalSplit').textContent = `dont salarié ${nf.format(out.fis.deltaSal)} / employeur ${nf.format(out.fis.deltaPat)}`;

    // Synthèse actionnable
    const actSoc = $('actionSocialLine');
    const actFis = $('actionFiscalLine');
    if(actSoc){
      const v = out.soc.delta;
      actSoc.textContent = `${nf.format(v)} €`;
      actSoc.classList.toggle('neg', v < -0.005);
    }
    if(actFis){
      const v = out.fis.delta;
      actFis.textContent = `${nf.format(v)} € (sal. ${nf.format(out.fis.deltaSal)} / pat. ${nf.format(out.fis.deltaPat)})`;
      actFis.classList.toggle('neg', v < -0.005);
    }


    // KPI « Correction » (delta négatif)
    const corrCard = $('kpiCorrectionCard');
    const corrVal = $('kpiCorrectionValue');
    const corrSub = $('kpiCorrectionSub');
    if(corrCard && corrVal && corrSub){
      const negSoc = out.soc.delta < -0.005;
      const negFis = out.fis.delta < -0.005;
      const show = !!out.allowNeg && (negSoc || negFis);
      corrCard.style.display = show ? '' : 'none';

      if(show){
        // Affichage multi-ligne, explicite côté paie
        const lines = [];
        if(negSoc) lines.push(`<div><strong>Social</strong> : ${nf.format(out.soc.delta)}</div>`);
        if(negFis) lines.push(`<div><strong>Fiscal</strong> : ${nf.format(out.fis.delta)} <span class="muted">(sal. ${nf.format(out.fis.deltaSal)} / pat. ${nf.format(out.fis.deltaPat)})</span></div>`);
        corrVal.innerHTML = lines.join('');
        corrSub.textContent = "Delta négatif = correction / reprise : vérifiez le contexte (régularisation, recalcul, annulation d'une réintégration précédente).";
      }
    }

    setKpi('kpiSocialYtd', out.soc.ytd);
    setKpi('kpiFiscalYtd', out.fis.ytd);

    $('healthYtd').textContent = nf.format(out.healthYtd);

    $('capVieill').textContent = nf.format(out.caps.capVieill);
    $('capChom').textContent = nf.format(out.caps.capChom);

    // Contrôles de cohérence (non bloquants)
    const list = $('coherenceList');
    const box = $('coherenceBox');
    const btnToggle = $('btnToggleChecks');
    if(list){
      list.innerHTML = '';
      const msgs = [];
      const push = (cls, txt) => msgs.push({cls, txt});

      let any = false;


      const Rs = out.soc.components.Rs;
      const Rf = out.soc.components.Rf;

      const cotTotal = out.soc.cmp.ret + out.soc.cmp.prev + out.fis.splits.retEmpPart + out.fis.splits.retErPart + out.fis.splits.prevEmpPart + out.fis.splits.prevErPart;

      if(Rs <= 0.005 && cotTotal > 0.005){
        any = true;
        push('warn', "Cotisations saisies > 0 alors que R_soc est à 0 : vérifiez la base de rémunération ou l'unité (cumul).");
      }
      if(Rf <= 0.005 && (out.fis.splits.retEmpPart + out.fis.splits.retErPart + out.fis.splits.prevEmpPart + out.fis.splits.prevErPart) > 0.005){
        any = true;
        push('warn', "Cotisations fiscales saisies > 0 alors que R_fisc est à 0 : vérifiez la rémunération fiscale de référence (cumul).");
      }

      if(out.capMode === 'annual' && out.period < 12){
        any = true;
        push('check-info', "Mode de plafonds = annuel : les plafonds ne sont pas proratisés, même si le mois contrôlé n'est pas décembre.");
      }

      if(!out.allowNeg){
        if(out.soc.over > 0.005){
          any = true;
          push('warn', `Social déjà réintégré supérieur au cumul calculé : écart de ${nf.format(out.soc.over)} (delta du mois ramené à 0).`);
        }
        if(out.fis.over > 0.005){
          any = true;
          push('warn', `Fiscal déjà réintégré supérieur au cumul calculé : écart de ${nf.format(out.fis.over)} (delta du mois ramené à 0).`);
        }
      }else{
        if(out.soc.over > 0.005 || out.fis.over > 0.005){
          any = true;
          push('check-info', "Delta négatif autorisé : les écarts (déjà réintégré > cumul) peuvent générer un delta de correction négatif.");
        }
      }

      if(out.fis.onlySalProvided){
        any = true;
        push('check-info', "Vous avez renseigné uniquement la part « salarié » déjà réintégrée : la part « employeur » est ajustée pour rester cohérente avec le total.");
      }
      if(out.fis.onlyPatProvided){
        any = true;
        push('check-info', "Vous avez renseigné uniquement la part « employeur » déjà réintégrée : la part « salarié » est ajustée pour rester cohérente avec le total.");
      }

      if(state.syncR){
        any = true;
        push('check-info', "R_fisc est synchronisé sur R_soc (approximation). Désactivez la synchronisation si vos bases diffèrent.");
      }
      // éléments périphériques (mode Expert)
      const periphTotal =
        (out.soc.components.retCetToRet || 0) +
        (out.soc.components.retAbondPerco || 0) +
        (out.soc.components.retCetIrExempt || 0) +
        (out.soc.components.prevCse || 0);
      if(periphTotal > 0.005){
        any = true;
        push('check-info', "Éléments périphériques renseignés (CET / abondement / participation CSE). Champs en mode Expert : vérifiez le traitement selon votre contexte (paramétrages, statut, exonérations).");
      }


      // cas spécifique : frais de santé seul
      if(out.healthYtd > 0.005 && out.soc.components.prevPatHorsFs <= 0.005 && out.soc.components.prevCse <= 0.005 && out.fis.splits.prevEmpPart <= 0.005){
        any = true;
        push('check-info', "Vous avez saisi uniquement des « frais de santé » : c'est possible. Vérifiez que le reste de la prévoyance (hors FS) est bien à 0 sur la période.");
      }

      if(!any){
        push('ok', "Aucun point d'alerte détecté sur la cohérence des saisies.");
      }

      // Render (limit to 5 by default)
      const MAX = 5;
      let expanded = !!state.checksExpanded;
      const renderChecks = () => {
        list.innerHTML = '';
        const slice = expanded ? msgs : msgs.slice(0, MAX);
        for(const m of slice){
          const li = document.createElement('li');
          li.className = m.cls;
          li.textContent = m.txt;
          list.appendChild(li);
        }
        if(btnToggle){
          if(msgs.length > MAX){
            btnToggle.style.display = '';
            btnToggle.textContent = expanded ? 'Voir moins' : `Voir plus (${msgs.length - MAX})`;
          }else{
            btnToggle.style.display = 'none';
          }
        }
      };
      if(btnToggle){
        btnToggle.addEventListener('click', () => {
          expanded = !expanded;
          state.checksExpanded = expanded;
          renderChecks();
        });
      }

      renderChecks();

      if(box) box.style.display = '';
    }

    renderSteps(out);
    renderRules(out);
    save();
  }


  // ===== events =====
  function wire(){
    // Vue Essentiel / Expert
    const btnEss = $('btnViewEssential');
    const btnExp = $('btnViewExpert');
    if(btnEss && btnExp){
      btnEss.addEventListener('click', () => { setViewMode('essential'); render(); });
      btnExp.addEventListener('click', () => { setViewMode('expert'); render(); });
    }

    // Aides (modals)
    initHelpModals();
    initDrawer();
    initCalculator();

    $('year').addEventListener('change', (e) => {
      const v = e.target.value;
      state.year = Number(v) || state.year;
      if(PASS_BY_YEAR[state.year]){
        state.pass = PASS_BY_YEAR[state.year];
        state.pass_overridden = false;
        const passEl = $('pass');
        passEl.value = String(state.pass);
      }
      render();
      selfCheck();
    });

    // PASS : permet la modification manuelle (marque comme overridden)
    $('pass').addEventListener('input', (e) => {
      const passEl = e.target;
      const newVal = clamp0(num(passEl.value));
      state.pass = newVal;
      // Marquer comme modifié manuellement si différent de la valeur officielle
      state.pass_overridden = (PASS_BY_YEAR[state.year] && newVal !== PASS_BY_YEAR[state.year]);
      render();
      selfCheck();
    });

    $('qualPrev')?.addEventListener('change', (e) => { state.qual_prev_oblig = !!e.target.checked; render(); selfCheck(); });
    $('qualRet')?.addEventListener('change', (e) => { state.qual_ret_oblig  = !!e.target.checked; render(); selfCheck(); });

    $('period').addEventListener('change', () => render());

    $('syncR').addEventListener('change', (e) => {
      state.syncR = !!e.target.checked;
      if(state.syncR){
        // copy Rsoc into Rfisc to avoid divergence
        state.rfisc = state.rsoc;
        $('rfisc').value = $('rsoc').value;
      }
      render();
    selfCheck();
    });
    $('capMode').addEventListener('change', (e) => {
      state.capMode = (e.target.value === 'annual') ? 'annual' : 'progressive';
      render();
    selfCheck();
    });

    $('allowNegative').addEventListener('change', (e) => {
      state.allowNegative = !!e.target.checked;
      render();
    selfCheck();
    });



    // input wiring helper avec debounce pour performance
    const debouncedRenderAndCheck = debounce(() => {
      render();
      selfCheck();
    }, 300);

    const bind = (id, key, opts = {}) => {
      $(id).addEventListener('input', (e) => {
        const v = e.target.value;
        if(opts.nullable){
          if(v === '' || v == null){
            state[key] = null;
          }else{
            state[key] = clamp0(num(v));
          }
        }else{
          state[key] = clamp0(num(v));
        }

        // sync Rsoc -> Rfisc if enabled
        if(key === 'rsoc' && state.syncR){
          state.rfisc = state.rsoc;
          $('rfisc').value = e.target.value;
        }
        
        // Utiliser debounce pour éviter recalculs excessifs
        debouncedRenderAndCheck();
      });
    };

    bind('rsoc','rsoc');
    bind('rfisc','rfisc');

    [
      'ret_sal','ret_pat','ret_pereob_sal','ret_pereob_pat','ret_cet_to_ret','ret_abond_perco','ret_cet_ir_exempt',
      'prev_sal','prev_pat_hors_fs','prev_pat_fs','prev_cse',
      'applied_soc','applied_fisc',
      'base_vieill_plaf','base_chom'
    ].forEach(id => bind(id, id));

    bind('applied_fisc_sal','applied_fisc_sal', { nullable:true });
    bind('applied_fisc_pat','applied_fisc_pat', { nullable:true });

    // Buttons
    $('btnReset').addEventListener('click', () => {
      const fresh = defaultState();
      Object.keys(fresh).forEach(k => state[k] = fresh[k]);
      location.hash = '';
      hydrate();
      render();
    selfCheck();
    });


    // Cas tests
    initTestCases();
    $('btnClearCase').addEventListener('click', () => {
      state.caseId = null;
      state.caseLabel = null;
      $('caseSelect').value = '';
      save();
      render();
    selfCheck();
    });

    
    const btnXls = $('btnExportExcel');
    if(btnXls){
      btnXls.addEventListener('click', () => {
        const out = calc();
        const xml = buildExcelXml(out);
        const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        // IMPORTANT: le fichier produit est du SpreadsheetML 2003 (XML).
        // En le nommant en .xml, Excel n'affiche pas l'avertissement "le format et l'extension ne correspondent pas".
        a.download = `kds_reintegration_${state.year}_${String(state.period).padStart(2,'0')}.xml`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
    }

$('btnExport').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `kds_reintegration_${state.year}_${String(state.period).padStart(2,'0')}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    });

    $('fileImport').addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if(!file) return;
      try{
        const txt = await file.text();
        const parsed = JSON.parse(txt);
        applyState(parsed, false);
        hydrate();
        render();
    selfCheck();
      }catch(_){
        alert('Fichier JSON invalide.');
      }finally{
        e.target.value = '';
      }
    });

    $('btnShare').addEventListener('click', async () => {
      try{
        const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
        const url = `${location.origin}${location.pathname}#data=${encodeURIComponent(b64)}`;
        await navigator.clipboard.writeText(url);
        const btn = $('btnShare');
        const prev = btn.textContent;
        btn.textContent = 'Lien copié ✓';
        setTimeout(()=>btn.textContent = prev, 1200);
      }catch(_){
        alert("Impossible de copier automatiquement.\nVous pouvez toutefois utiliser l'export JSON.");
      }
    });
  }

  
  // ===== Export Excel (SpreadsheetML .xls) =====
  function xmlEsc(v){
    return String(v)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&apos;');
  }

  function buildExcelXml(out){
    const now = new Date();
    const year = state.year;
    const monthNo = Number(state.period)||1;

    const inputs = [
      ["Année", year],
      ["Mois contrôlé (1-12)", monthNo],
      ["PASS", out.PASS],
      ["PMSS", out.PMSS],
      ["Salaire brut soumis cotisations (cumul)", out.soc.components.Rs],
      ["Rémunération imposable (cumul)", out.soc.components.Rf],
      ["Retraite suppl. — part employeur (cumul)", out.soc.components.retPat + out.soc.components.retPereobPat + out.soc.components.retCetToRet],
      ["Retraite suppl. — part salarié (cumul)", out.fis.splits.retEmpPart],
      ["Abondement / PERCO (cumul)", out.soc.components.retAbondPerco],
      ["CET vers retraite / PERECOB (cumul)", out.soc.components.retCetToRet],
      ["CET exonéré IR (cumul)", clamp0(num(state.ret_cet_ir_exempt))],
      ["Prévoyance — part employeur frais de santé (cumul)", out.healthYtd],
      ["Prévoyance — part employeur hors frais de santé (cumul)", out.soc.components.prevPatHorsFs],
      ["Prévoyance — part salarié (cumul)", clamp0(num(state.prev_sal))],
      ["Prévoyance — part CSE (cumul)", out.soc.components.prevCse],
      ["Social déjà réintégré (cumul mois précédent)", out.soc.appliedPrevYtd],
      ["Fiscal déjà réintégré (cumul mois précédent)", out.fis.appliedPrevYtd],
      ["… dont cotisations salariales non déductibles (si saisi)", (state.applied_fisc_sal!=null? clamp0(num(state.applied_fisc_sal)) : "")],
      ["… dont contributions patronales imposables (si saisi)", (state.applied_fisc_pat!=null? clamp0(num(state.applied_fisc_pat)) : "")]
    ];

    // Steps (social)
    const stepsSocRet = [
      ["Plafond retraite (base)", `max(5% PASS prorata ; 5% min(R ; 5 PASS prorata))`, out.soc.limits.retBase],
      ["Plafond retraite (après abondement)", `plafond base - abondement/PERCO`, out.soc.limits.ret],
      ["Cotisations retenues", `employeur + PEREOB (pat) + CET→retraite`, out.soc.cmp.ret],
      ["Excédent social retraite", `max(0 ; cotisations - plafond)`, out.soc.parts.ret],
    ];
    const stepsSocPrev = [
      ["Plafond prévoyance (brut)", `6% PASS prorata + 1,5% R`, out.soc.limits.prevRaw],
      ["Plafond prévoyance (cap)", `min(plafond brut ; 12% PASS prorata)`, out.soc.limits.prev],
      ["Cotisations retenues", `pat (FS + hors FS) + CSE`, out.soc.cmp.prev],
      ["Excédent social prévoyance", `max(0 ; cotisations - plafond)`, out.soc.parts.prev],
    ];

    // Steps (fiscal)
    const retEmpPart = out.fis.splits.retEmpPart;
    const retErPart  = out.fis.splits.retErPart;
    const retCmpTotal = out.fis.splits.retCmpTotal;
    const fisExcRet = out.fis.parts.ret;
    const fisRetSalPart = (fisExcRet>0 && retCmpTotal>0) ? fisExcRet*(retEmpPart/retCmpTotal) : 0;
    const fisRetPatPart = (fisExcRet>0 && retCmpTotal>0) ? fisExcRet*(retErPart/retCmpTotal) : 0;

    const prevEmpPart = out.fis.splits.prevEmpPart;
    const prevErPart  = out.fis.splits.prevErPart;
    const prevCmpTotal = out.fis.splits.prevCmpTotal;
    const fisExcPrev = out.fis.parts.prev;
    const fisPrevSalPart = (fisExcPrev>0 && prevCmpTotal>0) ? fisExcPrev*(prevEmpPart/prevCmpTotal) : 0;
    const fisPrevPatPart = (fisExcPrev>0 && prevCmpTotal>0) ? fisExcPrev*(prevErPart/prevCmpTotal) : 0;

    const stepsFisRet = [
      ["Plafond retraite (base)", `8% min(R ; 8 PASS prorata)`, out.fis.limits.retBase],
      ["Plafond retraite (après exclusions)", `plafond base - abondement/PERCO - CET exonéré IR`, out.fis.limits.ret],
      ["Cotisations retenues", `salarié + employeur (incl. CET→retraite)`, out.fis.cmp.ret],
      ["Excédent fiscal retraite (total)", `max(0 ; cotisations - plafond)`, out.fis.parts.ret],
      ["Ventilation excédent retraite", `prorata sal/pat`, `sal: ${nf.format(fisRetSalPart)} € | pat: ${nf.format(fisRetPatPart)} €`],
    ];
    const stepsFisPrev = [
      ["Plafond prévoyance (brut)", `5% PASS prorata + 2% R`, out.fis.limits.prevRaw],
      ["Plafond prévoyance (cap)", `min(plafond brut ; 2% x 8 PASS prorata)`, out.fis.limits.prev],
      ["Cotisations retenues (hors pat FS)", `sal + pat hors FS + CSE`, out.fis.cmp.prev],
      ["Excédent fiscal prévoyance (hors pat FS)", `max(0 ; cotisations - plafond)`, out.fis.parts.prev],
      ["Part patronale frais de santé", `imposable dès le 1er euro`, out.healthYtd],
      ["Ventilation excédent prévoyance", `prorata sal/pat (hors pat FS)`, `sal: ${nf.format(fisPrevSalPart)} € | pat: ${nf.format(fisPrevPatPart)} €`],
    ];

    const synth = [
      ...(state.caseId ? [["Cas test chargé", `${state.caseId} — ${state.caseLabel||''}`.trim()]] : []),
      ["Réintégration sociale — cumul à date", out.soc.ytd],
      ["Réintégration sociale — déjà réintégrée (cumul mois précédent)", out.soc.appliedPrevYtd],
      ["Réintégration sociale — à réintégrer ce mois", out.soc.delta],
      ["Réintégration fiscale — cumul à date", out.fis.ytd],
      ["Réintégration fiscale — déjà réintégrée (cumul mois précédent)", out.fis.appliedPrevYtd],
      ["Réintégration fiscale — à réintégrer ce mois", out.fis.delta],
      ["… dont cotisations salariales non déductibles (estimation/contrôle)", out.fis.deltaSal],
      ["… dont contributions patronales imposables (estimation/contrôle)", out.fis.deltaPat],
    ];

    const warnings = [];
    if(out.soc.over>0) warnings.push(["Attention", `Vous avez déjà réintégré plus que le cumul à date (écart : ${nf.format(out.soc.over)} €).`]);
    if(out.fis.over>0) warnings.push(["Attention", `Vous avez déjà réintégré plus que le cumul à date (écart : ${nf.format(out.fis.over)} €).`]);

    const wb = [];
    wb.push('<?xml version="1.0" encoding="UTF-8"?>');
    wb.push('<?mso-application progid="Excel.Sheet"?>');
    wb.push('<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">');

    // Styles
    wb.push('<Styles>');
    wb.push('<Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="11"/><Borders/></Style>');
    wb.push('<Style ss:ID="sTitle"><Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#6E398E"/><Alignment ss:Horizontal="Left" ss:Vertical="Center"/></Style>');
    wb.push('<Style ss:ID="sH"><Font ss:Size="12" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#6E398E" ss:Pattern="Solid"/><Alignment ss:Horizontal="Left"/></Style>');
    wb.push('<Style ss:ID="sSubH"><Font ss:Bold="1" ss:Color="#6E398E"/><Interior ss:Color="#F5F2FA" ss:Pattern="Solid"/><Alignment ss:Horizontal="Left"/></Style>');
    wb.push('<Style ss:ID="sLabel"><Font ss:Bold="1" ss:Color="#2B2B2B"/><Alignment ss:Horizontal="Left"/></Style>');
    wb.push('<Style ss:ID="sText"><Alignment ss:Horizontal="Left" ss:WrapText="1"/></Style>');
    wb.push('<Style ss:ID="sNum"><NumberFormat ss:Format="0.00"/><Alignment ss:Horizontal="Right"/></Style>');
    wb.push('<Style ss:ID="sMoney"><NumberFormat ss:Format="#,##0.00\\ €"/><Alignment ss:Horizontal="Right"/></Style>');
    wb.push('<Style ss:ID="sSmall"><Font ss:Size="9" ss:Color="#555555"/><Alignment ss:Horizontal="Left" ss:WrapText="1"/></Style>');
    wb.push('</Styles>');

    function ws(name, rows, colWidths){
      wb.push(`<Worksheet ss:Name="${xmlEsc(name)}"><Table>`);
      if(colWidths && colWidths.length){
        colWidths.forEach(w => wb.push(`<Column ss:AutoFitWidth="0" ss:Width="${w}"/>`));
      }
      rows.forEach(r => {
        wb.push('<Row>');
        r.forEach(c => {
          const val = c.v ?? "";
          const style = c.s ? ` ss:StyleID="${c.s}"` : '';
          const type = c.t || (typeof val === 'number' ? 'Number' : 'String');
          const data = (type==='Number' && val!=="" && !isNaN(Number(val))) ? String(Number(val)) : xmlEsc(val);
          wb.push(`<Cell${style}><Data ss:Type="${type}">${data}</Data></Cell>`);
        });
        wb.push('</Row>');
      });
      wb.push('</Table></Worksheet>');
    }

    // Sheet Synthese
    const rowsSyn = [];
    rowsSyn.push([{v:`Koesio Data Solutions — Réintégration sociale & fiscale`, s:'sTitle'} , {v:''},{v:''}]);
    rowsSyn.push([{v:`Export généré le ${now.toLocaleString('fr-FR')}`, s:'sSmall'},{v:''},{v:''}]);
    rowsSyn.push([{v:''},{v:''},{v:''}]);
    rowsSyn.push([{v:'Synthèse', s:'sH'},{v:'', s:'sH'},{v:'', s:'sH'}]);
    synth.forEach(([k,v])=>{
      rowsSyn.push([{v:k, s:'sLabel'},{v:v, s: (typeof v==='number'?'sMoney':'sText'), t: (typeof v==='number'?'Number':'String')},{v:''}]);
    });
    if(warnings.length){
      rowsSyn.push([{v:''},{v:''},{v:''}]);
      rowsSyn.push([{v:'Points d’attention', s:'sH'},{v:'', s:'sH'},{v:'', s:'sH'}]);
      warnings.forEach(([k,v])=>{
        rowsSyn.push([{v:k, s:'sLabel'},{v:v, s:'sText'},{v:''}]);
      });
    }
    rowsSyn.push([{v:''},{v:''},{v:''}]);
    rowsSyn.push([{v:'Paramètres', s:'sH'},{v:'', s:'sH'},{v:'', s:'sH'}]);
    [["Année",year],["Mois contrôlé",monthNo],["PASS (annuel)",out.PASS],["PASS prorata période",out.passCap],["PMSS",out.PMSS]].forEach(([k,v])=>{
      rowsSyn.push([{v:k, s:'sLabel'},{v:v, s:(typeof v==='number'?'sMoney':'sText'), t:(typeof v==='number'?'Number':'String')},{v:''}]);
    });
    ws('Synthese', rowsSyn, [420,220,60]);

    // Sheet Entrees
    const rowsIn = [];
    rowsIn.push([{v:'Entrées (saisie cumulée)', s:'sH'},{v:'Valeur', s:'sH'},{v:'Unité', s:'sH'}]);
    inputs.forEach(([k,v])=>{
      const isNum = typeof v === 'number' && !isNaN(v);
      rowsIn.push([
        {v:k, s:'sText'},
        {v:isNum? v : (v===""? "" : String(v)), s:isNum?'sMoney':'sText', t:isNum?'Number':'String'},
        {v: isNum ? '€' : '', s:'sSmall'}
      ]);
    });
    ws('Entrees', rowsIn, [520,220,80]);

    // Sheet Detail Social
    const rowsDS = [];
    rowsDS.push([{v:'Détail — Réintégration sociale', s:'sH'},{v:'Formule', s:'sH'},{v:'Montant', s:'sH'}]);
    rowsDS.push([{v:'Retraite supplémentaire (part employeur)', s:'sSubH'},{v:'', s:'sSubH'},{v:'', s:'sSubH'}]);
    stepsSocRet.forEach(([k,f,v])=> rowsDS.push([{v:k, s:'sText'},{v:f, s:'sSmall'},{v:v, s:'sMoney', t:'Number'}]));
    rowsDS.push([{v:''},{v:''},{v:''}]);
    rowsDS.push([{v:'Prévoyance complémentaire (part employeur)', s:'sSubH'},{v:'', s:'sSubH'},{v:'', s:'sSubH'}]);
    stepsSocPrev.forEach(([k,f,v])=> rowsDS.push([{v:k, s:'sText'},{v:f, s:'sSmall'},{v:v, s:'sMoney', t:'Number'}]));
    rowsDS.push([{v:''},{v:''},{v:''}]);
    rowsDS.push([{v:'Cumul & déclenchement', s:'sSubH'},{v:'', s:'sSubH'},{v:'', s:'sSubH'}]);
    [["Cumul social à date", out.soc.ytd],["Déjà réintégré (cumul mois précédent)", out.soc.appliedPrevYtd],["À réintégrer ce mois", out.soc.delta]].forEach(([k,v])=>{
      rowsDS.push([{v:k, s:'sLabel'},{v:'', s:'sSmall'},{v:v, s:'sMoney', t:'Number'}]);
    });
    ws('Detail Social', rowsDS, [420,360,160]);

    // Sheet Detail Fiscal
    const rowsDF = [];
    rowsDF.push([{v:'Détail — Réintégration fiscale', s:'sH'},{v:'Formule', s:'sH'},{v:'Montant', s:'sH'}]);
    rowsDF.push([{v:'Retraite supplémentaire', s:'sSubH'},{v:'', s:'sSubH'},{v:'', s:'sSubH'}]);
    stepsFisRet.forEach(([k,f,v])=>{
      if(typeof v === 'number'){
        rowsDF.push([{v:k, s:'sText'},{v:f, s:'sSmall'},{v:v, s:'sMoney', t:'Number'}]);
      }else{
        rowsDF.push([{v:k, s:'sText'},{v:f, s:'sSmall'},{v:String(v), s:'sText'}]);
      }
    });
    rowsDF.push([{v:''},{v:''},{v:''}]);
    rowsDF.push([{v:'Prévoyance complémentaire', s:'sSubH'},{v:'', s:'sSubH'},{v:'', s:'sSubH'}]);
    stepsFisPrev.forEach(([k,f,v])=>{
      if(typeof v === 'number'){
        rowsDF.push([{v:k, s:'sText'},{v:f, s:'sSmall'},{v:v, s:'sMoney', t:'Number'}]);
      }else{
        rowsDF.push([{v:k, s:'sText'},{v:f, s:'sSmall'},{v:String(v), s:'sText'}]);
      }
    });
    rowsDF.push([{v:''},{v:''},{v:''}]);
    rowsDF.push([{v:'Cumul & déclenchement', s:'sSubH'},{v:'', s:'sSubH'},{v:'', s:'sSubH'}]);
    [["Cumul fiscal à date", out.fis.ytd],["Déjà réintégré (cumul mois précédent)", out.fis.appliedPrevYtd],["À réintégrer ce mois", out.fis.delta],["… dont cotisations salariales non déductibles", out.fis.deltaSal],["… dont contributions patronales imposables", out.fis.deltaPat]].forEach(([k,v])=>{
      rowsDF.push([{v:k, s:'sLabel'},{v:'', s:'sSmall'},{v:v, s:'sMoney', t:'Number'}]);
    });
    ws('Detail Fiscal', rowsDF, [420,360,160]);

    wb.push('</Workbook>');
    return wb.join('');
  }


  // ===== self-check (anti-régression) =====
  // Objectif : détecter immédiatement une erreur bloquante (DOM manquant / NaN / crash calcul)
  // ===== self-check (anti-régression) =====
  // Objectif : détecter immédiatement une erreur bloquante (DOM manquant / NaN / crash calcul)
  // et afficher un message explicite plutôt qu'un simulateur "silencieux".
  function selfCheck(){
    const requiredIds = [
      'year','period','pass','capMode',
      'rsoc','rfisc','syncR',
      'btnViewExpert','btnOpenDetails','btnOpenRules',
      'resultsCard','coherenceBox','coherenceList'
    ];
    const missing = requiredIds.filter(id => !$(id));
    if(missing.length){
      throw new Error('Auto-test — éléments UI manquants : ' + missing.join(', '));
    }

    // Test calcul minimal sans modifier durablement la saisie utilisateur
    const snapshot = JSON.parse(JSON.stringify(state || {}));
    try{
      // Valeurs minimales plausibles
      const y = Number(state.year) || defaultYear();
      const pass = clamp0(num(state.pass)) || (PASS_BY_YEAR[y] || 48060);
      state.year = String(y);
      state.pass = pass;
      state.period = state.period || defaultPeriod();

      state.rsoc = 10000;
      state.rfisc = 10000;

      state.ret_pat = 1500;
      state.ret_sal = 500;

      state.prev_pat_hors_fs = 600;
      state.prev_pat_fs = 200;
      state.prev_sal = 0;

      state.applied_soc = 0;
      state.applied_fisc = 0;
      state.applied_fisc_sal = null;
      state.applied_fisc_pat = null;

      const out = calc();
      const mustBeNumbers = [
        out?.soc?.ytd, out?.soc?.delta,
        out?.fis?.ytd, out?.fis?.delta
      ];
      if(mustBeNumbers.some(v => typeof v !== 'number' || !isFinite(v))){
        throw new Error('Auto-test — calcul invalide (NaN/Inf) : ' + JSON.stringify(mustBeNumbers));
      }
    }finally{
      // restore state (sans réassigner l'objet)
      Object.keys(snapshot).forEach(k => state[k] = snapshot[k]);
      try{ render(); }catch(_e){ console.error('[KDS] Erreur render après selfCheck:', _e); }
    }

    try{ console.info('[KDS] Auto-test OK'); }catch(_e){ /* console indisponible */ }
  }

// ===== init =====
  try{
    initSelectors();
    load();
    hydrate();
    wire();
    render();
    selfCheck();
  }catch(err){
    showFatal(err);
  }
})();
