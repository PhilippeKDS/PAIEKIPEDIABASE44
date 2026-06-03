
// DOM helpers
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

// Mini helper (sécurise les attachements d'événements)
function onSafe(sel, evt, cb){
  const el = document.querySelector(sel);
  if(!el) return;
  el.addEventListener(evt, cb);
}

/* Simulateur RGDU 2026 – KDS (web app offline) */
const STORAGE_KEY = "kds_rgdu_webapp_v1";

const fmtEUR = new Intl.NumberFormat("fr-FR", { style:"currency", currency:"EUR" });
const fmt2 = new Intl.NumberFormat("fr-FR", { minimumFractionDigits:2, maximumFractionDigits:2 });
const fmt4 = new Intl.NumberFormat("fr-FR", { minimumFractionDigits:4, maximumFractionDigits:4 });
const fmt0 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits:0 });


const fmtPct4 = new Intl.NumberFormat("fr-FR", { minimumFractionDigits:4, maximumFractionDigits:4 });

const fmtPct2 = new Intl.NumberFormat("fr-FR", { minimumFractionDigits:0, maximumFractionDigits:2 });
function fmtPct(x){
  if(Number.isNaN(x) || x===null || x===undefined) return "—";
  return fmtPct2.format((Number(x)||0)*100) + " %";
}
function fmtValue(kind, x){
  if(Number.isNaN(x) || x===null || x===undefined) return "—";
  if(kind==="money") return fmtEUR.format(x);
  if(kind==="n4") return fmt4.format(x);
  if(kind==="n2") return fmt2.format(x);
  if(kind==="n0") return fmt0.format(x);
  return String(x);
}

function fmtMoney(x, _label){
  if(Number.isNaN(x) || x===null || x===undefined) return "—";
  return fmtEUR.format(Number(x)||0);
}





function periodize(periodicite, annualValue){
  if(Number.isNaN(annualValue)) return NaN;
  return (periodicite === "Mensuel") ? (annualValue / 12) : annualValue;
}

function round4(x){ return Math.round(x * 10000) / 10000; }
function n(x){
  if(x===null || x===undefined) return NaN;
  const s = String(x).trim().replace(/\s/g,"").replace(",", ".");
  const v = Number(s);
  return Number.isFinite(v) ? v : NaN;
}

function safeText(s){
  return String(s ?? "").replace(/[&<>"']/g, (c)=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;" }[c]));
}

async function loadJSON(path){
  const res = await fetch(path);
  if(!res.ok) throw new Error("Chargement impossible: " + path);
  return await res.json();
}

/** Mapping robuste : évite les soucis d'espaces dans les libellés */
function mapMajoration(label, params){
  const s = String(label || "").toLowerCase();
  if(s.includes("interim")) return params.majoration_interim;
  if(s.includes("conges") || s.includes("ccp")) return params.majoration_ccp;
  return 1;
}
function mapTransport(label, params){
  const s = String(label || "").toLowerCase();
  if(s.includes("grand")) return params.a_grand_routier;
  if(s.includes("courte")) return params.a_courte_distance;
  return 1;
}


function getDfsRate(choice){
  const c = String(choice||"Pas de DFS").trim();
  if(!c || c==="Pas de DFS") return 0;
  // 2026 — Mémo Paie KDS
  if(c.startsWith("Construction")) return 0.07;
  if(c.startsWith("Propreté")) return 0.03;
  if(c.startsWith("Journalistes")) return 0.24;
  if(c.startsWith("Transport routier")) return 0.17;
  if(c.startsWith("Aviation civile")) return 0.26;
  if(c.startsWith("Casino")) return 0.05;
  if(c.startsWith("VRP")) return 0.24;
  if(c.startsWith("Spectacle — musiciens")) return 0.16;
  if(c.startsWith("Spectacle — dramatiques")) return 0.18;
  return 0;
}

function computeRGDU(i, p){
  // Wrapper DFS : double calcul + plafonnement 130% (sans régression si Pas de DFS)
  const dfsRate = getDfsRate(i && i.dfs);
  const r0 = computeRGDU_core({...(i||{}), dfsRate:0}, p);

  if(!dfsRate || dfsRate<=0){
    return { ...r0, dfsRate:0, dfsApplied:false, dfsPlafondApplique:false };
  }

  // Abattement appliqué sur la rémunération de la période (annualisée ensuite).
  const i1 = { ...(i||{}), dfsRate, dfsApplied:true };
  if(Number.isFinite(i1.remunerationPeriode)){
    i1.remunerationPeriode = i1.remunerationPeriode * (1 - dfsRate);
  }
  // PPV : laissée inchangée.
  const r1 = computeRGDU_core(i1, p);

  const plaf130 = (Number.isFinite(r0.reducAnnuelle) ? (1.30 * r0.reducAnnuelle) : NaN);
  const reducFinalAn = (Number.isFinite(plaf130) && Number.isFinite(r1.reducAnnuelle)) ? Math.min(r1.reducAnnuelle, plaf130) : r1.reducAnnuelle;
  const reducFinalMens = Number.isFinite(reducFinalAn) ? (reducFinalAn/12) : NaN;
  const reducFinalAff = (i1.periodicite === "Mensuel") ? reducFinalMens : reducFinalAn;

  const dfsPlafondApplique = (Number.isFinite(plaf130) && Number.isFinite(r1.reducAnnuelle)) ? (r1.reducAnnuelle > plaf130 + 1e-9) : false;
  const coefFinal = (Number.isFinite(reducFinalAn) && Number.isFinite(r1.remunerationAnnuelle) && r1.remunerationAnnuelle>0)
    ? (reducFinalAn / r1.remunerationAnnuelle)
    : r1.coefFinal;

  return {
    ...r1,
    coefFinal,
    reducAnnuelle: reducFinalAn,
    reducMensuelle: reducFinalMens,
    reducAffichee: reducFinalAff,
    dfsRate,
    dfsApplied:true,
    reducSansDFS: r0.reducAnnuelle,
    reducAvecDFS: r1.reducAnnuelle,
    reducPlafond130: plaf130,
    dfsPlafondApplique,
  };
}

function computeRGDU_core(i, p){
  // --- T Maxi / Tdelta (cas général) et paramètres de répartition URSSAF / Retraite ---
  // Convention : les taux sont stockés en décimal (ex : 34,20% => 0,3420).
  // Valeurs par défaut 2026 (cas général) :
  // - TOTAL versé à l'URSSAF (URSSAF + chômage) = 0,3420 (FNAL 0,50) / 0,3380 (FNAL 0,10)
  // - Retraite prise en compte = Retraite patronale (plafonnée à 0,0472) + CEG T1 (0,0129) = 0,0601
  // - Tmin = 0,0200
  const fnal010 = i.fnal === "0,10%";

  let totalUrssafChomage_050 = Number.isFinite(n(p.urssaf_fnal_050)) ? n(p.urssaf_fnal_050) : 0.3420;
  let totalUrssafChomage_010 = Number.isFinite(n(p.urssaf_fnal_010)) ? n(p.urssaf_fnal_010) : 0.3380;

  // Bonus/Malus chômage : l'utilisateur saisit le taux modulé figurant sur ses bulletins (en %).
  // Le différentiel est calculé par l'outil : (taux saisi − 4,05%) / 100 → décimal.
  // Si vide → taux standard 4,05% → différentiel = 0.
  const TAUX_CHOMAGE_STANDARD = 4.05; // %
  let bonusMalusTaux = TAUX_CHOMAGE_STANDARD; // taux effectif en %
  let bonusMalusAdj = 0; // différentiel en décimal
  if(i.bonusMalus !== null && i.bonusMalus !== undefined && String(i.bonusMalus).trim() !== ""){
    const bm = n(i.bonusMalus);
    if(Number.isFinite(bm)){
      bonusMalusTaux = bm;
      bonusMalusAdj = (bm - TAUX_CHOMAGE_STANDARD) / 100; // ex: 5.05 → +0.01, 3.00 → −0.0105
    }
  }
  totalUrssafChomage_050 = totalUrssafChomage_050 + bonusMalusAdj;
  totalUrssafChomage_010 = totalUrssafChomage_010 + bonusMalusAdj;

  const cegT1 = Number.isFinite(n(p.ceg_t1)) ? n(p.ceg_t1) : 0.0129;

  // Retraite patronale : valeur globale paramétrée, ou dérogatoire saisie dans la simulation (en %).
  let retraitePatSociete = Number.isFinite(n(p.retraite_patronale_societe)) ? n(p.retraite_patronale_societe) : 0.0472;
  if(i.retraitePatronaleSociete !== null && i.retraitePatronaleSociete !== undefined && String(i.retraitePatronaleSociete).trim() !== ""){
    const x = n(i.retraitePatronaleSociete);
    if(Number.isFinite(x)) retraitePatSociete = x / 100; // saisie en %
  }
  const retraitePatRetenue = Math.min(Math.max(0, retraitePatSociete), 0.0472); // plafonnement à 4,72%
  const tauxRetraitePrisEnCompte = retraitePatRetenue + cegT1; // décimal

  const totalUrssafChomage = fnal010 ? totalUrssafChomage_010 : totalUrssafChomage_050;
  const tmaxi = totalUrssafChomage + tauxRetraitePrisEnCompte; // T maxi (décimal)
  const tmin = Number.isFinite(n(p.tmin)) ? n(p.tmin) : 0.0200;

  // --- Tdelta retenu (réplique de l'Excel) ---
  const base010 = (totalUrssafChomage_010 + tauxRetraitePrisEnCompte) - tmin;
  const base050 = (totalUrssafChomage_050 + tauxRetraitePrisEnCompte) - tmin;
  const deltaFNAL = base050 - base010;

  let tdelta;
  if(i.tdeltaPerso !== null && i.tdeltaPerso !== "" && Number.isFinite(n(i.tdeltaPerso))){
    tdelta = n(i.tdeltaPerso);
  }else{
    const sit = i.situation;
    if(sit === "Journalistes"){
      tdelta = fnal010 ? (p.tdelta_journalistes - deltaFNAL) : p.tdelta_journalistes;
    }else if(sit === "Prof médicales TP"){
      tdelta = fnal010 ? (p.tdelta_prof_med_tp - deltaFNAL) : p.tdelta_prof_med_tp;
    }else if(sit === "VRP multicartes"){
      tdelta = fnal010 ? (p.tdelta_vrp - deltaFNAL) : p.tdelta_vrp;
    }else if(sit === "Personnalise"){
      // si personnalisé sans saisie : retombe sur cas général (comportement Excel via IF(B10<>"",...))
      tdelta = fnal010 ? base010 : base050;
    }else{
      tdelta = fnal010 ? base010 : base050;
    }
  }

  // M et A
  const M = mapMajoration(i.majoration, p);
  const A = mapTransport(i.transport, p);

  // ── Heures annuelles retenues ──────────────────────────────────────────────
  const type = i.typeHeures;
  let heuresBase = 0;
  if(type === "Heures mensuelles contractuelles"){
    heuresBase = (n(i.heuresMensuelles) || 0) * 12;
  }else if(type === "Forfait annuel (heures)"){
    heuresBase = (n(i.forfaitHeures) || 0);
  }else if(type === "Forfait annuel (jours)"){
    heuresBase = (n(i.forfaitJours) || 0) * (n(i.heuresJour) || 0);
  }
  // Heures supplémentaires (hors jours > 218 supprimés — BOSS § 860)
  const heuresSupRetenues =
    (i.periodicite === "Mensuel" ? (n(i.heuresSupPeriode)||0) * 12 : (n(i.heuresSupPeriode)||0));

  const heuresAnnuelles = heuresBase + heuresSupRetenues;

  // ── Proratisation SMIC en cas d'absence (D.241-7 IV + BOSS § 720) ─────────
  // Trois situations possibles (situationAbsence) :
  //   "presence_totale"  → pas de correction du SMIC
  //   "absence"          → suspension sans paie ou avec paie partielle employeur
  //   "maintien_total"   → maintien intégral → SMIC habituel, pas de proratisation
  //
  // Formule légale (absence) :
  //   rapport = (remunVersée − ENA_versés) / (remunTheorique − ENA_theoriques)
  //   SMIC_proratisé = SMIC_horaire × heuresAnnuelles × rapport
  //
  // ENA (Éléments Non Affectés par l'absence) :
  //   - Primes dont le montant n'est PAS strictement proportionnel à l'absence
  //   - Éléments à périodicité différente de la paie (trimestriel, annuel...)
  //   - Indemnités de rupture (IFC, ICP...)
  //   Exclus des deux membres du rapport (numérateur ET dénominateur).
  //
  // Mode "coefficient direct" : l'utilisateur saisit le rapport directement
  //   (issu du logiciel de paie) → bypass du calcul par montants.

  let presence; // coefficient de présence retenu [0..1]
  let smicProratNote = ""; // note explicative pour l'affichage

  const sitAbs = i.situationAbsence || "presence_totale";

  if(sitAbs === "presence_totale" || sitAbs === "maintien_total"){
    // Pas d'absence ou maintien total : SMIC habituel
    presence = 1.0;
    smicProratNote = sitAbs === "maintien_total"
      ? "Maintien total : SMIC habituel (pas de proratisation)"
      : "";
  } else {
    // Absence (avec ou sans maintien partiel)
    const modeSaisie = i.modeAbsence || "montants"; // "montants" ou "coefficient"

    if(modeSaisie === "coefficient"){
      // Mode expert : coefficient direct saisi en % → converti en décimal
      const coefSaisi = n(i.presenceForfait);
      presence = Number.isFinite(coefSaisi) ? Math.max(0, Math.min(1, coefSaisi)) : 1.0;
      smicProratNote = "Coefficient saisi directement";
    } else {
      // Mode montants : calcul via rapport ENA
      // Rémunération théorique (mois complet) — annualisée
      const remunTheoAnnuelle = (i.periodicite === "Mensuel")
        ? (n(i.remunTheorique)||0) * 12
        : (n(i.remunTheorique)||0);

      // ENA théoriques (primes non proratisées, périodicité différente, IFC...)
      // L'utilisateur saisit le montant sur la PÉRIODE (automatiquement annualisé)
      const enaTheoAnnuelle = (i.periodicite === "Mensuel")
        ? (n(i.enaTheorique)||0) * 12
        : (n(i.enaTheorique)||0);

      // Rémunération effectivement versée — annualisée
      const remunVerseAnnuelle = (i.periodicite === "Mensuel")
        ? (n(i.remunVersee)||0) * 12
        : (n(i.remunVersee)||0);

      // ENA versés (en général = ENA théoriques sauf si l'ENA est lui-même impacté
      // de façon non strictement proportionnelle — cas rare mais possible)
      const enaVerseAnnuelle = (i.periodicite === "Mensuel")
        ? (n(i.enaVersee)||0) * 12
        : (n(i.enaVersee)||0);

      // Denominateur et numérateur hors ENA
      const denom = remunTheoAnnuelle - enaTheoAnnuelle;
      const numer = remunVerseAnnuelle - enaVerseAnnuelle;

      if(denom > 0 && Number.isFinite(numer) && Number.isFinite(denom)){
        presence = Math.max(0, Math.min(1, numer / denom));
        smicProratNote = `Rapport ENA : ${Math.round(numer)}/${Math.round(denom)} = ${(presence*100).toFixed(2)} %`;
      } else {
        // Fallback si données incomplètes : présence totale (sécurisant)
        presence = 1.0;
        smicProratNote = "Données absence incomplètes — présence totale retenue";
      }
    }
  }

  const smicAnnuelAvantA = p.smicHoraire * heuresAnnuelles * presence;
  const smicReference = smicAnnuelAvantA * A;
  const seuil3Smic = 3 * smicReference;

  const remunerationAnnuelle = (i.periodicite === "Mensuel")
    ? ((n(i.remunerationPeriode)||0) + (n(i.ppvPeriode)||0)) * 12
    : ((n(i.remunerationPeriode)||0) + (n(i.ppvPeriode)||0));

  const invalid = !(remunerationAnnuelle > 0) || !(heuresAnnuelles > 0);

  const base = invalid ? NaN : 0.5 * ((seuil3Smic / remunerationAnnuelle) - 1);
  const coefMath = invalid ? NaN : (p.tmin + tdelta * (Math.max(0, base) ** p.p));
  const coefPlaf = invalid ? NaN : Math.min(p.tmin + tdelta, coefMath);

  const coefFinal = invalid ? NaN
    : (remunerationAnnuelle >= seuil3Smic ? 0 : round4(coefPlaf * M));

  const reducAnnuelle = invalid ? NaN : remunerationAnnuelle * coefFinal;
  const reducMensuelle = Number.isNaN(reducAnnuelle) ? NaN : reducAnnuelle / 12;
  const reducAffichee = (i.periodicite === "Mensuel") ? reducMensuelle : reducAnnuelle;

  
  // --- Répartition URSSAF / Retraite (au centime) ---
  let pctRetraite = NaN;
  if(Number.isFinite(tmaxi) && tmaxi > 0 && Number.isFinite(tauxRetraitePrisEnCompte)){
    pctRetraite = Math.min(1, Math.max(0, tauxRetraitePrisEnCompte / tmaxi));
  }
  let partRetraiteAnnuelle = NaN, partUrssafAnnuelle = NaN, partRetraiteMensuelle = NaN, partUrssafMensuelle = NaN;
  if(Number.isFinite(pctRetraite) && Number.isFinite(reducAnnuelle)){
    partRetraiteAnnuelle = Math.round((reducAnnuelle * pctRetraite) * 100) / 100;
    partUrssafAnnuelle = Math.round((reducAnnuelle - partRetraiteAnnuelle) * 100) / 100;
  }
  if(Number.isFinite(pctRetraite) && Number.isFinite(reducMensuelle)){
    partRetraiteMensuelle = Math.round((reducMensuelle * pctRetraite) * 100) / 100;
    partUrssafMensuelle = Math.round((reducMensuelle - partRetraiteMensuelle) * 100) / 100;
  }
return {
    tmaxi,
    tauxRetraitePrisEnCompte,
    retraitePatronaleRetenue: retraitePatRetenue,
    bonusMalusAdj,
    bonusMalusTaux,
    tdelta, M, A,
    heuresAnnuelles, presence, smicProratNote,
    smicReference, seuil3Smic, remunerationAnnuelle,
    base, coefMath, coefPlaf, coefFinal,
    reducAnnuelle, reducMensuelle, reducAffichee,
    pctRetraite,
    partUrssafAnnuelle, partRetraiteAnnuelle,
    partUrssafMensuelle, partRetraiteMensuelle,
    invalid,
  };
}

function badgeFor(result){
  if(result.invalid) return { cls:"bad", txt:"Saisie incomplète / incohérente" };
  if(result.remunerationAnnuelle >= result.seuil3Smic) return { cls:"warn", txt:"Réduction nulle (≥ 3×SMIC)" };
  if(result.reducAffichee <= 0) return { cls:"warn", txt:"Réduction nulle" };
  return { cls:"ok", txt:"Calcul OK" };
}

function kpiBox(k, v){
  return `<div class="box"><div class="k">${safeText(k)}</div><div class="v">${safeText(v)}</div></div>`;
}

function field({id,label,type="text",value="",options=null,step=null,placeholder="",hint="",tooltip=""}){
  const h = hint ? `<div class="small muted">${safeText(hint)}</div>` : "";
  const tip = tooltip
    ? `<button type="button" class="rgdu-tip-btn" aria-label="Aide sur ce champ"
         data-tip="${safeText(tooltip)}" tabindex="-1">ⓘ</button>`
    : "";
  const labelHtml = `<label for="${id}">${safeText(label)}${tip}</label>`;
  if(options){
    const opts = options.map(o => `<option value="${safeText(o)}"${String(o)===String(value)?" selected":""}>${safeText(o)}</option>`).join("");
    return `<div class="field">
      ${labelHtml}
      <select id="${id}">${opts}</select>
      ${h}
    </div>`;
  }
  const st = step ? ` step="${step}"` : "";
  return `<div class="field">
    ${labelHtml}
    <input id="${id}" type="${type}" value="${safeText(value)}" placeholder="${safeText(placeholder)}"${st}/>
    ${h}
  </div>`;
}

function loadState(defaults){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) throw new Error("no state");
    const parsed = JSON.parse(raw);
    return {
      activeTab: parsed.activeTab || "Dashboard",
      A: { ...defaults.A, ...(parsed.A||{}) },
      B: { ...defaults.B, ...(parsed.B||{}) },
      params: { ...(parsed.params||{}) },
    };
  }catch(e){
    return { activeTab:"Dashboard", A: defaults.A, B: defaults.B, params: {} };
  }
}

function saveState(state){
  // Mode file:// : certains navigateurs peuvent bloquer localStorage.
  // On ne doit jamais casser la saisie/les recalculs à cause de ça.
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      activeTab: state.activeTab,
      A: state.A,
      B: state.B,
      params: state.params,
    }));
  }catch(e){}
}

function getFocusInfo(){
  const el = document.activeElement;
  if(!el || !el.id) return null;
  const tag = (el.tagName||"").toLowerCase();
  if(tag !== "input" && tag !== "select" && tag !== "textarea") return null;
  let start=null, end=null;
  try{
    start = el.selectionStart;
    end = el.selectionEnd;
  }catch(e){}
  return { id: el.id, start, end };
}

function restoreFocusInfo(focus){
  if(!focus || !focus.id) return;
  const el = document.getElementById(focus.id);
  if(!el) return;
  el.focus({ preventScroll:true });
  try{
    if(focus.start !== null && focus.end !== null && typeof el.setSelectionRange === "function"){
      el.setSelectionRange(focus.start, focus.end);
    }
  }catch(e){}
}

