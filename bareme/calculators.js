(function(){
  function el(tag, attrs={}, children=[]){
    const e = document.createElement(tag);
    for(const [k,v] of Object.entries(attrs||{})){
      if(k === "class") e.className = v;
      else if(k === "html") e.innerHTML = v;
      else if(k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2).toLowerCase(), v);
      else e.setAttribute(k, v);
    }
    for(const c of children){
      if(c == null) continue;
      e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return e;
  }

  function fmtMoney(n){
    if(n == null || n === "") return "—";
    if(typeof n === "string") return n;
    const v = Number(n);
    if(!Number.isFinite(v)) return "—";
    return v.toLocaleString("fr-FR",{minimumFractionDigits: (v%1?2:0), maximumFractionDigits:2}) + " €";
  }
  function fmtPct(n, digits=2){
    if(n == null || n === "") return "—";
    if(typeof n === "string") return n;
    const v = Number(n);
    if(!Number.isFinite(v)) return "—";
    return v.toLocaleString("fr-FR",{minimumFractionDigits:0, maximumFractionDigits:digits}) + " %";
  }
  function asNumber(v){
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
  }


  function guardNumberInput(input, {min=0, warnAbove=null}={}){
    const hint = el("div",{class:"small", style:"margin-top:4px; opacity:.75"},[""]);
    function check(){
      const v = asNumber(input.value);
      if(Number.isFinite(v) && v < min){
        input.value = String(min);
      }
      const vv = asNumber(input.value);
      if(warnAbove != null && Number.isFinite(vv) && vv >= warnAbove){
        hint.textContent = `Vérifiez la saisie : valeur élevée (${vv}).`;
      }else{
        hint.textContent = "";
      }
    }
    input.addEventListener("input", check);
    return hint;
  }

  function makeCopyButton(getTextFn){
    const btn = el("button",{class:"btn", type:"button"},["Copier le résumé"]);
    btn.addEventListener("click", async ()=>{
      const txt = String(getTextFn?.() || "").replace(/\n{3,}/g,"\n\n").trim();
      if(!txt){ return; }
      try{
        await navigator.clipboard.writeText(txt);
        btn.textContent = "Copié ✅";
        setTimeout(()=> btn.textContent = "Copier le résumé", 1200);
      }catch(e){
        alert("Copie impossible (navigateur).");
      }
    });
    return btn;
  }

  function getParamValue(id, asOf){
    const p = window.MEMO_DATA?.parameters?.[id];
    if(!p) return null;
    const target = new Date(asOf || window.MEMO_DATA.meta.default_as_of);
    const versions = (p.versions || []).slice().sort((a,b)=> new Date(a.from)-new Date(b.from));
    let chosen = versions[0]?.value ?? null;
    for(const ver of versions){
      if(new Date(ver.from) <= target) chosen = ver.value;
    }
    return chosen;
  }

  function strictEnabled(){
    return window.MEMO_STRICT === true;
  }

  function isMissingValue(v){
    return v === null || v === undefined || (typeof v === "number" && !Number.isFinite(v));
  }

  function reqParam(id, asOf, opts){
    const raw = getParamValue(id, asOf);
    if(isMissingValue(raw)) return { ok:false, id, value:null, reason:"missing" };
    if(opts?.type === "number"){
      const n = asNumber(raw);
      if(!Number.isFinite(n)) return { ok:false, id, value:null, reason:"not_number" };
      return { ok:true, id, value:n };
    }
    if(opts?.type === "array"){
      if(!Array.isArray(raw)) return { ok:false, id, value:null, reason:"not_array" };
      return { ok:true, id, value:raw };
    }
    if(opts?.type === "object"){
      if(typeof raw !== "object" || raw === null || Array.isArray(raw)) return { ok:false, id, value:null, reason:"not_object" };
      return { ok:true, id, value:raw };
    }
    return { ok:true, id, value:raw };
  }

  function strictCard(title, missing){
    const list = missing.map(x => `<li><span class="code-chip">${x}</span></li>`).join("");
    const msg = `
      <div class="alert-danger">
        <div class="title">Paramètres manquants (mode strict)</div>
        <div class="small">Ajoutez ces paramètres (avec des versions datées) dans <span class="code-chip">data.js</span> pour activer ce simulateur.</div>
        <ul>${list}</ul>
      </div>`;
    const card = el("section",{class:"calc-card"},[
      el("div",{class:"calc-head"},[
        el("div",{class:"calc-title"},[title]),
        el("div",{class:"calc-sub"},["Impossible de calculer tant que les paramètres sont incomplets."])
      ]),
      el("div",{class:"calc-body", html: msg},[])
    ]);
    return card;
  }

  function sectionTitle(text){
    return el("h4", {}, [text]);
  }

  function buildTRCalculator(asOf){
    if(strictEnabled()){
      const missing = [];
      const required = [
        ["tr.exempt_cap","number"],
        ["tr.employer_min","number"],
        ["tr.employer_max","number"],
      ];
      for(const [id, type] of required){
        const r = reqParam(id, asOf, type ? {type} : undefined);
        if(!r.ok) missing.push(id);
      }
      if(missing.length) return strictCard("Titres‑restaurant", missing);
    }

    const cap = asNumber(getParamValue("tr.exempt_cap", asOf));
    const minPct = asNumber(getParamValue("tr.employer_min", asOf));
    const maxPct = asNumber(getParamValue("tr.employer_max", asOf));

    const face = el("input", {type:"number", step:"0.01", value:"12.00", inputmode:"decimal"});
    const employerMode = el("select", {}, [
      el("option",{value:"pct"},["% employeur"]),
      el("option",{value:"amount"},["€ employeur"])
    ]);
    const employerVal = el("input", {type:"number", step:"0.01", value:"55", inputmode:"decimal"});
    const res = el("div",{class:"result"},[]);
    const copyBtn = makeCopyButton(()=>res.innerText);

    function compute(){
      const faceV = asNumber(face.value);
      const mode = employerMode.value;
      const ev = asNumber(employerVal.value);
      if(!Number.isFinite(faceV) || faceV<=0 || !Number.isFinite(ev) || ev<0){
        res.innerHTML = '<div class="big">—</div><div class="small">Renseignez des valeurs valides.</div>';
        return;
      }
      const employerAmount = mode==="pct" ? (faceV * ev/100) : ev;
      const employerPct = mode==="pct" ? ev : (employerAmount/faceV*100);

      let exempt = 0;
      let reintegrated = 0;
      let msg = [];

      if(employerPct < minPct){
        exempt = 0;
        reintegrated = employerAmount;
        msg.push(`Part employeur < ${minPct}% → réintégration totale (selon mémo).`);
      }else{
        const allowedByPct = Math.min(employerAmount, faceV * maxPct/100);
        exempt = Math.min(allowedByPct, cap);
        reintegrated = Math.max(0, employerAmount - exempt);
        if(employerPct > maxPct){
          msg.push(`Part employeur > ${maxPct}% → la partie au-delà de ${maxPct}% est réintégrée.`);
        }
        if(employerAmount > cap){
          msg.push(`Plafond exonération ${fmtMoney(cap)} → excédent réintégré.`);
        }
      }

      res.innerHTML = "";
      res.appendChild(el("div",{class:"big"},[`${fmtMoney(exempt)} exonérés`]));
      res.appendChild(el("div",{class:"small"},[
        `Participation employeur : ${fmtMoney(employerAmount)} (${employerPct.toFixed(2)}%). `,
        `Montant réintégré : ${fmtMoney(reintegrated)}. `,
        msg.length ? (" " + msg.join(" ")) : ""
      ]));
    }

    face.addEventListener("input", compute);
    employerMode.addEventListener("change", ()=>{
      employerVal.value = employerMode.value==="pct" ? "55" : "6.60";
      compute();
    });
    employerVal.addEventListener("input", compute);
    compute();

    return el("div",{class:"block", id:"calc-tr"},[
      sectionTitle("Simulateur — Titres-restaurant (exonération)"),
      el("div",{class:"note"},[
        `Règles intégrées : part employeur ${minPct}% à ${maxPct}%, plafond exonération ${fmtMoney(cap)}.`
      ]),
      el("div",{class:"form-row"},[
        el("div",{class:"field", style:"grid-column: span 4"},[el("label",{},["Valeur faciale (€)"]), face]),
        el("div",{class:"field", style:"grid-column: span 4"},[el("label",{},["Saisie participation employeur"]), employerMode]),
        el("div",{class:"field", style:"grid-column: span 4"},[el("label",{},["Valeur"]), employerVal]),
      ]),
      res,
      el("div",{style:"margin-top:10px; display:flex; gap:10px; flex-wrap:wrap"},[copyBtn])
    ]);
  }


  function buildRGDUCalculator(asOf){
    if(strictEnabled()){
      const missing = [];
      const required = [
        ["rgdu.tmin","number"],
        ["rgdu.tdelta.lt50","number"],
        ["rgdu.tdelta.ge50","number"],
        ["rgdu.p","number"],
        ["rgcp.hours.month","number"],
        ["rgcp.hours.year","number"],
        ["smic.hourly","number"],
        // Ventilation indicative (optionnelle, mais on la vérifie en mode strict)
        ["rgcp.rates.fnal010.total","number"],
        ["rgcp.rates.fnal010.urssaf","number"],
        ["rgcp.rates.fnal050.total","number"],
        ["rgcp.rates.fnal050.urssaf","number"],
      ];
      for(const [id, type] of required){
        const r = reqParam(id, asOf, type ? {type} : undefined);
        if(!r.ok) missing.push(id);
      }
      if(missing.length) return strictCard("Réduction générale (RGDU) 2026", missing);
    }

    // RGDU / Réduction générale de cotisations patronales (à partir de 2026)
    const Tmin = asNumber(getParamValue("rgdu.tmin", asOf));
    const tdeltaLT50 = asNumber(getParamValue("rgdu.tdelta.lt50", asOf)); // FNAL 0,10%
    const tdeltaGE50 = asNumber(getParamValue("rgdu.tdelta.ge50", asOf)); // FNAL 0,50%
    const P = asNumber(getParamValue("rgdu.p", asOf));

    const hoursMonthDefault = asNumber(getParamValue("rgcp.hours.month", asOf));
    const hoursYearDefault = asNumber(getParamValue("rgcp.hours.year", asOf));
    const smicHourlyDefault = asNumber(getParamValue("smic.hourly", asOf));

    // Ventilation indicative (si les paramètres sont présents)
    const tot010 = asNumber(getParamValue("rgcp.rates.fnal010.total", asOf));
    const urs010 = asNumber(getParamValue("rgcp.rates.fnal010.urssaf", asOf));
    const tot050 = asNumber(getParamValue("rgcp.rates.fnal050.total", asOf));
    const urs050 = asNumber(getParamValue("rgcp.rates.fnal050.urssaf", asOf));

    let period = "month"; // month | year

    const btnMonth = el("button",{class:"seg-btn active", type:"button"},["Mensuel"]);
    const btnYear = el("button",{class:"seg-btn", type:"button"},["Annuel"]);
    const periodUI = el("div",{class:"segmented", role:"group", "aria-label":"Période"},[btnMonth, btnYear]);
    const periodWarn = el("div",{class:"note", style:"margin-top:8px; display:none"},["Vous venez de changer de période : vérifiez brut/heures."]);
    let periodWarnTimer = null;
    function showPeriodWarn(){
      periodWarn.style.display = "";
      if(periodWarnTimer) clearTimeout(periodWarnTimer);
      periodWarnTimer = setTimeout(()=>{ periodWarn.style.display = "none"; }, 7000);
    }
    const effectif = el("select", {}, [
      el("option",{value:"lt50"},["< 50 salariés (FNAL 0,10%)"]),
      el("option",{value:"ge50", selected:"selected"},["≥ 50 salariés (FNAL 0,50%)"])
    ]);

    const gross = el("input", {type:"number", step:"0.01", value:"3000", inputmode:"decimal"});
    const grossHint = guardNumberInput(gross, {min:0, warnAbove:15000});
    const ppv = el("input", {type:"number", step:"0.01", value:"0", inputmode:"decimal"});
    const ppvHint = guardNumberInput(ppv, {min:0, warnAbove:10000});

    const baseHours = el("input", {type:"number", step:"0.01", value:String(hoursMonthDefault || 151.67), inputmode:"decimal"});
    const hs = el("input", {type:"number", step:"0.01", value:"0", inputmode:"decimal"});

    const smicHInput = el("input", {type:"number", step:"0.01", value:String(smicHourlyDefault || 12.02), inputmode:"decimal"});

    // Cas particuliers
    const isInterim = el("input", {type:"checkbox"});
    const isCaisseCP = el("input", {type:"checkbox"});

    const coeffA = el("select", {}, [
      el("option",{value:"1"},["Aucun (A = 1)"]),
      el("option",{value:String(40/35)},["Transport marchandises — courtes distances (A = 40/35)"]),
      el("option",{value:String(45/35)},["Transport marchandises — longues distances (A = 45/35)"]),
      el("option",{value:"custom"},["Autre coefficient A…"])
    ]);
    const coeffACustom = el("input", {type:"number", step:"0.0001", value:"1.0000", inputmode:"decimal", style:"display:none"});

    // Prorata absence / entrée-sortie (optionnel)
    const useProrata = el("input", {type:"checkbox"});
    const remunPerceived = el("input", {type:"number", step:"0.01", value:"", inputmode:"decimal", placeholder:"ex : 2400"});
    const remunTheoretical = el("input", {type:"number", step:"0.01", value:"", inputmode:"decimal", placeholder:"ex : 3000"});

    const prorataHelp = el("div", {class:"note", style:"margin-top:8px; display:none; white-space:pre-wrap"}, []);
    const prorataPerceivedLabel = el("label",{},["Rémunération perçue (sur le mois)"]);
    const prorataTheoreticalLabel = el("label",{},["Rémunération théorique (sur le mois, sans absence/entrée-sortie)"]);

    const prorataInputs = el("div",{class:"form-row", style:"margin-top:8px; display:none"},[
      el("div",{class:"field", style:"grid-column: span 6"},[prorataPerceivedLabel, remunPerceived]),
      el("div",{class:"field", style:"grid-column: span 6"},[prorataTheoreticalLabel, remunTheoretical]),
    ]);

    function updateProrataTexts(){
      const isMonth = (period==="month");
      prorataPerceivedLabel.textContent = isMonth ? "Rémunération perçue (sur le mois)" : "Rémunération perçue (sur l'année)";
      prorataTheoreticalLabel.textContent = isMonth ? "Rémunération théorique (sur le mois, sans absence/entrée-sortie)" : "Rémunération théorique (sur l'année, sans absence/entrée-sortie)";
      remunPerceived.placeholder = isMonth ? "ex : 2400" : "ex : 28800";
      remunTheoretical.placeholder = isMonth ? "ex : 3000" : "ex : 36000";
      prorataHelp.textContent = isMonth
        ? "Prorata (absence / entrée-sortie) : ratio = rémunération perçue / rémunération théorique (mois complet).\nCe ratio est appliqué aux heures SMIC de base, avant ajout des HS/HC."
        : "Prorata (année incomplète / entrée-sortie) : ratio = rémunération perçue / rémunération théorique (année complète).\nCe ratio est appliqué aux heures SMIC de base, avant ajout des HS/HC.";
    }

    const grossLabel = el("label",{},["Rémunération brute mensuelle (€)"]);
    const ppvLabel = el("label",{},["PPV (mensuelle) (€)"]);
    const baseHoursLabel = el("label",{},["Heures SMIC de base (h/mois)"]);
    const hsLabel = el("label",{},["Heures sup./complémentaires (h/mois)"]);
    const res = el("div",{class:"result"},[]);

    function round4(x){
      return Math.round(x*10000)/10000;
    }

    function setPeriod(p){
      const prev = period;
      period = p;
      btnMonth.classList.toggle("active", period==="month");
      btnYear.classList.toggle("active", period==="year");

      grossLabel.textContent = period==="month" ? "Rémunération brute mensuelle (€)" : "Rémunération brute annuelle (€)";
      ppvLabel.textContent = period==="month" ? "PPV (mensuelle) (€)" : "PPV (annuelle) (€)";
      baseHoursLabel.textContent = period==="month" ? "Heures SMIC de base (h/mois)" : "Heures SMIC de base (h/an)";
      hsLabel.textContent = period==="month" ? "Heures sup./complémentaires (h/mois)" : "Heures sup./complémentaires (h/an)";

      // Met à jour la valeur par défaut des heures si l'utilisateur n'a pas touché
      const wanted = period==="month" ? hoursMonthDefault : hoursYearDefault;
      if(String(baseHours.value).trim()===""){
        baseHours.value = String(wanted);
      }
      if(prev !== period) showPeriodWarn();
      updateProrataTexts();
      compute();
    }

    btnMonth.addEventListener("click", ()=>setPeriod("month"));
    btnYear.addEventListener("click", ()=>setPeriod("year"));

    function compute(){
      const g = asNumber(gross.value);
      const p = asNumber(ppv.value);
      const bh = asNumber(baseHours.value);
      const h = asNumber(hs.value);
      const smicH = asNumber(smicHInput.value);

      if(!Number.isFinite(g) || g<0 || !Number.isFinite(p) || p<0 || !Number.isFinite(bh) || bh<0 || !Number.isFinite(h) || h<0 || !Number.isFinite(smicH) || smicH<=0){
        res.innerHTML = '<div class="big">—</div><div class="small">Renseignez des valeurs valides.</div>';
        return;
      }

      const remun = g + p;
      if(remun <= 0){
        res.innerHTML = '<div class="big">—</div><div class="small">La rémunération (brut + PPV) doit être > 0.</div>';
        return;
      }

      // Prorata (absence / entrée-sortie) (optionnel)
      let ratio = 1;
      let ratioMsg = "";
      if(useProrata.checked){
        const rp = asNumber(remunPerceived.value);
        const rt = asNumber(remunTheoretical.value);
        if(!Number.isFinite(rp) || rp<0 || !Number.isFinite(rt) || rt<=0){
          const completeLbl = (period==="month") ? "mois complet" : "année complète";
          res.innerHTML = `<div class="big">—</div><div class="small">Prorata (absence / entrée-sortie) : renseignez une rémunération perçue ≥ 0 et une rémunération théorique (${completeLbl}) > 0.</div>`;
          return;
        }
        ratio = rp / rt;
        ratioMsg = `Prorata (absence / entrée-sortie) : ratio = ${ratio.toFixed(4).replace(".",",")} (perçue ${fmtMoney(rp)} / théorique ${fmtMoney(rt)}).`;
      }

      const baseAdj = bh * ratio;
      const hoursRef = baseAdj + h; // HS/HC ajoutées sans majoration

      // Coefficients de majoration du SMIC (cas particuliers)
      let mult = 1;

      // Intérim (hors CDI intérimaire) : × 1,1
      if(isInterim.checked) mult *= 1.1;

      // Caisse congés payés : × (100/90)
      if(isCaisseCP.checked) mult *= (100/90);

      // Coefficient A (transport routier de marchandises)
      let A = 1;
      if(coeffA.value === "custom"){
        const a = asNumber(coeffACustom.value);
        if(!Number.isFinite(a) || a<=0){
          res.innerHTML = '<div class="big">—</div><div class="small">Coefficient A : renseignez une valeur > 0.</div>';
          return;
        }
        A = a;
      }else{
        A = asNumber(coeffA.value);
      }
      mult *= A;

      const smicRef = hoursRef * smicH * mult; // 1 SMIC de référence sur la période
      const tdelta = (effectif.value === "lt50") ? tdeltaLT50 : tdeltaGE50;
      const tmax = Tmin + tdelta;

      // Formule : C = Tmin + (Tdelta × [(1/2) × ((3 × SMIC / rémunération) – 1)] ^ P)
      const inside = 0.5 * (((3 * smicRef) / remun) - 1);
      const powered = Math.pow(Math.max(0, inside), P);
      let C = Tmin + (tdelta * powered);

      // plafond C (au niveau du SMIC)
      C = Math.min(C, tmax);

      // La réduction doit être nulle à partir de 3 SMIC (au-delà du champ)
      if(remun >= 3 * smicRef) C = 0;

      C = round4(C);
      const reduction = remun * C;

      // Ventilation URSSAF / AGIRC-ARRCO (approx. selon taux du mémo)
      const totalRate = (effectif.value === "lt50") ? tot010 : tot050;
      const urssafRate = (effectif.value === "lt50") ? urs010 : urs050;
      const urssafShare = (Number.isFinite(totalRate) && totalRate>0 && Number.isFinite(urssafRate)) ? (urssafRate/totalRate) : null;
      const partUrssaf = (urssafShare==null) ? null : reduction * urssafShare;
      const partAgirc = (urssafShare==null) ? null : (reduction - partUrssaf);

      const periodLbl = period==="month" ? "mensuelle" : "annuelle";
      res.innerHTML = "";
      res.appendChild(el("div",{class:"big"},[fmtMoney(reduction)]));
      res.appendChild(el("div",{class:"small"},[
        `Réduction ${periodLbl} estimée (coefficient C = ${String(C).replace('.',',')}).`,
        el("br"),
        `Seuil 3 SMIC (${periodLbl}) ≈ ${fmtMoney(3*smicRef)} (au-delà : C = 0).`
      ]));

      const lines = [];
      lines.push(`Paramètres : Tmin=${Tmin} ; Tdelta=${tdelta} ; P=${P}`);
      lines.push(`SMIC horaire : ${smicH.toLocaleString("fr-FR",{minimumFractionDigits:2, maximumFractionDigits:2})} €`);
      lines.push(`Heures SMIC : base ${baseAdj.toLocaleString("fr-FR",{maximumFractionDigits:2})} h + HS/HC ${h.toLocaleString("fr-FR",{maximumFractionDigits:2})} h`);
      if(ratioMsg) lines.push(ratioMsg);
      if(isInterim.checked) lines.push("Majoration intérim : × 1,1");
      if(isCaisseCP.checked) lines.push("Majoration caisse congés payés : × (100/90)");
      if(A !== 1) lines.push(`Coefficient A (transport) : × ${A.toFixed(4).replace(".",",")}`);
      if(mult !== 1) lines.push(`Majoration totale SMIC : × ${mult.toFixed(4).replace(".",",")}`);
      lines.push(`SMIC retenu sur la période : ${fmtMoney(smicRef)} (pour 1 SMIC)`);
      lines.push(`Montant de la réduction = (brut + PPV) × C`);

      res.appendChild(el("div",{class:"note", style:"margin-top:10px; white-space:pre-wrap"},[lines.join("\n")]));

      if(partUrssaf != null){
        res.appendChild(el("div",{class:"note", style:"margin-top:10px; white-space:pre-wrap"},[
          `Ventilation indicative :
- URSSAF ≈ ${fmtMoney(partUrssaf)}
- AGIRC-ARRCO ≈ ${fmtMoney(partAgirc)}`
        ]));
      }
    }

    function syncCoeffAUI(){
      coeffACustom.style.display = (coeffA.value === "custom") ? "" : "none";
      compute();
    }
    function syncProrataUI(){
      const show = useProrata.checked;
      if(show) updateProrataTexts();
      prorataHelp.style.display = show ? "" : "none";
      prorataInputs.style.display = show ? "grid" : "none";
      compute();
    }

    gross.addEventListener("input", compute);
    ppv.addEventListener("input", compute);
    baseHours.addEventListener("input", compute);
    hs.addEventListener("input", compute);
    smicHInput.addEventListener("input", compute);
    effectif.addEventListener("change", compute);
    isInterim.addEventListener("change", compute);
    isCaisseCP.addEventListener("change", compute);
    coeffA.addEventListener("change", syncCoeffAUI);
    coeffACustom.addEventListener("input", compute);
    useProrata.addEventListener("change", syncProrataUI);
    remunPerceived.addEventListener("input", compute);
    remunTheoretical.addEventListener("input", compute);

    // init
    updateProrataTexts();
    syncCoeffAUI();
    syncProrataUI();
    compute();

    return el("div",{class:"block", id:"calc-rgdu"},[
      sectionTitle("Simulateur — Réduction générale (RGDU) 2026"),
      el("div",{class:"note", style:"background:#fff3cd; border-left:4px solid #ffc107; padding:16px; margin-bottom:16px"},[
        el("strong",{style:"display:block; margin-bottom:8px; color:#856404"},["⚠️ Simulateur simplifié"]),
        el("div",{style:"margin-bottom:12px; color:#856404"},["Ce simulateur couvre les cas courants sans particularité. Pour des calculs plus complexes ou des situations spécifiques, utilisez le simulateur complet."]),
        el("a",{
          href:((window.PAIEKIPEDIA_CONFIG||{}).URL_RGDU||"../outils/rgdu/"),
          target:"_blank",
          rel:"noopener noreferrer",
          class:"btn",
          style:"display:inline-flex; align-items:center; gap:8px; background:#6e398e; color:white; border:none; padding:8px 16px; font-size:14px"
        },[
          el("span",{},["🧮"]),
          el("span",{},["Simulateur RGDU complet"])
        ])
      ]),
      el("div",{class:"note", style:"white-space:pre-wrap"},[
        `Formule 2026 : C = Tmin + (Tdelta × [(1/2) × ((3 × SMIC / rémunération) – 1)]^P), plafonné à Tmin + Tdelta.
La réduction est nulle à partir de 3 SMIC. La rémunération inclut la PPV (même si exonérée).
Cas intégrés : intérim (×1,1), caisse congés payés (×100/90), coefficient A (transport), prorata (absence / entrée-sortie).`
      ]),
      el("div",{class:"form-row"},[
        el("div",{class:"field", style:"grid-column: span 6"},[el("label",{},["Période"]), periodUI, periodWarn]),
        el("div",{class:"field", style:"grid-column: span 6"},[el("label",{},["Effectif / FNAL"]), effectif]),
        el("div",{class:"field", style:"grid-column: span 6"},[grossLabel, gross, grossHint]),
        el("div",{class:"field", style:"grid-column: span 6"},[ppvLabel, ppv, ppvHint]),
        el("div",{class:"field", style:"grid-column: span 6"},[baseHoursLabel, baseHours]),
        el("div",{class:"field", style:"grid-column: span 6"},[hsLabel, hs]),
        el("div",{class:"field", style:"grid-column: span 6"},[el("label",{},["SMIC horaire (€)"]), smicHInput]),
        el("div",{class:"field", style:"grid-column: span 6"},[
          el("label",{},["Cas particuliers (majoration SMIC)"]),
          el("div",{style:"display:flex; gap:14px; align-items:center; flex-wrap:wrap; padding-top:6px"},[
            el("label",{class:"chk"},[isInterim, el("span",{},["Intérim ×1,1"])]),
            el("label",{class:"chk"},[isCaisseCP, el("span",{},["Caisse CP ×100/90"])]),
          ])
        ]),
        el("div",{class:"field", style:"grid-column: span 6"},[el("label",{},["Coefficient A (transport)"]), coeffA]),
        el("div",{class:"field", style:"grid-column: span 6"},[el("label",{},["Coefficient A — valeur"]), coeffACustom]),
        el("div",{class:"field", style:"grid-column: span 12"},[
          el("label",{style:"display:flex; gap:8px; align-items:center"},[useProrata, el("span",{},["Prorata (absence / entrée-sortie)"])]),
          prorataHelp,
          prorataInputs
        ]),
      ]),
      res,
      el("div",{style:"display:flex; gap:10px; flex-wrap:wrap"},[makeCopyButton(()=>res.innerText)])
    ]);
}


  function buildIKCalculator(asOf){
    if(strictEnabled()){
      const missing = [];
      const required = [
        ["ik.rules","object"],
      ];
      for(const [id, type] of required){
        const r = reqParam(id, asOf, type ? {type} : undefined);
        if(!r.ok) missing.push(id);
      }

      const rules = getParamValue("ik.rules", asOf);
      if(rules){
        if(!Array.isArray(rules.bands) || rules.bands.length===0) missing.push("ik.rules.bands");
        if(!(Number.isFinite(asNumber(rules.threshold1)))) missing.push("ik.rules.threshold1");
        if(!(Number.isFinite(asNumber(rules.threshold2)))) missing.push("ik.rules.threshold2");
        // validate band structure
        if(Array.isArray(rules.bands)){
          const b0 = rules.bands[0];
          if(!b0 || !b0.t1 || !b0.t2 || !b0.t3) missing.push("ik.rules.bands[*].t1/t2/t3");
        }
      }

      if(missing.length) return strictCard("Indemnités kilométriques", missing);
    }

    const rules = getParamValue("ik.rules", asOf);
    const bands = Array.isArray(rules?.bands) ? rules.bands : [];
    const t1 = rules?.threshold1;
    const t2 = rules?.threshold2;

    const bandSel = el("select", {}, bands.map(b => el("option",{value:b.key},[b.label])));
    const dist = el("input", {type:"number", step:"1", value:"3500", inputmode:"numeric"});
    const res = el("div",{class:"result"},[]);
    const copyBtn = makeCopyButton(()=>res.innerText);

    function compute(){
      const d = asNumber(dist.value);
      const b = bands.find(x=>x.key===bandSel.value) || bands[0];
      if(!Number.isFinite(d) || d<0 || !b){
        res.innerHTML = '<div class="big">—</div><div class="small">Renseignez une distance valide.</div>';
        return;
      }
      let amount = 0;
      let used = "";
      if(d <= t1){
        amount = d*b.t1.k + b.t1.b;
        used = `d × ${b.t1.k}`;
      }else if(d <= t2){
        amount = d*b.t2.k + b.t2.b;
        used = `(d × ${b.t2.k}) + ${b.t2.b}`;
      }else{
        amount = d*b.t3.k + b.t3.b;
        used = `d × ${b.t3.k}`;
      }
      res.innerHTML = "";
      res.appendChild(el("div",{class:"big"},[fmtMoney(amount)]));
      res.appendChild(el("div",{class:"small"},[
        `Barème voiture — seuils ${t1.toLocaleString("fr-FR")} km et ${t2.toLocaleString("fr-FR")} km. Formule utilisée : ${used}.`
      ]));
    }

    bandSel.addEventListener("change", compute);
    dist.addEventListener("input", compute);
    compute();

    return el("div",{class:"block", id:"calc-ik"},[
      sectionTitle("Simulateur — Indemnités kilométriques (voiture)"),
      el("div",{class:"note"},["d = distance parcourue en kilomètres."]),
      el("div",{class:"form-row"},[
        el("div",{class:"field", style:"grid-column: span 6"},[el("label",{},["Puissance fiscale"]), bandSel]),
        el("div",{class:"field", style:"grid-column: span 6"},[el("label",{},["Distance (km)"]), dist]),
      ]), res,
      el("div",{style:"display:flex; gap:10px; flex-wrap:wrap"},[makeCopyButton(()=>res.innerText)])
    ]);
  }

  function buildLogementCalculator(asOf){
    if(strictEnabled()){
      const missing = [];
      const required = [
        ["aen.logement.brackets","array"],
      ];
      for(const [id, type] of required){
        const r = reqParam(id, asOf, type ? {type} : undefined);
        if(!r.ok) missing.push(id);
      }
      if(missing.length) return strictCard("Avantage en nature — logement", missing);
    }

    const brackets = getParamValue("aen.logement.brackets", asOf) || [];
    const salary = el("input", {type:"number", step:"0.01", value:"2400", inputmode:"decimal"});
    const rooms = el("select", {}, [
      el("option",{value:"one"},["1 pièce"]),
      el("option",{value:"multi"},["Plusieurs pièces"])
    ]);
    const res = el("div",{class:"result"},[]);
    const copyBtn = makeCopyButton(()=>res.innerText);

    function parseRange(s){
      // Very small helper to approximate bracket selection from display string.
      // We keep this simple: the JSON is the source of truth; edit it if needed.
      const cleaned = s.replace(/\s/g,"").replace("€","");
      if(cleaned.startsWith("<")){
        const max = asNumber(cleaned.slice(1));
        return {min:-Infinity, max};
      }
      if(cleaned.startsWith("≥")){
        const min = asNumber(cleaned.slice(1));
        return {min, max: Infinity};
      }
      const parts = cleaned.split("–");
      if(parts.length===2){
        return {min: asNumber(parts[0]), max: asNumber(parts[1])};
      }
      return {min:-Infinity,max:Infinity};
    }

    const parsed = brackets.map(b=>({ ...b, _r: parseRange(b.range) }));

    function compute(){
      const s = asNumber(salary.value);
      if(!Number.isFinite(s) || s<0){
        res.innerHTML = '<div class="big">—</div><div class="small">Renseignez un brut mensuel valide.</div>';
        return;
      }
      const row = parsed.find(b => s < b._r.max && s >= b._r.min) || parsed[parsed.length-1];
      const v = rooms.value==="one" ? row.one_room : row.multi_room;

      res.innerHTML = "";
      res.appendChild(el("div",{class:"big"},[fmtMoney(v)]));
      res.appendChild(el("div",{class:"small"},[
        `Barème logement — tranche : ${row.range}.`
      ]));
    }

    salary.addEventListener("input", compute);
    rooms.addEventListener("change", compute);
    compute();

    return el("div",{class:"block", id:"calc-logement"},[
      sectionTitle("Simulateur — Avantage en nature logement"),
      el("div",{class:"note"},["Valeur forfaitaire mensuelle (incluant accessoires : chauffage, électricité, etc.)."]),
      el("div",{class:"form-row"},[
        el("div",{class:"field", style:"grid-column: span 6"},[el("label",{},["Rémunération brute mensuelle (€)"]), salary]),
        el("div",{class:"field", style:"grid-column: span 6"},[el("label",{},["Type de logement"]), rooms]),
      ]), res,
      el("div",{style:"display:flex; gap:10px; flex-wrap:wrap"},[makeCopyButton(()=>res.innerText)])
    ]);
  }



  function buildGarnishmentCalculator(asOf){
    if(strictEnabled()){
      const missing = [];
      const required = [
        ["garnish.thresholds","array"],
        ["garnish.fractions","array"],
        ["garnish.dependent_allowance","number"],
        ["garnish.rsa_floor.metro","number"],
        ["garnish.rsa_floor.mayotte","number"],
      ];
      for(const [id, type] of required){
        const r = reqParam(id, asOf, type ? {type} : undefined);
        if(!r.ok) missing.push(id);
      }
      if(missing.length) return strictCard("Saisie sur rémunérations", missing);
    }

    const baseThresholds = getParamValue("garnish.thresholds", asOf) || [];
    const fractions = getParamValue("garnish.fractions", asOf) || [];
    const allowance = asNumber(getParamValue("garnish.dependent_allowance", asOf));

    const rsaMetro = asNumber(getParamValue("garnish.rsa_floor.metro", asOf));
    const rsaMayotte = asNumber(getParamValue("garnish.rsa_floor.mayotte", asOf));

    // Default: mensuel
    let period = "month";
    let autoFloor = true;

    const btnMonth = el("button",{class:"seg-btn active", type:"button"},["Mensuel"]);
    const btnYear = el("button",{class:"seg-btn", type:"button"},["Annuel"]);
    const periodUI = el("div",{class:"segmented", role:"group", "aria-label":"Période"},[btnMonth, btnYear]);

    const zone = el("select", {}, [
      el("option",{value:"metro", selected:"selected"},["Métropole & DOM"]),
      el("option",{value:"mayotte"},["Mayotte"])
    ]);

    const amount = el("input", {type:"number", step:"0.01", value:"2500", inputmode:"decimal"});
    const deps = el("input", {type:"number", step:"1", value:"0", min:"0", inputmode:"numeric"});

    const floor = el("input", {type:"number", step:"0.01", value:"0", min:"0", inputmode:"decimal"});

    const amountLabel = el("label",{},["Rémunération nette mensuelle (€)"]);
    const floorLabel = el("label",{},["Plancher à laisser (RSA — personne seule)"]);
    const res = el("div",{class:"result"},[]);
    const copyBtn = makeCopyButton(()=>res.innerText);

    function floorDefault(){
      const base = (zone.value === "mayotte") ? rsaMayotte : rsaMetro;
      const v = (period === "month") ? base : (base * 12);
      return Number.isFinite(v) ? v : 0;
    }

    function syncFloorDefault(force=false){
      if(force) autoFloor = true;
      if(autoFloor){
        const v = floorDefault();
        floor.value = (Math.round(v*100)/100).toFixed(2);
      }
    }

    function setPeriod(p){
      period = p;
      btnMonth.classList.toggle("active", period==="month");
      btnYear.classList.toggle("active", period==="year");
      amountLabel.textContent = period==="month" ? "Rémunération nette mensuelle (€)" : "Rémunération nette annuelle (€)";
      syncFloorDefault();
      compute();
    }
    btnMonth.addEventListener("click", ()=>setPeriod("month"));
    btnYear.addEventListener("click", ()=>setPeriod("year"));

    zone.addEventListener("change", ()=>{
      syncFloorDefault(true);
      compute();
    });

    floor.addEventListener("input", ()=>{
      autoFloor = false;
      compute();
    });

    function compute(){
      const a = asNumber(amount.value);
      const n = Math.max(0, Math.floor(asNumber(deps.value)));
      const f = Math.max(0, asNumber(floor.value));

      if(!Number.isFinite(a) || a < 0){
        res.innerHTML = '<div class="big">—</div><div class="small">Renseignez une rémunération valide.</div>';
        return;
      }

      const annual = period==="month" ? a*12 : a;

      // Helper for display (keep calculations annual, but show brackets in the selected period)
      const inPeriod = (v)=> period==="month" ? (v/12) : v;

      // Majoration des seuils selon le nombre de personnes à charge
      const thresholds = baseThresholds.map(t => t + (allowance * n));
      const bands = [];
      let prev = 0;
      let totalSeize = 0;

      for(let i=0; i<thresholds.length; i++){
        const upper = thresholds[i];
        const frac = fractions[i] ?? 0;
        const base = Math.max(0, Math.min(annual, upper) - prev);
        const seize = base * frac;
        bands.push({
          range:`${fmtMoney(inPeriod(prev))} – ${fmtMoney(inPeriod(upper))}`,
          frac,
          seize
        });
        totalSeize += seize;
        prev = upper;
      }
      // Dernière tranche : au-delà du dernier seuil
      const lastFrac = fractions[thresholds.length] ?? 1;
      const lastBase = Math.max(0, annual - prev);
      const lastSeize = lastBase * lastFrac;
      bands.push({
        range:`≥ ${fmtMoney(inPeriod(prev))}`,
        frac:lastFrac,
        seize:lastSeize
      });
      totalSeize += lastSeize;

      const outRaw = period==="month" ? totalSeize/12 : totalSeize;

      // Plancher RSA : on ne peut pas saisir plus que (rémunération - plancher)
      const maxByFloor = Math.max(0, a - f);
      const out = Math.min(outRaw, maxByFloor);

      const table = el("table",{class:"table"});
      table.appendChild(el("thead",{},[
        el("tr",{},[
          el("th",{},[`Tranche (${period==="month" ? "mensuelle" : "annuelle"}, seuils majorés)`]),
          el("th",{},["Taux de saisie"]),
          el("th",{},[`Max saisissable ${period==="month" ? "mensuel" : "annuel"}`])
        ])
      ]));
      const tbody = el("tbody");
      for(const b of bands){
        const seizePeriod = period==="month" ? (b.seize/12) : b.seize;
        tbody.appendChild(el("tr",{},[
          el("td",{},[b.range]),
          el("td",{},[fmtPct((b.frac||0)*100, 0)]),
          el("td",{},[fmtMoney(seizePeriod)])
        ]));
      }
      table.appendChild(tbody);

      res.innerHTML = "";
      res.appendChild(el("div",{class:"big"},[fmtMoney(out)]));
      res.appendChild(el("div",{class:"small"},[
        `Montant maximal ${period==="month" ? "mensuel" : "annuel"} saisissable (hors pension alimentaire).`,
        el("br"),
        `Personnes à charge : ${n}. Seuils majorés de ${fmtMoney(allowance)} / personne (base annuelle).`,
        el("br"),
        `Avant plancher RSA : ${fmtMoney(outRaw)} — Plancher appliqué : ${fmtMoney(f)} → plafond (rémunération - plancher) : ${fmtMoney(maxByFloor)}.`
      ]));
      res.appendChild(el("div",{class:"note", style:"margin-top:10px; white-space:pre-wrap"},[
        "Important : ce simulateur donne une estimation du maximum saisissable selon le barème (et un plancher RSA). " +
        "Le résultat dépend du “net saisissable” retenu, des priorités de créances, et de la procédure."
      ]));
      res.appendChild(table);
    }

    amount.addEventListener("input", compute);
    deps.addEventListener("input", compute);

    syncFloorDefault(true);
    compute();

    return el("div",{class:"block", id:"calc-garnish"},[
      sectionTitle("Simulateur — Saisie sur rémunérations (maximum)"),
      el("div",{class:"form-row"},[
        el("div",{class:"field", style:"grid-column: span 12"},[el("label",{},["Période"]), periodUI]),
        el("div",{class:"field", style:"grid-column: span 4"},[el("label",{},["Zone"]), zone]),
        el("div",{class:"field", style:"grid-column: span 4"},[amountLabel, amount]),
        el("div",{class:"field", style:"grid-column: span 4"},[el("label",{},["Personnes à charge"]), deps]),
        el("div",{class:"field", style:"grid-column: span 12"},[floorLabel, floor]),
      ]), res,
      el("div",{style:"display:flex; gap:10px; flex-wrap:wrap"},[makeCopyButton(()=>res.innerText)])
    ]);
  }


  function buildInternshipCalculator(asOf){
    if(strictEnabled()){
      const missing = [];
      const required = [
        ["pss.hourly","number"],
        ["stage.gratification.rate","number"],
      ];
      for(const [id, type] of required){
        const r = reqParam(id, asOf, type ? {type} : undefined);
        if(!r.ok) missing.push(id);
      }
      if(missing.length) return strictCard("Gratification de stage", missing);
    }

    const pssHourly = asNumber(getParamValue("pss.hourly", asOf));
    const rate = asNumber(getParamValue("stage.gratification.rate", asOf));

    const hours = el("input", {type:"number", step:"0.01", value:"154", inputmode:"decimal"});
    const paid = el("input", {type:"number", step:"0.01", value:"0", inputmode:"decimal"});
    const res = el("div",{class:"result"},[]);
    const copyBtn = makeCopyButton(()=>res.innerText);

    function compute(){
      const h = asNumber(hours.value);
      const p = asNumber(paid.value);
      if(!Number.isFinite(h) || h<0 || !Number.isFinite(pssHourly) || pssHourly<=0 || !Number.isFinite(rate) || rate<=0){
        res.innerHTML = '<div class="big">—</div><div class="small">Renseignez des valeurs valides.</div>';
        return;
      }
      const hourlyMin = pssHourly * rate;
      const min = h * hourlyMin;
      const diff = (Number.isFinite(p) && p>0) ? (p - min) : null;

      res.innerHTML = "";
      res.appendChild(el("div",{class:"big"},[fmtMoney(min)]));
      res.appendChild(el("div",{class:"small"},[
        `Minimum estimé (taux ${fmtPct(rate*100, 2)} du plafond horaire SS).`,
        el("br"),
        `Taux horaire minimal ≈ ${fmtMoney(hourlyMin)} / h.`
      ]));
      if(diff != null){
        res.appendChild(el("div",{class:"note", style:"margin-top:10px; white-space:pre-wrap"},[
          diff >= 0
            ? `Gratification saisie : ${fmtMoney(p)} (au-dessus du minimum de ${fmtMoney(min)} ; écart +${fmtMoney(diff)}).`
            : `Gratification saisie : ${fmtMoney(p)} (en-dessous du minimum de ${fmtMoney(min)} ; manque ${fmtMoney(-diff)}).`
        ]));
      }
    }

    hours.addEventListener("input", compute);
    paid.addEventListener("input", compute);
    compute();

    return el("div",{class:"block", id:"calc-stage"},[
      sectionTitle("Simulateur — Gratification de stage (minimum)"),
      el("div",{class:"note", style:"white-space:pre-wrap"},[
        "Calcul : gratification minimale ≈ (heures effectuées) × (plafond horaire SS) × 15% (paramétrable)."
      ]),
      el("div",{class:"form-row"},[
        el("div",{class:"field", style:"grid-column: span 6"},[el("label",{},["Heures effectuées"]), hours]),
        el("div",{class:"field", style:"grid-column: span 6"},[el("label",{},["Gratification versée (€) — optionnel"]), paid]),
      ]), res,
      el("div",{style:"display:flex; gap:10px; flex-wrap:wrap"},[makeCopyButton(()=>res.innerText)])
    ]);
  }

function buildPASNeutralCalculator(asOf){
  if(strictEnabled()){
    const missing = [];
    const required = [
      ["pas.neutral.metropole.monthly.brackets","array"],
    ];
    for(const [id, type] of required){
      const r = reqParam(id, asOf, type ? {type} : undefined);
      if(!r.ok) missing.push(id);
    }
    if(missing.length) return strictCard("Prélèvement à la source (PAS) — taux neutre", missing);
  }

  const brackets = getParamValue("pas.neutral.metropole.monthly.brackets", asOf) || [];

  const net = el("input", {type:"number", step:"0.01", value:"2500.00", inputmode:"decimal"});
  const netHint = guardNumberInput(net, {min:0, warnAbove:15000});
  const res = el("div",{class:"result"},[]);
    const copyBtn = makeCopyButton(()=>res.innerText);

  function labelRange(b){
    const min = (b.min == null) ? null : Number(b.min);
    const max = (b.max == null) ? null : Number(b.max);
    if(min == null && max != null) return `Inférieure à ${max.toLocaleString("fr-FR")} €`;
    if(min != null && max != null) return `De ${min.toLocaleString("fr-FR")} € à < ${max.toLocaleString("fr-FR")} €`;
    if(min != null && max == null) return `À partir de ${min.toLocaleString("fr-FR")} €`;
    return "—";
  }

  function pickBracket(v){
    for(const b of brackets){
      if(!b) continue;
      const minOk = (b.min == null) || (v >= Number(b.min));
      const maxOk = (b.max == null) || (v < Number(b.max));
      if(minOk && maxOk) return b;
    }
    return brackets[brackets.length-1] || null;
  }

  function compute(){
    const v = asNumber(net.value);
    if(!Number.isFinite(v) || v < 0){
      res.innerHTML = '<div class="big">—</div><div class="small">Renseignez un net imposable mensuel valide.</div>';
      return;
    }
    const b = pickBracket(v);
    const rate = b ? asNumber(b.rate) : NaN;
    const amount = (Number.isFinite(rate)) ? (v * rate / 100) : NaN;

    res.innerHTML = "";
    res.appendChild(el("div",{class:"big"},[Number.isFinite(amount) ? fmtMoney(amount) : "—"]));
    res.appendChild(el("div",{class:"small"},[
      `Taux neutre (métropole) : ${Number.isFinite(rate) ? fmtPct(rate, 1) : "—"} — assiette : ${fmtMoney(v)} (net imposable).`
    ]));
    if(b){
      res.appendChild(el("div",{class:"note", style:"margin-top:10px; white-space:pre-wrap"},[
        `Tranche : ${labelRange(b)}.`
      ]));
    }
  }

  net.addEventListener("input", compute);
  compute();

  return el("div",{class:"block", id:"calc-pas"},[
      sectionTitle("Simulateur — PAS (taux neutre, métropole, mensuel)"),
    el("div",{class:"note", style:"white-space:pre-wrap"},[
      "Ce simulateur estime le montant du PAS à partir du barème « taux neutre ».\nAssiette : net imposable mensuel.\nRemarque : si un taux DGFiP est transmis, c’est ce taux transmis qui s’applique."
    ]),
    el("div",{class:"form-row"},[
      el("div",{class:"field", style:"grid-column: span 6"},[el("label",{},["Net imposable mensuel (€)"]), net, netHint]),
    ]),
    res,
    el("div",{class:"note", style:"margin-top:10px; white-space:pre-wrap"},[
      "D’autres barèmes existent (DOM, Guyane/Mayotte, périodicités autres que mensuelle…). Se référer à la DGFiP / BOFiP (BOI-BAREME-000037)."
    ])
    ]);
}


  function attachCommonValidations(container){
    // Basic guard: no negative values on numeric inputs
    const inputs = container.querySelectorAll('input[type="number"]');
    inputs.forEach(inp=>{
      inp.addEventListener("input", ()=>{
        const v = asNumber(inp.value);
        if(Number.isFinite(v) && v < 0){
          inp.value = "0";
          // trigger any listeners bound on change/input
          inp.dispatchEvent(new Event("change"));
          inp.dispatchEvent(new Event("input"));
        }
      });
    });
  }

  

  function buildHeuresSupCalculator(asOf){
    if(strictEnabled()){
      const missing = [];
      const required = [
        ["hs.reduc_salariale.taux_max","number"],
        ["hs.ir.exo_cap_net","number"],
        ["hs.ir.exo_cap_brut","number"],
        ["hs.ir.brut_to_net_coef","number"],
        ["hs.patronal.ded_h_lt20","number"],
        ["hs.patronal.ded_h_gt20","number"],
        ["hs.patronal.ded_j_lt20","number"],
        ["hs.patronal.ded_j_gt20","number"],
      ];
      for(const [id,type] of required){
        const r = reqParam(id, asOf, type ? {type} : undefined);
        if(!r.ok) missing.push(id);
      }
      if(missing.length) return strictCard("Heures supplémentaires", missing);
    }

    const tauxMax = asNumber(getParamValue("hs.reduc_salariale.taux_max", asOf));
    const capNet = asNumber(getParamValue("hs.ir.exo_cap_net", asOf));
    const capBrut = asNumber(getParamValue("hs.ir.exo_cap_brut", asOf));
    const coefBN = asNumber(getParamValue("hs.ir.brut_to_net_coef", asOf));

    const dh_lt20 = asNumber(getParamValue("hs.patronal.ded_h_lt20", asOf));
    const dh_gt20 = asNumber(getParamValue("hs.patronal.ded_h_gt20", asOf));
    const dj_lt20 = asNumber(getParamValue("hs.patronal.ded_j_lt20", asOf));
    const dj_gt20 = asNumber(getParamValue("hs.patronal.ded_j_gt20", asOf));

    const kind = el("select",{},[
      el("option",{value:"hs"},["Heures supplémentaires"]),
      el("option",{value:"hc"},["Heures complémentaires (temps partiel)"]),
      el("option",{value:"forfaitj"},["Forfait jours : jours > 218"]),
      el("option",{value:"rtt"},["RTT monétisées (LFR 2022)"]),
    ]);

    const employer = el("select",{},[
      el("option",{value:"lt20"},["< 20 salariés"]),
      el("option",{value:"gt20"},["> 20 salariés (nouvelle tranche)"]),
    ]);

    const qty = el("input",{type:"number", step:"0.01", value:"10", inputmode:"decimal"});
    const gross = el("input",{type:"number", step:"0.01", value:"250", inputmode:"decimal"});

    const rateMode = el("select",{},[
      el("option",{value:"max"},["Taux max (mémo)"]),
      el("option",{value:"custom"},["Taux personnalisé"]),
    ]);
    const rate = el("input",{type:"number", step:"0.01", value:String(tauxMax||11.31), inputmode:"decimal"});
    rate.disabled = true;

    const alreadyNet = el("input",{type:"number", step:"0.01", value:"0", inputmode:"decimal"});

    const res = el("div",{class:"result"},[]);
    const copyBtn = makeCopyButton(()=>res.innerText);

    const qtyLabel = el("div",{class:"small", style:"margin-top:4px; opacity:.75"},[""]);

    function updateLabels(){
      const k = kind.value;
      qtyLabel.textContent = (k==="forfaitj") ? "Saisir un nombre de jours." : "Saisir un nombre d’heures.";
    }

    function compute(){
      const k = kind.value;
      const eff = employer.value;

      const qtyV = asNumber(qty.value);
      const grossV = asNumber(gross.value);
      const alreadyNetV = asNumber(alreadyNet.value);

      let rateV = tauxMax;
      if(rateMode.value === "custom") rateV = asNumber(rate.value);

      if(!Number.isFinite(qtyV) || qtyV<0 || !Number.isFinite(grossV) || grossV<0 || !Number.isFinite(alreadyNetV) || alreadyNetV<0 || !Number.isFinite(rateV) || rateV<0){
        res.innerHTML = '<div class="big">—</div><div class="small">Renseignez des valeurs valides.</div>';
        return;
      }

      // 1) Réduction cotisations salariales (approximation via taux saisi)
      const reduc = grossV * rateV/100;

      // 2) Exonération IR (plafond annuel net imposable)
      const netEq = (Number.isFinite(coefBN) && coefBN>0) ? grossV * coefBN : NaN;
      const capRemain = Math.max(0, capNet - alreadyNetV);
      const exemptNet = Number.isFinite(netEq) ? Math.min(netEq, capRemain) : NaN;
      const taxableNet = Number.isFinite(netEq) ? Math.max(0, netEq - exemptNet) : NaN;
      const exemptGross = (Number.isFinite(exemptNet) && Number.isFinite(coefBN) && coefBN>0) ? (exemptNet/coefBN) : NaN;
      const taxableGross = Number.isFinite(exemptGross) ? Math.max(0, grossV - exemptGross) : NaN;

      // 3) Déduction forfaitaire patronale
      let dedPat = 0;
      let dedInfo = "";
      if(k === "hc"){
        dedPat = 0;
        dedInfo = "Pas de déduction forfaitaire patronale sur heures complémentaires.";
      }else if(k === "forfaitj"){
        const per = (eff==="lt20") ? dj_lt20 : dj_gt20;
        dedPat = qtyV * per;
        dedInfo = `Déduction calculée sur ${qtyV} jour(s).`;
      }else{
        const per = (eff==="lt20") ? dh_lt20 : dh_gt20;
        dedPat = qtyV * per;
        dedInfo = `Déduction calculée sur ${qtyV} heure(s).`;
      }

      const warn = [];
      if(Number.isFinite(netEq) && netEq > capNet) warn.push(`Plafond IR annuel ${fmtMoney(capNet)} (net imposable) : une partie reste imposable.`);
      if(alreadyNetV > capNet) warn.push(`Déjà exonéré (${fmtMoney(alreadyNetV)}) > plafond annuel : plus d’exonération disponible.`);

      res.innerHTML = "";
      res.appendChild(el("div",{class:"big"},["Résultat (indicatif)"]));
      res.appendChild(el("div",{class:"small"},[
        `Base saisie : ${fmtMoney(grossV)} de rémunération brute liée aux heures/jours (majorations incluses).`
      ]));

      res.appendChild(el("div",{class:"block", style:"margin-top:10px"},[
        el("h4",{},["1) Réduction de cotisations salariales"]),
        el("div",{class:"note", style:"white-space:pre-wrap"},[
          `Taux retenu : ${fmtPct(rateV)}.
Réduction estimée : ${fmtMoney(reduc)}.`
        ])
      ]));

      res.appendChild(el("div",{class:"block", style:"margin-top:10px"},[
        el("h4",{},["2) Exonération d’impôt sur le revenu"]),
        el("div",{class:"note", style:"white-space:pre-wrap"},[
          `Net imposable estimé (coef ${coefBN}): ${fmtMoney(netEq)}.
Plafond annuel : ${fmtMoney(capNet)} (reste : ${fmtMoney(capRemain)}).
Exonéré : ${fmtMoney(exemptNet)} (net) ≈ ${fmtMoney(exemptGross)} (brut).
Imposable : ${fmtMoney(taxableNet)} (net) ≈ ${fmtMoney(taxableGross)} (brut).
(Équiv. brut indicatif plafond : ${fmtMoney(capBrut)}.)`
        ])
      ]));

      res.appendChild(el("div",{class:"block", style:"margin-top:10px"},[
        el("h4",{},["3) Déduction forfaitaire patronale"]),
        el("div",{class:"note", style:"white-space:pre-wrap"},[
          `${fmtMoney(dedPat)}.
${dedInfo}`
        ])
      ]));

      if(warn.length){
        res.appendChild(el("div",{class:"note", style:"margin-top:10px; white-space:pre-wrap"},["⚠️ " + warn.join("\n⚠️ ")]));
      }
    }

    function onKindChange(){
      updateLabels();
      if(kind.value === "forfaitj"){
        qty.value = "2";
        gross.value = "600";
      }else{
        qty.value = "10";
        gross.value = "250";
      }
      compute();
    }

    kind.addEventListener("change", onKindChange);
    employer.addEventListener("change", compute);
    qty.addEventListener("input", compute);
    gross.addEventListener("input", compute);
    alreadyNet.addEventListener("input", compute);

    rateMode.addEventListener("change", ()=>{
      rate.disabled = (rateMode.value !== "custom");
      if(rateMode.value === "max") rate.value = String(tauxMax||11.31);
      compute();
    });
    rate.addEventListener("input", compute);

    updateLabels();
    compute();

    return el("div",{class:"block", id:"calc-hs"},[
      sectionTitle("Simulateur — Heures supplémentaires (réduction/IR/déduction patronale)"),
      el("div",{class:"note"},[
        "Saisie volontairement simple : renseignez une rémunération brute totale liée aux heures/jours. " +
        "Résultats indicatifs (à valider selon bulletin et contexte)."
      ]),
      el("div",{class:"form-row"},[
        el("div",{class:"field", style:"grid-column: span 6"},[el("label",{},["Type"]), kind]),
        el("div",{class:"field", style:"grid-column: span 6"},[el("label",{},["Tranche employeur"]), employer]),

        el("div",{class:"field", style:"grid-column: span 4"},[el("label",{},["Quantité (heures/jours)"]), qty, qtyLabel]),
        el("div",{class:"field", style:"grid-column: span 4"},[el("label",{},["Rémunération brute liée aux heures/jours (€)"]), gross]),
        el("div",{class:"field", style:"grid-column: span 4"},[el("label",{},["Déjà exonéré IR cette année (net imposable €)"]), alreadyNet]),

        // Dernière ligne : 2 champs sur 12 colonnes pour un alignement plus propre
        el("div",{class:"field", style:"grid-column: span 6"},[el("label",{},["Taux réduction salariale"]), rateMode]),
        el("div",{class:"field", style:"grid-column: span 6"},[el("label",{},["Taux (%)"]), rate]),
      ]),
      res,
      el("div",{style:"margin-top:10px; display:flex; gap:10px; flex-wrap:wrap"},[copyBtn])
    ]);
  }


  function buildSimTOC(items){
    // items: [{id,title}]
    const links = items.map(it=>{
      const a = el("a",{href:"#"+it.id, class:"toc-link"},[it.title]);
      a.addEventListener("click",(e)=>{
        e.preventDefault();
        document.getElementById(it.id)?.scrollIntoView({behavior:"smooth", block:"start"});
      });
      return a;
    });
    return el("div",{class:"toc"},[
      el("div",{class:"toc-title"},["Sommaire"]),
      el("div",{class:"toc-links"}, links)
    ]);
  }

  window.MEMO_CALCULATORS = {
    render: function(container, asOf, opts){
      const mode = (opts && opts.mode) ? String(opts.mode) : "all";
      container.innerHTML = "";

      try{
        if(mode === "rgdu"){
          container.appendChild(buildRGDUCalculator(asOf));
          attachCommonValidations(container);
          return;
        }

        if(mode === "others"){
          // Redirection vers le portail externe pour tous les autres simulateurs
          const redirectBox = el("div", {class: "note", style: "text-align:center; padding:40px 20px"}, [
            el("h3", {style: "margin-bottom:20px; font-size:20px"}, ["Simulateurs complets disponibles"]),
            el("p", {style: "margin-bottom:24px; opacity:0.9"}, [
              "Tous les simulateurs (PAS, heures supplémentaires, titres-restaurant, saisies, gratification de stage, indemnités kilométriques, avantage logement) sont disponibles sur le portail."
            ]),
            el("a", {
              href: ((window.PAIEKIPEDIA_CONFIG||{}).URL_SIMULATEURS||"../outils/simulateurs/"),
              target: "_blank",
              rel: "noopener noreferrer",
              class: "btn btn-primary",
              style: "display:inline-flex; align-items:center; gap:8px; padding:12px 24px; font-size:16px"
            }, [
              el("span", {}, ["🧮"]),
              el("span", {}, ["Accéder aux simulateurs"])
            ])
          ]);
          container.appendChild(redirectBox);
          return;
        }

        // mode all (rare) : RGDU + autres
        container.appendChild(buildRGDUCalculator(asOf));
        container.appendChild(buildPASNeutralCalculator(asOf));
          container.appendChild(buildHeuresSupCalculator(asOf));
        container.appendChild(buildTRCalculator(asOf));
        container.appendChild(buildGarnishmentCalculator(asOf));
        container.appendChild(buildInternshipCalculator(asOf));
        container.appendChild(buildIKCalculator(asOf));
        container.appendChild(buildLogementCalculator(asOf));
        attachCommonValidations(container);
      }catch(err){
        console.error("Erreur simulateurs:", err);
        container.innerHTML = "";
        container.appendChild(el("div",{class:"note", style:"white-space:pre-wrap"},[
          "Une erreur a empêché l’affichage des simulateurs.\n\n" +
          "Actions :\n" +
          "• Rafraîchir la page (Ctrl+F5 / Cmd+Shift+R)\n" +
          "• Vider le cache SharePoint/Teams si besoin\n\n" +
          "Détail (console) : " + (err && err.message ? err.message : String(err))
        ]));
}
    }
  };
})()