function exportJSON(state, runtime){
  const blob = new Blob([JSON.stringify({
    exported_at: new Date().toISOString(),
    state,
    runtime,
  }, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "rgdu_export.json";
  a.click();
  URL.revokeObjectURL(url);
}

function renderTextLines(lines){
  const html = lines.map(line=>{
    const l = String(line);
    // titres simples
    if(/^mode d’emploi|suivi des versions|glossaire/i.test(l)) return `<h2>${safeText(l)}</h2>`;
    if(/^\d+[\.\s]*\d*\s*\|/i.test(l)) return `<div class="muted">${safeText(l)}</div>`;
    // bullet points : conserve sauts de ligne
    return `<div class="small" style="white-space:pre-wrap;line-height:1.45">${safeText(l)}</div>`;
  }).join("\n");
  return `<div class="card"><div class="bd">${html}</div></div>`;
}



function renderModeEmploi(mode){
  // Transforme la liste de lignes en sections lisibles (titres + paragraphes)
  const lines = (mode.lines || []).map(l => String(l||"").trim()).filter(Boolean);

  const sections = [];
  let current = { title: null, items: [] };

  const pushCurrent = ()=>{
    if((current.title && current.title.trim()) || current.items.length){
      sections.push(current);
    }
    current = { title: null, items: [] };
  };

  for(const line of lines){
    const isTitle =
      /^[A-ZÉÈÀÇ].{0,60}:$/.test(line) ||
      /^\d+\s*[\.\)\-]\s+/.test(line) ||
      /^Mode d’emploi/i.test(line);

    if(isTitle){
      pushCurrent();
      current.title = line.replace(/:$/,"");
    }else{
      current.items.push(line);
    }
  }
  pushCurrent();

  const blocks = sections.map(sec=>{
    const title = sec.title ? `<div class="title">${safeText(sec.title)}</div>` : `<div class="title">Informations</div>`;
    const body = sec.items.map(p=>{
      // bullets rudimentaires
      const isBullet = /^[-•]\s+/.test(p);
      if(isBullet) return `<li>${safeText(p.replace(/^[-•]\s+/,""))}</li>`;
      return `<p>${safeText(p)}</p>`;
    });

    // regroupe les li consécutifs
    let htmlBody = "";
    let inList = false;
    for(const frag of body){
      if(frag.startsWith("<li")){
        if(!inList){ htmlBody += "<ul>"; inList = true; }
        htmlBody += frag;
      }else{
        if(inList){ htmlBody += "</ul>"; inList = false; }
        htmlBody += frag;
      }
    }
    if(inList) htmlBody += "</ul>";

    return `
      <div class="card">
        <div class="hd">
          <div>${title}</div>
        </div>
        <div class="bd mode">
          ${htmlBody}
        </div>
      </div>
    `;
  }).join("");

  return `<div class="sheet">${blocks}</div>`;
}




function renderModernMode(){

  return `
    <div class="sheet modeHero">

      <div class="hero">
        <div class="heroLeft">
          <div class="heroKicker">Simulateur RGDU 2026</div>
          <h1>Mode d\u2019emploi</h1>
          <p class="heroLead">Guide pratique pour simuler, comparer et contr\u00f4ler la R\u00e9duction G\u00e9n\u00e9rale D\u00e9gressive Unique.</p>
          <div class="heroBadges">
            <span class="badge ok">Offline</span>
            <span class="badge">Temps r\u00e9el</span>
            <span class="badge">Sc\u00e9narios A/B</span>
            <span class="badge">Contr\u00f4le Sage</span>
          </div>
        </div>
        <div class="heroRight">
          <div class="heroCard">
            <div class="heroStat">
              <div class="k">Parcours type</div>
              <div class="v">Simulation \u2192 Comparateur \u2192 R\u00e9f\u00e9rences Sage</div>
            </div>
            <div class="heroStat">
              <div class="k">Stockage</div>
              <div class="v">Donn\u00e9es locales (navigateur)</div>
            </div>
          </div>
        </div>
      </div>

      <!-- BLOC 1 : D\u00e9marrage rapide -->
      <div class="card">
        <div class="hd"><div class="title">\u{1F680} D\u00e9marrer en 4 \u00e9tapes</div></div>
        <div class="bd mode">
          <ol class="steps">
            <li><strong>Contexte global</strong> \u2014 Choisissez la p\u00e9riodicit\u00e9 (Mensuel/Annuel), le FNAL, la situation particuli\u00e8re, le profil de majoration et le transport.</li>
            <li><strong>Temps de travail</strong> \u2014 S\u00e9lectionnez le type de contrat (heures mensuelles, forfait heures ou forfait jours), puis renseignez les heures ou jours correspondants ainsi que les heures suppl\u00e9mentaires.</li>
            <li><strong>Pr\u00e9sence & R\u00e9mun\u00e9ration</strong> \u2014 Saisissez les heures d\u2019absence <em>ou</em> le taux de pr\u00e9sence (en %), puis la r\u00e9mun\u00e9ration brute de la p\u00e9riode et la PPV \u00e9ventuelle.</li>
            <li><strong>R\u00e9sultats</strong> \u2014 Le panneau lat\u00e9ral affiche en temps r\u00e9el : coefficient, r\u00e9duction (URSSAF + Retraite), SMIC de r\u00e9f\u00e9rence et seuil 3\u00d7SMIC.</li>
          </ol>
        </div>
      </div>

      <!-- BLOC 2 : Champs de saisie d\u00e9taill\u00e9s -->
      <details class="acc" open>
        <summary>\u{1F4CB} D\u00e9tail des champs de saisie</summary>
        <div class="accBody mode">

          <h4 style="margin:0 0 10px 0">Contexte global</h4>
          <table class="table">
            <thead><tr><th>Champ</th><th>R\u00f4le</th><th>Valeurs possibles</th></tr></thead>
            <tbody>
              <tr><td><strong>P\u00e9riodicit\u00e9</strong></td><td>D\u00e9termine si la saisie et l\u2019affichage sont mensuels ou annuels.</td><td>Mensuel / Annuel</td></tr>
              <tr><td><strong>FNAL</strong></td><td>Contribution employeur au logement \u2014 impacte le Tdelta et le T\u00a0maxi.</td><td>0,10\u00a0% / 0,50\u00a0%</td></tr>
              <tr><td><strong>Situation particuli\u00e8re</strong></td><td>D\u00e9termine le Tdelta sp\u00e9cifique appliqu\u00e9.</td><td>Cas g\u00e9n\u00e9ral, Journalistes, Prof m\u00e9dicales TP, VRP multicartes, Personnalis\u00e9</td></tr>
              <tr><td><strong>DFS</strong></td><td>D\u00e9duction forfaitaire sp\u00e9cifique (abattement frais pro). D\u00e9clenche le double calcul avec plafonnement \u00e0 130\u00a0%.</td><td>Pas de DFS, Construction 7\u00a0%, Propret\u00e9 3\u00a0%, etc.</td></tr>
              <tr><td><strong>Tdelta personnalis\u00e9</strong></td><td>Surcharge manuelle du Tdelta (si \u00ab\u00a0Personnalis\u00e9\u00a0\u00bb est choisi). Laisser vide pour le calcul automatique.</td><td>D\u00e9cimal (ex : 0,3821)</td></tr>
              <tr><td><strong>Retraite patronale d\u00e9rogatoire</strong></td><td>Si le taux patronal retraite diff\u00e8re du taux standard (4,72\u00a0%). Impacte la cl\u00e9 URSSAF/Retraite. Plafonn\u00e9 \u00e0 4,72\u00a0%.</td><td>En % (ex : 4,50)</td></tr>
              <tr><td><strong>Profil de majoration</strong></td><td>Coefficient multiplicateur (M) appliqu\u00e9 au coefficient final.</td><td>Aucune, Int\u00e9rimaires (\u00d71,1), Caisses cong\u00e9s pay\u00e9s (\u00d7100/90), Transport routier</td></tr>
              <tr><td><strong>Transport</strong></td><td>Coefficient transport (A) appliqu\u00e9 au SMIC de r\u00e9f\u00e9rence.</td><td>Aucun (1), Grand routier (45/35), Courte distance (40/35)</td></tr>
            </tbody>
          </table>

          <h4 style="margin:18px 0 10px 0">Temps de travail</h4>
          <table class="table">
            <thead><tr><th>Champ</th><th>R\u00f4le</th><th>Quand remplir ?</th></tr></thead>
            <tbody>
              <tr><td><strong>Type de contrat</strong></td><td>D\u00e9termine le mode de calcul des heures annuelles.</td><td>Toujours</td></tr>
              <tr><td><strong>Heures mensuelles</strong></td><td>Heures contractuelles par mois (ex : 151,67).</td><td>Si type = \u00ab\u00a0Heures mensuelles\u00a0\u00bb</td></tr>
              <tr><td><strong>Forfait annuel (heures)</strong></td><td>Volume horaire annuel du forfait.</td><td>Si type = \u00ab\u00a0Forfait annuel (heures)\u00a0\u00bb</td></tr>
              <tr><td><strong>Forfait annuel (jours)</strong></td><td>Nombre de jours du forfait. Multipli\u00e9 par \u00ab\u00a0Heures par jour\u00a0\u00bb.</td><td>Si type = \u00ab\u00a0Forfait annuel (jours)\u00a0\u00bb</td></tr>
              <tr><td><strong>Heures par jour</strong></td><td>Utilis\u00e9 pour convertir les forfaits jours en heures (d\u00e9faut : 7h).</td><td>Forfait jours / jours > 218</td></tr>
              <tr><td><strong>Heures suppl\u00e9mentaires (p\u00e9riode)</strong></td><td>Heures sup sur la p\u00e9riode. Annualis\u00e9es automatiquement si p\u00e9riodicit\u00e9 = Mensuel.</td><td>Si heures sup effectu\u00e9es</td></tr>
              <tr><td><strong>Jours > 218 (annuel)</strong></td><td>Jours travaillés au-delà de 218, convertis en heures via « Heures par jour ». ⚠️ BOSS § 860 (01/04/2026) : le SMIC ne peut PAS être majoré à ce titre.</td><td>Simulation uniquement</td></tr>
            </tbody>
          </table>

          <h4 style="margin:18px 0 10px 0">Pr\u00e9sence</h4>
          <table class="table">
            <thead><tr><th>Champ</th><th>R\u00f4le</th><th>Priorit\u00e9</th></tr></thead>
            <tbody>
              <tr><td><strong>Absence (heures)</strong></td><td>Heures d\u2019absence sur la p\u00e9riode. Si renseign\u00e9, la pr\u00e9sence est calcul\u00e9e automatiquement.</td><td><strong>Prioritaire</strong> si renseign\u00e9</td></tr>
              <tr><td><strong>Pr\u00e9sence (%)</strong></td><td>Taux de pr\u00e9sence directement (ex : 97,5). Utilis\u00e9 uniquement si l\u2019absence est vide.</td><td>Utilis\u00e9 par d\u00e9faut si absence vide</td></tr>
            </tbody>
          </table>

          <h4 style="margin:18px 0 10px 0">R\u00e9mun\u00e9ration</h4>
          <table class="table">
            <thead><tr><th>Champ</th><th>R\u00f4le</th></tr></thead>
            <tbody>
              <tr><td><strong>R\u00e9mun\u00e9ration p\u00e9riode (hors PPV)</strong></td><td>R\u00e9mun\u00e9ration brute soumise \u00e0 cotisations, hors PPV. Annualis\u00e9e automatiquement.</td></tr>
              <tr><td><strong>PPV p\u00e9riode</strong></td><td>Prime de Partage de la Valeur (incluse dans le calcul depuis 2025). Annualis\u00e9e automatiquement.</td></tr>
            </tbody>
          </table>
        </div>
      </details>

      <!-- BLOC 3 : Comparateur -->
      <details class="acc">
        <summary>\u{1F504} Comparateur A / B</summary>
        <div class="accBody mode">
          <p><strong>Simulation</strong> (Sc\u00e9nario A) est le cas de r\u00e9f\u00e9rence. <strong>Simulation B</strong> est le sc\u00e9nario alternatif.</p>
          <p>Le <strong>Comparateur</strong> affiche l\u2019\u00e9cart B \u2212 A : gain ou surco\u00fbt, en montant et en pourcentage, sur la p\u00e9riode et en annuel.</p>
          <p><strong>Exemples d\u2019usage :</strong></p>
          <ul>
            <li>Avant / apr\u00e8s augmentation : mesurer l\u2019impact sur la RGDU.</li>
            <li>Avec / sans PPV : quantifier l\u2019effet de la prime sur la r\u00e9duction.</li>
            <li>Temps plein vs temps partiel : visualiser l\u2019\u00e9cart de r\u00e9duction.</li>
            <li>Deux salari\u00e9s diff\u00e9rents : comparer les r\u00e9ductions respectives.</li>
          </ul>
        </div>
      </details>

      <!-- BLOC 4 : Contr\u00f4le Sage -->
      <details class="acc">
        <summary>\u{1F50D} Contr\u00f4le avec Sage Paie</summary>
        <div class="accBody mode">
          <p>L\u2019onglet <strong>R\u00e9f\u00e9rences Sage</strong> met en correspondance les valeurs calcul\u00e9es par le simulateur avec les rubriques et constantes Sage Paie 100.</p>
          <p><strong>\u00c9l\u00e9ments \u00e0 contr\u00f4ler en priorit\u00e9 :</strong></p>
          <ul>
            <li>Coefficient final (arrondi 4 d\u00e9cimales) \u2014 constante <strong>79580</strong></li>
            <li>Montant de r\u00e9duction \u2014 rubrique <strong>63500</strong></li>
            <li>SMIC de r\u00e9f\u00e9rence \u2014 rubrique <strong>63460</strong></li>
            <li>R\u00e9mun\u00e9ration retenue \u2014 rubrique <strong>63470</strong></li>
            <li>Tdelta retenu \u2014 constante <strong>ALG_TDELTA</strong></li>
          </ul>
        </div>
      </details>

      <!-- BLOC 5 : R\u00e9partition URSSAF/Retraite -->
      <details class="acc">
        <summary>\u{1F4CA} R\u00e9partition URSSAF / Retraite</summary>
        <div class="accBody mode">
          <p>La r\u00e9duction est ventil\u00e9e entre <strong>part URSSAF</strong> et <strong>part Retraite</strong> selon la cl\u00e9 :</p>
          <p style="text-align:center; font-size:15px"><code>Cl\u00e9 Retraite = taux Retraite pris en compte / T maxi</code></p>
          <p>Le taux Retraite comprend la retraite patronale (standard 4,72\u00a0% ou d\u00e9rogatoire, plafonn\u00e9) + la CEG T1 (1,29\u00a0%). La somme Part URSSAF + Part Retraite reconstitue la r\u00e9duction totale au centime pr\u00e8s.</p>
          <p>Si votre entreprise applique un taux retraite patronal inf\u00e9rieur au standard, saisissez-le dans le champ \u00ab\u00a0Retraite patronale d\u00e9rogatoire\u00a0\u00bb du contexte global.</p>
        </div>
      </details>

      <!-- BLOC 6 : Calculatrice -->
      <details class="acc">
        <summary>\u{1F5A9} Calculatrice int\u00e9gr\u00e9e</summary>
        <div class="accBody mode">
          <p>Le bouton rouge en bas du menu ouvre une calculatrice <strong>ind\u00e9pendante</strong> des simulations (aucun impact sur les calculs RGDU).</p>
          <p>Fonctionnalit\u00e9s : mode standard et scientifique (sin, cos, tan, ln, log, \u221a, x\u00b2, x\u02b8), m\u00e9moire (MC/MR/M+/M\u2212), historique, et <strong>ANS</strong> pour r\u00e9utiliser le dernier r\u00e9sultat.</p>
        </div>
      </details>

      <!-- BLOC 7 : Cas particuliers -->
      <details class="acc">
        <summary>\u{1F9EA} Cas particuliers \u2014 checklist de contr\u00f4le</summary>
        <div class="accBody mode">
          <h4 style="margin:0 0 8px 0">Bonus/Malus ch\u00f4mage</h4>
          <ul>
            <li>Le champ <strong>Taux ch\u00f4mage patronal modul\u00e9</strong> (dans Contexte soci\u00e9t\u00e9) permet de saisir le taux figurant sur vos bulletins de paie.</li>
            <li>L\u2019outil calcule automatiquement le diff\u00e9rentiel par rapport au taux standard de <strong>4,05\u00a0%</strong>.</li>
            <li>Exemples : saisir <strong>3,00</strong> (bonus \u2192 diff. \u22121,05\u00a0%) ou <strong>5,05</strong> (malus \u2192 diff. +1,00\u00a0%).</li>
            <li>Si le champ est vide, le taux standard 4,05\u00a0% est appliqu\u00e9 (aucun ajustement).</li>
            <li>Ce champ impacte le <strong>total URSSAF+ch\u00f4mage</strong>, donc le <strong>T\u00a0maxi</strong>, le <strong>Tdelta</strong>, et la <strong>r\u00e9partition URSSAF/Retraite</strong>.</li>
          </ul>

          <h4 style="margin:14px 0 8px 0">Apprentis</h4>
          <ul>
            <li>V\u00e9rifier le statut, les heures, la pr\u00e9sence et la r\u00e9mun\u00e9ration assujettie.</li>
            <li>Contr\u00f4ler les constantes : ALG_BRUTAN, FI_LIMCOEF, FI_MTALLEG, FI_PLAFAID, ALG_PARTUA, ALG_PARTRA.</li>
            <li>Si taux retraite d\u00e9rogatoire, le saisir pour recalculer correctement le T\u00a0maxi.</li>
          </ul>

          <h4 style="margin:14px 0 8px 0">DFS (d\u00e9duction forfaitaire sp\u00e9cifique)</h4>
          <ul>
            <li>Le simulateur effectue un <strong>double calcul</strong> : sans DFS puis avec DFS.</li>
            <li>La r\u00e9duction \u00ab\u00a0avec DFS\u00a0\u00bb est plafonn\u00e9e \u00e0 <strong>130\u00a0%</strong> de la r\u00e9duction sans DFS.</li>
            <li>L\u2019onglet <strong>Calcul DFS</strong> d\u00e9taille le m\u00e9canisme pas \u00e0 pas.</li>
          </ul>
        </div>
      </details>

      <!-- BLOC 8 : FAQ -->
      <details class="acc">
        <summary>\u2753 Questions fr\u00e9quentes</summary>
        <div class="accBody mode">
          <p><strong>Pourquoi la r\u00e9duction est-elle nulle ?</strong><br/>V\u00e9rifiez : saisie compl\u00e8te, pr\u00e9sence > 0, heures annuelles > 0, et r\u00e9mun\u00e9ration < 3\u00d7SMIC.</p>
          <p><strong>Pourquoi le r\u00e9sultat mensuel diff\u00e8re de mon logiciel de paie ?</strong><br/>Le calcul est annualis\u00e9 puis divis\u00e9 par 12 pour l\u2019affichage mensuel. Des \u00e9carts peuvent appara\u00eetre en cas de r\u00e9gularisations infra-annuelles.</p>
          <p><strong>Comment forcer un Tdelta sp\u00e9cifique ?</strong><br/>S\u00e9lectionnez \u00ab\u00a0Personnalis\u00e9\u00a0\u00bb dans Situation, puis saisissez la valeur souhait\u00e9e dans \u00ab\u00a0Tdelta personnalis\u00e9\u00a0\u00bb.</p>
          <p><strong>Les param\u00e8tres sont-ils modifiables ?</strong><br/>Oui, via l\u2019onglet <strong>Param\u00e8tres</strong>. Les valeurs 2026 sont pr\u00e9charg\u00e9es et l\u2019impact de chaque modification est visible imm\u00e9diatement.</p>
          <p><strong>O\u00f9 trouver la formule d\u00e9taill\u00e9e ?</strong><br/><code>C = (Tmin + Tdelta \u00d7 [(1/2) \u00d7 (3 \u00d7 SMIC_an / RAB \u2212 1)]^P) \u00d7 M</code>, arrondi \u00e0 4 d\u00e9cimales, puis appliqu\u00e9 \u00e0 la r\u00e9mun\u00e9ration annualis\u00e9e.</p>
        </div>
      </details>

      <!-- BLOC 9 : Avertissement -->
      <details class="acc" open>
        <summary>\u2696\uFE0F Avertissement & responsabilit\u00e9</summary>
        <div class="accBody mode">
          <p>Ce simulateur est mis \u00e0 disposition <strong>\u00e0 titre gratuit</strong>, comme outil d\u2019aide au contr\u00f4le et \u00e0 la compr\u00e9hension des m\u00e9canismes de calcul de la RGDU.</p>
          <p>Les r\u00e9sultats produits ont une valeur <strong>indicative</strong> et ne constituent ni un bulletin de paie, ni une validation de conformit\u00e9. Ils doivent \u00eatre <strong>contr\u00f4l\u00e9s et valid\u00e9s</strong> dans votre environnement de paie. La soci\u00e9t\u00e9 ne saurait \u00eatre tenue responsable des d\u00e9cisions prises sur la base des seules valeurs issues des simulations.</p>
        </div>
      </details>

    </div>
  `;
}



function renderGlossaire(glossaire){
  const rows = glossaire.items.map(it => `<tr><td><strong>${safeText(it.terme)}</strong></td><td>${safeText(it.definition)}</td></tr>`).join("");
  return `
    <div class="card">
      <div class="hd">
        <div>
          <div class="title">${safeText(glossaire.title)}</div>
          <div class="hint">${safeText(glossaire.intro||"")}</div>
        </div>
      </div>
      <div class="bd">
        <table class="table">
          <thead><tr><th>Terme</th><th>Définition</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
function renderCalculDFS(){
  return `
  <div class="sheet mode">
    <div class="card">
      <div class="hd">
        <div>
          <div class="kicker">Pédagogie</div>
          <div class="title">Calcul DFS & Réduction Générale (RGDU)</div>
          <div class="sub">Comprendre la logique de double calcul (avec / sans DFS) et le plafonnement, avec ponts vers les éléments Sage.</div>
        </div>
        <span class="badge">2026</span>
      </div>
      <div class="bd">
        <div class="grid2">
          <div class="card mini">
            <div class="hd"><div class="title">1) Rappel : qu’est-ce que la DFS ?</div></div>
            <div class="bd">
              <p>La <strong>Déduction Forfaitaire Spécifique (DFS)</strong> est un abattement appliqué à l’assiette de certaines cotisations pour des professions éligibles (ex : VRP, journalistes, transport…). Dans le simulateur, la DFS est pilotée via le choix <strong>Contexte global → DFS</strong>.</p>
              <p>Dans Sage Paie, le taux est généralement porté par une <strong>constante</strong> et/ou une <strong>rubrique</strong> (ex : <strong>ALG_TDFS</strong> et la rubrique <strong>63492</strong> selon paramétrage).</p>
            </div>
          </div>

          <div class="card mini">
            <div class="hd"><div class="title">2) Le mécanisme RGDU en présence de DFS</div></div>
            <div class="bd">
              <p>La RGDU se calcule <strong>deux fois</strong> :</p>
              <ul>
                <li><strong>Calcul A (sans DFS)</strong> : la réduction est calculée sur la rémunération retenue <em>sans abattement DFS</em>.</li>
                <li><strong>Calcul B (avec DFS)</strong> : la réduction est recalculée en appliquant le taux DFS sur la rémunération retenue.</li>
              </ul>
              <p>Puis un <strong>plafonnement</strong> s’applique : la réduction « avec DFS » ne peut pas dépasser <strong>130% de la réduction sans DFS</strong>.</p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="hd"><div class="title">3) Formule (principe mathématique)</div></div>
          <div class="bd">
            <p>On note <code>f(R)</code> le calcul RGDU standard (celui déjà utilisé dans le simulateur) à partir d’une rémunération retenue <code>R</code>.</p>
            <ul>
              <li><code>RGDU_sansDFS = f(R)</code></li>
              <li><code>RGDU_avecDFS = f(R × (1 − TDFS))</code> où <code>TDFS</code> est le taux choisi (ex : 0,24)</li>
              <li><code>Plafond = 1,30 × RGDU_sansDFS</code></li>
              <li><strong>RGDU_finale = min(RGDU_avecDFS, Plafond)</strong></li>
            </ul>
            <p class="callout">Lorsque « Pas de DFS » est sélectionné, <code>TDFS = 0</code> et le simulateur doit retomber exactement sur le calcul standard (aucune régression).</p>
          </div>
        </div>

        <div class="grid2">
          <div class="card mini">
            <div class="hd"><div class="title">4) Où le voir dans le simulateur ?</div></div>
            <div class="bd">
              <ul>
                <li><strong>Contexte global → DFS</strong> : choix du cas (ou « Pas de DFS »).</li>
                <li><strong>Dashboard / Simulation</strong> : la réduction finale (après plafonnement) est affichée.</li>
                <li><strong>Références Sage</strong> : comparez la valeur de taux DFS remontée par Sage (ex : <strong>ALG_TDFS</strong>, <strong>63492</strong>) avec le taux retenu par le simulateur.</li>
              </ul>
            </div>
          </div>

          <div class="card mini">
            <div class="hd"><div class="title">5) Contrôles recommandés (Sage)</div></div>
            <div class="bd">
              <p>Pour valider un cas DFS, contrôlez :</p>
              <ul>
                <li>Le <strong>taux DFS</strong> effectivement appliqué dans Sage (constante / rubrique).</li>
                <li>Le <strong>montant RGDU</strong> sans DFS (référence de comparaison).</li>
                <li>Le <strong>plafonnement 130%</strong> : si la réduction « avec DFS » dépasse le plafond, Sage doit retenir le plafond.</li>
              </ul>
              <p class="muted">Astuce : effectuez un test avec une rémunération proche du seuil pour observer l’effet du plafonnement.</p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="hd"><div class="title">6) Exemple pédagogique (schéma)</div></div>
          <div class="bd">
            <ol>
              <li>Calculez la réduction sans DFS : <strong>A</strong>.</li>
              <li>Appliquez la DFS (abattement) puis recalculez : <strong>B</strong>.</li>
              <li>Calculez le plafond : <strong>1,30 × A</strong>.</li>
              <li>La réduction finale est : <strong>min(B ; 1,30 × A)</strong>.</li>
            </ol>
          </div>
        </div>

      </div>
    </div>
  </div>
  `;
}

function renderCalculDFSTrace(runtime, state){
  const params = (runtime && runtime.params) ? runtime.params : {};
  const p = { ...params, ...(state.params||{}) };

  const traceOne = (label, key)=>{
    const inputs = state[key] || {};
    const dfsRate = getDfsRate(inputs.dfs);
  const noDfs = (dfsRate<=0);


    const r = computeRGDU(inputs, p);

    const isMensTr = (inputs.periodicite==="Mensuel");
    const divTr = isMensTr ? 12 : 1;
    const perLabelTr = isMensTr ? "Mensuel" : "Annuel";
    const remunSaisiePer = Number(inputs.remunerationPeriode||0);
    const remunAbattuePer = (dfsRate>0) ? (remunSaisiePer * (1 - dfsRate)) : remunSaisiePer;

    const A = r.reducSansDFS / divTr;
    const B = r.reducAvecDFS / divTr;
    const plaf = r.reducPlafond130 / divTr;
    const finalA = r.reducAnnuelle / divTr;
    const finalPer = finalA;

    const badge = (dfsRate<=0)
      ? `<span class="badge">Pas de DFS</span>`
      : (r.dfsPlafondApplique ? `<span class="badge bad">Plafond 130% appliqué</span>` : `<span class="badge ok">DFS retenue</span>`);

    return `
      <div class="card">
        <div class="hd">
          <div class="title">Trace – ${safeText(label)}</div>
          <div class="sub">DFS : ${fmtPct(dfsRate)} • Affichage : ${safeText(perLabelTr)}</div>
        </div>
        <div class="bd mode">

          <div class="callout">
            <div class="calloutTitle">Montant final retenu</div>
            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
              <div style="font-size:22px; font-weight:950;">${fmtMoney(finalPer, perLabelTr)}</div>
              ${badge}
            </div>
            <div class="small muted">Final = min( Calcul avec DFS ; 130% du calcul sans DFS ).</div>
          </div>

          <div class="grid2" style="margin-top:10px">
            <div class="card mini">
              <div class="hd"><div class="title">1) Données de départ</div></div>
              <div class="bd">
                <div class="kv"><span>Rémunération saisie (période)</span><strong>${fmtMoney(remunSaisiePer, "Période")}</strong></div>
                <div class="kv"><span>TDFS (taux DFS)</span><strong>${fmtPct(dfsRate)}</strong></div>
                <div class="kv"><span>Rémunération après abattement</span><strong>${fmtMoney(remunAbattuePer, "Période")}</strong></div>
                <div class="small muted">PPV : conservée (pas d’abattement DFS appliqué ici).</div>
              </div>
            </div>

            <div class="card mini">
              <div class="hd"><div class="title">2) Double calcul (vulgarisé)</div></div>
              <div class="bd">
                <div class="kv"><span>A – Sans DFS (${safeText(perLabelTr)})</span><strong>${fmtMoney(A, perLabelTr)}</strong></div>
                <div class="kv"><span>B – Avec DFS (${safeText(perLabelTr)}, avant plafond)</span><strong>${fmtMoney(B, perLabelTr)}</strong></div>
                <div class="kv"><span>Plafond (130% de A)</span><strong>${fmtMoney(plaf, perLabelTr)}</strong></div>
                <div class="kv"><span>Final retenu</span><strong>${fmtMoney(finalA, perLabelTr)}</strong></div>
              </div>
            </div>
          </div>

          <details class="acc" style="margin-top:10px" open>
            <summary>Comment interpréter ces lignes ?</summary>
            <div class="accBody">
              <ol>
                <li><strong>A (Sans DFS)</strong> : calcul standard (référence).</li>
                <li><strong>B (Avec DFS)</strong> : recalcul après abattement rémunération × (1 − TDFS).</li>
                <li><strong>Plafond</strong> : limite à 130% de A pour éviter une sur‑réduction.</li>
                <li><strong>Final</strong> : le simulateur retient le minimum entre B et le plafond.</li>
              </ol>
            </div>
          </details>

          <details class="acc" style="margin-top:10px">
            <summary>Repères Sage (comparaison)</summary>
            <div class="accBody">
              <p>Valeurs attendues dans Sage :</p>
              <table class="table">
                <thead><tr><th>Référence</th><th>Type</th><th>Valeur</th></tr></thead>
                <tbody>
                  <tr><td><strong>ALG_TDFS</strong></td><td>Constante</td><td>${fmtPct(dfsRate)}</td></tr>
                  <tr><td><strong>63492</strong></td><td>Rubrique</td><td>${fmtPct(dfsRate)}</td></tr>
                </tbody>
              </table>
              <p class="small muted">Comparez dans l’onglet <strong>Références Sage</strong>.</p>
            </div>
          </details>

        </div>
      </div>
    `;
  };

  return `
    <div class="sheet mode">
      <div class="card">
        <div class="hd">
          <div>
            <div class="kicker">DFS</div>
            <div class="title">Mécanisme “double comparaison” – trace vulgarisée</div>
            <div class="sub">Affiche le calcul <strong>sans DFS</strong>, le calcul <strong>avec DFS</strong>, puis le <strong>plafond 130%</strong> et le montant final retenu.</div>
          </div>
          <span class="badge">v4.6</span>
        </div>
        <div class="bd mode">
          <div class="callout">
            <div class="calloutTitle">Rappel</div>
            <p>Quand une DFS est sélectionnée, on compare deux résultats : <strong>Sans DFS</strong> et <strong>Avec DFS</strong>. Le résultat “Avec DFS” est ensuite <strong>plafonné</strong> à 130% du “Sans DFS”.</p>
          </div>

          <div class="grid2" style="margin-top:10px">
            ${traceOne("Scénario A", "A")}
            ${traceOne("Scénario B", "B")}
          </div>

          <div class="small muted" style="margin-top:10px">
            Astuce : pour voir l’effet du plafonnement, essayez une DFS élevée (ex. 24%) et une rémunération proche d’un seuil.
          </div>
        </div>
      </div>
    </div>
  `;
}



}

function renderVersions(v){
  const rows = v.items.map(it => `
    <tr>
      <td><strong>${safeText(it.version)}</strong></td>
      <td>${safeText(it.objectif)}</td>
      <td>${safeText(it.ajouts)}</td>
      <td>${safeText(it.modifications)}</td>
      <td>${safeText(it.corrections)}</td>
    </tr>`).join("");
  return `
    <div class="card">
      <div class="hd">
        <div>
          <div class="title">${safeText(v.title)}</div>
          <div class="hint">${safeText(v.note||"")}</div>
        </div>
      </div>
      <div class="bd">
        <table class="table">
          <thead><tr><th>Version</th><th>Objectif</th><th>Ajouts</th><th>Modifications</th><th>Corrections</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

// ==============================
// Tests & non-régression (offline)
// ==============================
function renderTestsPage(runtime){
  const meta = (runtime && runtime.tests && runtime.tests.meta) ? runtime.tests.meta : null;
  return `
  <div class="sheet">
    <div class="card">
      <div class="hd">Tests & non-régression</div>
      <div class="bd">
        <p class="muted" style="margin-top:0">
          Cette page exécute un jeu de cas normés et compare les résultats obtenus au <strong>référentiel interne</strong>.
          Objectif : empêcher toute régression (si ça change, c'est volontaire et documenté).
        </p>
        <div class="row" style="gap:8px;flex-wrap:wrap">
          <button class="btn" id="btnRunTests">Lancer les tests</button>
          <button class="btn ghost" id="btnToggleFails" aria-pressed="false">Afficher seulement les échecs</button>
          <span class="badge" id="testsBadge">${meta && meta.engine_badge ? safeText(meta.engine_badge) : safeText($("#uiVersion")?.textContent || "")}</span>
        </div>
        <div id="testsStatus" class="muted" style="margin-top:10px"></div>
        <div id="testsTable" style="margin-top:10px"></div>
      </div>
    </div>
  </div>`;
}



// --- Référentiel de tests embarqué (fallback offline si fetch bloqué en file://) ---
const EMBEDDED_TESTS_RGDU_2026 = {"meta":{"name":"RGDU 2026 — cas de non-régression","generated_on":"2026-05-03","engine_badge":"v3.2","notes":"Cas v1 : attendus moteur V1 hotfix. Cas v2 (2026-05-03) : absence+ENA, coefficient direct, maintien total, FNAL 0,10%, DFS+absence."},"tolerance":{"money":0.01,"coef":0.0001},"cases":[]};
// Cas de test dans data/tests_rgdu_2026.json (chargé dynamiquement par ensureTestsLoaded)

async function ensureTestsLoaded(runtime){
  // Idempotent
  if(runtime.tests && runtime.tests.cases) return runtime.tests;

  const fallback = ()=>{
    const fb = JSON.parse(JSON.stringify(EMBEDDED_TESTS_RGDU_2026 || { meta:{}, tolerance:{money:0.01, coef:0.0001}, cases:[] }));
    fb._loadedFrom = "embedded";
    return fb;
  };

  try{
    const t = await loadJSON("data/tests_rgdu_2026.json");
    // Si le JSON est chargé mais vide/mal structuré, on bascule quand même sur le fallback
    if(!t || !Array.isArray(t.cases) || t.cases.length===0){
      const fb = fallback();
      fb._loadError = "JSON externe chargé mais vide ou invalide (cases manquantes).";
      runtime.tests = fb;
    }else{
      t._loadedFrom = "external";
      runtime.tests = t;
    }
  }catch(e){
    const fb = fallback();
    fb._loadError = String(e);
    runtime.tests = fb;
  }
  return runtime.tests;
}

function cmpWithin(a,b,tol){
  if(!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(a-b) <= tol;
}

function fmtNum(x, d){
  if(!Number.isFinite(x)) return "—";
  return Number(x).toFixed(d);
}

function fmtMoney2(x){
  if(!Number.isFinite(x)) return "—";
  return fmtMoney(x, "Mensuel"); // fmtMoney => € avec 2 décimales
}


function buildTestsTable(rows, onlyFails){
  const shown = onlyFails ? rows.filter(r=>!r.ok) : rows;
  const okCount = rows.filter(r=>r.ok).length;
  const total = rows.length;

  const head = `
    <div class="card" style="margin:0">
      <div class="bd" style="padding:10px">
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
          ${total>0 ? `<span class="badge">${okCount}/${total} OK</span>`
                    : `<span class="badge" style="background:rgba(234,75,88,.15);border-color:rgba(234,75,88,.35)">0 test chargé</span>`}
          ${total===0
            ? `<span class="badge" style="background:rgba(255,214,30,.18);border-color:rgba(255,214,30,.35)">Non‑régression NON garantie (tests indisponibles)</span>`
            : (okCount===total
                ? `<span class="badge" style="background:rgba(63,192,240,.20);border-color:rgba(63,192,240,.35)">Aucune régression détectée</span>`
                : `<span class="badge" style="background:rgba(234,75,88,.15);border-color:rgba(234,75,88,.35)">Régressions détectées</span>`)}
          ${onlyFails ? `<span class="muted">Filtre: échecs</span>` : `<span class="muted">Filtre: tous</span>`}
        </div>
      </div>
    </div>
  `;

  const table = `
  <div class="card" style="margin:0">
    <div class="bd" style="padding:0;overflow:auto">
      <table class="tbl" style="width:100%">
        <thead>
          <tr>
            <th>Cas</th>
            <th>Coef (attendu / obtenu)</th>
            <th>Réduction € mensuelle (attendue / obtenue)</th>
            <th>URSSAF € (attendu / obtenu)</th>
            <th>Retraite € (attendu / obtenu)</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          ${shown.map(r=>{
            const exp = r.expected || {};
            const got = r.got || {};
            const badge = r.ok
              ? `<span class="badge" style="background:rgba(63,192,240,.16);border-color:rgba(63,192,240,.30)">OK</span>`
              : `<span class="badge" style="background:rgba(234,75,88,.15);border-color:rgba(234,75,88,.35)">NOK</span>`;

            const coefExp = fmtNum(Number(exp.coefFinal), 4);
            const coefGot = fmtNum(Number(got.coefFinal), 4);

            const rmExp = fmtMoney2(Number(exp.reducMensuelle));
            const rmGot = fmtMoney2(Number(got.reducMensuelle));

            const uExp = fmtMoney2(Number(exp.partUrssafMensuelle));
            const uGot = fmtMoney2(Number(got.partUrssafMensuelle));

            const rExp = fmtMoney2(Number(exp.partRetraiteMensuelle));
            const rGot = fmtMoney2(Number(got.partRetraiteMensuelle));

            return `
          <tr>
            <td>${esc(r.label || r.id || "")}</td>
            <td class="mono">${coefExp} / ${coefGot}</td>
            <td class="mono">${rmExp} / ${rmGot}</td>
            <td class="mono">${uExp} / ${uGot}</td>
            <td class="mono">${rExp} / ${rGot}</td>
            <td>${badge}</td>
          </tr>
        `}).join("")}
        </tbody>
      </table>
    </div>
  </div>`;
  return head + table;
}

async function runAllTests(runtime){
  const statusEl = $("#testsStatus");
  const tableEl  = $("#testsTable");
  if(statusEl) statusEl.textContent = "Chargement des cas…";
  if(tableEl){ while(tableEl.firstChild) tableEl.removeChild(tableEl.firstChild); }

  const doc = await ensureTestsLoaded(runtime);

  const totalCases = Array.isArray(doc && doc.cases) ? doc.cases.length : 0;
  const sourceTxt = doc && doc._loadedFrom === "embedded" ? "fallback embarqué (offline)" : "JSON externe";
  const metaTxt = (doc && doc.meta && (doc.meta.name || doc.meta.generated_on)) ? ` — ${doc.meta.name || ""}${doc.meta.generated_on ? " ("+doc.meta.generated_on+")" : ""}` : "";

  if(statusEl){
    const warn = (doc && doc._loadError) ? ` ⚠️ ${doc._loadError}` : "";
    statusEl.textContent = `Référentiel: ${sourceTxt} — ${totalCases} cas chargés${metaTxt}.${warn}`;
  }

  // Si aucun cas : on affiche explicitement et on renvoie []
  if(!totalCases){
    return [];
  }

  const tolMoney = (doc.tolerance && Number.isFinite(doc.tolerance.money)) ? doc.tolerance.money : 0.01;
  const tolCoef  = (doc.tolerance && Number.isFinite(doc.tolerance.coef)) ? doc.tolerance.coef : 0.0001;

  const rows = (doc.cases||[]).map(tc=>{
    const gotRaw = computeRGDU(tc.input, runtime.params);
    const got = {
      coefFinal: Number.isFinite(gotRaw.coefFinal) ? Math.round(gotRaw.coefFinal*10000)/10000 : gotRaw.coefFinal,
      reducMensuelle: Number.isFinite(gotRaw.reducMensuelle) ? Math.round(gotRaw.reducMensuelle*100)/100 : gotRaw.reducMensuelle,
      reducAnnuelle: Number.isFinite(gotRaw.reducAnnuelle) ? Math.round(gotRaw.reducAnnuelle*100)/100 : gotRaw.reducAnnuelle,
      partUrssafMensuelle: Number.isFinite(gotRaw.partUrssafMensuelle) ? Math.round(gotRaw.partUrssafMensuelle*100)/100 : gotRaw.partUrssafMensuelle,
      partRetraiteMensuelle: Number.isFinite(gotRaw.partRetraiteMensuelle) ? Math.round(gotRaw.partRetraiteMensuelle*100)/100 : gotRaw.partRetraiteMensuelle,
      invalid: !!gotRaw.invalid,
      dfsApplied: !!gotRaw.dfsApplied,
      dfsPlafondApplique: !!gotRaw.dfsPlafondApplique,
    };
    const exp = tc.expected || {};
    const ok =
      cmpWithin(got.coefFinal, Number(exp.coefFinal), tolCoef) &&
      cmpWithin(got.reducMensuelle, Number(exp.reducMensuelle), tolMoney) &&
      cmpWithin(got.reducAnnuelle, Number(exp.reducAnnuelle), tolMoney) &&
      cmpWithin(got.partUrssafMensuelle, Number(exp.partUrssafMensuelle), tolMoney) &&
      cmpWithin(got.partRetraiteMensuelle, Number(exp.partRetraiteMensuelle), tolMoney) &&
      (got.invalid === !!exp.invalid) &&
      (got.dfsApplied === !!exp.dfsApplied) &&
      (got.dfsPlafondApplique === !!exp.dfsPlafondApplique);

    return { id: tc.id, label: tc.label, input: tc.input, expected: tc.expected, got, ok };
  });

  const okCount = rows.filter(r=>r.ok).length;
  const total = rows.length;
  if(statusEl){
    const base = `Résultat : ${okCount}/${total} OK — Tolérances: coef ±${tolCoef}, € ±${tolMoney}.`;
    const warn = (doc && doc._loadedFrom==="embedded") ? " (⚠️ tests externes non accessibles en file://, fallback utilisé)" : "";
    statusEl.textContent = base + warn;
  }
  return rows;
}

function wireTestsPage(runtime){
  const runBtn = $("#btnRunTests");
  const toggleBtn = $("#btnToggleFails");
  if(!runBtn) return;

  let lastRows = null;
  let onlyFails = false;

  runBtn.addEventListener("click", async ()=>{
    const rows = await runAllTests(runtime);
    lastRows = rows || [];
    (function(){ var el=document.querySelector("#testsTable"); if(el){ while(el.firstChild) el.removeChild(el.firstChild); var tmp=document.createElement("div"); tmp.innerHTML=buildTestsTable(lastRows,onlyFails); while(tmp.firstChild) el.appendChild(tmp.firstChild); }})()
  });

  if(toggleBtn){
    toggleBtn.addEventListener("click", ()=>{
      onlyFails = !onlyFails;
      toggleBtn.setAttribute("aria-pressed", onlyFails ? "true":"false");
      toggleBtn.textContent = onlyFails ? "Afficher tous les cas" : "Afficher seulement les échecs";
      if(lastRows) (function(){ var el=document.querySelector("#testsTable"); if(el){ while(el.firstChild) el.removeChild(el.firstChild); var tmp=document.createElement("div"); tmp.innerHTML=buildTestsTable(lastRows,onlyFails); while(tmp.firstChild) el.appendChild(tmp.firstChild); }})()
    });
  }
}





function buildRefsWithValues(refs, scenarioKey, params, state){
  const p = { ...params, ...(state.params||{}) };
  const inputs = state[scenarioKey];
  const r = computeRGDU(inputs, p);
  const dashTrackedHTML = renderTrackedConstantsTable(getTrackedSageConstants(r, inputs, p), (inputs && inputs.periodicite==="Mensuel") ? "Mensuel" : "Période");

  const money = (x)=> Number.isNaN(x) ? NaN : x;

  const mapValue = (cellule)=>{
    const c = String(cellule||"").trim();
    // Supporte les références vues dans l'Excel
    if(c.endsWith("B25")) return money(n(inputs.ppvPeriode)||0);
    if(c.endsWith("B24")) return money(n(inputs.remunerationPeriode)||0);
    if(c.endsWith("E38")) return money(r.smicReference);
    if(c.endsWith("E46")) return money(r.reducAnnuelle);
    if(c.endsWith("E45")) return r.coefFinal;
    if(c.endsWith("E41")) return money(r.remunerationAnnuelle);
    if(c.endsWith("E40")) return money(r.seuil3Smic);
    if(c.endsWith("E31")) return r.tdelta;
    if(c.endsWith("Parametres!B6") || c.endsWith("B6")) return p.p;
    if(c.endsWith("Parametres!B5") || c.endsWith("B5")) return p.tmin;
    return NaN;
  };

  const kindFor = (code, cellule)=>{
    const c = String(code||"");
    const cell = String(cellule||"");
    if(c.includes("SMIC") || c.includes("REMUN") || c.includes("REDUC") || c.includes("MAXSMI") || cell.includes("E38") || cell.includes("E40") || cell.includes("E41") || cell.includes("E46") || cell.includes("B24") || cell.includes("B25")) return "money";
    if(c.includes("TDELTA") || c.includes("TMIN") || cell.includes("E31") || cell.includes("E45")) return "n4";
    if(c.includes("EXPOS") || cell.includes("B6")) return "n2";
    return "n2";
  };

  const decorate = (item)=>({
    ...item,
    valeur_calculee: mapValue(item.cellule),
    valeur_type: kindFor(item.code, item.cellule),
  });

  return {
    ...refs,
    scenarioKey,
    rubriques: (refs.rubriques||[]).map(decorate),
    constantes: (refs.constantes||[]).map(decorate),
  };
}



function getTrackedSageConstants(r, inputs, p){
  // IMPORTANT : ne pas inventer de codes. Cette liste ne contient QUE des rubriques / constantes présentes
  // dans l’onglet “Références Sage” (data/references_sage.json).
  const perFactor = (inputs && inputs.periodicite === "Mensuel") ? 12 : 1;

  const remunPer = Number.isFinite(r.remunerationAnnuelle) ? (r.remunerationAnnuelle / perFactor) : NaN;
  const smicPer  = Number.isFinite(r.smicReference) ? (r.smicReference / perFactor) : NaN;
  const reducPer = Number.isFinite(r.reducAffichee) ? r.reducAffichee : (Number.isFinite(r.reducMensuelle) ? r.reducMensuelle : NaN);

  return [
    // ---- Rubriques (codes numériques) ----
    { code:"13785", libelle:"PPV pour calcul RGCP", commentaire:"Valeur saisie (PPV sur période).",
      annuel:(Number.isFinite(inputs && inputs.ppvPeriode) ? inputs.ppvPeriode * perFactor : NaN),
      periode:(Number.isFinite(inputs && inputs.ppvPeriode) ? inputs.ppvPeriode : NaN), type:"money" },

    { code:"63492", libelle:"Historisation DFS", commentaire:"Taux DFS appliqué (0 si pas de DFS).", annuel:r.dfsRate||0, periode:r.dfsRate||0, type:"n4" },

    { code:"63460", libelle:"Historisation SMICMENS", commentaire:"SMIC annuel de référence (annualisé dans le simulateur).",
      annuel:r.smicReference, periode:smicPer, type:"money" },

    { code:"63470", libelle:"Historisation Rémunération", commentaire:"Rémunération sur période (hors PPV).",
      annuel:r.remunerationAnnuelle, periode:remunPer, type:"money" },

    { code:"79580", libelle:"Coefficient Allègement général", commentaire:"Coefficient final (arrondi à 4 décimales).",
      annuel:r.coefFinal, periode:r.coefFinal, type:"n4" },

    { code:"63500", libelle:"Allègement des cotisations", commentaire:"Montant d’allègement (annuel) ; voir aussi mensuel / affiché.",
      annuel:r.reducAnnuelle, periode:reducPer, type:"money" },

    // ---- Constantes (codes alphanumériques) ----
    { code:"ALG_TDFS", libelle:"Taux DFS", commentaire:"Taux DFS retenu (0 si pas de DFS).", annuel:r.dfsRate||0, periode:r.dfsRate||0, type:"n4" },
    { code:"ALG_TMIN", libelle:"Valeur Tmin", commentaire:"Tmin utilisé dans la formule.", annuel:p.tmin, periode:p.tmin, type:"n4" },
    { code:"ALG_EXPOS", libelle:"Valeur exposant (P)", commentaire:"Exposant de la formule (P).", annuel:(Number.isFinite(p.p)?p.p:1.75), periode:(Number.isFinite(p.p)?p.p:1.75), type:"n4" },
    { code:"ALG_TDELTA", libelle:"Calcul de la valeur de Tdelta", commentaire:"Tdelta retenu (standard ou personnalisé).", annuel:r.tdelta, periode:r.tdelta, type:"n4" },
    { code:"ALG_SMICAN", libelle:"SMIC annuel", commentaire:"SMIC annuel de référence.", annuel:r.smicReference, periode:smicPer, type:"money" },
    { code:"ALG_MAXSMI", libelle:"Valeur à appliquer au SMIC", commentaire:"Seuil d’annulation (3 × SMIC annuel).",
      annuel:r.seuil3Smic, periode:(Number.isFinite(r.seuil3Smic)? r.seuil3Smic/perFactor : NaN), type:"money" },
    { code:"ALG_REMUNA", libelle:"Rémunération annuelle", commentaire:"Rémunération annualisée incluant PPV.",
      annuel:r.remunerationAnnuelle, periode:remunPer, type:"money" },
    { code:"ALG_REDUC", libelle:"Montant global de l’allègement", commentaire:"Montant d’allègement (annuel).",
      annuel:r.reducAnnuelle, periode:reducPer, type:"money" },
  ];
}

function fmtByType(x, type){
  if(type==="money") return Number.isNaN(x) ? "—" : fmtEUR.format(x);
  if(type==="n4") return Number.isNaN(x) ? "—" : fmt4.format(x);
  if(type==="pct"){
    if(!Number.isFinite(x)) return "—";
    return fmt2.format(x*100) + " %";
  }
  if(type==="bool"){
    if(x===true) return "Oui";
    if(x===false) return "Non";
    return "—";
  }
  return Number.isNaN(x) ? "—" : fmt2.format(x);
}

function renderTrackedConstantsTable(rows, periodLabel){
  return `
    <table class="table">
      <thead>
        <tr>
          <th>Constante</th>
          <th>Libellé</th><th>Commentaire</th>
          <th>${safeText(periodLabel || "Période")}</th>
          <th>Annuel</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r=>`
          <tr>
            <td><strong>${safeText(r.code)}</strong></td>
            <td>${safeText(r.libelle)}</td>
            <td>${safeText(r.commentaire || "")}</td>
            <td>${safeText(fmtByType(r.periode, r.type))}</td>
            <td>${safeText(fmtByType(r.annuel, r.type))}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    <div class="small muted" style="margin-top:8px">Note : ces valeurs sont les <strong>équivalents</strong> calculés par la web app, pour faciliter le contrôle avec le paramétrage Sage.</div>
  `;
}

function renderReferencesView(refs){
  return `
    <div class="sheet">
      <div class="card">
        <div class="hd">
          <div>
            <div class="title">${safeText(refs.title || "Références Sage")}</div>
            <div class="hint">${safeText(refs.note || "")}</div>
          </div>
        </div>
        <div class="bd">
          
          <div class="searchrow">
            <select id="refScenario">
              <option value="A">Scénario A (Simulation)</option>
              <option value="B">Scénario B (Simulation_B)</option>
            </select>
            <input id="refSearch" placeholder="Rechercher (code, libellé…)" />
            <span class="badge" id="refCount"></span>
          </div>
             
          <hr class="sep"/>
          <div id="refConstantesBlock"></div>

          <hr class="sep"/>
          <div id="refRubriquesBlock"></div>
        </div>
      </div>
    </div>
  `;
}

function renderRefTable(items){
  const rows = items.map(it => `
    <tr>
      <td><strong>${safeText(it.code)}</strong></td>
      <td>${safeText(it.libelle)}</td>
      <td>${safeText(fmtValue(it.valeur_type, it.valeur_calculee))}</td>
      <td>${safeText(it.commentaire)}</td>
    </tr>`).join("");

  return `
    <table class="table">
      <thead><tr><th>Code</th><th>Libellé (Sage)</th><th>Valeur (${safeText(perLabelRef)})</th><th>Commentaire</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}


function wireReferences(refs, params, state){
  const inp = document.getElementById("refSearch");
  const cnt = document.getElementById("refCount");
  const constBlock = document.getElementById("refConstantesBlock");
  const rubBlock = document.getElementById("refRubriquesBlock");
  const sel = document.getElementById("refScenario");

  function renderNow(){
    const scenarioKey = sel.value;
    const p = { ...params, ...(state.params||{}) };
    const r = computeRGDU(state[scenarioKey], p);
    const inputs = state[scenarioKey] || {};

    // Build unified rows from tracked constants
    const tracked = getTrackedSageConstants(r, inputs, p);
    // Also merge static refs data
    const staticRub = (refs.rubriques||[]).map(it=>({...it}));
    const staticConst = (refs.constantes||[]).map(it=>({...it}));

    // Build all rows with: code, libelle (from Sage), commentaire, valeur (from scenario)
    const isMensRef = (inputs.periodicite === "Mensuel");
    const perLabelRef = isMensRef ? "Mensuel" : "Annuel";
    const allRows = tracked.map(t => {
      const val = isMensRef
        ? (Number.isFinite(t.periode) ? t.periode : NaN)
        : (Number.isFinite(t.annuel) ? t.annuel : NaN);
      return {
        code: t.code,
        libelle: t.libelle,
        commentaire: t.commentaire || "",
        valeur: val,
        type: t.type || "n4"
      };
    });

    // Separate into constantes (alphabetic codes) and rubriques (numeric codes)
    const isNumeric = (s) => /^\d+$/.test(s);
    const constantes = allRows.filter(r => !isNumeric(r.code)).sort((a,b) => a.code.localeCompare(b.code));
    const rubriques = allRows.filter(r => isNumeric(r.code)).sort((a,b) => Number(a.code) - Number(b.code));

    // Filter by search
    const q = (inp.value||"").toLowerCase().trim();
    const filt = (arr) => arr.filter(it => {
      const s = (it.code+" "+it.libelle+" "+it.commentaire).toLowerCase();
      return !q || s.includes(q);
    });

    const fc = filt(constantes);
    const fr = filt(rubriques);
    cnt.textContent = (fc.length + fr.length) + " ligne(s)";

    const renderCadre = (title, items) => {
      if(items.length === 0) return `<h3>${safeText(title)}</h3><p class="muted">Aucun résultat.</p>`;
      const rows = items.map(it => `
        <tr>
          <td><strong>${safeText(it.code)}</strong></td>
          <td>${safeText(it.libelle)}</td>
          <td class="muted">${safeText(it.commentaire)}</td>
          <td>${safeText(fmtByType(it.valeur, it.type))}</td>
        </tr>`).join("");
      return `
        <h3>${safeText(title)}</h3>
        <table class="table">
          <thead><tr><th>Code</th><th>Libellé (Sage)</th><th>Commentaire</th><th>Valeur (${safeText(perLabelRef)})</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    };

    constBlock.innerHTML = renderCadre("Constantes", fc);
    rubBlock.innerHTML = renderCadre("Rubriques", fr);
  }

  inp.addEventListener("input", renderNow);
  sel.addEventListener("change", renderNow);
  renderNow();
}







function renderParams(params, state){
  const cur = { ...params, ...(state.params||{}) };

  // Taux stockés en décimal (ex : 34,20% => 0,3420)
  const urssaf050 = Number.isFinite(n(cur.urssaf_fnal_050)) ? n(cur.urssaf_fnal_050) : 0.3420;
  const urssaf010 = Number.isFinite(n(cur.urssaf_fnal_010)) ? n(cur.urssaf_fnal_010) : 0.3380;
  const retraiteSoc = Number.isFinite(n(cur.retraite_patronale_societe)) ? n(cur.retraite_patronale_societe) : 0.0472;
  const ceg = Number.isFinite(n(cur.ceg_t1)) ? n(cur.ceg_t1) : 0.0129;
  const tmin = Number.isFinite(n(cur.tmin)) ? n(cur.tmin) : 0.0200;

  const retraiteRetenue = Math.min(Math.max(0, retraiteSoc), 0.0472);
  const tauxRetraitePrisEnCompte = retraiteRetenue + ceg;

  const tmaxi050 = urssaf050 + tauxRetraitePrisEnCompte;
  const tmaxi010 = urssaf010 + tauxRetraitePrisEnCompte;

  const tdelta050 = tmaxi050 - tmin;
  const tdelta010 = tmaxi010 - tmin;

  const pctRetraite050 = (tmaxi050>0) ? (tauxRetraitePrisEnCompte / tmaxi050) : NaN;
  const pctRetraite010 = (tmaxi010>0) ? (tauxRetraitePrisEnCompte / tmaxi010) : NaN;

  const fmtPct2 = (x)=> Number.isFinite(x) ? (fmt2.format(x*100) + " %") : "—";
  const fmt4d = (x)=> Number.isFinite(x) ? fmt4.format(x) : "—";
  const fmtRate = (x)=> Number.isFinite(x) ? (fmt2.format(x*100) + " %") : "—";

  const inputRow = (label, key, valPct, hint="")=>`
    <div class=\"pRow\">
      <div class=\"pLbl\">
        <div class=\"pT\">${safeText(label)}</div>
        ${hint ? `<div class=\"pH\">${safeText(hint)}</div>` : ``}
      </div>
      <div class=\"pInp\">
        <input data-pkey=\"${safeText(key)}\" data-scale=\"pct\" value=\"${safeText(valPct)}\" />
      </div>
    </div>
  `;

  const section = (title, sub, body)=>`
    <div class=\"card\">
      <div class=\"hd\">
        <div>
          <div class=\"title\">${safeText(title)}</div>
          ${sub ? `<div class=\"hint\">${safeText(sub)}</div>` : ``}
        </div>
      </div>
      <div class=\"bd\">${body}</div>
    </div>
  `;

  const s1 = section(
    "Taux du champ de réduction – socle 2026",
    "Modifiez ces taux pour couvrir les cas particuliers (taux Retraite dérogatoire) ou les évolutions futures.",
    `
      ${inputRow("TOTAL versé à l’URSSAF (URSSAF + chômage) – FNAL 0,50", "urssaf_fnal_050", fmt2.format(urssaf050*100), "Défaut 2026 : 34,20")}
      ${inputRow("TOTAL versé à l’URSSAF (URSSAF + chômage) – FNAL 0,10", "urssaf_fnal_010", fmt2.format(urssaf010*100), "Défaut 2026 : 33,80")}
      ${inputRow("Retraite patronale société (valeur de référence)", "retraite_patronale_societe", fmt2.format(retraiteSoc*100), "Défaut 2026 : 4,72 (plafonné à 4,72)")}
      ${inputRow("CEG T1 (patronal)", "ceg_t1", fmt2.format(ceg*100), "Défaut 2026 : 1,29")}
      ${inputRow("Tmin", "tmin", fmt2.format(tmin*100), "Défaut 2026 : 2,00")}
      <div class=\"small muted\" style=\"margin-top:10px\">
        Pour un cas dérogatoire, saisissez directement le taux Retraite patronal dans “Simulation” / “Simulation B” : il prime sur le paramètre global (tout en étant plafonné à 4,72%).
      </div>
    `
  );

  const s2 = section(
    "Aperçu (calculé)",
    "Contrôle rapide de T maxi / Tdelta et de la répartition URSSAF / Retraite selon FNAL.",
    `
      <div class=\"grid2\">
        <div>
          <div class=\"calcGroupTitle\">FNAL 0,50</div>
          <div class=\"kpi kpi3\">
            ${kpiBox("T maxi", fmt4d(tmaxi050))}
            ${kpiBox("Tdelta", fmt4d(tdelta050))}
            ${kpiBox("% Retraite", fmtPct2(pctRetraite050))}
          </div>
          <div class=\"small muted\" style=\"margin-top:8px\">% URSSAF : <strong>${fmtPct2(Number.isFinite(pctRetraite050)?(1-pctRetraite050):NaN)}</strong></div>
        </div>
        <div>
          <div class=\"calcGroupTitle\">FNAL 0,10</div>
          <div class=\"kpi kpi3\">
            ${kpiBox("T maxi", fmt4d(tmaxi010))}
            ${kpiBox("Tdelta", fmt4d(tdelta010))}
            ${kpiBox("% Retraite", fmtPct2(pctRetraite010))}
          </div>
          <div class=\"small muted\" style=\"margin-top:8px\">% URSSAF : <strong>${fmtPct2(Number.isFinite(pctRetraite010)?(1-pctRetraite010):NaN)}</strong></div>
        </div>
      </div>

      <hr class=\"sep\"/>

      <div class=\"kpi kpi3\">
        ${kpiBox("Retraite retenue (plafonnée)", fmtRate(tauxRetraitePrisEnCompte))}
        ${kpiBox("Retraite société (réf.)", fmtRate(retraiteSoc))}
        ${kpiBox("CEG T1", fmtRate(ceg))}
      </div>

      <div class=\"small muted\" style=\"margin-top:10px\">
        La “répartition URSSAF / Retraite” du bloc Résultats dépend directement de ces taux (URSSAF+chômage, Retraite, CEG, Tmin).
      </div>
    `
  );

  // Export des signalements d'écart (stockés localement)
  let reportCount = 0;
  try{ reportCount = JSON.parse(localStorage.getItem("rgdu_reports_v1")||"[]").length; }catch(e){ reportCount = 0; }

  const s3 = section(
    "Signalements d’écart",
    "Télécharge un fichier texte regroupant les signalements (utile pour support KDS).",
    `
      <div class=\"rowActions\" style=\"align-items:center\">
        <span class=\"badge\">${safeText(reportCount)} signalement(s) enregistré(s)</span>
        <button class=\"btn ghost\" id=\"exportReports\">Exporter les signalements</button>
      </div>
      <div class=\"small muted\" style=\"margin-top:10px\">
        Astuce : si le fichier est vide, crée un signalement via le bouton “Signaler un écart” depuis Simulation.
      </div>
    `
  );

  return `${s1}${s2}${s3}`;
}



function renderSimulation(title, key, options, params, state){
  const i = state[key];
  const p = { ...params, ...(state.params||{}) };

  const r = computeRGDU(i, p);
  const b = badgeFor(r);

  const money = (x)=> Number.isNaN(x) ? "—" : fmtEUR.format(x);
  const num4 = (x)=> Number.isNaN(x) ? "—" : fmt4.format(x);
  const num2 = (x)=> Number.isNaN(x) ? "—" : fmt2.format(x);

  const kpiTop = `
    <div class="kpi kpi3">
      ${kpiBox("Résultat affiché", money(r.reducAffichee))}
      ${kpiBox("Coefficient final", num4(r.coefFinal))}
      ${kpiBox("Statut", r.invalid ? "—" : (r.remunerationAnnuelle >= r.seuil3Smic ? "⛔ Pas de réduction" : (r.reducAffichee>0 ? "✅ Réduction" : "⛔ Pas de réduction")))}
    </div>
  `;

  const card = (t,h,body)=>`
    <div class="card">
      <div class="hd">
        <div>
          <div class="title">${safeText(t)}</div>
          ${h ? `<div class="hint">${safeText(h)}</div>` : ``}
        </div>
      </div>
      <div class="bd">${body}</div>
    </div>
  `;

  const blocSociete = `
    <div class="grid2">
      ${field({id:`${key}_periodicite`, label:"Périodicité", value:i.periodicite, options: options.periodicite, hint:"Mensuel = affichage annuel/12"})}
      ${field({id:`${key}_fnal`, label:"FNAL applicable", tooltip:"FNAL 0,10 % : entreprises de moins de 50 salariés. FNAL 0,50 % : entreprises de 50 salariés et plus (assiette totale, sans plafond). En cas de doute, vérifiez l'effectif habituel de l'entreprise.", value:i.fnal, options: options.fnal})}
      ${field({id:`${key}_situation`, label:"Situation particulière", tooltip:"Cas général : la grande majorité des salariés. Journalistes : taux Tdelta spécifique (formule D.241-7 II). Prof médicales TP : temps partiel médical, règles dérogatoires. VRP multicartes : exonération partielle de l'assujettissement. Personnalisé : permet de saisir un Tdelta libre dans le champ dédié.", value:i.situation, options: options.situation})}
      ${field({id:`${key}_dfs`, label:"DFS (abattement frais pro)", tooltip:"La Déduction Forfaitaire Spécifique (DFS) permet d'appliquer un abattement sur l'assiette des cotisations dans certains secteurs. Elle déclenche un double calcul de la réduction : sans DFS (base) et avec DFS. Le plus favorable est retenu, dans la limite de 130 % de la réduction de base. À n'activer que si la convention collective ou l'accord le prévoit expressément.", value:(i.dfs ?? "Pas de DFS"), options: options.dfs, hint:"Déduction forfaitaire spécifique (DFS) — plafonnement à 130% de la réduction sans DFS."})}
      ${field({id:`${key}_tdeltaPerso`, label:"Tdelta personnalisé (si Personnalise)", tooltip:"Le Tdelta est la différence entre le taux maximum du champ de réduction et le Tmin (2 %). Utile uniquement si vous avez sélectionné 'Personnalisé' en situation particulière et que votre taux diffère du standard calculé automatiquement (FNAL 0,50 % : 0,3220 — FNAL 0,10 % : 0,3180).", type:"number", value:i.tdeltaPerso ?? "", step:"0.0001", hint:"Laissez vide pour utiliser le Tdelta standard."})}
      ${field({id:`${key}_bonusMalus`, label:"Taux chômage patronal modulé (%)", type:"number", value:i.bonusMalus ?? "", step:"0.01", hint:"Taux figurant sur vos bulletins de paie. Vide = taux standard (4,05 %). Ex : 3,00 (bonus) ou 5,05 (malus)."})}
      ${field({id:`${key}_retraitePatronaleSociete`, label:"Retraite patronale société (dérogatoire)", tooltip:"À renseigner uniquement si le taux de retraite patronale de l'entreprise diffère du taux standard 2026 (4,72 %). Ce champ est plafonné à 4,72 % dans le calcul : un taux supérieur sera ramené à ce plafond. Ne pas renseigner pour le cas général.", type:"number", value:i.retraitePatronaleSociete ?? "", step:"0.01", hint:"Saisissez en % (ex : 4,50). Si > 4,72, la prise en compte est plafonnée à 4,72."})}
      ${field({id:`${key}_majoration`, label:"Profil de majoration", value:i.majoration, options: options.majoration})}
      ${field({id:`${key}_transport`, label:"Transport", value:i.transport, options: options.transport})}
    </div>
  `;

  const blocTemps = `
    <div class="grid2">
      ${field({id:`${key}_typeHeures`, label:"Type de contrat / temps de travail", value:i.typeHeures, options: options.typeHeures})}
      ${field({id:`${key}_heuresJour`, label:"Heures par jour (forfait)", type:"number", value:i.heuresJour ?? 7, step:"0.01"})}
      ${field({id:`${key}_heuresMensuelles`, label:"Heures mensuelles contractuelles", type:"number", value:i.heuresMensuelles ?? "", step:"0.01", hint:"Uniquement si “Heures mensuelles contractuelles”"})}
      ${field({id:`${key}_forfaitHeures`, label:"Forfait annuel (heures)", type:"number", value:i.forfaitHeures ?? "", step:"0.01", hint:"Uniquement si “Forfait annuel (heures)”"})}
      ${field({id:`${key}_forfaitJours`, label:"Forfait annuel (jours)", type:"number", value:i.forfaitJours ?? "", step:"0.01", hint:"Uniquement si “Forfait annuel (jours)”"})}
      ${field({id:`${key}_heuresSupPeriode`, label:"Heures supplémentaires sur période", type:"number", value:i.heuresSupPeriode ?? 0, step:"0.01"})}
    </div>
  `;

  // ── Bloc Présence (refonte BOSS § 720 — 01/04/2026) ──────────────────────
  const sitAbs = i.situationAbsence || "presence_totale";
  const modeAbs = i.modeAbsence || "montants";
  const showAbsDetails = sitAbs === "absence";
  const showCoef = showAbsDetails && modeAbs === "coefficient";
  const showMontants = showAbsDetails && modeAbs !== "coefficient";

  // Calculs affichés dans le résumé ENA
  const remunTheo = n(i.remunTheorique) || 0;
  const enaTh    = n(i.enaTheorique) || 0;
  const remunVer = n(i.remunVersee) || 0;
  const enaVer   = n(i.enaVersee) || 0;
  const elemAffTh  = remunTheo - enaTh;
  const elemAffVer = remunVer  - enaVer;
  const rapportPct = (elemAffTh > 0 && Number.isFinite(elemAffVer / elemAffTh))
    ? fmt2.format((elemAffVer / elemAffTh) * 100) + " %"
    : "—";

  const blocPresence = `
    <div class="field">
      <label>Situation sur la période<button type="button" class="rgdu-tip-btn" aria-label="Aide" data-tip="Présence totale : salarié présent tout le mois, SMIC non proratisé.&#10;Absence (sans paie ou maintien partiel) : déclenche la formule D.241-7 IV (BOSS § 720). Le SMIC est proratisé selon le rapport rémunération versée / théorique, hors ENA.&#10;Maintien total : salarié absent mais salaire intégralement maintenu, SMIC non proratisé (comme présence totale)." tabindex="-1">ⓘ</button></label>
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:4px;">
        ${["presence_totale","absence","maintien_total"].map(v => `
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-weight:${sitAbs===v?"600":"400"}">
            <input type="radio" name="${key}_situationAbsence" value="${v}" ${sitAbs===v?"checked":""} style="cursor:pointer"/>
            ${v==="presence_totale" ? "Présence totale" : v==="absence" ? "Absence (sans paie ou maintien partiel)" : "Maintien total de salaire"}
          </label>`).join("")}
      </div>
      ${sitAbs==="maintien_total" ? `<div class="small muted" style="margin-top:6px">Maintien total : SMIC habituel — pas de proratisation.</div>` : ""}
    </div>

    <div id="${key}_presenceModeDiv" class="field" style="margin-top:12px;display:${showAbsDetails?'block':'none'}">
      <label>Mode de saisie</label>
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:4px;">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-weight:${modeAbs!=="coefficient"?"600":"400"}">
          <input type="radio" name="${key}_modeAbsence" value="montants" ${modeAbs!=="coefficient"?"checked":""} style="cursor:pointer"/>
          Montants détaillés <span class="small muted">(recommandé)</span>
        </label>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-weight:${modeAbs==="coefficient"?"600":"400"}">
          <input type="radio" name="${key}_modeAbsence" value="coefficient" ${modeAbs==="coefficient"?"checked":""} style="cursor:pointer"/>
          Coefficient direct <span class="small muted">(issu du logiciel)</span>
        </label>
      </div>
    </div>

    <div id="${key}_presenceMontantsDiv" style="display:${showMontants?'block':'none'};background:rgba(110,57,142,.06);border:1px solid rgba(110,57,142,.18);border-radius:10px;padding:14px 16px;margin-top:10px;">
      <div style="font-size:11px;font-weight:700;color:var(--muted,#666);text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px;">
        Proratisation SMIC — D.241-7 IV + BOSS § 720 (01/04/2026)<button type="button" class="rgdu-tip-btn" style="font-size:10px;" aria-label="Aide" data-tip="Formule légale :&#10;Rapport = (Rémun. versée − ENA versés) / (Rémun. théorique − ENA théoriques)&#10;SMIC proratisé = SMIC annuel × rapport&#10;&#10;Les ENA (Éléments Non Affectés) sont exclus des deux membres du rapport." tabindex="-1">ⓘ</button>
      </div>
      <div class="grid2">
        ${field({id:`${key}_remunTheorique`, label:"Rémun. théorique (mois complet)", type:"number", value: remunTheo || "", step:"0.01", hint:"Rémunération si présence totale sur la période (hors ENA)"})}
        ${field({id:`${key}_enaTheorique`, label:"ENA théoriques (période)", tooltip:"ENA = Éléments Non Affectés par l'absence. Ce sont les éléments de rémunération qui ne sont PAS proratisés proportionnellement à l'absence. Exemples : prime trimestrielle versée intégralement, IFC, ICP, prime de Noël forfaitaire. Saisir le montant brut que le salarié aurait perçu pour un mois complet. Une prime mensuelle proratisée strictement n'est PAS un ENA (BOSS § 720).", type:"number", value: enaTh || "", step:"0.01", hint:"Éléments Non Affectés par l'absence : primes non proratisées strictement, primes à périodicité différente (trim./ann.), IFC, ICP…"})}
      </div>
      <div class="small muted" style="margin:2px 0 12px 0">
        Éléments <em>affectés</em> théoriques (calculé&nbsp;auto) :
        <strong>${elemAffTh > 0 ? money(elemAffTh) : "—"}</strong>
      </div>
      <div class="grid2">
        ${field({id:`${key}_remunVersee`, label:"Rémun. effectivement versée", type:"number", value: remunVer || "", step:"0.01", hint:"Ce que l'employeur verse réellement ce mois (hors IJSS nettes de SS)"})}
        ${field({id:`${key}_enaVersee`, label:"ENA versés (période)", tooltip:"Montant des ENA effectivement versés sur la période concernée (même définition que les ENA théoriques). Dans la plupart des cas, ENA versés = ENA théoriques (la prime forfaitaire est versée même pendant l'absence). Différent uniquement si la prime a été suspendue ou proratisée partiellement.", type:"number", value: enaVer || "", step:"0.01", hint:"En général = ENA théoriques. Diffère seulement si l'ENA est lui-même impacté non strictement proportionnellement"})}
      </div>
      <div class="small muted" style="margin:2px 0 12px 0">
        Éléments <em>affectés</em> versés (calculé&nbsp;auto) :
        <strong>${elemAffVer > 0 ? money(elemAffVer) : "—"}</strong>
      </div>
      <div style="background:rgba(110,57,142,.10);border-radius:8px;padding:8px 12px;font-size:13px;line-height:1.5;">
        Rapport&nbsp;: <strong>${elemAffVer > 0 || elemAffTh > 0 ? money(elemAffVer)+" / "+money(elemAffTh) : "—"}</strong>
        &nbsp;=&nbsp;<strong>${rapportPct}</strong>
      </div>
      <div class="small muted" style="margin-top:8px">
        ⓘ Les ENA sont exclus des deux membres du rapport (numérateur ET dénominateur).
        Exemples d'ENA : prime mensuelle non proratisée, prime trimestrielle ou annuelle, IFC, ICP.
      </div>
    </div>

    <div id="${key}_presenceCoefDiv" style="display:${showCoef?'block':'none'};margin-top:10px;">
      ${field({id:`${key}_presenceForfait`, label:"Coefficient de présence (%)", type:"number", value: ((i.presenceForfait ?? 1) * 100), step:"0.01", hint:"Rapport issu du logiciel (ex : 50,00 pour 50 %). Converti automatiquement en coefficient."})}
    </div>

    <div class="small muted" style="margin-top:10px;">
      Présence retenue (calcul)&nbsp;: <strong id="${key}_presenceComputed">${Number.isNaN(r.presence) ? "—" : (fmt2.format(r.presence*100) + " %")}</strong>
      ${r.smicProratNote ? `<span class="muted" style="margin-left:8px">(${r.smicProratNote})</span>` : ""}
    </div>
  `;
  const blocRemun = `
    <div class="grid2">
      ${field({id:`${key}_remunerationPeriode`, label:"Rémunération période (hors PPV)", type:"number", value:i.remunerationPeriode ?? 0, step:"0.01"})}
      ${field({id:`${key}_ppvPeriode`, label:"PPV période", type:"number", value:i.ppvPeriode ?? 0, step:"0.01"})}
    </div>
    <div class="small muted" style="margin-top:10px">
      Rémunération annualisée (incl. PPV) : <strong>${money(r.remunerationAnnuelle)}</strong>
    </div>
  `;

  const resumeCalc = `
    ${kpiTop}
    <hr class="sep"/>
    <table class="table">
      <thead><tr><th>Indicateur</th><th>Valeur</th></tr></thead>
      <tbody>
        <tr><td>SMIC de référence (annuel)</td><td>${money(r.smicReference)}${r.smicProratNote ? `<br/><span class="small muted">${safeText(r.smicProratNote)}</span>` : ""}</td></tr>
        <tr><td>Seuil 3×SMIC (annuel)</td><td>${money(r.seuil3Smic)}</td></tr>
        <tr><td>Heures annuelles retenues</td><td>${num2(r.heuresAnnuelles)}</td></tr>
        <tr><td>Tdelta retenu</td><td>${num4(r.tdelta)}</td></tr>
        <tr><td>Taux chômage patronal</td><td>${num4(r.bonusMalusTaux)} % ${Number.isFinite(r.bonusMalusAdj) && r.bonusMalusAdj !== 0 ? '<span class="muted">(diff. ' + (r.bonusMalusAdj > 0 ? "+" : "") + num4(r.bonusMalusAdj*100) + ' %)</span>' : '<span class="muted">(standard)</span>'}</td></tr>
        <tr><td>M (majoration) <span class="small muted">— Coefficient de majoration : intérimaires (×1,1), caisses congés payés (×100/90), transport routier, ou ×1 par défaut.</span></td><td>${num4(r.M)}</td></tr>
        <tr><td>A (transport)</td><td>${num4(r.A)}</td></tr>
        <tr><td>Réduction annuelle</td><td>${money(r.reducAnnuelle)}</td></tr>
        <tr><td>Part URSSAF (annuelle)</td><td>${money(r.partUrssafAnnuelle)}</td></tr>
        <tr><td>Part Retraite (annuelle)</td><td>${money(r.partRetraiteAnnuelle)}</td></tr>
        <tr><td>Réduction mensuelle</td><td>${money(r.reducMensuelle)}</td></tr>
        <tr><td>Part URSSAF (mensuelle)</td><td>${money(r.partUrssafMensuelle)}</td></tr>
        <tr><td>Part Retraite (mensuelle)</td><td>${money(r.partRetraiteMensuelle)}</td></tr>
      </tbody>
    </table>
    <div class="small muted" style="margin-top:10px">Astuce : utilise “Références Sage” pour contrôler les valeurs avec Sage.</div>
  `;

  // DFS condensed block (only for Scenario A)
  const dfsRate = getDfsRate(i.dfs);
  const dfsBlock = (key === "A") ? (() => {
    if(dfsRate <= 0) return `
      <div class="card">
        <div class="hd"><div><div class="title">Calcul DFS</div><div class="hint">Pas de DFS sélectionné</div></div></div>
        <div class="bd"><p class="muted">Sélectionnez un taux DFS dans « Contexte global » pour activer le double calcul.</p></div>
      </div>`;
    const Adfs = r.reducSansDFS;
    const Bdfs = r.reducAvecDFS;
    const plaf = r.reducPlafond130;
    const finalDfs = r.reducAnnuelle;
    const remunAbattuePer = (i.remunerationPeriode||0) * (1 - dfsRate);
    const ppvP = Number(i.ppvPeriode||0);
    const perF = (i.periodicite==="Mensuel") ? 12 : 1;
    const fP = (x)=> Number.isNaN(x) ? "—" : fmtEUR.format(x);
    const fPc = (x)=> Number.isFinite(x) ? fmt2.format(x*100)+" %" : "—";
    return `
      <div class="card">
        <div class="hd">
          <div>
            <div class="title">Calcul DFS</div>
            <div class="hint">Double calcul + plafond 130%</div>
          </div>
          ${r.dfsPlafondApplique ? '<span class="badge bad">Plafond 130% appliqué</span>' : '<span class="badge ok">DFS retenue</span>'}
        </div>
        <div class="bd">
          <table class="table">
            <tbody>
              <tr><td>Taux DFS retenu</td><td><strong>${fPc(dfsRate)}</strong></td></tr>
              <tr><td>Rémunération après abattement (période)</td><td>${fP(remunAbattuePer)}</td></tr>
              <tr><td>PPV (période)</td><td>${fP(ppvP)}</td></tr>
              <tr><td>A — Sans DFS (${perF===12?"mensuel":"annuel"})</td><td>${fP(Adfs/perF)}</td></tr>
              <tr><td>B — Avec DFS (${perF===12?"mensuel":"annuel"})</td><td>${fP(Bdfs/perF)}</td></tr>
              <tr><td>Plafond 130% de A (${perF===12?"mensuel":"annuel"})</td><td>${fP(plaf/perF)}</td></tr>
              <tr><td><strong>Final retenu (${perF===12?"mensuel":"annuel"})</strong></td><td><strong>${fP(finalDfs/perF)}</strong></td></tr>
            </tbody>
          </table>
          <div class="small muted" style="margin-top:6px">Détail pédagogique complet dans l'onglet « Calcul DFS ».</div>
        </div>
      </div>`;
  })() : '';

  // Copy button (Sim B only)
  const copyBtn = (key === "B") ? `<button class="btn ghost sm" id="btnCopyFromA" style="margin-left:8px">📋 Recopie de la simulation principale</button>` : '';

  const left = `
    ${card(title, "Saisie guidée par blocs (plus lisible et plus rapide).", `<div class="rowActions"><span class="badge ${b.cls}">${safeText(b.txt)}</span>${copyBtn}<button class="btn ghost sm" data-report="simulation" data-scn="${key}">Signaler un écart</button></div>`)}
    ${card("Contexte global", "FNAL / situation / majoration / transport", blocSociete)}
    ${card("Temps de travail", "Type de contrat + heures/forfait + heures sup", blocTemps)}
    ${card("Présence", "Absence annualisée ou coefficient de présence", blocPresence)}
    ${card("Rémunération", "Rémunération de la période + PPV", blocRemun)}
    <div id="${key}_dfsBlock">${dfsBlock}</div>
  `;

  const right = `
    <div class="card stickySide">
      <div class="hd">
        <div>
          <div class="title">Résultats</div>
          <div class="hint">Mise à jour en temps réel</div>
        </div>
        <span class="badge ${b.cls}">${safeText(b.txt)}</span>
      </div>
      <div class="bd"><div class="stateBar" id="${key}_stateBar">${renderStateBar(key, state)}</div><div id="${key}_resultsBody">${renderSimulationResults(key, r, i, p)}</div></div>
    </div>
  `;

  return `
    <div class="sheet simLayout">
      <div class="simLeft">${left}</div>
      <div class="simRight">${right}</div>
    </div>
  `;
}


function renderCalcPanel(key, r, i, p){
  const money = (x)=> (Number.isFinite(x) ? fmtEUR.format(x) : "—");
  const num4 = (x)=> (Number.isFinite(x) ? fmt4.format(x) : "—");

  window.__KDS_UI = window.__KDS_UI || { calcTab:{}, calcScope:{} };
  const ui = window.__KDS_UI;
  const tab = (ui.calcTab && ui.calcTab[key]) ? ui.calcTab[key] : "detail";
  const scope = (ui.calcScope && ui.calcScope[key]) ? ui.calcScope[key] : "period";

  const periodicite = (i && i.periodicite) ? i.periodicite : "Mensuel";
  const isMonthly = (periodicite === "Mensuel");
  const div = (scope === "period" && isMonthly) ? 12 : 1;
  const labelScope = (scope === "annual") ? "Annuel" : "Période";

  const hsRet =
    (isMonthly ? (n(i.heuresSupPeriode)||0) * 12 : (n(i.heuresSupPeriode)||0));
    // heuresSupAnnuel supprimé — BOSS § 860

  const heuresAn = Number.isFinite(r.heuresAnnuelles) ? r.heuresAnnuelles : (n(i.heuresMensuelles)||0)*12;
  const heuresBaseAn = Math.max(0, (heuresAn||0) - (hsRet||0));

  const A = Number.isFinite(r.A) ? r.A : 1;
  const presence = Number.isFinite(r.presence) ? r.presence : 1;

  const smicSansHS = (Number.isFinite(p.smicHoraire) ? p.smicHoraire : 0) * heuresBaseAn * presence * A;
  const majHS = (Number.isFinite(p.smicHoraire) ? p.smicHoraire : 0) * hsRet * presence * A;

  const smicSansHSDisp = Number.isFinite(smicSansHS) ? (smicSansHS / div) : NaN;
  const majHSDisp = Number.isFinite(majHS) ? (majHS / div) : NaN;

  const smicRef = Number.isFinite(r.smicReference) ? (r.smicReference / div) : NaN;
  const seuil3  = Number.isFinite(r.seuil3Smic) ? (r.seuil3Smic / div) : NaN;

  const remunAn = Number.isFinite(r.remunerationAnnuelle) ? r.remunerationAnnuelle : NaN;
  const assiette = Number.isFinite(remunAn) ? (remunAn / div) : NaN;

  const ratio = (Number.isFinite(assiette) && Number.isFinite(smicRef) && smicRef>0) ? (assiette / smicRef) : NaN;
  const base = (Number.isFinite(assiette) && assiette>0 && Number.isFinite(smicRef)) ? ((3*smicRef/assiette) - 1) : NaN;
  const P = Number.isFinite(p.p) ? p.p : 1.75;
  const coefDeg = (Number.isFinite(base) && base>0) ? (0.5 * Math.pow(base, P)) : 0;

  const reduc = (scope === "annual")
    ? r.reducAnnuelle
    : (isMonthly ? r.reducMensuelle : r.reducAnnuelle);

  const partU = (scope === "annual")
    ? r.partUrssafAnnuelle
    : (isMonthly ? r.partUrssafMensuelle : r.partUrssafAnnuelle);

  const partR = (scope === "annual")
    ? r.partRetraiteAnnuelle
    : (isMonthly ? r.partRetraiteMensuelle : r.partRetraiteAnnuelle);

  const btn = (active)=> active ? "btn" : "btn ghost";
  const tabBtn = (t, label)=> `<button type="button" aria-pressed="${tab===t}" class="${btn(tab===t)}" onclick="KDS_setCalcTab('${key}','${t}')">${safeText(label)}</button>`;
  const scopeBtn = (s, label)=> `<button type="button" aria-pressed="${scope===s}" class="${btn(scope===s)}" onclick="KDS_setCalcScope('${key}','${s}')">${safeText(label)}</button>`;

  const header = `
    <div class="calcHeader">
      <div class="calcTabs">
        ${tabBtn("detail","Détail")}
        ${tabBtn("synth","Synthèse")}
      </div>
      <div class="calcScope">
        ${scopeBtn("period","Période")}
        ${scopeBtn("annual","Annuel")}
      </div>
      <div class="calcExport">
        <button type="button" class="btn ghost" onclick="KDS_exportCalcExcelXML('${key}')">Exporter Excel</button>
      </div>
    </div>
  `;

  if(tab === "synth"){
    return `
      ${header}
      <div class="calcSynth">
        <div class="calcRow"><span>SMIC ajusté (${safeText(labelScope)})</span><strong>${money(smicRef)}</strong></div>
        <div class="calcRow"><span>Seuil 3×SMIC (${safeText(labelScope)})</span><strong>${money(seuil3)}</strong></div>
        <div class="calcRow"><span>Assiette retenue (${safeText(labelScope)})</span><strong>${money(assiette)}</strong></div>
        <div class="calcRow"><span>Coefficient final</span><strong>${num4(r.coefFinal)}</strong></div>
        <div class="calcRow"><span>Réduction (${safeText(labelScope)})</span><strong>${money(reduc)}</strong></div>
        <div class="calcRow"><span>Part URSSAF (${safeText(labelScope)})</span><strong>${money(partU)}</strong></div>
        <div class="calcRow"><span>Part Retraite (${safeText(labelScope)})</span><strong>${money(partR)}</strong></div>
      </div>
    `;
  }

  const step = (nStep, label, value, formula)=>`
    <div class="calcStep">
      <div class="calcStepN">${nStep}</div>
      <div class="calcStepBody">
        <div class="calcStepLabel">${safeText(label)}</div>
        ${formula ? `<div class="calcStepFormula">${formula}</div>` : ``}
      </div>
      <div class="calcStepVal">${safeText(value)}</div>
    </div>
  `;
  const title = (txt)=>`<div class="calcGroupTitle">${safeText(txt)}</div>`;
  const line = (label, val)=>`<div class="calcLine"><span>${safeText(label)}</span><strong>${safeText(val)}</strong></div>`;

  return `
    ${header}
    <div class="calcSteps">
      ${step(1, `SMIC de référence (hors HS) (${labelScope.toLowerCase()})`, money(smicSansHSDisp),
        `${fmt2.format(p.smicHoraire||0)} × ${fmt2.format((heuresBaseAn/div))} h × ${fmt4.format(A)} × présence ${fmt2.format(presence*100)} %`)}
      ${step(2, `Majoration heures sup (${labelScope.toLowerCase()})`, money(majHSDisp),
        `${fmt2.format(p.smicHoraire||0)} × ${fmt2.format((hsRet/div))} h × ${fmt4.format(A)} × présence ${fmt2.format(presence*100)} %`)}
      ${step(3, `SMIC ajusté (${labelScope.toLowerCase()})`, money(smicRef),
        `${money(smicSansHSDisp)} + ${money(majHSDisp)}`)}
      ${step(4, `Assiette (brut) retenue (${labelScope.toLowerCase()})`, money(assiette),
        `Rémunération ${fmt2.format(n(i.remunerationPeriode)||0)} + PPV ${fmt2.format(n(i.ppvPeriode)||0)}${(r.dfsApplied?` (DFS ${fmt2.format((r.dfsRate||0)*100)}%)`:``)}`)}
      ${step(5, "Ratio salaire / SMIC", (Number.isFinite(ratio)? (fmt4.format(ratio) + " × SMIC") : "—"),
        (Number.isFinite(ratio)? `${money(assiette)} / ${money(smicRef)} = ${fmt4.format(ratio)} (seuil 3)` : ""))}
      ${step(6, "Coefficient dégressif", (Number.isFinite(coefDeg)? fmt4.format(coefDeg) : "—"),
        (Number.isFinite(base)? `0,5 × ((3×SMIC / assiette) − 1) ^ ${fmt2.format(P)}` : ""))}
      ${step(7, "Taux applicable / Coefficient final", (Number.isFinite(r.coefFinal)? num4(r.coefFinal):"—"),
        `min(tmin + tdelta×coef, tmin+tdelta) × <span class="ttip">M<span class="ttpop">Coefficient de majoration (${num4(r.M)}) : intérimaires ×1,1 ; caisses congés payés ×100/90 ; transport routier ; ou ×1 par défaut</span></span>`)}
      ${step(8, `Réduction (${labelScope.toLowerCase()})`, money(reduc),
        (Number.isFinite(r.coefFinal) && Number.isFinite(assiette) ? `${num4(r.coefFinal)} × ${money(assiette)}` : ""))}
      ${title(`Répartition de la réduction (${labelScope.toLowerCase()})`)}
      ${line("Part URSSAF", money(partU))}
      ${line("Part Retraite", money(partR))}
    </div>
  `;
}



function renderStateBar(key, state){
  try{
    const v = (__EMBEDDED__ && __EMBEDDED__.versions && __EMBEDDED__.versions.items && __EMBEDDED__.versions.items[0]) ? __EMBEDDED__.versions.items[0] : null;
    const ver = v && v.version ? String(v.version).trim() : "";
    const date = v && v.date ? String(v.date).trim() : "";
    const i = (state && state[key]) ? state[key] : {};
    const periodicite = i && i.periodicite ? i.periodicite : "—";
    const fnal = i && i.fnal ? i.fnal : "—";
    const dfs = (i && i.dfs) ? i.dfs : "Pas de DFS";

    const pills = [];
    pills.push(`<span class="statePill"><strong>Scénario ${safeText(key)}</strong></span>`);
    pills.push(`<span class="statePill">Mode : <strong>${safeText(periodicite)}</strong></span>`);
    pills.push(`<span class="statePill">FNAL : <strong>${safeText(fnal)}</strong></span>`);
    pills.push(`<span class="statePill">DFS : <strong>${safeText(dfs)}</strong></span>`);
    // Version : volontairement non affichée dans le bloc Résultats (trop "technique")
    return pills.join('');
  }catch(e){
    return '';
  }
}

function renderSimulationResults(key, r, i, p){
    try{ window.__KDS_LAST = window.__KDS_LAST || {}; window.__KDS_LAST[key] = { r, i, p }; }catch(e){}
const money = (x)=> Number.isNaN(x) ? "—" : fmtEUR.format(x);
  const num4 = (x)=> Number.isNaN(x) ? "—" : fmt4.format(x);
  const num2 = (x)=> Number.isNaN(x) ? "—" : fmt2.format(x);

  
  // Répartition URSSAF / Retraite (clé = tauxRetraitePrisEnCompte / T maxi)
  const reducPer = Number.isFinite(r.reducAffichee) ? r.reducAffichee : (Number.isFinite(r.reducMensuelle) ? r.reducMensuelle : NaN);
  let pctRet = NaN;
  if(Number.isFinite(r.tmaxi) && r.tmaxi > 0 && Number.isFinite(r.tauxRetraitePrisEnCompte)){
    pctRet = Math.min(1, Math.max(0, r.tauxRetraitePrisEnCompte / r.tmaxi));
  }
  let partRet = NaN, partUrs = NaN;
  if(Number.isFinite(pctRet) && Number.isFinite(reducPer)){
    partRet = Math.round((reducPer * pctRet) * 100) / 100;
    partUrs = Math.round((reducPer - partRet) * 100) / 100;
  }
const invalidMsg = r.invalid ? `
    <div class="callout bad" style="margin-bottom:12px">
      <div class="calloutTitle">Saisie incomplète</div>
      <div class="small">Renseigne au minimum : <strong>Type de contrat / temps de travail</strong>, <strong>heures/forfait</strong>, et <strong>rémunération de la période</strong>. Les champs non renseignés s’affichent “—” et les étapes de calcul sont neutralisées.</div>
    </div>
  ` : "";

const status = r.invalid ? "—" : (r.remunerationAnnuelle >= r.seuil3Smic ? "⛔ Pas de réduction" : (r.reducAffichee>0 ? "✅ Réduction" : "⛔ Pas de réduction"));

  const kpiTop = `
    <div class="kpi kpi3">
      ${kpiBox("Résultat affiché", money(r.reducAffichee))}
      ${kpiBox("Coefficient final", num4(r.coefFinal))}
      ${kpiBox("Statut", status)}
    </div>
  `;

  return `
    ${invalidMsg}
    ${kpiTop}
    <hr class="sep"/>
    ${renderCalcPanel(key, r, i, p)}
    <div class="small muted" style="margin-top:10px">Astuce : utilisez “Références Sage” pour contrôler les valeurs avec Sage.</div>
  `;
}

function updateSimulationResults(runtime, state, key){
  try{
    const p = { ...runtime.params, ...(state.params||{}) };
    const r = computeRGDU(state[key], p);
    try{ window.__KDS_LAST = window.__KDS_LAST || {}; window.__KDS_LAST[key] = { r, i: state[key], p }; }catch(e){}
    const body = document.getElementById(`${key}_resultsBody`);
    if(body) body.innerHTML = renderSimulationResults(key, r, state[key], p);

    // Dynamic DFS block update (Scenario A only)
    if(key === "A"){
      const dfsEl = document.getElementById("A_dfsBlock");
      if(dfsEl){
        const ii = state.A || {};
        const dRate = getDfsRate(ii.dfs);
        const _fP = (x)=> Number.isNaN(x) ? "—" : fmtEUR.format(x);
        const _fPc = (x)=> Number.isFinite(x) ? fmt2.format(x*100)+" %" : "—";
        if(dRate <= 0){
          dfsEl.innerHTML = '<div class="card"><div class="hd"><div><div class="title">Calcul DFS</div><div class="hint">Pas de DFS sélectionné</div></div></div><div class="bd"><p class="muted">Sélectionnez un taux DFS dans « Contexte global » pour activer le double calcul.</p></div></div>';
        } else {
          const _isMensDfs = (ii.periodicite==="Mensuel");
          const _divDfs = _isMensDfs ? 12 : 1;
          const _perLbl = _isMensDfs ? "mensuel" : "annuel";
          const _ppvP = Number(ii.ppvPeriode||0);
          const _remAbat = (ii.remunerationPeriode||0) * (1 - dRate);
          const _pBadge = r.dfsPlafondApplique ? '<span class="badge bad">Plafond 130% appliqué</span>' : '<span class="badge ok">DFS retenue</span>';
          dfsEl.innerHTML = '<div class="card"><div class="hd"><div><div class="title">Calcul DFS</div><div class="hint">Double calcul + plafond 130%</div></div>'+_pBadge+'</div><div class="bd"><table class="table"><tbody>'+
            '<tr><td>Taux DFS retenu</td><td><strong>'+_fPc(dRate)+'</strong></td></tr>'+
            '<tr><td>Rémun. après abattement (période)</td><td>'+_fP(_remAbat)+'</td></tr>'+
            '<tr><td>PPV (période)</td><td>'+_fP(_ppvP)+'</td></tr>'+
            '<tr><td>A — Sans DFS ('+_perLbl+')</td><td>'+_fP(r.reducSansDFS/_divDfs)+'</td></tr>'+
            '<tr><td>B — Avec DFS ('+_perLbl+')</td><td>'+_fP(r.reducAvecDFS/_divDfs)+'</td></tr>'+
            '<tr><td>Plafond 130% de A ('+_perLbl+')</td><td>'+_fP(r.reducPlafond130/_divDfs)+'</td></tr>'+
            '<tr><td><strong>Final retenu ('+_perLbl+')</strong></td><td><strong>'+_fP(r.reducAnnuelle/_divDfs)+'</strong></td></tr>'+
            '</tbody></table><div class="small muted" style="margin-top:6px">Détail pédagogique complet dans l’onglet « Calcul DFS ».</div></div></div>';
        }
      }
    }

    const sb = document.getElementById(`${key}_stateBar`);
    if(sb) sb.innerHTML = renderStateBar(key, state);

    const pres = document.getElementById(`${key}_presenceComputed`);
    if(pres){
      pres.textContent = Number.isNaN(r.presence) ? "—" : (fmt2.format(r.presence*100) + " %");
    }
  }catch(e){
    // Ne pas casser la saisie
  }
}





function renderDashboard(params, state){
  const p = { ...params, ...(state.params||{}) };
  const i = state.A; // Dashboard centré sur Scénario A (référence)
  const r = computeRGDU(i, p);

  const reducPer = r.invalid ? NaN : r.reducAffichee;
  const coef = r.invalid ? NaN : r.coefFinal;
  const remunPer = r.invalid ? NaN : periodize(i.periodicite, r.remunerationAnnuelle);
  const smicRefPer = r.invalid ? NaN : periodize(i.periodicite, r.smicReference);
  const seuil3Per = r.invalid ? NaN : periodize(i.periodicite, r.seuil3Smic);

  const hasReduction = !r.invalid && (r.remunerationAnnuelle < r.seuil3Smic) && (r.reducAffichee > 0);
  const status = r.invalid ? {cls:"bad", txt:"Saisie incomplète"} : (hasReduction ? {cls:"ok", txt:"Réduction"} : {cls:"bad", txt:"Pas de réduction"});

  const money = (x)=> Number.isNaN(x) ? "—" : fmtEUR.format(x);
  const num4 = (x)=> Number.isNaN(x) ? "—" : fmt4.format(x);

  // Alerting (v4.2 – garde-fous UX renforcés)
  const alerts = [];
  if(r.invalid){
    alerts.push({cls:"bad", title:"Saisie incomplète", txt:"Renseigne le type de temps de travail + les heures/forfait + la rémunération de la période."});
  }else{
    if(!(r.heuresAnnuelles > 0)) alerts.push({cls:"bad", title:"Heures annuelles", txt:"Les heures annuelles retenues sont à 0. Vérifie le type de contrat et les heures."});
    if(r.presence <= 0) alerts.push({cls:"warn", title:"Présence", txt:"Le taux de présence est nul : vérifie l’absence/presence."});
    if(r.remunerationAnnuelle >= r.seuil3Smic) alerts.push({cls:"bad", title:"Seuil 3×SMIC atteint", txt:"Rémunération ≥ 3×SMIC ⇒ coefficient = 0 ⇒ pas de réduction."});
    if(!Number.isNaN(r.reducAffichee) && r.reducAffichee === 0 && r.remunerationAnnuelle < r.seuil3Smic) alerts.push({cls:"warn", title:"Réduction à 0", txt:"La réduction est nulle malgré une rémunération < seuil : vérifie majoration/paramètres."});

    // --- Garde-fous UX (v4.4 — BOSS § 720) ---
    const _presCoeff = n(i.presenceForfait);
    const _sitAbs = i.situationAbsence || "presence_totale";
    const _modeAbs = i.modeAbsence || "montants";
    const _hasAbsence = (_sitAbs === "absence");
    // Coefficient de présence > 100 % en mode coefficient
    if(_hasAbsence && _modeAbs === "coefficient" && Number.isFinite(_presCoeff) && _presCoeff > 1){
      alerts.push({cls:"bad", title:"Présence > 100 %", txt:"Le coefficient de présence saisi (" + fmt2.format(_presCoeff*100) + " %) dépasse 100 %. Vérifie la saisie."});
    }
    // Rémunération versée > rémunération théorique
    if(_hasAbsence && _modeAbs !== "coefficient"){
      const _rTh  = n(i.remunTheorique)||0;
      const _rVer = n(i.remunVersee)||0;
      if(_rTh > 0 && _rVer > _rTh + 0.01){
        alerts.push({cls:"bad", title:"Versée > théorique", txt:"La rémunération versée (" + money(_rVer) + ") dépasse la rémunération théorique (" + money(_rTh) + "). Vérifie la saisie."});
      }
    }
    // Heures annuelles = 0 avec absence déclarée
    if(_hasAbsence && !(r.heuresAnnuelles > 0)){
      alerts.push({cls:"bad", title:"Absence sans base horaire", txt:"Des heures d’absence sont saisies (" + fmt2.format(_absVal) + " h) mais les heures annuelles retenues sont à 0. Le calcul de présence est impossible."});
    }
  }

  // Résumé Société
  const soc = [
    ["FNAL", i.fnal],
    ["Situation", i.situation],
    ["Profil majoration", i.majoration],
    ["Tdelta retenu", Number.isNaN(r.tdelta) ? "—" : fmt4.format(r.tdelta)],
    ["Tmin", Number.isNaN(p.tmin) ? "—" : fmt4.format(p.tmin)],
    ["P", Number.isNaN(p.p) ? "—" : fmt2.format(p.p)],
  ];

  // Résumé Salarié
  const heuresMens = (i.typeHeures === "Heures mensuelles contractuelles") ? (n(i.heuresMensuelles)||0) : null;
  const forfaitH = (i.typeHeures === "Forfait annuel (heures)") ? (n(i.forfaitHeures)||0) : null;
  const forfaitJ = (i.typeHeures === "Forfait annuel (jours)") ? (n(i.forfaitJours)||0) : null;

  const sal = [
    ["Type de contrat", i.typeHeures],
    ["Heures mensuelles", heuresMens===null ? "—" : fmt2.format(heuresMens)],
    ["Forfait annuel (heures)", forfaitH===null ? "—" : fmt2.format(forfaitH)],
    ["Forfait annuel (jours)", forfaitJ===null ? "—" : fmt2.format(forfaitJ)],
    ["Taux de présence", Number.isNaN(r.presence) ? "—" : fmt2.format(r.presence * 100) + " %"],
    ["Rémunération période (hors PPV)", money(n(i.remunerationPeriode)||0)],
    ["Heures supplémentaires période", fmt2.format(n(i.heuresSupPeriode)||0)],
    ["PPV période", money(n(i.ppvPeriode)||0)],
  ];

  const kvTable = (rows)=>`
    <table class="table">
      <thead><tr><th>Élément</th><th>Valeur</th></tr></thead>
      <tbody>${rows.map(([k,v])=>`<tr><td><strong>${safeText(k)}</strong></td><td>${safeText(v)}</td></tr>`).join("")}</tbody>
    </table>
  `;

  // Synthèse réduction (décomposition URSSAF / Retraite)
  // Principe (tableau 2026) :
  // - Clé Retraite = (taux Retraite pris en compte) / (T maxi)
  // - Part Retraite = Réduction × Clé Retraite (arrondie au centime)
  // - Part URSSAF = complément (Total − Retraite) pour garantir le centime près.
  //
  // Les taux utilisés proviennent de “Paramètres” (socle 2026 par défaut) et/ou d’un taux Retraite dérogatoire saisi dans la simulation.

  const tmaxi = r.tmaxi;
  const tauxRetraite = r.tauxRetraitePrisEnCompte;

  let pctRetraite = NaN;
  if(Number.isFinite(tmaxi) && tmaxi > 0 && Number.isFinite(tauxRetraite)){
    pctRetraite = Math.min(1, Math.max(0, tauxRetraite / tmaxi));
  }

  let partRetraite = NaN, partUrssaf = NaN;
  if(Number.isFinite(pctRetraite) && Number.isFinite(reducPer)){
    partRetraite = Math.round((reducPer * pctRetraite) * 100) / 100;
    partUrssaf = Math.round((reducPer - partRetraite) * 100) / 100;
  }

  const synthMsg = Number.isFinite(pctRetraite)
    ? `<div class="small muted">Clé de répartition : <strong>Retraite = ${fmt2.format(pctRetraite*100)} %</strong> (taux Retraite pris en compte / T maxi). <strong>URSSAF = complément</strong> pour reconstituer la réduction au centime près.</div>`
    : `<div class="small muted"><strong>Répartition URSSAF / Retraite non calculée</strong> : vérifiez les taux dans “Paramètres” (URSSAF+chômage, Retraite, CEG, Tmin) et/ou renseignez un taux Retraite dérogatoire dans la simulation.</div>`;

  const alertBlocks = alerts.length ? `
    <div class="card">
      <div class="hd">
        <div>
          <div class="title">Alertes & contrôles rapides</div>
          <div class="hint">Explications automatiques selon tes saisies</div>
        </div>
      <div class="card">
        <div class="hd">
          <div>
            <div class="title">Constantes Sage suivies</div>
            <div class="hint">Équivalents calculés (Scénario A) pour contrôle rapide.</div>
          </div>
        </div>
        <div class="bd" id="tblDashTrack">${dashTrackedHTML}</div>
      </div>

        <span class="badge">Alerting</span>
      </div>
      <div class="bd">
        <div class="alertGrid">
          ${alerts.map(a=>`
            <div class="alert ${a.cls}">
              <div class="aTitle">${safeText(a.title)}</div>
              <div class="aTxt">${safeText(a.txt)}</div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  ` : "";

  return `
    <div class="sheet">
      <div class="dashTop">
        <div class="dashTitle">
          <div class="heroKicker">Scénario A (référence)</div>
          <div class="dashH">Dashboard</div>
          <div class="muted">Les valeurs essentielles + les contrôles pour fiabiliser la réduction.</div>
        </div>
        <div class="dashActions">
          <button class="btn" data-goto="Simulation">Modifier la simulation</button>
          <button class="btn ghost" data-goto="Références Sage">A contrôler avec Sage</button>
          <button class="btn ghost" data-goto="Comparateur">Comparer avec B</button>
          <button class="btn ghost" data-report="dashboard" data-scn="A">Signaler un écart</button>
          <button class="btn" id="btnExportXls" style="background:#13a538;color:#fff;border:none">📊 Export Excel</button>
        </div>
      </div>

      <div class="card">
        <div class="hd">
          <div>
            <div class="title">Résultat – réduction générale</div>
            <div class="hint">Montants affichés sur la période sélectionnée</div>
          </div>
          <span class="badge ${status.cls}">${safeText(status.txt)}</span>
        </div>
        <div class="bd">
          <div class="kpi kpi6">
            ${kpiBox("Montant réduction", money(reducPer))}
            ${kpiBox("Coefficient final", num4(coef))}
            ${kpiBox("Rémunération retenue", money(remunPer))}
            ${kpiBox("SMIC de référence", money(smicRefPer))}
            ${kpiBox("Seuil 3×SMIC", money(seuil3Per))}
            ${kpiBox("Statut", hasReduction ? "✅ Réduction" : (r.invalid ? "—" : "⛔ Pas de réduction"))}
          </div>
        </div>
      </div>

      ${alertBlocks}

      <div class="gridDash2">
        <div class="card">
          <div class="hd">
            <div>
              <div class="title">Résumé Société</div>
              <div class="hint">Paramètres impactant le coefficient</div>
            </div>
          </div>
          <div class="bd">
            ${kvTable(soc)}
          </div>
        </div>

        <div class="card">
          <div class="hd">
            <div>
              <div class="title">Résumé Salarié</div>
              <div class="hint">Éléments de paie retenus pour la période</div>
            </div>
          </div>
          <div class="bd">
            ${kvTable(sal)}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="hd">
          <div>
            <div class="title">Synthèse réduction</div>
            <div class="hint">Répartition URSSAF / Retraite</div>
          </div>
        </div>
        <div class="bd">
          <div class="kpi kpi2">
            ${kpiBox("Part URSSAF", money(partUrssaf))}
            ${kpiBox("Part Retraite", money(partRetraite))}
          </div>
          ${synthMsg}
          <div class="small muted" style="margin-top:8px">Somme = réduction totale au centime près (Retraite = Total − URSSAF).</div>
        </div>
      </div>
    </div>
  `;
}




function renderComparateur(params, state){
  const p = { ...params, ...(state.params||{}) };
  const a = computeRGDU(state.A, p);
  const b = computeRGDU(state.B, p);

  const money = (x)=> Number.isNaN(x) ? "—" : fmtEUR.format(x);
  const coef = (x)=> Number.isNaN(x) ? "—" : fmt4.format(x);

  // Follow periodicite of Scenario A
  const isMensComp = (state.A && state.A.periodicite === "Mensuel");
  const perLabelComp = isMensComp ? "Mensuel" : "Annuel";
  const perDivComp = isMensComp ? 12 : 1;
  const perV = (x) => Number.isNaN(x) ? NaN : x / perDivComp;

    const diffAff = (Number.isNaN(a.reducAffichee) || Number.isNaN(b.reducAffichee)) ? NaN : (b.reducAffichee - a.reducAffichee);
  const diffAn = (Number.isNaN(a.reducAnnuelle) || Number.isNaN(b.reducAnnuelle)) ? NaN : (b.reducAnnuelle - a.reducAnnuelle);

  const badge = Number.isNaN(diffAff)
    ? {cls:"bad", txt:"Comparer nécessite 2 scénarios valides"}
    : (diffAff > 0 ? {cls:"ok", txt:"Gain"} : diffAff < 0 ? {cls:"bad", txt:"Surcoût"} : {cls:"warn", txt:"Égalité"});

  const cardScenario = (title, hint, r)=>`
    <div class="card">
      <div class="hd">
        <div>
          <div class="title">${safeText(title)}</div>
          <div class="hint">${safeText(hint)}</div>
        </div>
        <span class="badge ${badgeFor(r).cls}">${safeText(badgeFor(r).txt)}</span>
      </div>
      <div class="bd">
        <div class="kpi kpi3">
          ${kpiBox("Réduction (" + perLabelComp.toLowerCase() + ")", money(r.reducAffichee))}
          ${kpiBox("Coefficient", coef(r.coefFinal))}
          ${kpiBox("Rémunération annualisée", money(r.remunerationAnnuelle))}
        </div>
        <div class="small muted" style="margin-top:10px">SMIC réf : ${money(r.smicReference)} • Seuil 3×SMIC : ${money(r.seuil3Smic)}</div>
      </div>
    </div>
  `;

  return `
    <div class="sheet">
      <div class="gridDash2">
        ${cardScenario("Scénario A", "Onglet Simulation", a)}
        ${cardScenario("Scénario B", "Onglet Simulation_B", b)}
      </div>

      <div class="card">
        <div class="hd">
          <div>
            <div class="title">Comparateur (B − A)</div>
            <div class="hint">Lecture des écarts — Périodicité : ${safeText(perLabelComp)}</div>
          </div>
          <span class="badge ${badge.cls}">${safeText(badge.txt)}</span>
        </div>
        <div class="bd">
          <div class="kpi kpi2">
            ${kpiBox("Écart " + perLabelComp.toLowerCase() + " (B − A)", money(diffAff))}
            ${kpiBox("Écart annuel (B − A)", money(diffAn))}
          </div>

          <hr class="sep"/>

          <table class="table">
            <thead><tr><th>Indicateur (${safeText(perLabelComp)})</th><th>Scénario A</th><th>Scénario B</th></tr></thead>
            <tbody>
              <tr><td>Coefficient final</td><td>${coef(a.coefFinal)}</td><td>${coef(b.coefFinal)}</td></tr>
              <tr><td>SMIC de référence</td><td>${money(perV(a.smicReference))}</td><td>${money(perV(b.smicReference))}</td></tr>
              <tr><td>Seuil 3×SMIC</td><td>${money(perV(a.seuil3Smic))}</td><td>${money(perV(b.seuil3Smic))}</td></tr>
              <tr><td>Rémunération</td><td>${money(perV(a.remunerationAnnuelle))}</td><td>${money(perV(b.remunerationAnnuelle))}</td></tr>
              <tr><td>Réduction</td><td>${money(a.reducAffichee)}</td><td>${money(b.reducAffichee)}</td></tr>
              <tr><td>Part URSSAF</td><td>${money(isMensComp ? a.partUrssafMensuelle : a.partUrssafAnnuelle)}</td><td>${money(isMensComp ? b.partUrssafMensuelle : b.partUrssafAnnuelle)}</td></tr>
              <tr><td>Part Retraite</td><td>${money(isMensComp ? a.partRetraiteMensuelle : a.partRetraiteAnnuelle)}</td><td>${money(isMensComp ? b.partRetraiteMensuelle : b.partRetraiteAnnuelle)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}


function wireSimulationInputs(key, state, rerender){
  const bind = (id, prop, conv=(v)=>v) => {
    const el = document.getElementById(id);
    if(!el) return;

    const handler = () => {
      state[key][prop] = conv(el.value);
      saveState(state);
      rerender(getFocusInfo());
    };

    el.addEventListener("input", handler);
    el.addEventListener("change", handler);
  };

  bind(`${key}_periodicite`, "periodicite", (v)=>v);
  bind(`${key}_fnal`, "fnal", (v)=>v);
  bind(`${key}_situation`, "situation", (v)=>v);
  bind(`${key}_dfs`, "dfs", (v)=>v);
  bind(`${key}_tdeltaPerso`, "tdeltaPerso", (v)=> (v===""? null : Number(v)));
  bind(`${key}_majoration`, "majoration", (v)=>v);
  bind(`${key}_transport`, "transport", (v)=>v);
  bind(`${key}_typeHeures`, "typeHeures", (v)=>v);
  bind(`${key}_heuresMensuelles`, "heuresMensuelles", (v)=> (v===""? null : Number(v)));
  bind(`${key}_forfaitHeures`, "forfaitHeures", (v)=> (v===""? null : Number(v)));
  bind(`${key}_forfaitJours`, "forfaitJours", (v)=> (v===""? null : Number(v)));
  bind(`${key}_heuresSupPeriode`, "heuresSupPeriode", (v)=> Number(v||0));
  // heuresSupAnnuel (Jours > 218) supprimé — BOSS § 860 : majoration non autorisée
  bind(`${key}_heuresJour`, "heuresJour", (v)=> Number(v||0));
  // ── Présence (refonte BOSS § 720) ──
  // Radios situationAbsence
  $(`[name="${key}_situationAbsence"]`) && document.querySelectorAll(`[name="${key}_situationAbsence"]`).forEach(radio => {
    radio.addEventListener("change", ()=>{
      const v = document.querySelector(`[name="${key}_situationAbsence"]:checked`)?.value || "presence_totale";
      if(state[key]) state[key].situationAbsence = v;
      saveState(state);
      updatePresenceUI(key, state);
      rerender();
    });
  });
  // Radios modeAbsence
  $(`[name="${key}_modeAbsence"]`) && document.querySelectorAll(`[name="${key}_modeAbsence"]`).forEach(radio => {
    radio.addEventListener("change", ()=>{
      const v = document.querySelector(`[name="${key}_modeAbsence"]:checked`)?.value || "montants";
      if(state[key]) state[key].modeAbsence = v;
      saveState(state);
      updatePresenceUI(key, state);
      rerender();
    });
  });
  bind(`${key}_remunTheorique`, "remunTheorique", (v)=> (v===""? null : Number(v)));
  bind(`${key}_enaTheorique`,   "enaTheorique",   (v)=> (v===""? null : Number(v)));
  bind(`${key}_remunVersee`,    "remunVersee",     (v)=> (v===""? null : Number(v)));
  bind(`${key}_enaVersee`,      "enaVersee",       (v)=> (v===""? null : Number(v)));
  bind(`${key}_presenceForfait`, "presenceForfait", (v)=> (Number(v||0) / 100));
  // absencePeriode supprimé (remplacé par remunTheorique/remunVersee/ENA)
  bind(`${key}_remunerationPeriode`, "remunerationPeriode", (v)=> Number(v||0));
  bind(`${key}_ppvPeriode`, "ppvPeriode", (v)=> Number(v||0));
  bind(`${key}_bonusMalus`, "bonusMalus", (v)=> (v===""? null : v));
  bind(`${key}_retraitePatronaleSociete`, "retraitePatronaleSociete", (v)=> (v===""? null : v));
}

function updatePresenceUI(key, state) {
  const i       = state[key] || {};
  const sitAbs  = i.situationAbsence || "presence_totale";
  const modeAbs = i.modeAbsence      || "montants";
  const showAbs  = sitAbs === "absence";
  const showMont = showAbs && modeAbs !== "coefficient";
  const showCoef = showAbs && modeAbs === "coefficient";
  const modeDiv = document.getElementById(`${key}_presenceModeDiv`);
  const montDiv = document.getElementById(`${key}_presenceMontantsDiv`);
  const coefDiv = document.getElementById(`${key}_presenceCoefDiv`);
  if (modeDiv)  modeDiv.style.display  = showAbs  ? "" : "none";
  if (montDiv)  montDiv.style.display  = showMont ? "" : "none";
  if (coefDiv)  coefDiv.style.display  = showCoef ? "" : "none";
  document.querySelectorAll(`[name="${key}_situationAbsence"]`).forEach(r => {
    const lbl = r.closest("label"); if (lbl) lbl.style.fontWeight = r.value === sitAbs ? "600" : "400";
  });
  document.querySelectorAll(`[name="${key}_modeAbsence"]`).forEach(r => {
    const lbl = r.closest("label"); if (lbl) lbl.style.fontWeight = r.value === modeAbs ? "600" : "400";
  });
}

function wireParams(state, rerender){
  $$("input[data-pkey]").forEach(inp=>{
    const handler = ()=>{
      const k = inp.getAttribute("data-pkey");
      let v = String(inp.value ?? "").trim();
      v = Number(v.replace(",", "."));
      if(!state.params) state.params = {};
      const scale = inp.getAttribute("data-scale");
      if(scale === "pct"){
        // stocke en décimal (ex : 34,20 => 0,3420)
        v = v / 100;
      }
      state.params[k] = v;
      saveState(state);
      rerender(getFocusInfo());
    };
    inp.addEventListener("input", handler);
    inp.addEventListener("change", handler);
  });
}



function nowISO(){
  try{return new Date().toISOString();}catch(e){return "";}
}
function safeNum(x){ return (x===null||x===undefined||Number.isNaN(x)) ? "—" : String(x); }

function buildReportBody(payload){
  // payload: {version, page, scenario, tool, userEmail, description, context}
  const lines = [];
  lines.push("=== Signalement d'écart RGDU ===");
  lines.push(`Version : ${payload.version||"—"}`);
  lines.push(`Date : ${payload.date||nowISO()}`);
  lines.push(`Page : ${payload.page||"—"}`);
  if(payload.scenario) lines.push(`Scénario : ${payload.scenario}`);
  lines.push(`Outil de comparaison : ${payload.tool||"—"}`);
  lines.push(`Email : ${payload.userEmail||"—"}`);
  lines.push("");
  lines.push("Description :");
  lines.push(payload.description||"—");
  lines.push("");
  lines.push("Contexte (auto) :");
  lines.push(payload.context||"—");
  lines.push("");
  return lines.join("\n");
}

function downloadText(filename, text){
  try{
    const blob = new Blob([text], {type:"text/plain;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }catch(e){}
}

function storeReport(report){
  try{
    const key="rgdu_reports_v1";
    const arr = JSON.parse(localStorage.getItem(key)||"[]");
    arr.unshift(report);
    localStorage.setItem(key, JSON.stringify(arr));
  }catch(e){}
}

function openReportModal(runtime, state, ctx){
  // ctx: {page, scenario}
  const p = { ...runtime.params, ...(state.params||{}) };
  const to = (state.params && state.params.report_to) ? String(state.params.report_to).trim() : "";
  const version = (runtime && runtime.versions && runtime.versions.items && runtime.versions.items[0] && runtime.versions.items[0].version) ? runtime.versions.items[0].version : "—";

  // Build auto context snapshot
  let context = "";
  try{
    const key = (ctx.scenario === "A") ? "A" : (ctx.scenario === "B" ? "B" : "A");
    const r = computeRGDU(state[key], p);
    try{ window.__KDS_LAST = window.__KDS_LAST || {}; window.__KDS_LAST[key] = { r, i: state[key], p }; }catch(e){}
    const fmt = (x)=> Number.isNaN(x) ? "—" : fmtEUR.format(x);
    context = [
      `FNAL=${state[key].fnal||"—"} / Situation=${state[key].situation||"—"} / Majoration=${state[key].majoration||"—"} / Transport=${state[key].transport||"—"}`,
      `Périodicité=${state[key].periodicite||"—"} / Type contrat=${state[key].typeHeures||"—"}`,
      `Rémunération annualisée=${fmt(r.remunerationAnnuelle)} / SMIC réf=${fmt(r.smicReference)} / Seuil 3×SMIC=${fmt(r.seuil3Smic)}`,
      `Coefficient final=${Number.isNaN(r.coefFinal) ? "—" : fmt4.format(r.coefFinal)} / Réduction affichée=${fmt(r.reducAffichee)}`,
      `Tmaxi=${(Number.isNaN(r.tmaxi)? "—" : fmt4.format(r.tmaxi))} / Tdelta=${(Number.isNaN(r.tdelta)? "—" : fmt4.format(r.tdelta))}`,
    ].join("\n");
  }catch(e){}

  const back = document.createElement("div");
  back.className = "modalBack";
  back.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modalHd">
        <div>
          <div class="t">Signaler un écart</div>
          <div class="s">Envoyer un signalement (avec contexte automatique) pour analyse et correction.</div>
        </div>
        <button class="iconBtn" id="reportClose" aria-label="Fermer">✕</button>
      </div>
      <div class="modalBd">
        <div class="modalGrid">
          <div class="field">
            <label>Votre email</label>
            <input id="reportEmail" placeholder="nom@domaine.fr" />
            <div class="hint">Optionnel, mais recommandé pour être recontacté.</div>
          </div>
          <div class="field">
            <label>Outil de comparaison</label>
            <select id="reportTool">
              <option>Sage</option>
              <option>Silae</option>
              <option>Simulateur Excel</option>
              <option>Autre</option>
            </select>
            <div class="hint">Avec quel outil l’écart est-il constaté ?</div>
          </div>
        </div>

        <div class="field" style="margin-top:10px">
          <label>Description de l’écart (détaillée)</label>
          <textarea id="reportDesc" placeholder="Décrivez l’écart, les valeurs attendues/obtenues, le contexte, etc."></textarea>
          <div class="hint">Vous pouvez copier/coller des valeurs, étapes, captures, etc.</div>
        </div>

        <details class="acc" style="margin-top:10px">
          <summary>📎 Contexte automatique inclus</summary>
          <div class="accBody">
            <pre style="white-space:pre-wrap; margin:0; font-size:12px; color:var(--muted)">${safeText(context)}</pre>
          </div>
        </details>

        <div class="smallNote" style="margin-top:10px">
          En mode offline, l’envoi se fait via votre client mail (mailto) ou via un fichier de signalement téléchargé automatiquement (copie presse‑papiers si disponible).
        </div>
      </div>
      <div class="modalFt">
        <button class="btn ghost" id="reportDownload">Télécharger le signalement</button>
        <button class="btn" id="reportSend">${to ? "Envoyer par email" : "Préparer l’email"}</button>
      </div>
    </div>
  `;
  document.body.appendChild(back);

  const close = ()=>{
    try{ back.remove(); }catch(e){}
  };
  back.addEventListener("click", (e)=>{ if(e.target === back) close(); });
  document.getElementById("reportClose").addEventListener("click", close);

  const makePayload = ()=>{
    const userEmail = document.getElementById("reportEmail").value.trim();
    const tool = document.getElementById("reportTool").value;
    const description = document.getElementById("reportDesc").value;
    return {
      version,
      date: nowISO(),
      page: ctx.page || state.activeTab || "—",
      scenario: ctx.scenario || "",
      tool,
      userEmail,
      description,
      context
    };
  };

  document.getElementById("reportDownload").addEventListener("click", ()=>{
    const payload = makePayload();
    const body = buildReportBody(payload);
    storeReport({ ...payload, body });
    downloadText(`signalement_rgdu_${payload.version}_${payload.date.replace(/[:.]/g,"-")}.txt`, body);
    try{ navigator.clipboard && navigator.clipboard.writeText(body); }catch(e){}
  });

  document.getElementById("reportSend").addEventListener("click", ()=>{
    const payload = makePayload();
    const body = buildReportBody(payload);
    storeReport({ ...payload, body });
    try{ navigator.clipboard && navigator.clipboard.writeText(body); }catch(e){}

    const subject = `Signalement écart RGDU v${payload.version} (${payload.page}${payload.scenario?(" - "+payload.scenario):""})`;
    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    // Ouvre le client mail si possible, sinon fallback téléchargement
    try{
      window.location.href = mailto;
    }catch(e){
      downloadText(`signalement_rgdu_${payload.version}_${payload.date.replace(/[:.]/g,"-")}.txt`, body);
    }
    close();
  });

  // Focus initial
  setTimeout(()=>{ try{ document.getElementById("reportEmail").focus(); }catch(e){} }, 0);
}


/* --- Calculatrice flottante --- */

function ensureCalcState(state){
  if(!state.calc) state.calc = { open:false, sci:false, expr:"", history:[], mem:0 };
  if(typeof state.calc.open !== "boolean") state.calc.open = true;
  if(typeof state.calc.sci !== "boolean") state.calc.sci = false;
  if(typeof state.calc.expr !== "string") state.calc.expr = "";
  if(!Array.isArray(state.calc.history)) state.calc.history = [];
  if(typeof state.calc.mem !== "number") state.calc.mem = 0;
}

function sanitizeCalcExpr(s){
  s = String(s||"").replace(/,/g,".");
  s = s.replace(/÷/g,"/").replace(/×/g,"*").replace(/−/g,"-");
  s = s.replace(/\^/g,"**"); // puissance
  s = s.replace(/[^0-9+\-*/().\sA-Za-z_*]/g,"");
  s = s.replace(/\*\*\*/g,"**");
  return s;
}

function calcTransformToJS(s){
  let x = sanitizeCalcExpr(s);
  x = x.replace(/\bpi\b/gi, "Math.PI");
  x = x.replace(/\be\b/g, "Math.E");
  const map = [
    ["sin","Math.sin"],
    ["cos","Math.cos"],
    ["tan","Math.tan"],
    ["sqrt","Math.sqrt"],
    ["abs","Math.abs"],
    ["exp","Math.exp"],
    ["ln","Math.log"],
    ["log","Math.log10"],
  ];
  for(const [k,v] of map){
    x = x.replace(new RegExp("\\b"+k+"\\b","gi"), v);
  }
  return x;
}

function tryEvalCalc(expr){
  try{
    const js = calcTransformToJS(expr);
    if(!js.trim()) return { ok:false, value:NaN };
    const v = Function('"use strict"; return ('+js+');')();
    if(typeof v !== "number" || !Number.isFinite(v)) return { ok:false, value:NaN };
    return { ok:true, value:v };
  }catch(e){
    return { ok:false, value:NaN };
  }
}

function addCalcHistory(state, expr, value){
  ensureCalcState(state);
  state.calc.history.unshift({ ts: nowISO(), expr: sanitizeCalcExpr(expr), value });
  state.calc.history = state.calc.history.slice(0, 30);
}

function calcAppend(state, txt){ ensureCalcState(state); state.calc.expr = String(state.calc.expr||"") + String(txt||""); }
function calcBack(state){ ensureCalcState(state); state.calc.expr = state.calc.expr.slice(0,-1); }
function calcClear(state){ ensureCalcState(state); state.calc.expr = ""; }

function calcToggleSign(state){
  ensureCalcState(state);
  const s = state.calc.expr.trim();
  if(!s) return;
  if(s.startsWith("-(") && s.endsWith(")")){
    state.calc.expr = s.slice(2,-1);
  }else if(s.startsWith("-") && /^[\-0-9.]+$/.test(s)){
    state.calc.expr = s.slice(1);
  }else{
    state.calc.expr = "-(" + s + ")";
  }
}

function calcPercent(state){
  ensureCalcState(state);
  const s = state.calc.expr.trim();
  if(!s) return;
  const m = s.match(/(.*?)([0-9.]+)\s*$/);
  if(m){
    const head = m[1];
    const num = parseFloat(m[2]);
    if(Number.isFinite(num)){
      state.calc.expr = head + String(num/100);
      return;
    }
  }
  state.calc.expr = "(" + s + ")/100";
}

function renderCalculator(state){
  ensureCalcState(state);
  const c = state.calc;
  const ev = tryEvalCalc(c.expr);
  const resTxt = ev.ok ? fmt2.format(ev.value) : "—";
  const memTxt = fmt2.format(c.mem || 0);

  if(!c.open){
    return ``;
  }

  const btn = (txt, a, cls="")=>`<button class="calcBtn ${cls}" data-calc="${safeText(a)}">${safeText(txt)}</button>`;

  const sciKeys = `
    ${btn("sin","sin(","sci")}
    ${btn("cos","cos(","sci")}
    ${btn("tan","tan(","sci")}
    ${btn("ln","ln(","sci")}
    ${btn("log","log(","sci")}
    ${btn("√","sqrt(","sci")}
    ${btn("x²","pow2","sci")}
    ${btn("xʸ","^","sci")}
    ${btn("π","pi","sci")}
    ${btn("e","e","sci")}
  `;

  const keys = `
    ${btn("MC","mc","util")}
    ${btn("MR","mr","util")}
    ${btn("M+","mplus","util")}
    ${btn("M-","mminus","util")}
    ${btn("Sci","toggleSci","util")}

    ${btn("(","(","op")}
    ${btn(")"," ) ","op")}
    ${btn("±","sign","op")}
    ${btn("%","pct","op")}
    ${btn("⌫","back","")}

    ${btn("7","7")}
    ${btn("8","8")}
    ${btn("9","9")}
    ${btn("÷","/","op")}
    ${btn("C","clear","")}

    ${btn("4","4")}
    ${btn("5","5")}
    ${btn("6","6")}
    ${btn("×","*","op")}
    ${btn("^","^","op")}

    ${btn("1","1")}
    ${btn("2","2")}
    ${btn("3","3")}
    ${btn("−","-","op")}
    ${btn("=","eq","eq")}

    ${btn("0","0")}
    ${btn(".",".")}
    ${btn(",","comma")}
    ${btn("+","+","op")}
    ${btn("Ans","ans","util")}
  `;

  const hist = (c.history||[]).slice(0,8).map(h=>`
    <div class="calcHistItem">
      <div class="l">
        <div class="e">${safeText(h.expr)}</div>
        <div class="r">= ${safeText(fmt2.format(h.value))}</div>
      </div>
      <button class="btn ghost sm" data-calc="use" data-val="${safeText(h.value)}">Utiliser</button>
    </div>
  `).join("");

  return `
    <div class="calcFloat">
      <div class="calcBar">
        <div class="t">Calculatrice</div>
        <div class="actions">
          <span class="badge">Mémoire: ${safeText(memTxt)}</span>
          <button class="calcMiniBtn" data-calc="min">Réduire</button>
        </div>
      </div>
      <div class="calcBody">
        <div class="calcDisp">
          <input class="calcExpr" id="calcExpr" placeholder="Expression…" value="${safeText(c.expr)}"/>
          <div class="calcSub">
            <span>Résultat : <strong>${safeText(resTxt)}</strong></span>
            <span class="muted">${c.sci ? "Mode scientifique" : "Mode standard"}</span>
          </div>
        </div>

        ${c.sci ? `<div class="calcGrid">${sciKeys}</div>` : ``}
        <div class="calcGrid">${keys}</div>

        <div class="calcRow2">
          <button class="btn ghost sm" data-calc="copy">Copier résultat</button>
          <button class="btn sm" data-calc="useResult">Utiliser résultat</button>
        </div>

        <div class="calcHist">
          <div class="refsSubTitle">Historique (mémoire)</div>
          ${hist || `<div class="small muted">Aucun calcul enregistré pour le moment.</div>`}
        </div>
      </div>
    </div>
  `;
}


function renderCalcDock(state){
  ensureCalcState(state);
  const host = document.getElementById("tabsBottom");
  if(!host) return;
  const c = state.calc;
  const label = c.open ? "Réduire la calculatrice" : "Ouvrir la calculatrice";
  host.innerHTML = `
    <button class="calcDockBtn" id="calcDockBtn" type="button">
      <span>Calculatrice</span>
      <span class="calcDockSub">${safeText(label)}</span>
    </button>
  `;
  const b = document.getElementById("calcDockBtn");
  if(b){
    b.addEventListener("click", ()=>{
      c.open = !c.open;
      saveState(state);
      try{ wireCalculator(state); }catch(e){}
    });
  }
}


function KDS_enableCalcDrag(state){
  try{
    const box = document.querySelector(".calcFloat");
    const bar = document.querySelector(".calcBar");
    if(!box || !bar) return;

    box.style.position = "fixed";
    box.style.left = (state.calc.pos && Number.isFinite(state.calc.pos.x)) ? (state.calc.pos.x+"px") : "18px";
    box.style.top  = (state.calc.pos && Number.isFinite(state.calc.pos.y)) ? (state.calc.pos.y+"px") : "auto";
    if(box.style.top === "auto"){
      box.style.bottom = "18px";
    }else{
      box.style.bottom = "auto";
    }
    box.style.zIndex = 9999;

    let dragging=false, ox=0, oy=0;

    const onDown = (e)=>{
      const t = e.target;
      if(t && (t.tagName==="BUTTON" || t.closest("button"))) return;
      dragging=true;
      const r = box.getBoundingClientRect();
      ox = e.clientX - r.left;
      oy = e.clientY - r.top;
      e.preventDefault();
    };
    const onMove = (e)=>{
      if(!dragging) return;
      let x = e.clientX - ox;
      let y = e.clientY - oy;
      const w = box.offsetWidth || 320;
      const h = box.offsetHeight || 420;
      x = Math.max(8, Math.min(window.innerWidth - w - 8, x));
      y = Math.max(8, Math.min(window.innerHeight - h - 8, y));
      box.style.left = x+"px";
      box.style.top  = y+"px";
      box.style.bottom = "auto";
      state.calc.pos = {x,y};
      try{ saveState(state); }catch(e){}
    };
    const onUp = ()=>{ dragging=false; };

    bar.style.cursor = "move";
    bar.onmousedown = onDown;
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }catch(e){}
}

function wireCalculator(state){
  ensureCalcState(state);
  try{ renderCalcDock(state); }catch(e){}
  let root = document.getElementById("calcRoot");
  if(!root){
    root = document.createElement("div");
    root.id = "calcRoot";
    document.body.appendChild(root);
  }

  // Assure que la calculatrice n'est pas enfermée dans un conteneur scrollable
  if(root.parentElement !== document.body){
    document.body.appendChild(root);
  }

  const render = (keepFocus=false)=>{
    root.innerHTML = renderCalculator(state);
    try{ KDS_enableCalcDrag(state); }catch(e){}
    const expr = document.getElementById("calcExpr");
    if(expr){
      if(keepFocus){
        try{ expr.focus(); expr.selectionStart = expr.selectionEnd = expr.value.length; }catch(e){}
      }
      expr.addEventListener("input", ()=>{
        state.calc.expr = expr.value;
        saveState(state);
        render(true);
      });
      expr.addEventListener("keydown", (e)=>{
        if(e.key === "Enter"){
          e.preventDefault();
          const ev = tryEvalCalc(state.calc.expr);
          if(ev.ok){
            addCalcHistory(state, state.calc.expr, ev.value);
            state.calc.expr = String(ev.value);
            saveState(state);
            render(true);
          }
        }
      });
    }

    root.querySelectorAll("[data-calc]").forEach(b=>{
      b.addEventListener("click", ()=>{
        const a = b.getAttribute("data-calc");

        if(a==="min"){ state.calc.open=false; saveState(state); render(); return; }
        if(a==="open"){ state.calc.open=true; saveState(state); render(true); return; }
        if(a==="toggleSci"){ state.calc.sci=!state.calc.sci; saveState(state); render(true); return; }

        if(a==="clear"){ calcClear(state); saveState(state); render(true); return; }
        if(a==="back"){ calcBack(state); saveState(state); render(true); return; }
        if(a==="sign"){ calcToggleSign(state); saveState(state); render(true); return; }
        if(a==="pct"){ calcPercent(state); saveState(state); render(true); return; }
        if(a==="comma"){ calcAppend(state, ","); saveState(state); render(true); return; }

        if(a==="ans"){
          const last = (state.calc.history && state.calc.history[0]) ? state.calc.history[0].value : 0;
          calcAppend(state, String(last));
          saveState(state); render(true); return;
        }

        if(a==="eq"){
          const ev = tryEvalCalc(state.calc.expr);
          if(ev.ok){
            addCalcHistory(state, state.calc.expr, ev.value);
            state.calc.expr = String(ev.value);
            saveState(state);
          }
          render(true);
          return;
        }

        if(a==="copy"){
          const ev = tryEvalCalc(state.calc.expr);
          const v = ev.ok ? String(ev.value) : "";
          try{ navigator.clipboard && navigator.clipboard.writeText(v); }catch(e){}
          return;
        }

        if(a==="useResult"){
          const ev = tryEvalCalc(state.calc.expr);
          if(ev.ok){
            addCalcHistory(state, state.calc.expr, ev.value);
            state.calc.expr = String(ev.value);
            saveState(state);
            render(true);
          }
          return;
        }

        if(a==="use"){
          const v = b.getAttribute("data-val");
          if(v!==null && v!==undefined){
            state.calc.expr = String(v);
            saveState(state);
            render(true);
          }
          return;
        }

        if(a==="mc"){ state.calc.mem=0; saveState(state); render(true); return; }
        if(a==="mr"){ state.calc.expr = String(state.calc.mem||0); saveState(state); render(true); return; }
        if(a==="mplus"){
          const ev = tryEvalCalc(state.calc.expr);
          if(ev.ok){ state.calc.mem = (state.calc.mem||0) + ev.value; saveState(state); render(true); }
          return;
        }
        if(a==="mminus"){
          const ev = tryEvalCalc(state.calc.expr);
          if(ev.ok){ state.calc.mem = (state.calc.mem||0) - ev.value; saveState(state); render(true); }
          return;
        }

        if(a==="pow2"){
          const s = String(state.calc.expr||"").trim();
          if(!s) return;
          state.calc.expr = "(" + s + ")^2";
          saveState(state); render(true); return;
        }
        if(a==="pi"){ calcAppend(state, "pi"); saveState(state); render(true); return; }
        if(a==="e"){ calcAppend(state, "e"); saveState(state); render(true); return; }

        calcAppend(state, a);
        saveState(state);
        render(true);
      });
    });
  };

  render(false);
}


// --- DFS (page dédiée) : trace vulgarisée, branchée dans la navigation ---
// --- DFS (page dédiée) : explication pédagogique (sur Scénario A) ---
function renderCalculDFSTracePage(runtime, state){
  const params = (runtime && runtime.params) ? runtime.params : {};
  const p = { ...params, ...(state.params||{}) };

  const inputs = state.A || {};
  const dfsRate = getDfsRate(inputs.dfs);
  const noDfs = (dfsRate<=0);


  const r = computeRGDU(inputs, p);

  const remunSaisiePer = Number(inputs.remunerationPeriode||0);
  const ppvPer = Number(inputs.ppvPeriode||0);
  const remunAbattuePer = (dfsRate>0) ? (remunSaisiePer * (1 - dfsRate)) : remunSaisiePer;

  const isMensDFS = (inputs.periodicite==="Mensuel");
  const divPer = isMensDFS ? 12 : 1;
  const A = r.reducSansDFS / divPer;
  const B = r.reducAvecDFS / divPer;
  const plaf = r.reducPlafond130 / divPer;
  const finalA = r.reducAnnuelle / divPer;
  const finalPer = finalA;

  const badge = (dfsRate<=0)
    ? `<span class="badge">Pas de DFS</span>`
    : (r.dfsPlafondApplique ? `<span class="badge bad">Plafond 130% appliqué</span>` : `<span class="badge ok">DFS retenue</span>`);

  const periodiciteLabel = isMensDFS ? "Mensuel" : "Annuel";

  
  const noDfsBlock = noDfs ? `
    <div class="callout" style="margin-top:10px">
      <div class="calloutTitle">DFS non appliquée (Pas de DFS sélectionné)</div>
      <p>Le sélecteur DFS du <strong>Scénario A</strong> est actuellement positionné sur <strong>« Pas de DFS »</strong>. Dans ce cas, il n’y a <strong>aucun abattement</strong> et le mécanisme « double comparaison » ne s’applique pas.</p>
      <p class="small muted">Pour voir le mécanisme DFS : allez dans <strong>Simulation</strong> → <strong>Contexte global</strong> → <strong>DFS</strong>, sélectionnez un taux (ex. 24%), puis revenez ici.</p>
    </div>
  ` : ``;

  const stepsBlock = noDfs ? `
    <div class="card" style="margin-top:12px">
      <div class="hd"><div class="title">Aucun calcul DFS à détailler</div></div>
      <div class="bd">
        <p>Le Scénario A est en <strong>Pas de DFS</strong> : la réduction est donc calculée selon le mode standard.</p>
        <p class="small muted">Cette page affichera automatiquement la trace détaillée dès qu’un taux de DFS est sélectionné.</p>
      </div>
    </div>
  ` : `
<div class="card" style="margin-top:12px">
            <div class="hd"><div class="title">Étape 1 — Définir ce que l’on abat (DFS)</div></div>
            <div class="bd">
              <p>La DFS est un <strong>abattement</strong> appliqué à la rémunération (selon les professions éligibles). Dans le simulateur, on la choisit dans <strong>Contexte global → DFS</strong>.</p>
              <div class="kv"><span>TDFS retenu</span><strong>${fmtPct(dfsRate)}</strong></div>
              <div class="kv"><span>Rémunération saisie (période)</span><strong>${fmtMoney(remunSaisiePer, "Période")}</strong></div>
              <div class="kv"><span>Rémunération après abattement</span><strong>${fmtMoney(remunAbattuePer, "Période")}</strong></div>
              <div class="small muted">Note : la PPV est traitée comme une donnée distincte. Ici, elle est affichée pour contrôle, sans être “abattue” automatiquement dans cette page pédagogique.</div>
              <div class="kv"><span>PPV (période)</span><strong>${fmtMoney(ppvPer, "Période")}</strong></div>
            </div>
          </div>

          <div class="card" style="margin-top:12px">
            <div class="hd"><div class="title">Étape 2 — Calcul A : réduction “Sans DFS” (référence)</div></div>
            <div class="bd">
              <p>On calcule la RGDU <strong>comme d’habitude</strong>, sans appliquer d’abattement DFS. Ce résultat sert de <strong>référence</strong>.</p>
              <div class="kv"><span>A — Sans DFS (${safeText(periodiciteLabel)})</span><strong>${fmtMoney(A, periodiciteLabel)}</strong></div>
              <p class="small muted">Ce montant correspond au calcul standard RGDU : il dépend du SMIC de référence, de la rémunération retenue et du coefficient.</p>
            </div>
          </div>

          <div class="card" style="margin-top:12px">
            <div class="hd"><div class="title">Étape 3 — Calcul B : réduction “Avec DFS”</div></div>
            <div class="bd">
              <p>On refait le même calcul, mais sur une rémunération <strong>abaissée</strong> par la DFS. Cette baisse peut augmenter la réduction, car la formule devient plus favorable.</p>
              <div class="kv"><span>B — Avec DFS (${safeText(periodiciteLabel)}, avant plafond)</span><strong>${fmtMoney(B, periodiciteLabel)}</strong></div>
              <details class="acc" style="margin-top:10px">
                <summary>Pourquoi la réduction peut augmenter ?</summary>
                <div class="accBody">
                  <p>La réduction générale augmente quand la rémunération est <strong>plus proche du SMIC</strong>. En abaissant artificiellement l’assiette via la DFS, on peut se rapprocher de cette zone “favorable”.</p>
                </div>
              </details>
            </div>
          </div>

          <div class="card" style="margin-top:12px">
            <div class="hd"><div class="title">Étape 4 — Plafond 130% : sécurisation</div></div>
            <div class="bd">
              <p>Pour éviter qu’une DFS ne génère une réduction disproportionnée, on plafonne :</p>
              <ul>
                <li><strong>Plafond = 130% × A</strong></li>
                <li><strong>Final = min(B ; Plafond)</strong></li>
              </ul>
              <div class="kv"><span>Plafond (130% de A)</span><strong>${fmtMoney(plaf, periodiciteLabel)}</strong></div>
              <div class="kv"><span>Final retenu (${safeText(periodiciteLabel)})</span><strong>${fmtMoney(finalA, periodiciteLabel)}</strong></div>
            </div>
          </div>

          
  `;
return `
    <div class="sheet mode">
      <div class="card">
        <div class="hd">
          <div>
            <div class="kicker">DFS</div>
            <div class="title">Comprendre la DFS – explication pas à pas (trace vulgarisée)</div>
            <div class="sub">Cette page illustre le mécanisme DFS sur <strong>le Scénario A</strong> (le scénario B reste disponible pour la comparaison des simulations, pas pour la pédagogie).</div>
          </div>
          <span class="badge">v4.6</span>
        </div>

        <div class="bd mode">

          <div class="callout">
            <div class="calloutTitle">L’idée en une phrase</div>
            <p>Si une DFS est sélectionnée, on calcule la réduction <strong>deux fois</strong> (sans DFS puis avec DFS). On retient ensuite la réduction « avec DFS », <strong>mais plafonnée</strong> à <strong>130%</strong> de la réduction « sans DFS ».</p>
          </div>

          ${noDfsBlock}
          <div class="callout" style="margin-top:10px">
            <div class="calloutTitle">Résultat final retenu (${safeText(periodiciteLabel)})</div>
            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
              <div style="font-size:22px; font-weight:950;">${fmtMoney(finalPer, "Période")}</div>
              ${badge}
            </div>
            <div class="small muted">Final = min( Calcul avec DFS ; 130% du calcul sans DFS ).</div>
          </div>

          ${stepsBlock}

<details class="acc" style="margin-top:12px" open>
            <summary>Repères Sage (comparaison)</summary>
            <div class="accBody">
              <p>Selon votre paramétrage, le taux DFS peut être visible via :</p>
              <table class="table">
                <thead><tr><th>Référence</th><th>Type</th><th>Valeur</th></tr></thead>
                <tbody>
                  <tr><td><strong>ALG_TDFS</strong></td><td>Constante</td><td>${noDfs ? '0,0000' : fmtPct(dfsRate)}</td></tr>
                  <tr><td><strong>63492</strong></td><td>Rubrique</td><td>${noDfs ? '0,0000' : fmtPct(dfsRate)}</td></tr>
                </tbody>
              </table>
              <p class="small muted">Comparez ces valeurs dans l’onglet <strong>Références Sage</strong>.</p>
            </div>
          </details>

          <div class="small muted" style="margin-top:10px">
            Conseil : pour “voir” l’effet de la DFS, faites un test avec une DFS élevée (ex. 24%) et une rémunération proche d’un seuil, puis observez si le plafond 130% s’applique.
          </div>

        </div>
      </div>
    </div>
  `;
}



// ============================================================
// EXPORT EXCEL — Dashboard élégant (SpreadsheetML XML)
// ============================================================
function exportDashboardExcel(runtime, state){
  const p = { ...runtime.params, ...(state.params||{}) };
  const iA = state.A || {};
  const iB = state.B || {};
  const rA = computeRGDU(iA, p);
  const rB = computeRGDU(iB, p);
  const isMensA = (iA.periodicite === "Mensuel");
  const isMensB = (iB.periodicite === "Mensuel");
  const perLabelA = isMensA ? "Mensuel" : "Annuel";
  const perLabelB = isMensB ? "Mensuel" : "Annuel";
  const divA = isMensA ? 12 : 1;
  const divB = isMensB ? 12 : 1;
  const Mf = (x) => Number.isFinite(x) ? x.toFixed(2) : "";
  const N4 = (x) => Number.isFinite(x) ? x.toFixed(4) : "";
  const Pf = (x) => Number.isFinite(x) ? (x*100).toFixed(2)+"%" : "";

  // Helper: répartition
  const repartition = (r, reduc) => {
    let pctR=NaN, partR=NaN, partU=NaN;
    if(Number.isFinite(r.tmaxi) && r.tmaxi>0 && Number.isFinite(r.tauxRetraitePrisEnCompte))
      pctR = r.tauxRetraitePrisEnCompte / r.tmaxi;
    if(Number.isFinite(pctR) && Number.isFinite(reduc)){
      partR = Math.round((reduc * pctR) * 100) / 100;
      partU = Math.round((reduc - partR) * 100) / 100;
    }
    return {partU, partR, pctR};
  };

  const repA = repartition(rA, rA.reducAffichee);
  const repB = repartition(rB, rB.reducAffichee);

  const esc = (s) => String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const sCell = (v, si) => `<Cell ss:StyleID="${si||"sD"}"><Data ss:Type="String">${esc(v)}</Data></Cell>`;
  const nCell = (v, si) => (v==="" ? `<Cell ss:StyleID="${si||"sN"}"/>` : `<Cell ss:StyleID="${si||"sN"}"><Data ss:Type="Number">${v}</Data></Cell>`);
  const emptyCell = (si) => `<Cell ss:StyleID="${si||"sD"}"/>`;

  const rows = [];
  // 4-column layout: Label | Scénario A | Scénario B | (notes)
  const hdr = (t) => `<Row ss:Height="28">${sCell(t,"sH")}${sCell("","sH")}${sCell("","sH")}${sCell("","sH")}</Row>`;
  const hdr2 = () => `<Row ss:Height="22">${sCell("","sHB")}${sCell("Scénario A","sHA")}${sCell("Scénario B","sHB")}${sCell("","sHB")}</Row>`;
  const kvss = (k, va, vb, note) => `<Row>${sCell(k,"sK")}${sCell(va,"sV")}${sCell(vb,"sV")}${note?sCell(note,"sNote"):emptyCell("sD")}</Row>`;
  const kvnn = (k, va, vb, note) => `<Row>${sCell(k,"sK")}${nCell(va,"sN")}${nCell(vb,"sN")}${note?sCell(note,"sNote"):emptyCell("sD")}</Row>`;
  const blank = () => `<Row ss:Height="6"><Cell/></Row>`;

  // Title block
  rows.push(`<Row ss:Height="42">${sCell("Dashboard RGDU 2026","sT")}${sCell("","sT")}${sCell("","sT")}${sCell("","sT")}</Row>`);
  rows.push(`<Row ss:Height="18">${sCell("Koesio Data Solutions — Export " + new Date().toLocaleDateString("fr-FR"),"sS")}${sCell("","sS")}${sCell("","sS")}${sCell("","sS")}</Row>`);
  rows.push(`<Row ss:Height="18">${sCell("Simulateur RGDU 2026 — v4.6","sS")}${sCell("","sS")}${sCell("","sS")}${sCell("","sS")}</Row>`);
  rows.push(blank());

  // Main result
  rows.push(hdr("Résultat — Réduction Générale"));
  rows.push(hdr2());
  rows.push(kvss("Périodicité", perLabelA, perLabelB));
  rows.push(kvnn("Montant réduction", Mf(rA.reducAffichee), Mf(rB.reducAffichee)));
  rows.push(kvss("Coefficient final", N4(rA.coefFinal), N4(rB.coefFinal)));
  rows.push(kvnn("Rémunération retenue", Mf(rA.remunerationAnnuelle/divA), Mf(rB.remunerationAnnuelle/divB)));
  rows.push(kvnn("SMIC de référence", Mf(rA.smicReference/divA), Mf(rB.smicReference/divB)));
  rows.push(kvnn("Seuil 3×SMIC", Mf(rA.seuil3Smic/divA), Mf(rB.seuil3Smic/divB)));
  const stA = rA.invalid ? "Incomplet" : (rA.remunerationAnnuelle < rA.seuil3Smic && rA.reducAffichee > 0 ? "Réduction" : "Pas de réduction");
  const stB = rB.invalid ? "Incomplet" : (rB.remunerationAnnuelle < rB.seuil3Smic && rB.reducAffichee > 0 ? "Réduction" : "Pas de réduction");
  rows.push(kvss("Statut", stA, stB));
  rows.push(blank());

  // Répartition
  rows.push(hdr("Répartition URSSAF / Retraite"));
  rows.push(hdr2());
  rows.push(kvnn("Part URSSAF", Mf(repA.partU), Mf(repB.partU)));
  rows.push(kvnn("Part Retraite", Mf(repA.partR), Mf(repB.partR)));
  rows.push(kvss("Clé Retraite", Pf(repA.pctR), Pf(repB.pctR)));
  rows.push(blank());

  // Comparateur
  const diffAff = (Number.isFinite(rA.reducAffichee) && Number.isFinite(rB.reducAffichee)) ? (rB.reducAffichee - rA.reducAffichee) : NaN;
  const diffAn = (Number.isFinite(rA.reducAnnuelle) && Number.isFinite(rB.reducAnnuelle)) ? (rB.reducAnnuelle - rA.reducAnnuelle) : NaN;
  rows.push(hdr("Comparateur (B − A)"));
  rows.push(kvnn("Écart affiché (B − A)", Mf(diffAff), "", Number.isFinite(diffAff) ? (diffAff > 0 ? "Gain" : diffAff < 0 ? "Surcoût" : "Égalité") : ""));
  rows.push(kvnn("Écart annuel (B − A)", Mf(diffAn), ""));
  rows.push(blank());

  // Params société
  rows.push(hdr("Paramètres Société"));
  rows.push(hdr2());
  rows.push(kvss("FNAL", iA.fnal, iB.fnal));
  rows.push(kvss("Situation", iA.situation, iB.situation));
  rows.push(kvss("DFS", iA.dfs || "Pas de DFS", iB.dfs || "Pas de DFS"));
  rows.push(kvss("Majoration", iA.majoration, iB.majoration));
  rows.push(kvss("Transport", iA.transport, iB.transport));
  rows.push(kvss("Tdelta retenu", N4(rA.tdelta), N4(rB.tdelta)));
  rows.push(kvss("T maxi", N4(rA.tmaxi), N4(rB.tmaxi)));
  rows.push(kvss("Tmin", N4(p.tmin), N4(p.tmin)));
  rows.push(kvss("P (exposant)", N4(Number.isFinite(p.p)?p.p:1.75), N4(Number.isFinite(p.p)?p.p:1.75)));
  rows.push(blank());

  // Params salarié
  rows.push(hdr("Paramètres Salarié"));
  rows.push(hdr2());
  rows.push(kvss("Type de contrat", iA.typeHeures, iB.typeHeures));
  rows.push(kvss("Présence", Pf(rA.presence), Pf(rB.presence)));
  rows.push(kvnn("Rémunération période", Mf(Number(iA.remunerationPeriode||0)), Mf(Number(iB.remunerationPeriode||0))));
  rows.push(kvnn("PPV période", Mf(Number(iA.ppvPeriode||0)), Mf(Number(iB.ppvPeriode||0))));
  rows.push(blank());

  // Détail calcul
  rows.push(hdr("Détail du calcul"));
  rows.push(hdr2());
  rows.push(kvnn("Heures annuelles", Mf(rA.heuresAnnuelles), Mf(rB.heuresAnnuelles)));
  rows.push(kvnn("SMIC de référence (annuel)", Mf(rA.smicReference), Mf(rB.smicReference)));
  rows.push(kvnn("Rémunération annualisée", Mf(rA.remunerationAnnuelle), Mf(rB.remunerationAnnuelle)));
  rows.push(kvss("M (majoration)", N4(rA.M), N4(rB.M), "Intérimaires ×1,1 ; CCP ×100/90 ; sinon ×1"));
  rows.push(kvss("A (transport)", N4(rA.A), N4(rB.A)));
  rows.push(kvnn("Réduction annuelle", Mf(rA.reducAnnuelle), Mf(rB.reducAnnuelle)));
  rows.push(kvnn("Réduction mensuelle", Mf(rA.reducMensuelle), Mf(rB.reducMensuelle)));
  rows.push(kvnn("Part URSSAF annuelle", Mf(rA.partUrssafAnnuelle), Mf(rB.partUrssafAnnuelle)));
  rows.push(kvnn("Part Retraite annuelle", Mf(rA.partRetraiteAnnuelle), Mf(rB.partRetraiteAnnuelle)));
  rows.push(kvnn("Part URSSAF mensuelle", Mf(rA.partUrssafMensuelle), Mf(rB.partUrssafMensuelle)));
  rows.push(kvnn("Part Retraite mensuelle", Mf(rA.partRetraiteMensuelle), Mf(rB.partRetraiteMensuelle)));
  rows.push(blank());

  // DFS info if applicable
  const dfsA = getDfsRate(iA.dfs);
  const dfsB = getDfsRate(iB.dfs);
  if(dfsA > 0 || dfsB > 0){
    rows.push(hdr("DFS (Déduction Forfaitaire Spécifique)"));
    rows.push(hdr2());
    rows.push(kvss("Taux DFS", Pf(dfsA), Pf(dfsB)));
    if(dfsA > 0){
      rows.push(kvnn("A — Sans DFS (annuel)", Mf(rA.reducSansDFS), ""));
      rows.push(kvnn("B — Avec DFS (annuel)", Mf(rA.reducAvecDFS), ""));
      rows.push(kvnn("Plafond 130%", Mf(rA.reducPlafond130), ""));
      rows.push(kvss("Plafond appliqué ?", rA.dfsPlafondApplique ? "Oui" : "Non", ""));
    }
    rows.push(blank());
  }

  rows.push(`<Row ss:Height="16">${sCell("Fichier généré par le Simulateur RGDU 2026 v4.6 – Koesio Data Solutions","sF")}${sCell("","sF")}${sCell("","sF")}${sCell("","sF")}</Row>`);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:x="urn:schemas-microsoft-com:office:excel">
  <Styles>
    <Style ss:ID="Default"><Font ss:FontName="Calibri" ss:Size="10"/></Style>
    <Style ss:ID="sT"><Font ss:FontName="Calibri" ss:Size="20" ss:Bold="1" ss:Color="#6E398E"/><Interior ss:Color="#F3EEF8" ss:Pattern="Solid"/><Alignment ss:Vertical="Center"/></Style>
    <Style ss:ID="sS"><Font ss:FontName="Calibri" ss:Size="9" ss:Color="#6E398E"/><Interior ss:Color="#F3EEF8" ss:Pattern="Solid"/></Style>
    <Style ss:ID="sH"><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#6E398E" ss:Pattern="Solid"/><Alignment ss:Vertical="Center"/></Style>
    <Style ss:ID="sHA"><Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#6E398E"/><Interior ss:Color="#E8DFF0" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#6E398E"/></Borders></Style>
    <Style ss:ID="sHB"><Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#E94B57"/><Interior ss:Color="#FDE8EA" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E94B57"/></Borders></Style>
    <Style ss:ID="sK"><Font ss:FontName="Calibri" ss:Size="10" ss:Color="#333333"/><Interior ss:Color="#FAFAFA" ss:Pattern="Solid"/><Alignment ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E8E8E8"/></Borders></Style>
    <Style ss:ID="sV"><Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#333333"/><Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E8E8E8"/></Borders></Style>
    <Style ss:ID="sN"><Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#333333"/><NumberFormat ss:Format="#,##0.00"/><Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E8E8E8"/></Borders></Style>
    <Style ss:ID="sNote"><Font ss:FontName="Calibri" ss:Size="9" ss:Italic="1" ss:Color="#888888"/><Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/><Alignment ss:Vertical="Center"/></Style>
    <Style ss:ID="sD"><Font ss:FontName="Calibri" ss:Size="10"/></Style>
    <Style ss:ID="sF"><Font ss:FontName="Calibri" ss:Size="8" ss:Italic="1" ss:Color="#946AAB"/></Style>
  </Styles>
  <Worksheet ss:Name="Dashboard RGDU">
    <Table ss:DefaultColumnWidth="60">
      <Column ss:Width="280"/>
      <Column ss:Width="180"/>
      <Column ss:Width="180"/>
      <Column ss:Width="220"/>
      ${rows.join("\n      ")}
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
      <FitToPage/><Print><FitHeight>1</FitHeight><FitWidth>1</FitWidth></Print>
    </WorksheetOptions>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], {type:"application/vnd.ms-excel"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "Dashboard_RGDU_" + new Date().toISOString().slice(0,10) + ".xls";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  const msg = document.createElement("div");
  msg.className = "toast"; msg.textContent = "\U0001f4ca Export Excel téléchargé";
  document.body.appendChild(msg); setTimeout(()=>msg.remove(), 2500);
}


function renderApp(runtime, state, focusInfo){
  const tabs = [
    {id:"Dashboard", label:"Dashboard"},
    {id:"Simulation", label:"Simulation"},
    {id:"Comparateur", label:"Comparateur"},
    {id:"Simulation_B", label:"Simulation B"},
    {id:"Références Sage", label:"Références Sage"},
    {id:"Mode d\'emploi", label:"Mode d\'emploi"},
    {id:"Calcul DFS", label:"Calcul DFS"},
    {id:"Glossaire", label:"Glossaire"},
    {id:"Parametres", label:"Paramètres"},
    {id:"Suivi des versions", label:"Suivi des versions"},
  ];
  $("#tabs").innerHTML = tabs.map(t => `
    <button class="tab ${state.activeTab===t.id?"active":""}" data-tab="${safeText(t.id)}">${safeText(t.label)}</button>
  `).join("");
  try{ renderCalcDock(state); }catch(e){}

  $$(".tab").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      state.activeTab = btn.getAttribute("data-tab") || "";
      if(state.activeTab === "Paramètres") state.activeTab = "Parametres";
      saveState(state);
      renderApp(runtime, state, null);
  try{ window.__KDS_BOOT_OK = true; window.__KDS_RUNTIME = runtime; window.__KDS_STATE = state; window.__KDS_UI = window.__KDS_UI || { calcTab:{}, calcScope:{}  }; }catch(e){}
    });
  });

  // Secret code "kdstest" to reveal the Tests tab
  if(!window.__KDS_SECRET_LISTENER){
    window.__KDS_SECRET_BUFFER = "";
    window.__KDS_SECRET_LISTENER = true;
    document.addEventListener("keydown", (e) => {
      if(e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
      window.__KDS_SECRET_BUFFER += e.key.toLowerCase();
      if(window.__KDS_SECRET_BUFFER.length > 20) window.__KDS_SECRET_BUFFER = window.__KDS_SECRET_BUFFER.slice(-20);
      if(window.__KDS_SECRET_BUFFER.includes("kdstest")){
        window.__KDS_SECRET_BUFFER = "";
        window.__KDS_TESTS_UNLOCKED = true;
        try{
          const rt = window.__KDS_RUNTIME;
          const st = window.__KDS_STATE;
          if(rt && st){ st.activeTab = "Tests"; saveState(st); renderApp(rt, st, null); }
        }catch(ex){}
      }
    });
  }
  // If tests were unlocked, inject the tab button
  if(window.__KDS_TESTS_UNLOCKED){
    const tabsEl = document.getElementById("tabs");
    if(tabsEl && !tabsEl.querySelector('[data-tab="Tests"]')){
      const btn = document.createElement("button");
      btn.className = "tab" + (state.activeTab === "Tests" ? " active" : "");
      btn.setAttribute("data-tab", "Tests");
      btn.textContent = "\u{1F9EA} Tests";
      btn.addEventListener("click", () => {
        state.activeTab = "Tests";
        saveState(state);
        renderApp(runtime, state, null);
      });
      tabsEl.appendChild(btn);
    }
  }

  const view = $("#view");
  const p = runtime.params;

  if(state.activeTab === "Dashboard"){
    view.innerHTML = renderDashboard(p, state);
    $$("[data-goto]").forEach(b=>b.addEventListener("click", ()=>{ state.activeTab = b.getAttribute("data-goto"); saveState(state); renderApp(runtime, state, null);
  try{ window.__KDS_BOOT_OK = true; window.__KDS_RUNTIME = runtime; window.__KDS_STATE = state; window.__KDS_UI = window.__KDS_UI || { calcTab:{}, calcScope:{} }; }catch(e){} }));
    const _xlsBtn = document.getElementById("btnExportXls");
    if(_xlsBtn) _xlsBtn.addEventListener("click", ()=> exportDashboardExcel(runtime, state));
  }else if(state.activeTab === "Simulation"){
    view.innerHTML = renderSimulation("Simulation (Scénario A)", "A", runtime.options, p, state);
    wireSimulationInputs("A", state, (focus)=>{ updateSimulationResults(runtime, state, "A");
    $$("[data-report]").forEach(b=>b.addEventListener("click", ()=>{ openReportModal(runtime, state, {page: state.activeTab, scenario: b.getAttribute("data-scn") || "A"}); })); setTimeout(()=>restoreFocusInfo(focus),0); });
  }else if(state.activeTab === "Simulation_B"){
    view.innerHTML = renderSimulation("Simulation B (Scénario alternatif)", "B", runtime.options, p, state);
    wireSimulationInputs("B", state, (focus)=>{ updateSimulationResults(runtime, state, "B");
    $$("[data-report]").forEach(b=>b.addEventListener("click", ()=>{ openReportModal(runtime, state, {page: state.activeTab, scenario: b.getAttribute("data-scn") || "B"}); })); setTimeout(()=>restoreFocusInfo(focus),0); });
    // Wire copy button
    const btnCopy = document.getElementById("btnCopyFromA");
    if(btnCopy) btnCopy.addEventListener("click", ()=>{
      const keysToClone = ["periodicite","fnal","situation","dfs","tdeltaPerso","bonusMalus","retraitePatronaleSociete","majoration","transport","typeHeures","heuresJour","heuresMensuelles","forfaitHeures","forfaitJours","heuresSupPeriode","situationAbsence","modeAbsence","remunTheorique","enaTheorique","remunVersee","enaVersee","presenceForfait","remunerationPeriode","ppvPeriode"];
      const src = state.A || {};
      keysToClone.forEach(k=>{ if(src[k] !== undefined) state.B[k] = JSON.parse(JSON.stringify(src[k])); });
      saveState(state);
      renderApp(runtime, state);
      const msg = document.createElement("div");
      msg.className = "toast"; msg.textContent = "✅ Données du scénario A copiées dans B";
      document.body.appendChild(msg); setTimeout(()=>msg.remove(), 2500);
    });
  }else if(state.activeTab === "Comparateur"){
    view.innerHTML = renderComparateur(p, state);
  }else if(state.activeTab === "Parametres" || state.activeTab === "Paramètres"){
    view.innerHTML = `<div class="sheet">${renderParams(p, state)}</div>`;
    wireParams(state, (focus)=>renderApp(runtime, state, focus));
    $$("[data-report]").forEach(b=>b.addEventListener("click", ()=>{ openReportModal(runtime, state, {page: state.activeTab, scenario: b.getAttribute("data-scn") || ""}); }));
  
    const btn = document.getElementById("exportReports");
    if(btn){
      btn.addEventListener("click", ()=>{
        try{
          const key="rgdu_reports_v1";
          const arr = JSON.parse(localStorage.getItem(key)||"[]");
          const txt = arr.map(r=>buildReportBody(r)).join("\n\n------------------------------\n\n");
          downloadText(`signalements_rgdu_${nowISO().replace(/[:.]/g,"-")}.txt`, txt || "Aucun signalement.");
        }catch(e){
          downloadText(`signalements_rgdu_${nowISO().replace(/[:.]/g,"-")}.txt`, "Aucun signalement.");
        }
      });
    }

  }else if(state.activeTab === "Mode d\'emploi"){
    view.innerHTML = renderModernMode();
  }else if(state.activeTab === "Calcul DFS"){
    view.innerHTML = renderCalculDFSTracePage(runtime, state);
  }else if(state.activeTab === "Tests"){
    view.innerHTML = renderTestsPage(runtime);
    wireTestsPage(runtime);
  }else if(state.activeTab === "Glossaire"){
    view.innerHTML = `<div class="sheet">${renderGlossaire(runtime.glossaire)}</div>`;
  }else if(state.activeTab === "Suivi des versions"){
    view.innerHTML = `<div class="sheet">${renderVersions(runtime.versions)}</div>`;
  }else if(state.activeTab === "Références Sage"){
    view.innerHTML = renderReferencesView(runtime.refs);
    wireReferences(runtime.refs, p, state);
  }else{
    view.innerHTML = `<div class="sheet"><div class="card"><div class="bd">Onglet non géré.</div></div></div>`;
  }

  // Restaure le focus après re-render (évite le saut de curseur pendant la saisie)
  setTimeout(()=>restoreFocusInfo(focusInfo), 0);

  // Les actions topbar (Charger exemple / Réinitialiser) sont câblées une seule fois au boot
  // Calculatrice flottante (indépendante)
  try{ wireCalculator(state); }catch(e){}
}




  // Délégation clic "Signaler un écart" (robuste à tous rerenders)
  if(!window.KDS_delegatedHandlersInstalled){
    window.KDS_delegatedHandlersInstalled = true;
    document.addEventListener("click", (ev)=>{
      try{
        const t = ev.target && ev.target.closest ? ev.target.closest("[data-report]") : null;
        if(!t) return;
        const scn = t.getAttribute("data-scn") || "";
        openReportModal(window.__KDS_RUNTIME, window.__KDS_STATE, { page: (window.__KDS_STATE && window.__KDS_STATE.activeTab) ? window.__KDS_STATE.activeTab : "", scenario: scn });
      }catch(e){}
    });
  }
// --- Données embarquées pour mode "double-clic" (file://) ---
// (évitent les blocages CORS sur fetch() en local)
const __EMBEDDED__ = {
  "options": {
    "periodicite": [
      "Mensuel",
      "Annuel"
    ],
    "fnal": [
      "0,10%",
      "0,50%"
    ],
    "situation": [
      "Cas general",
      "Journalistes",
      "Prof médicales TP",
      "VRP multicartes",
      "Personnalise"
    ],
    "majoration": [
      "Aucune",
      "Interimaires (x1, 1)",
      "Caisses conges payes (x100/90)",
      "Transport routier"
    ],
    "transport": [
      "Aucun (1)",
      "Grand routier (45/35)",
      "Courte distance (40/35)"
    ],
    "typeHeures": [
      "Heures mensuelles contractuelles",
      "Forfait annuel (heures)",
      "Forfait annuel (jours)"
    ],
    "dfs": [
      "Pas de DFS",
      "Construction — 7%",
      "Propreté — 3%",
      "Journalistes — 24%",
      "Transport routier de marchandises — 17%",
      "Aviation civile — 26%",
      "Casino et cercle de jeux — 5%",
      "VRP — 24%",
      "Spectacle — musiciens/choristes/chefs/régisseurs — 16%",
      "Spectacle — dramatiques/lyriques/cinéma/choré — 18%"
    ]
  },
  "defaults": {
    "A": {
      "periodicite": "Mensuel",
      "fnal": "0,50%",
      "situation": "Cas general",
      "tdeltaPerso": null,
      "majoration": "Aucune",
      "transport": "Aucun (1)",
      "typeHeures": "Heures mensuelles contractuelles",
      "heuresMensuelles": 151.67,
      "forfaitHeures": null,
      "forfaitJours": null,
      "heuresSupPeriode": 0,
      "heuresJour": 7.0,
      "presenceForfait": 1.0,
      "remunerationPeriode": 3000.0,
      "ppvPeriode": 0,
      "dfs": "Pas de DFS",
      "situationAbsence": "presence_totale",
      "modeAbsence": "montants",
      "remunTheorique": null,
      "enaTheorique": null,
      "remunVersee": null,
      "enaVersee": null
    },
    "B": {
      "periodicite": "Mensuel",
      "fnal": "0,50%",
      "situation": "Cas general",
      "tdeltaPerso": null,
      "majoration": "Aucune",
      "transport": "Aucun (1)",
      "typeHeures": "Heures mensuelles contractuelles",
      "heuresMensuelles": 151.67,
      "forfaitHeures": null,
      "forfaitJours": null,
      "heuresSupPeriode": 0,
      "heuresJour": 7.0,
      "presenceForfait": 1.0,
      "remunerationPeriode": 3000.0,
      "ppvPeriode": 0,
      "dfs": "Pas de DFS",
      "situationAbsence": "presence_totale",
      "modeAbsence": "montants",
      "remunTheorique": null,
      "enaTheorique": null,
      "remunVersee": null,
      "enaVersee": null
    }
  },
  "params": {
    "smicHoraire": 12.02,
    "tmin": 0.02,
    "p": 1.75,
    "urssaf_fnal_050": 0.342,
    "urssaf_fnal_010": 0.338,
    "ceg_t1": 0.0129,
    "retraite_patronale_societe": 0.0472,
    "tdelta_fnal_010": 0.3781,
    "tdelta_fnal_050": 0.3821,
    "tdelta_journalistes": 0.3493,
    "tdelta_prof_med_tp": 0.3565,
    "tdelta_vrp": 0.3656,
    "majoration_interim": 1.1,
    "majoration_ccp": 1.111111111111111,
    "a_grand_routier": 1.285714285714286,
    "a_courte_distance": 1.142857142857143,
    "meta": {
      "source_xlsx": "Simulateur_RGDU_2026_Koesio_v34_2_ReferencesSage_FormatFixed.xlsx",
      "extracted_at": "2026-01-26"
    }
  },
  "mode": {
    "title": "Mode d’emploi – Simulateur RGDU 2026",
    "lines": [
      "Mode d’emploi – Simulateur RGDU 2026",
      "Version du fichier : 3. 2 | Dernière mise à jour : 15/01/2026",
      "Clause de non-responsabilité\nL’outil de calcul de la réduction générale des cotisations patronales mis à disposition par Koesio Data Solutions est fourni à titre purement informatif. Bien que conçu avec le plus grand soin, cet outil ne constitue ni un document contractuel, ni un conseil juridique ou fiscal. Les résultats produits ne sauraient engager la responsabilité de Koesio Data Solutions, notamment en cas d’erreur, d’omission ou d’utilisation inappropriée des données. Il appartient à chaque utilisateur de vérifier l’exactitude des calculs et de se référer aux textes en vigueur ou de consulter un juriste pour toute décision prise sur la base de ces résultats.",
      "Objectif\nCe fichier permet de simuler la Réduction Générale Dégressive Unique (RGDU) 2026 en calcul mensuel ou annuel, avec une restitution pédagogique adaptée aux gestionnaires de paie.",
      "Où saisir les données?\nToutes les saisies se font dans l’onglet « Simulation » (cellules de saisie en fond cyan).\nL’onglet « Dashboard » est une vue de lecture (résultats et contrôles).\nL’onglet « Simulation B » sert au comparateur (scénario alternatif).",
      "Étape 1 – Choisir la périodicité\nEn Simulation (cellule B5), choisir « Mensuel » ou « Annuel ».\nCe choix pilote l’interprétation des montants (rémunération, PPV, SMIC de référence) et l’affichage des résultats.",
      "Étape 2 – Paramètres Société\nRenseigner les paramètres entreprise :\n• FNAL : 0, 10 % ou 0, 50 %\n• Situation particulière (journalistes, VRP, professions médicales TP…)\n• Cas spéciaux / majorations (intérim, caisses congés payés…)\n• Transport routier : coefficient A si applicable",
      "Étape 3 – Paramètres Salarié\nRenseigner le type de temps de travail, puis compléter les champs selon le type de contrat (heures mensuelles ou forfait annuel).\n\nÉtape 3b – Présence et absence\nChoisir la situation :\n• Présence totale : aucune saisie supplémentaire\n• Absence (sans paie ou maintien partiel) : saisir rémunération théorique, rémunération versée et ENA (Éléments Non Affectés par l'absence). Mode expert : coefficient direct.\n• Maintien total : SMIC habituel, pas de proratisation\n\nLes ENA sont exclus des deux membres du rapport SMIC (D.241-7 IV, BOSS § 720 - 01/04/2026).",
      "Étape 4 – Rémunération & PPV\nSaisir :\n• Rémunération brute soumise à cotisations (hors PPV)\n• PPV dans la zone dédiée (incluse dans le calcul)\n\nAttention : si périodicité = Mensuel → PPV mensuelle; si Annuel → PPV annuelle.",
      "Lire le résultat (Dashboard)\nLe Dashboard affiché : réduction RGDU, coefficient C, rémunération (incl. PPV), SMIC de référence, seuil 3 SMIC, et des contrôles de cohérence (OK / Conseil).",
      "⚠️ Points de vigilance (lecture du résultat)\n• Le calcul est annualisé : en mode « Mensuel », le montant affiché correspond à une projection (annuel / 12).\n• En cas d’absence, certains éléments non affectés (ENA) ne doivent pas être proratisés : adapter la rémunération saisie si nécessaire (ex. prime non proratisée).",
      "📌 Interprétation du résultat\nLe montant affiché est une estimation fondée sur les données saisies. Des écarts peuvent apparaître en paie réelle en cas de variations de rémunération ou de régularisations en cours d’année.",
      "Comparateur (A / B)\n• Scénario A = onglet « Simulation »\n• Scénario B = onglet « Simulation B »\nL’onglet « Comparateur » met en évidence les écarts et l’impact mensuel / annuel équivalent.\n\nExemples d’utilisation :\n• Comparer deux salariés (mêmes paramètres société) pour visualiser l’écart de réduction.\n• Simuler un salarié avant / après augmentation pour mesurer l’impact sur la RGDU.\n• Mesurer l’effet d’une PPV (avec ou sans PPV, ou PPV à différents montants).\n• Tester une variation de temps de travail (ex. passage à temps partiel) et son effet sur le seuil SMIC.",
      "Dépannage rapide\nSi le résultat paraît incohérent :\n1) Vérifier la périodicité (B5)\n2) Vérifier FNAL (0, 10 / 0, 50)\n3) Vérifier rémunération et PPV\n4) Vérifier le seuil 3 SMIC (Dashboard)\n5) Vérifier le type de temps de travail et les champs associés",
      "Références Sage\nUn onglet « Références Sage » est disponible pour rapprocher certaines rubriques et constantes du guide de paramétrage Sage Paie 100 avec les cellules du simulateur.\nLimites : seules les correspondances directes sont listées ; le simulateur fournit une estimation et peut différer d’un calcul paie réel (régularisations, particularités de paramétrage, éléments non pris en compte, ventilations URSSAF/retraite, etc.).",
      "Calculatrice : bouton rouge en bas du menu • standard + scientifique • mémoire • historique • ANS (dernier résultat)."
    ]
  },
  "glossaire": {
    "title": "Glossaire RGDU 2026",
    "intro": "Définitions rapides pour lecture client / gestionnaire de paie",
    "items": [
      "Glossaire RGDU 2026",
      "Définitions rapides pour lecture client / gestionnaire de paie",
      {
        "terme": "RGDU",
        "definition": "Réduction Générale Dégressive Unique : réduction de cotisations patronales applicable jusqu’à 3 SMIC (2026)."
      },
      {
        "terme": "Tmin",
        "definition": "Exonération minimale garantie : 2, 00% (0, 0200)."
      },
      {
        "terme": "Tdelta",
        "definition": "Part variable dépendant du périmètre de cotisations (notamment FNAL) et des situations particulières."
      },
      {
        "terme": "P",
        "definition": "Coefficient de puissance : 1, 75 en 2026."
      },
      {
        "terme": "SMIC de référence",
        "definition": "SMIC annualisé / proratisé selon temps de travail, présence, heures sup… et majorations éventuelles."
      },
      {
        "terme": "Seuil 3 SMIC",
        "definition": "Au-delà (ou égal) à 3×SMIC de référence : réduction nulle (coefficient forcé à 0)."
      },
      {
        "terme": "PPV",
        "definition": "Prime de Partage de la Valeur : incluse dans la rémunération de calcul de la réduction."
      },
      {
        "terme": "ENA",
        "definition": "Éléments Non Affectés par l’absence : exclus de la proratisation du SMIC (ex : 13e mois, IFC…)."
      },
      {
        "terme": "ENA (Éléments Non Affectés)",
        "definition": "Éléments exclus du rapport de proratisation du SMIC en cas d'absence (D.241-7 IV, BOSS § 720). Exemples : primes non proratisées strictement, primes trimestrielles ou annuelles, IFC, ICP. Exclus des DEUX membres du rapport (numérateur ET dénominateur)."
      },
      {
        "terme": "FNAL",
        "definition": "Contribution employeur au logement : 0, 10% ou 0, 50% selon effectif/règles."
      },
      {
        "terme": "Bonus/Malus chômage",
        "definition": "Modulation du taux de cotisation chômage patronale (standard 4,05%). Saisissez le taux modulé figurant sur vos bulletins. L'outil calcule le différentiel. Bonus : réduction (ex : 3,00%). Malus : majoration (ex : 5,05%). Impact sur T maxi et Tdelta."
      }
    ]
  },
  "versions": {
    "title": "Suivi des versions – Simulateur RGDU 2026",
    "note": "Règle de mise à jour : toute nouvelle évolution fonctionnelle est ajoutée en tête (ligne 5), les versions précédentes sont décalées vers le bas. La version du fichier ne change pas pour une simple mise à jour d’informations.",
    "items": [
      {
        "version": "4.6",
        "objectif": "Périodicité dynamique + export Excel enrichi + corrections",
        "ajouts": "Export Excel Dashboard complet (A + B, comparateur, DFS, couleurs Koesio). Tooltip interactif sur la valeur M (étape 7 du calcul). Repères Sage DFS (ALG_TDFS / 63492) avec valeurs dans la page Calcul DFS.",
        "modifications": "Calcul DFS : valeurs A et B suivent la périodicité (mensuel/annuel). Références Sage : valeurs suivent la périodicité du scénario. Comparateur : écarts affichés selon la périodicité. Bloc DFS condensé (simulation) : valeurs dynamiques selon périodicité. Logo : lien + tooltip vers le portail des outils Paie. Sous-titre allégé (suppression mention classeur Excel).",
        "corrections": "ALG_EXPOS : valeur affichée correctement (fallback 1,75). Bloc DFS en simulation : actualisation dynamique corrigée. PPV dans la page Calcul DFS : utilise ppvPeriode (correction v4.4).",
        "date": "2026-02-25"
      },
      {
        "version": "4.3",
        "objectif": "Bonus/Malus chômage + charte Koesio",
        "ajouts": "Champ Bonus/Malus chômage dans Simulation A et B (écart en % vs taux standard 4,05%) ; impact sur T maxi, Tdelta et répartition URSSAF/Retraite. Logo Koesio en footer + composition de carrés (charte). Bouton retour outils Paie.",
        "modifications": "Mode d emploi : documentation du bonus/malus. Footer enrichi (logo + carrés Koesio). Nettoyage fichiers orphelins (styles.css, app.js). Cas de test M_HS_10h_2000 clarifié.",
        "corrections": "Correction binding retraitePatronaleSociete (v4.2). Suppression barre violette (web uniquement, v4.2).",
        "date": "2026-02-11"
      },
      {
        "version": "4.1",
        "objectif": "DFS + calculatrice + pédagogie",
        "ajouts": "Calculatrice intégrée (standard + scientifique) avec historique et mémoire, disponible sur toutes les pages ; Ajout du choix DFS dans le Contexte global et page « Calcul DFS » (double calcul + plafonnement 130%) ; Ajout de la répartition URSSAF / Retraite dans les résultats ; Ajout des repères Sage DFS (ALG_TDFS, rubrique 63492) dans Références Sage (comparaison avec Sage Paie).",
        "modifications": "Mode d’emploi : enrichissement (dont calculatrice) ; bouton calculatrice docké en bas du menu (rouge charte) ; ajustements d’affichage et de parcours. ; Page « Calcul DFS » : trace vulgarisée sur Scénario A uniquement, explication pas à pas renforcée.",
        "corrections": "Stabilité offline ; recalcul dynamique après saisie ; correctifs UI divers (focus, navigation). ; Page « Calcul DFS » : message dédié lorsque DFS = « Pas de DFS » (aucune trace affichée, indication pour activer un taux DFS).",
        "date": "2026-01-29"
      },
      {
        "version": "4.0",
        "objectif": "Portage web (offline) + refonte UI & calculs",
        "ajouts": "Bascule en web app offline (index.html) : Dashboard, Simulation A/B en pavés, Comparateur, Références Sage live, Mode d’emploi modernisé, Glossaire, Paramètres assistantés, alerting. Répartition URSSAF/Retraite (T maxi) avec gestion d’un taux retraite patronal dérogatoire (plafonné). Thème clair + intégration logo KDS.",
        "modifications": "Ordre des pages : Dashboard → Simulation → Comparateur → Simulation_B → Références Sage → Mode d’emploi → Glossaire → Paramètres → Suivi des versions. Présence saisie et affichée en %. Suppression des références de cellules Excel en interface. Références Sage alimentées par les calculs.",
        "corrections": "Calculs et affichages mis à jour en temps réel. Correction du focus (le curseur ne saute plus en saisie numérique). Sécurisation du stockage local. Ajustements T maxi/Tdelta selon FNAL et taux retenus."
      },
      {
        "version": "3.4",
        "objectif": "Corrections calcul (RGDU)",
        "ajouts": "",
        "modifications": "Simulation : retour à l’affichage annuel des bases (suppression de la colonne technique) ; Simulation_B alignée ; Ajout onglet « Références Sage » (correspondances Sage Paie 100) + lien depuis Simulation + note dans Mode d’emploi",
        "corrections": "Tdelta personnalisé : priorité à la saisie utilisateur (B10) ; FNAL : prise en compte cohérente en cas particulier ; SMIC : suppression de la majoration E32 sur E39 (majoration appliquée au coefficient uniquement)"
      },
      {
        "version": "3.3",
        "objectif": "Améliorations documentation & fiabilisation",
        "ajouts": "",
        "modifications": "Mode d’emploi : encadrés déplacés en B15/B16 (sans fusion) + exemples d’utilisation du comparateur ; Correction libellés FR (accents/terminologie) sur l’ensemble du classeur ; Simulation : affichage des bases conservé en annuel (fonction mensuel/annuel retirée, pas de colonne technique)",
        "corrections": "Coefficient C arrondi à 4 décimales avant calcul (conformité légale) ; Ajustements de mise en page du Mode d’emploi (hauteurs de lignes adaptées au contenu colonne B) ; FNAL : liste corrigée (0,10% / 0,50%) ; Tdelta prend en compte le FNAL même en cas particulier (B9). ; SMIC : suppression de la majoration E32 sur E39 (majoration appliquée au coefficient uniquement)"
      },
      {
        "version": "3. 2",
        "objectif": "Finalisation + documentation",
        "ajouts": "Gestion “officielle” du versioning : Version 3. 2; Dernière mise à jour = date du jour",
        "modifications": "Mode d’emploi restructuré pour être plus lisible; Réduction des espaces excessifs entre paragraphes",
        "corrections": "Simulation & Simulation B : B17 et B18 laissées vides; Graphique déplacé pour ne plus gêner les tableaux (coin haut gauche en H15); Coefficient C arrondi à 4 décimales (au dix-millième le plus proche) avant calcul final, conformément au texte."
      },
      {
        "version": "3. 1",
        "objectif": "Comparateur encore plus visuel",
        "ajouts": "Flèches ▲/▼ sur les écarts; Affichage simultané gain mensuel équivalent et gain annuel équivalent; Mini graphique A vs B",
        "modifications": "",
        "corrections": ""
      },
      {
        "version": "3. 0",
        "objectif": "Comparateur orienté client",
        "ajouts": "Comparateur KPI : Réduction A/B, Écart, Badge Gain/Surcoût, Impact annuel équivalent (auto x12 si mensuel); Mise en couleur intelligente des écarts",
        "modifications": "Impression propre 1 page; lecture immédiate",
        "corrections": ""
      },
      {
        "version": "2. 9",
        "objectif": "Meilleure UX + comparateur fiable",
        "ajouts": "Ajouts d’instructions : C15 “Saisie obligatoire”; C16/C17/C18 “selon le type sélectionné”",
        "modifications": "Suppression des blocs Parcours/Complétude/PPV (colonne J)",
        "corrections": "Verrouillage périodicité : Simulation_B! B5 = Simulation! B5"
      },
      {
        "version": "2. 8",
        "objectif": "Rendu pro + sécurité juridique",
        "ajouts": "Préambule : Clause de non-responsabilité dans Mode d’emploi",
        "modifications": "Finitions d’impression Dashboard (1 page); Alignements et mise en page client-ready",
        "corrections": ""
      },
      {
        "version": "2. 7",
        "objectif": "Fiabilité des listes + propreté Dashboard",
        "ajouts": "Dashboard : suppression visuelle des couleurs vert/jaune si rien ne s’affiché",
        "modifications": "",
        "corrections": "Restauration listes : Simulation! B5 Mensuel / Annuel; Simulation_B! B5 Mensuel / Annuel; Recopie validations manquantes dans Simulation B"
      },
      {
        "version": "2. 6",
        "objectif": "Rétablir un affichage clair du mode",
        "ajouts": "",
        "modifications": "Réintégration affichage MODE : Mensuel / Annuel (une seule zone); Ordre onglets : Comparateur entre Simulation et Simulation B",
        "corrections": ""
      },
      {
        "version": "2. 5",
        "objectif": "Simplification + alignement",
        "ajouts": "",
        "modifications": "Suppression doublons Mensuel / Annuel; Client → salarié; Suppression lignes inutiles; Suppression bloc rappel règle de calcul; Structure : Aide → Mode d’emploi; Ajustement largeur colonne A",
        "corrections": "Comparateur : Simulation = scénario A; Suppression Simulation_A"
      },
      {
        "version": "2. 4",
        "objectif": "Enrichissement fonctionnel",
        "ajouts": "Comparateur A/B; Onglets Simulation_A + Simulation_B; Glossaire RGDU; Équivalences mensuel / annuel + diagnostic",
        "modifications": "",
        "corrections": "Correction SMIC horaire dans Paramètres (12, 02 €)"
      },
      {
        "version": "2. 3",
        "objectif": "Rendre le fichier autoportant",
        "ajouts": "Mode d’emploi rédigé dans l’onglet Aide",
        "modifications": "Aide rendue plus accessible et exploitable",
        "corrections": ""
      },
      {
        "version": "2. 2",
        "objectif": "Meilleure clarté des choix",
        "ajouts": "Bloc récapitulatif Dashboard : Paramètres Société / Paramètres Salarié",
        "modifications": "Mise en page plus structurée et logique",
        "corrections": ""
      },
      {
        "version": "2. 1",
        "objectif": "Plus pédagogique",
        "ajouts": "Blocs d’explication + contrôles dans le Dashboard; Indications de lecture",
        "modifications": "",
        "corrections": ""
      },
      {
        "version": "2. 0",
        "objectif": "Style Dashboard validé",
        "ajouts": "",
        "modifications": "Dashboard aligné sur le style de la Synthèse V1. 0; Mise en forme propre et lisible",
        "corrections": ""
      },
      {
        "version": "1. 6",
        "objectif": "Corriger la cause racine des réparations Excel",
        "ajouts": "",
        "modifications": "",
        "corrections": "Correction des formules corrompues à l’origine des réparations Excel (sheet1. xml); Stabilisation durable de la structure"
      },
      {
        "version": "1. 0",
        "objectif": "Ergonomie Dashboard",
        "ajouts": "",
        "modifications": "Réduction du bandeau haut; Déplacement du texte de A3 vers H1 (header plus compact)",
        "corrections": "Stabilisation du rendu"
      },
      {
        "version": "0. 7",
        "objectif": "Stabilité du tableau Excel",
        "ajouts": "",
        "modifications": "Ajustements techniques pour fichier ouvrable en local sans réparation",
        "corrections": "Suppression du message d’erreur Excel à l’ouverture; Réparation des listes déroulantes"
      }
    ]
  },
  "refs": {
    "title": "Références Sage Paie 100 (rubriques et constantes)",
    "subtitle": "Correspondances directes présentes dans le simulateur RGDU",
    "note": "Correspondances réalisées selon le paramétrage de la RGDU décrit dans le document PPS1_01_AllegementFillon.pdf téléchargeable depuis la tuile « Allègements et réductions » de la section PPS de Sage Paie 100.",
    "rubriques": [
      {
        "code": "13785",
        "libelle": "PPV pour calcul RGCP",
        "cellule": "Simulation!B25",
        "valeur_excel": "None",
        "commentaire": "Valeur saisie (PPV sur période)"
      },
      {
        "code": "63460",
        "libelle": "Historisation SMICMENS",
        "cellule": "Simulation!E38",
        "valeur_excel": "None",
        "commentaire": "SMIC annuel de référence (annualisé dans le simulateur)"
      },
      {
        "code": "63470",
        "libelle": "Historisation Rémunération",
        "cellule": "Simulation!B24",
        "valeur_excel": "None",
        "commentaire": "Rémunération sur période (hors PPV)"
      },
      {
        "code": "63500",
        "libelle": "Allègement des cotisations",
        "cellule": "Simulation!E46",
        "valeur_excel": "None",
        "commentaire": "Montant d’allègement (annuel) ; voir aussi E47 (mensuel) / E48 (affiché)"
      },
      {
        "code": "79580",
        "libelle": "Coefficient Allègement général",
        "cellule": "Simulation!E45",
        "valeur_excel": "None",
        "commentaire": "Coefficient final (arrondi à 4 décimales)"
      }
    ],
    "constantes": [
      {
        "code": "ALG_EXPOS",
        "libelle": "Valeur exposant (P)",
        "cellule": "Parametres!B6",
        "valeur_excel": "None",
        "commentaire": "Exposant de la formule (P)"
      },
      {
        "code": "ALG_MAXSMI",
        "libelle": "Valeur à appliquer au SMIC",
        "cellule": "Simulation!E40",
        "valeur_excel": "None",
        "commentaire": "Seuil d’annulation (3 × SMIC annuel)"
      },
      {
        "code": "ALG_REDUC",
        "libelle": "Montant global de l’allègement",
        "cellule": "Simulation!E46",
        "valeur_excel": "None",
        "commentaire": "Montant d’allègement (annuel)"
      },
      {
        "code": "ALG_REMUNA",
        "libelle": "Rémunération annuelle",
        "cellule": "Simulation!E41",
        "valeur_excel": "None",
        "commentaire": "Rémunération annualisée incluant PPV"
      },
      {
        "code": "ALG_SMICAN",
        "libelle": "SMIC annuel",
        "cellule": "Simulation!E38",
        "valeur_excel": "None",
        "commentaire": "SMIC annuel de référence"
      },
      {
        "code": "ALG_TDELTA",
        "libelle": "Calcul de la valeur de Tdelta",
        "cellule": "Simulation!E31",
        "valeur_excel": "None",
        "commentaire": "Tdelta retenu (standard ou personnalisé)"
      },
      {
        "code": "ALG_TMIN",
        "libelle": "Valeur Tmin",
        "cellule": "Parametres!B5",
        "valeur_excel": "None",
        "commentaire": "Tmin de la formule"
      }
    ]
  }
};

(function main_embedded(){
  const options = __EMBEDDED__.options;
  const defaults = __EMBEDDED__.defaults;
  const params = __EMBEDDED__.params;
  const mode = __EMBEDDED__.mode;
  const glossaire = __EMBEDDED__.glossaire;
  const versions = __EMBEDDED__.versions;
  const refs = __EMBEDDED__.refs;

  const state = loadState(defaults);
  const runtime = { options, defaults, params, mode, glossaire, versions, refs };

  // Topbar : handlers installés UNE SEULE FOIS (sinon doublons à chaque re-render)
  if(!window.__KDS_TOPBAR_WIRED){
    window.__KDS_TOPBAR_WIRED = true;

    onSafe("#btnExample","click", ()=>{
      // Exemple prêt à l'emploi (A vs B)
      const exA = {
        periodicite: "Mensuel",
        fnal: "0,50%",
        situation: "Cas general",
        tdeltaPerso: null,
        majoration: "Aucune",
        transport: "Aucun (1)",
        typeHeures: "Heures mensuelles contractuelles",
        heuresMensuelles: 151.67,
        forfaitHeures: null,
        forfaitJours: null,
        heuresSupPeriode: 6,
        heuresJour: 7.0,
        // absencePeriode remplacé par situationAbsence/ENA
        situationAbsence: "presence_totale",
        presenceForfait: 1.0,
        remunerationPeriode: 2600.0,
        ppvPeriode: 0,
        dfs: "Pas de DFS"
      };
      const exB = { ...exA, remunerationPeriode: 2750.0, ppvPeriode: 300.0, dfs: "Construction — 7%" };

      state.activeTab = "Comparateur";
      state.A = exA;
      state.B = exB;
      saveState(state);
      renderApp(runtime, state, null);
    });

    onSafe("#btnReset","click", ()=>{
      localStorage.removeItem(STORAGE_KEY);
      state.activeTab = "Dashboard";
      state.A = runtime.defaults.A;
      state.B = runtime.defaults.B;
      state.params = {};
      saveState(state);
      renderApp(runtime, state, null);
    });
  }
  try{
    const v = (versions && versions.items && versions.items[0]) ? versions.items[0] : null;
    const badge = document.getElementById("uiVersion");
    if(badge && v && v.version){ badge.textContent = "v" + String(v.version).trim(); }
  }catch(e){}
  renderApp(runtime, state, null);
  try{ window.__KDS_BOOT_OK = true; window.__KDS_RUNTIME = runtime; window.__KDS_STATE = state; window.__KDS_UI = window.__KDS_UI || { calcTab:{}, calcScope:{} }; }catch(e){}
})();


try{ window.renderCalculDFSTrace = (typeof renderCalculDFSTrace==='function'?renderCalculDFSTrace:null); }catch(e){}


function KDS_refreshCalcPanel(key){
  try{
    const last = (window.__KDS_LAST && window.__KDS_LAST[key]) ? window.__KDS_LAST[key] : null;
    const body = document.getElementById(`${key}_resultsBody`);
    if(body && last){
      body.innerHTML = renderSimulationResults(key, last.r, last.i, last.p);
    }
  }catch(e){}
}
function KDS_csvCell(v){
  const s = String(v ?? "");
  return `"${s.replace(/"/g,'""').replace(/\r?\n/g,' ')}"`;
}
function KDS_numCsv(x){
  return Number.isFinite(x) ? String(x).replace('.', ',') : "";
}

// --- UI helpers: détail de calcul (Résultats) ---
function KDS_setCalcTab(key, tab){
  try{
    window.__KDS_UI = window.__KDS_UI || { calcTab:{}, calcScope:{} };
    window.__KDS_UI.calcTab[key] = tab;
    KDS_refreshCalcPanel(key);
  }catch(e){}
}

function KDS_setCalcScope(key, scope){
  try{
    window.__KDS_UI = window.__KDS_UI || { calcTab:{}, calcScope:{} };
    window.__KDS_UI.calcScope[key] = scope;
    KDS_refreshCalcPanel(key);
  }catch(e){}
}

function KDS_exportCalcExcelXML(key){
  try{
    const last = (window.__KDS_LAST && window.__KDS_LAST[key]) ? window.__KDS_LAST[key] : null;
    if(!last) return;
    const r = last.r, i = last.i||{}, p = last.p||{};
    window.__KDS_UI = window.__KDS_UI || { calcScope:{} };
    const scope = (window.__KDS_UI.calcScope && window.__KDS_UI.calcScope[key]) ? window.__KDS_UI.calcScope[key] : "period";
    const periodicite = (i && i.periodicite) ? i.periodicite : "Mensuel";
    const isMonthly = (periodicite === "Mensuel");
    const div = (scope === "period" && isMonthly) ? 12 : 1;
    const labelScope = (scope === "annual") ? "Annuel" : "Période";

    const money = (x)=> (Number.isFinite(x) ? fmtEUR.format(x) : "");

    const hsRet =
      (isMonthly ? (n(i.heuresSupPeriode)||0) * 12 : (n(i.heuresSupPeriode)||0));
      // heuresSupAnnuel supprimé (BOSS § 860)

    const heuresAn = Number.isFinite(r.heuresAnnuelles) ? r.heuresAnnuelles : (n(i.heuresMensuelles)||0)*12;
    const heuresBaseAn = Math.max(0, (heuresAn||0) - (hsRet||0));

    const A = Number.isFinite(r.A) ? r.A : 1;
    const presence = Number.isFinite(r.presence) ? r.presence : 1;

    const smicSansHS = (Number.isFinite(p.smicHoraire) ? p.smicHoraire : 0) * heuresBaseAn * presence * A;
    const majHS = (Number.isFinite(p.smicHoraire) ? p.smicHoraire : 0) * hsRet * presence * A;

    const smicSansHSDisp = Number.isFinite(smicSansHS) ? (smicSansHS / div) : NaN;
    const majHSDisp = Number.isFinite(majHS) ? (majHS / div) : NaN;
    const smicRef = Number.isFinite(r.smicReference) ? (r.smicReference / div) : NaN;

    const seuil3 = Number.isFinite(r.seuil3Smic) ? (r.seuil3Smic / div) : NaN;
    const assiette = Number.isFinite(r.remunerationAnnuelle) ? (r.remunerationAnnuelle / div) : NaN;

    const reduc = (scope === "annual")
      ? r.reducAnnuelle
      : (isMonthly ? r.reducMensuelle : r.reducAnnuelle);

    const partU = (scope === "annual")
      ? r.partUrssafAnnuelle
      : (isMonthly ? r.partUrssafMensuelle : r.partUrssafAnnuelle);

    const partR = (scope === "annual")
      ? r.partRetraiteAnnuelle
      : (isMonthly ? r.partRetraiteMensuelle : r.partRetraiteAnnuelle);

    const rows = [
      ["Étape","Libellé","Scope","Valeur (num)","Valeur","Formule/Explication"],
      ["1","SMIC de référence (hors HS)",labelScope, Number.isFinite(smicSansHSDisp)? String(smicSansHSDisp):"", money(smicSansHSDisp), "SMIC horaire × heures base × présence × A"],
      ["2","Majoration heures supplémentaires",labelScope, Number.isFinite(majHSDisp)? String(majHSDisp):"", money(majHSDisp), "SMIC horaire × heures sup × présence × A"],
      ["3","SMIC ajusté",labelScope, Number.isFinite(smicRef)? String(smicRef):"", money(smicRef), "1 + 2"],
      ["4","Assiette (brut) retenue",labelScope, Number.isFinite(assiette)? String(assiette):"", money(assiette), "Rémunération + PPV (après règles éventuelles ex. DFS)"],
      ["5","Seuil 3×SMIC",labelScope, Number.isFinite(seuil3)? String(seuil3):"", money(seuil3), "3 × SMIC ajusté"],
      ["6","Coefficient final",labelScope, Number.isFinite(r.coefFinal)? String(r.coefFinal):"", (Number.isFinite(r.coefFinal)? fmt4.format(r.coefFinal):""), "Réduction / assiette (plafonné)"],
      ["7","Réduction",labelScope, Number.isFinite(reduc)? String(reduc):"", money(reduc), "Coefficient × assiette"],
      ["8","Part URSSAF",labelScope, Number.isFinite(partU)? String(partU):"", money(partU), "Répartition URSSAF"],
      ["9","Part Retraite",labelScope, Number.isFinite(partR)? String(partR):"", money(partR), "Répartition Retraite"],
    ];

    const esc = (s)=> String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    const cell = (v)=> `<Cell><Data ss:Type="String">${esc(v)}</Data></Cell>`;
    const rowXml = (arr)=> `<Row>` + arr.map(cell).join("") + `</Row>`;

    const xml =
`<?xml version="1.0"?>
_tf_
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Detail calcul">
  <Table>
   ${rows.map(rowXml).join("\n")}
  </Table>
 </Worksheet>
</Workbook>`.replace("_tf_","<?mso-application progid=\"Excel.Sheet\"?>");

    const blob = new Blob([xml], {type:"application/vnd.ms-excel;charset=utf-8"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `RGDU_${key}_detail_calcul_${scope}.xml`;
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }catch(e){}
}


// ── Tooltips ⓘ ──────────────────────────────────────────────────────────────
(function(){
  var $bubble = null;

  function showTip(btn) {
    hideTip();
    var text = (btn.getAttribute("data-tip") || "").replace(/&#10;/g, String.fromCharCode(10));
    if (!text) return;
    $bubble = document.createElement("div");
    $bubble.className = "rgdu-tooltip-bubble";
    $bubble.textContent = text;
    document.body.appendChild($bubble);
    var rect = btn.getBoundingClientRect();
    var bw = $bubble.offsetWidth || 300;
    var left = Math.min(rect.left, window.innerWidth - bw - 12);
    $bubble.style.left = Math.max(6, left) + "px";
    $bubble.style.top  = (rect.bottom + 8 + window.scrollY) + "px";
  }

  function hideTip() {
    if ($bubble) { $bubble.remove(); $bubble = null; }
  }

  document.addEventListener("mouseover",  function(e){ var b=e.target.closest(".rgdu-tip-btn"); if(b) showTip(b); });
  document.addEventListener("mouseout",   function(e){ if(e.target.closest(".rgdu-tip-btn")) hideTip(); });
  document.addEventListener("focusin",    function(e){ var b=e.target.closest(".rgdu-tip-btn"); if(b) showTip(b); });
  document.addEventListener("focusout",   function(e){ if(e.target.closest(".rgdu-tip-btn")) hideTip(); });
  document.addEventListener("click",      function(e){
    var b = e.target.closest(".rgdu-tip-btn");
    if (b) { if($bubble) hideTip(); else showTip(b); e.stopPropagation(); }
    else hideTip();
  });
  document.addEventListener("keydown",    function(e){ if(e.key==="Escape") hideTip(); });

  // Ctrl+Entrée → lancer les tests RGDU (si l'onglet Tests est actif)
  document.addEventListener("keydown", function(e){
    if((e.ctrlKey || e.metaKey) && e.key === "Enter"){
      var btn = document.getElementById("btnRunTests");
      if(btn && !btn.disabled) { btn.click(); e.preventDefault(); }
    }
  });
})();

      // Injection des URLs depuis config.js (PaieKipédia)
    (function(){
      var cfg = window.PAIEKIPEDIA_CONFIG || {};
      var url = cfg.URL_OUTILS || "../../";
      var logo = document.getElementById("linkLogoOutils");
      var back = document.getElementById("btnBackOutils");
      if(logo) logo.href = url;
      if(back) back.href = url;
    })();

    // ── Pop-up information RGDU — Gel du paramètre SMIC au 1er juin 2026 ────
    (function(){
      var STORAGE_KEY_POPUP = "kds_rgdu_popup_gel_smic_juin2026_dismissed";
      try {
        if(sessionStorage.getItem(STORAGE_KEY_POPUP)) return;
      } catch(e) {}

      var overlay = document.createElement("div");
      overlay.id = "rgduInfoOverlay";
      overlay.style.cssText = [
        "position:fixed","top:0","left:0","width:100%","height:100%",
        "background:rgba(0,0,0,0.55)","z-index:9999",
        "display:flex","align-items:center","justify-content:center",
        "font-family:inherit"
      ].join(";");

      var box = document.createElement("div");
      box.style.cssText = [
        "background:#fff","border-radius:10px","padding:28px 32px",
        "max-width:520px","width:90%","box-shadow:0 8px 32px rgba(0,0,0,0.22)",
        "position:relative"
      ].join(";");

      box.innerHTML = [
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">',
        '  <span style="font-size:24px;">⚠️</span>',
        '  <strong style="font-size:16px;color:#b45309;">Information importante — RGDU juin 2026</strong>',
        '</div>',
        '<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#1e293b;">',
        '  Le ministre de l\'Action et des comptes publics a annoncé le <strong>22 mai 2026</strong> que',
        '  la hausse du SMIC au 1er juin 2026 (<strong>12,31 €/h</strong>) <u>ne sera pas répercutée</u>',
        '  sur le calcul des allègements généraux (RGDU).',
        '</p>',
        '<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#1e293b;">',
        '  Le coefficient de réduction continue à se calculer en fonction du <strong>SMIC en vigueur',
        '  au 1er janvier 2026 (12,02 €)</strong>.',
        '  Un décret officialisant ce gel est attendu.',
        '</p>',
        '<p style="margin:0 0 18px;font-size:13px;color:#64748b;font-style:italic;">',
        '  Ce simulateur utilise actuellement le SMIC de janvier 2026 (12,02 €) pour le calcul RGDU,',
        '  conformément à l\'annonce ministérielle. Mise à jour dès publication du décret.',
        '</p>',
        '<div style="text-align:right;">',
        '  <button id="rgduPopupClose" style="',
        '    background:#0f4c81;color:#fff;border:none;border-radius:6px;',
        '    padding:9px 22px;font-size:14px;cursor:pointer;font-weight:600;',
        '  ">J\'ai compris</button>',
        '</div>'
      ].join("");

      overlay.appendChild(box);
      document.body.appendChild(overlay);

      function closePopup() {
        try { sessionStorage.setItem(STORAGE_KEY_POPUP, "1"); } catch(e) {}
        overlay.remove();
      }

      document.getElementById("rgduPopupClose").addEventListener("click", closePopup);
      overlay.addEventListener("click", function(e){ if(e.target === overlay) closePopup(); });
      document.addEventListener("keydown", function(e){ if(e.key === "Escape") closePopup(); });
    })();
