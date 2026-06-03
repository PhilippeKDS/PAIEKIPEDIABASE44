(() => {
  const $ = (id) => document.getElementById(id);
  const toastEl = document.getElementById("toast");

  // Ce script est chargé sur plusieurs pages (index, help, parameters, tests...).
  // On évite toute exécution de calcul si les éléments du simulateur ne sont pas présents.
  const IS_SIMULATOR_PAGE = !!document.getElementById("mns-estime");

  const nf = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmt = (x) => nf.format(x);
  // --- Step cards (détail du calcul) ---
  // Construit une "étape" lisible : titre, explication, formule (avec valeurs), résultat et référence.
  const stepCard = (n, title, desc, formulaHtml, value, ref) => {
    const v = (Number.isFinite(value) ? fmt(roundTo(value, 2)) : "—");
    // Référence : même taille que l'explication (step-d) pour éviter un effet "trop gros".
    const safeRef = (ref ? `<div class="step-d mono" style="margin-top:6px">Réf : ${ref}</div>` : "");
    return `
      <div class="step">
        <div class="step-n">${n}</div>
        <div class="step-b">
          <div class="step-t">${title}</div>
          ${desc ? `<div class="step-d">${desc}</div>` : ""}
          ${formulaHtml ? `<div class="step-f mono">${formulaHtml}</div>` : ""}
          <div class="step-r">
            <span class="badge">Résultat étape</span>
            <span class="mono" style="font-weight:1000">${v}</span>
          </div>
          ${safeRef}
        </div>
      </div>
    `;
  };

  const toNum = (v) => {
    if (v === "" || v === null || v === undefined) return 0;
    const x = Number(String(v).replace(',', '.'));
    return Number.isFinite(x) ? x : 0;
  };
  const num = (id) => toNum($(id).value);
  const isFilled = (id) => {
    const v = $(id).value;
    return v !== "" && v !== null && v !== undefined;
  };
  const roundTo = (x, d=2) => {
    const p = Math.pow(10, d);
    return Math.round((x + Number.EPSILON) * p) / p;
  };
  const clampMin0 = (x) => (x < 0 ? 0 : x);

  const DEFAULTS = { threshold: 20, tauxCsg: 2.9, roundingMode: "final" };
  const loadParams = () => {
    const threshold = toNum(localStorage.getItem("mns_threshold_pct")) || DEFAULTS.threshold;
    const tauxCsg = toNum(localStorage.getItem("mns_taux_csg_pct")) || DEFAULTS.tauxCsg;
    const roundingMode = String(localStorage.getItem("mns_rounding_mode") || DEFAULTS.roundingMode);
    return { threshold, tauxCsg, roundingMode };
  };

  const PRIME_TYPES = [
    { type: "002", label: "Prime, gratification et indemnité" },
    { type: "007", label: "Indemnité légale de licenciement" },
    { type: "008", label: "Indemnité supplémentaire légale de licenciement" },
    { type: "009", label: "Indemnité spéciale légale de licenciement" },
    { type: "010", label: "Indemnité spécifique légale de licenciement" },
    { type: "013", label: "Journaliste — indemnité" },
    { type: "014", label: "Clientèle — indemnité" },
    { type: "015", label: "Personnel navigant — indemnité" },
    { type: "016", label: "Apprenti — indemnité légale" },
    { type: "021", label: "Indemnité conventionnelle supplémentaire" },
    { type: "045", label: "Dommages et intérêts" },
    { type: "903", label: "Autres primes exonérées de cotisations" },
  ];

  function renderPrimes() {
    const tbody = $("primes-body");
    tbody.innerHTML = PRIME_TYPES.map(p => `
      <tr data-type="${p.type}">
        <td class="mono">${p.type}</td>
        <td>${p.label}</td>
        <td class="right"><input data-field="b" type="number" inputmode="decimal" step="0.01" placeholder="0,00"></td>
      </tr>
    `).join("");
    tbody.querySelectorAll("input").forEach(inp => inp.addEventListener("input", compute));
  }

  function sumPrimes() {
    let s = 0;
    document.querySelectorAll("#primes-body tr").forEach(tr => {
      const inp = tr.querySelector(`input[data-field="b"]`);
      s += toNum(inp?.value);
    });
    return s;
  }

  function getPrimeDetails(){
    const details = [];
    PRIME_TYPES.forEach(p => {
      const tr = document.querySelector(`#primes-body tr[data-type="${p.type}"]`);
      const inp = tr?.querySelector(`input[data-field="b"]`);
      const filled = !!(inp && inp.value !== "");
      const amount = toNum(inp?.value);
      details.push({ type: p.type, label: p.label, amount, filled });
    });
    return details;
  }

  function getRnfBulletin() { return num("netimpo") + num("rnf-regul"); }
  function getBasePasBulletin() { return num("pas-98960") + num("pas-98970"); }
  function getPniBulletin() { return num("pni-98941") - num("pni-98911"); }

  function setEnabledByCase() {
    const caseMode = $("case-toggle").value;
    const showException = (caseMode === "exception");

    // --- Socle fields (general vs particular) ---
    // RNF inputs (NETIMPO + régularisations) useful only for cas particulier
    const rnfWrap = document.getElementById("rnf-wrap");
    if (rnfWrap) {
      rnfWrap.classList.toggle("hidden", !showException);
      rnfWrap.style.display = showException ? "" : "none";
    }

    // Extra safety: also disable individual RNF inputs when hidden
    const netimpo = document.getElementById("netimpo");
    const rnfRegul = document.getElementById("rnf-regul");
    if (netimpo) netimpo.disabled = !showException;
    if (rnfRegul) rnfRegul.disabled = !showException;

    const rnfNote = document.getElementById("rnf-note");
    if (rnfNote) {
      rnfNote.style.display = showException ? "" : "none";
    }

    // General socle inputs (Base PAS + Part non imposable) only for cas général
    const socleGeneralWrap = document.getElementById("socle-general-wrap");
    if (socleGeneralWrap) {
      socleGeneralWrap.style.display = showException ? "none" : "";
    }

    // Indu section only for cas particulier
    const sec56 = document.getElementById("sec-56");
    if (sec56) {
      sec56.classList.toggle("hidden", !showException);
      sec56.style.display = showException ? "" : "none";
    }

    // Extra safety: also disable Indu input when hidden
    const indu = document.getElementById("indu");
    if (indu) indu.disabled = !showException;

    // Update the hint inside S21.G00.50 depending on case
    const hint50 = document.getElementById("hint-50");
    if (hint50) {
      hint50.textContent = showException
        ? "Hors socle (cas particulier) • RNF reconstituée via NETIMPO + régularisations."
        : "Socle (cas général) • Reconstitution via bulletin.";
    }

    // Right panel socle mode label
    $("socle-mode").textContent = showException
      ? "Socle = RNF + Indu (cas CDD court / RNF négative)"
      : "Socle = Base Prélèvement à la source + Part non imposable";
  }
  function getIjssNet(){
    // Saisie unique : IJSS nettes (Sage 84100)
    // À renseigner uniquement en cas de subrogation employeur.
    const ijssNet = clampMin0(num("ijss-net"));
    const includeInMns = ijssNet;
    return { ijssNet, includeInMns };
  }

function compute() {
    try {
    const { threshold, tauxCsg, roundingMode } = loadParams();
    const taux = tauxCsg / 100;
    const RSTEP = (x) => (roundingMode === "step" ? roundTo(x, 2) : x);
    const ri = $("rounding-info");
    if(ri){
      ri.textContent = "Arrondis : " + (roundingMode === "step" ? "par étape (2 décimales à chaque étape)" : "fin de chaîne (arrondi uniquement sur le résultat)");
    }

    const caseMode = $("case-toggle").value;

    const rnfB = getRnfBulletin();
    const pasB = getBasePasBulletin();
    const pniB = getPniBulletin();

    const induB = num("indu");
    const primesB = sumPrimes();
    const hsB = num("hs-exo");
    const mutB = num("mutuelles-pp");
    const abB = num("abondements-epargne");
    const assCsgB = num("assiette-csg");
    const ppvB = num("ppv-placee");

    const interCsg = assCsgB - ppvB - abB;
    let dedCsg = clampMin0(interCsg) * taux;
    dedCsg = RSTEP(dedCsg);

    let socle = (caseMode === "exception") ? (rnfB + induB) : (pasB + pniB);
    socle = RSTEP(socle);
    let ajouts = primesB + hsB;
    ajouts = RSTEP(ajouts);

    const ijss = getIjssNet();
    const ijssIn = RSTEP(ijss.includeInMns);
    const mnsEstime = roundTo(socle + ajouts + ijssIn - mutB - dedCsg, 2);

    $("mns-estime").textContent = fmt(mnsEstime);

    const mnsBulletin = num("mns-bulletin");
    let gap = NaN;
    let gapPct = NaN;

    const bulletinFilled = isFilled("mns-bulletin");

    const dot = $("status-dot");
    const statusLabel = $("status-label");
    const alert = $("alert");

    if (bulletinFilled && mnsBulletin != 0) {
      gap = mnsEstime - mnsBulletin;
      gapPct = Math.abs(gap) / Math.abs(mnsBulletin) * 100;

      const causes = buildActionableCauses({ caseMode, gap, gapPct, threshold });


      $("ecart-eur").textContent = (gap >= 0 ? "+" : "") + fmt(roundTo(gap,2));
      $("ecart-pct").textContent = `Écart : ${roundTo(gapPct,2).toFixed(2).replace('.', ',')} % (seuil ${threshold}%)`;

      if (gapPct > threshold) {
        dot.className = "sDot bad";
        statusLabel.textContent = "Alerte (paramétrage à vérifier)";
        alert.className = "note bad";
        alert.innerHTML = `<b>Alerte :</b> l’écart dépasse ${threshold}%.<br>` +
          `<ul class="bullets">` + causes.map(c=>`<li>${c}</li>`).join("") + `</ul>`;
      } else {
        dot.className = "sDot ok";
        statusLabel.textContent = "OK (cohérent)";
        alert.className = "note";
        alert.textContent = "Le calcul est cohérent avec le MNS imprimé (sous le seuil).";
      }
    } else {
      dot.className = "sDot";
      statusLabel.textContent = "MNS bulletin non saisi";
      $("ecart-eur").textContent = "—";
      $("ecart-pct").textContent = "—";
      alert.className = "note";
      alert.textContent = "Saisissez le MNS affiché sur le bulletin pour activer la vérification.";
    }

    

    
    // Erreurs douces (validation non bloquante)
    updateSoftValidation(caseMode, bulletinFilled, gapPct, threshold);
// Snapshot des résultats (pour export JSON)
    window.__mns_lastResults = {
      case_mode: $("case-toggle")?.value || "standard",
      mns_bulletin: num("mns-bulletin"),
      mns_bulletin_text: isFilled("mns-bulletin") ? fmt(roundTo(num("mns-bulletin"),2)) : "—",
      mns_calcule: roundTo(mnsEstime, 2),
      mns_calcule_text: fmt(roundTo(mnsEstime,2)),
      ecart_eur: $("ecart-eur")?.textContent || "—",
      ecart_pct: $("ecart-pct")?.textContent || "—",
      status: $("status-label")?.textContent || "—",
      socle_mode: $("socle-mode")?.textContent || "—",
      causes: (typeof causes !== "undefined") ? causes : [],
      breakdown: {
        rnfB, pasB, pniB, induB,
        primesB, hsB, mutB,
        assCsgB, ppvB, abB,
        interCsg, dedCsg,
        socle
      }
    };

    const stepsEl = document.getElementById("steps");
    if (stepsEl) {
      // Libellés/refs pour l'étape "Socle" (sécurise le rendu des étapes)
      const socleDesc = (caseMode === "exception")
        ? "En cas particulier, le socle est reconstitué à partir du Revenu Net Fiscal (RNF) et de l’Indu (type 03)."
        : "En cas général, le socle est reconstitué à partir de la Base Prélèvement à la source et de la Part non imposable.";

      const socleRef = (caseMode === "exception")
        ? "S21.G00.50 (RNF reconstituée) + S21.G00.56 (type 03)"
        : "S21.G00.50 (Base PAS + Part non imposable)";

      const socleFormula = (caseMode === "exception")
        ? `Socle = RNF + Indu = (${fmt(rnfB)} + ${fmt(induB)})`
        : `Socle = Base Prélèvement à la source + Part non imposable = (${fmt(pasB)} + ${fmt(pniB)})`;

      let ajouts = primesB + hsB;
    ajouts = RSTEP(ajouts);
      const ajoutsFormula = `Ajouts = Primes + HS/HC exo = (${fmt(primesB)} + ${fmt(hsB)}) = ${fmt(roundTo(ajouts,2))}`;

      const interFormula = `Intermédiaire CSG = Assiette CSG − PPV placée − Abondements = (${fmt(assCsgB)} − ${fmt(ppvB)} − ${fmt(abB)}) = ${fmt(roundTo(interCsg,2))}`;
      const dedCsgFormula = `Déduction CSG non déductible = max(0, Intermédiaire) × ${tauxCsg}% = max(0, ${fmt(roundTo(interCsg,2))}) × ${tauxCsg}% = ${fmt(roundTo(dedCsg,2))}`;
      const dedsFormula = `Déductions = Mutuelles PP + CSG non déductible = (${fmt(mutB)} + ${fmt(roundTo(dedCsg,2))}) = ${fmt(roundTo(mutB + dedCsg,2))}`;

      const includeIjss = ijss.ijssNet > 0;

      const finalFormula = includeIjss
        ? `MNS = Socle + Ajouts + IJSS − Déductions = (${fmt(roundTo(socle,2))} + ${fmt(roundTo(ajouts,2))} + ${fmt(roundTo(ijssIn,2))} − ${fmt(roundTo(mutB + dedCsg,2))}) = ${fmt(mnsEstime)}`
        : `MNS = Socle + Ajouts − Déductions = (${fmt(roundTo(socle,2))} + ${fmt(roundTo(ajouts,2))} − ${fmt(roundTo(mutB + dedCsg,2))}) = ${fmt(mnsEstime)}`;

      stepsEl.innerHTML =
        stepCard(1, "Socle", socleDesc, socleFormula, socle, socleRef) +
        stepCard(2, "Ajouts", "Additionner les éléments à ajouter au socle (primes/indemnités, HS/HC exonérées).", ajoutsFormula, ajouts, "URSSAF — ajouts") +
        (includeIjss
          ? stepCard(3, "IJSS", "À renseigner uniquement en cas de subrogation employeur. Les IJSS nettes (rubrique Sage 84100) sont intégrées au MNS.",
              `IJSS intégrées = ${fmt(ijssIn)} (net)`,
              ijssIn,
              "DSN — S21.G00.58 type 10 (si subrogation)"
            )
          : "") +
        stepCard(includeIjss ? 4 : 3, "Déductions", "Calculer les éléments à déduire (mutuelles PP, CSG non déductible).", interFormula + "<br>" + dedCsgFormula + "<br>" + dedsFormula, (mutB + dedCsg), "URSSAF — déductions") +
        stepCard(includeIjss ? 5 : 4, "Résultat final", includeIjss ? "Appliquer la formule URSSAF : socle + ajouts + IJSS − déductions." : "Appliquer la formule URSSAF : socle + ajouts − déductions.", finalFormula, mnsEstime, "Montant Net Social calculé");
    }

    // Mapping DSN (si activé)
    try {
      renderDsnAudit();
    } catch (auditError) {
      console.warn('Erreur renderDsnAudit:', auditError);
      // Ne pas bloquer le calcul pour une erreur d'audit
    }

    } catch (e) {
      console.error(e);
      // Rendre un état "stable" (évite un panneau vide)
      const dot = document.getElementById('status-dot');
      const statusLabel = document.getElementById('status-label');
      const alert = document.getElementById('alert');
      if (dot) dot.className = 'sDot bad';
      if (statusLabel) statusLabel.textContent = 'Erreur interne (calcul interrompu)';
      if (alert) {
        alert.className = 'note bad';
        alert.innerHTML = '<b>Erreur :</b> une exception JavaScript a interrompu le calcul. Ouvrez la console (F12) pour le détail. Cette situation ne doit pas arriver : utilisez la page <b>Tests</b> pour détecter toute régression.';
      }
      const stepsEl = document.getElementById('steps');
      if (stepsEl) stepsEl.innerHTML = '<div class="note bad">Détail du calcul indisponible (erreur interne).</div>';
      const auditWrap = document.getElementById('dsn-audit');
      if (auditWrap) auditWrap.style.display = 'none';
    }
  }
  function csvEscape(s){
    const str = String(s ?? "");
    if (str.includes(";") || str.includes("\\n") || str.includes('"')) return `"${str.replaceAll('"','""')}"`;
    return str;
  }

  function exportCsv(){
    const { threshold, tauxCsg, roundingMode } = loadParams();
    const rows = [];
    const add = (k, v) => rows.push([k, v].map(csvEscape).join(";"));

    add("generated_at", new Date().toISOString());
    add("threshold_pct", threshold);
    add("taux_csg_pct", tauxCsg);

    add("case_mode", $("case-toggle").value);
    add("mns_bulletin", $("mns-bulletin").value);

    add("netimpo", $("netimpo").value);
    add("rnf_regul", $("rnf-regul").value);
    add("pas_98960", $("pas-98960").value);
    add("pas_98970", $("pas-98970").value);
    add("pni_98941", $("pni-98941").value);
    add("pni_98911", $("pni-98911").value);

    add("indu_type03", $("indu").value);

    PRIME_TYPES.forEach(p => {
      const tr = document.querySelector(`#primes-body tr[data-type="${p.type}"]`);
      add(`prime_${p.type}`, tr?.querySelector('input[data-field="b"]')?.value || "");
    });

    add("hs_exo_79900", $("hs-exo").value);
    add("mutuelles_pp_type92", $("mutuelles-pp").value);
    add("abondements_141516", $("abondements-epargne").value);
    add("assiette_csg_code04", $("assiette-csg").value);
    add("ppv_placee_type906", $("ppv-placee").value);

        add("ijss_nettes_84100", (document.getElementById("ijss-net")||{}).value || "");

    add("mns_calcule", $("mns-estime").textContent);
    add("ecart_eur", $("ecart-eur").textContent);
    add("ecart_pct", $("ecart-pct").textContent);
    add("status", $("status-label").textContent);

    const csv = rows.join("\\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mns_kds_export_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }


  function xmlEscape(s){
    return String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  function exportExcel(){
    const { threshold, tauxCsg, roundingMode } = loadParams();
    const state = collectState();
    const res = window.__mns_lastResults || {};
    const generatedAt = new Date().toLocaleString("fr-FR");

    const sheetInputs = [];
    const addIn = (k,v) => sheetInputs.push([k, v]);
    addIn("Généré le", generatedAt);
    addIn("Seuil d’alerte (%)", threshold);
    addIn("Taux CSG non déductible (%)", tauxCsg);
    addIn("", "");
    addIn("Mode (cas)", state["case-toggle"] || "");
    addIn("MNS affiché sur le bulletin", state["mns-bulletin"] || "");
    addIn("Base PAS 98960", state["pas-98960"] || "");
    addIn("Base PAS 98970", state["pas-98970"] || "");
    addIn("Part non imposable 98941", state["pni-98941"] || "");
    addIn("Part non imposable 98911", state["pni-98911"] || "");
    addIn("NETIMPO (cas particulier)", state["netimpo"] || "");
    addIn("Régularisations RNF (cas particulier)", state["rnf-regul"] || "");
    addIn("Indu type 03 (cas particulier)", state["indu"] || "");
    addIn("HS/HC exonérées (79900)", state["hs-exo"] || "");
    addIn("Mutuelles parts patronales (type 92)", state["mutuelles-pp"] || "");
    addIn("Abondements épargne (14/15/16)", state["abondements-epargne"] || "");
    addIn("Assiette CSG (code 04)", state["assiette-csg"] || "");
    addIn("PPV placée (type 906)", state["ppv-placee"] || "");
    addIn("IJSS nettes (Sage 84100)", state["ijss-net"] || "");

    addIn("", "");
    addIn("Primes (S21.G00.52) — Type", "Montant bulletin");
    const primes = state.primes || {};
    PRIME_TYPES.forEach(p => addIn(p.type, primes[p.type] || ""));

    const sheetResults = [];
    const addR = (k,v) => sheetResults.push([k, v]);
    addR("MNS calculé", res.mns_calcule_text || (document.getElementById("mns-estime")?.textContent || ""));
    addR("Écart (€)", document.getElementById("ecart-eur")?.textContent || "");
    addR("Écart (%)", document.getElementById("ecart-pct")?.textContent || "");
    addR("Statut", document.getElementById("status-label")?.textContent || "");
    addR("Socle", document.getElementById("socle-mode")?.textContent || "");

    // Audit DSN si affiché
    const auditToggle = document.getElementById("audit-toggle");
    const auditWrap = document.getElementById("dsn-audit");
    const isAuditShown = !!(auditToggle && auditToggle.checked && auditWrap && auditWrap.style.display !== "none");
    const sheetAudit = [];
    if(isAuditShown){
      const table = auditWrap.querySelector("table");
      if(table){
        const rows = Array.from(table.querySelectorAll("tr"));
        rows.forEach(tr => {
          const cells = Array.from(tr.querySelectorAll("th,td")).map(td => td.textContent.replace(/\s+/g," ").trim());
          if(cells.length) sheetAudit.push(cells);
        });
      }
    }

    function toWorksheetXml(name, rows){
      const wsRows = rows.map(r => {
        const cells = r.map(v => `<Cell><Data ss:Type="String">${xmlEscape(v)}</Data></Cell>`).join("");
        return `<Row>${cells}</Row>`;
      }).join("");
      return `
  <Worksheet ss:Name="${xmlEscape(name)}">
    <Table>${wsRows}</Table>
  </Worksheet>`;
    }

    const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
${toWorksheetXml("Saisie", sheetInputs)}
${toWorksheetXml("Résultats", sheetResults)}
${isAuditShown ? toWorksheetXml("Audit DSN", sheetAudit.length ? sheetAudit : [["Audit DSN activé mais table vide"]]) : ""}
</Workbook>`;

    const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mns_kds_export_${new Date().toISOString().replace(/[:]/g,"").slice(0,15)}.xls`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("Export Excel généré");
  }

  function collectState(){
    const state = {};
    // Inputs simples
    const ids = [
      "case-toggle","mns-bulletin","netimpo","rnf-regul",
      "pas-98960","pas-98970","pni-98941","pni-98911",
      "indu","hs-exo","mutuelles-pp","abondements-epargne",
      "assiette-csg","ppv-placee","ijss-net"
    ];
    ids.forEach(id => {
      const el = $(id);
      if (el) state[id] = el.value;
    });

    // Primes (table)
    const primes = {};
    PRIME_TYPES.forEach(p => {
      const tr = document.querySelector(`#primes-body tr[data-type="${p.type}"]`);
      primes[p.type] = tr?.querySelector('input[data-field="b"]')?.value || "";
    });
    state.primes = primes;

    return state;
  }

  function applyState(state){
    if(!state || typeof state !== "object") return;

    const ids = [
      "case-toggle","mns-bulletin","netimpo","rnf-regul",
      "pas-98960","pas-98970","pni-98941","pni-98911",
      "indu","hs-exo","mutuelles-pp","abondements-epargne",
      "assiette-csg","ppv-placee","ijss-net"
    ];
    ids.forEach(id => {
      if(state[id] === undefined) return;
      const el = $(id);
      if (el) el.value = state[id];
    });

    if(state.primes && typeof state.primes === "object"){
      PRIME_TYPES.forEach(p => {
        const tr = document.querySelector(`#primes-body tr[data-type="${p.type}"]`);
        const inp = tr?.querySelector('input[data-field="b"]');
        if (inp) inp.value = state.primes[p.type] ?? "";
      });
    }

    setEnabledByCase();
    compute();
  }

  function downloadJson(obj, filename){
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "simulation.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportJson(){
    const { threshold, tauxCsg, roundingMode } = loadParams();
    const payload = {
      app: "Simulateur Montant Net Social (MNS) — Koesio Data Solutions",
      version: "steps",
      exported_at: new Date().toISOString(),
      params: { threshold_pct: threshold, taux_csg_pct: tauxCsg },
      inputs: collectState(),
      results: window.__mns_lastResults || null
    };
    downloadJson(payload, `mns_kds_export_${new Date().toISOString().slice(0,10)}.json`);
    showToast("Export JSON généré");
  }

  async function importJsonFile(file){
    const txt = await file.text();
    const payload = JSON.parse(txt);

    // accepte soit {inputs:{...}} soit directement l'état
    const state = payload?.inputs ? payload.inputs : payload;

    if(!state || typeof state !== "object"){
      alert("Fichier JSON invalide : structure attendue { inputs: {...} }.");
      return;
    }

    applyState(state);
    showToast("Simulation importée");
  }

  function exportPdfAllInOne(){
    const { threshold, tauxCsg, roundingMode } = loadParams();
    const logoUrl = "./assets/img/logo-kds.png";
    const title = "Rapport — Vérification Montant Net Social (bulletin)";
    const generatedAt = new Date().toLocaleString("fr-FR");
    const getHtml = (id) => document.getElementById(id).innerHTML;

    const auditToggle = document.getElementById("audit-toggle");
    const auditWrap = document.getElementById("dsn-audit");
    const isAuditShown = !!(auditToggle && auditToggle.checked && auditWrap && auditWrap.style.display !== "none");
    const auditHtml = isAuditShown ? auditWrap.innerHTML : "";

    // Récap saisie (pour rapport PDF)
    const st = collectState();
    const primesObj = st.primes || {};
    const row = (k,v) => `<tr><th>${k}</th><td class="right mono">${(v ?? "")}</td></tr>`;
    const inputsTable = `
      <table>
        <tbody>
          ${row("Mode (cas)", st["case-toggle"] || "")}
          ${row("MNS affiché sur le bulletin", st["mns-bulletin"] || "")}
          ${row("Base PAS 98960", st["pas-98960"] || "")}
          ${row("Base PAS 98970", st["pas-98970"] || "")}
          ${row("Part non imposable 98941", st["pni-98941"] || "")}
          ${row("Part non imposable 98911", st["pni-98911"] || "")}
          ${row("NETIMPO (cas particulier)", st["netimpo"] || "")}
          ${row("Régularisations RNF (cas particulier)", st["rnf-regul"] || "")}
          ${row("Indu type 03 (cas particulier)", st["indu"] || "")}
          ${row("HS/HC exonérées (79900)", st["hs-exo"] || "")}
          ${row("Mutuelles parts patronales (type 92)", st["mutuelles-pp"] || "")}
          ${row("Abondements épargne (14/15/16)", st["abondements-epargne"] || "")}
          ${row("Assiette CSG (code 04)", st["assiette-csg"] || "")}
          ${row("PPV placée (type 906)", st["ppv-placee"] || "")}
          ${row("IJSS nettes (Sage 84100)", st["ijss-net"] || "")}
        </tbody>
      </table>`;
    const primesRows = PRIME_TYPES.map(p => `<tr><th class="mono">${p.type}</th><td class="right mono">${(primesObj[p.type] || "")}</td></tr>`).join("");
    const primesTable = `
      <table>
        <thead><tr><th>Type</th><th class="right">Montant bulletin</th></tr></thead>
        <tbody>${primesRows}</tbody>
      </table>`;

    const report = `
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body{font-family: ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#111;margin:24px}
    .top{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:14px}
    .brand{display:flex;align-items:center;gap:12px}
    .brand img{height:42px;padding:6px 10px;border:1px solid #ddd;border-radius:12px}
    h1{font-size:18px;margin:0}
    .meta{color:#555;font-size:12px}
    h2{font-size:13px;text-transform:uppercase;letter-spacing:.22px;color:#333;margin:18px 0 8px}
    .card{border:1px solid #ddd;border-radius:12px;padding:12px;margin-bottom:12px}
    .kpi{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .kpi .box{border:1px solid #e5e5e5;border-radius:12px;padding:10px}
    .t{font-size:11px;color:#555;text-transform:uppercase;letter-spacing:.2px;font-weight:800}
    .v{margin-top:6px;font-size:18px;font-weight:1000}
    .badge{display:inline-block;border:1px solid #ddd;border-radius:999px;padding:2px 8px;font-size:11px;color:#555;font-weight:800}
    table{width:100%;border-collapse:collapse;border:1px solid #ddd;border-radius:10px;overflow:hidden}
    th,td{padding:8px;border-bottom:1px solid #eee;font-size:12px;vertical-align:top}
    th{background:#f6f6fb;text-align:left}
    .right{text-align:right}
    .mono{font-family: ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace}
    .note{border-left:3px solid #3fc0f0;background:#eef9fe;border-radius:10px;padding:10px;font-size:12px;line-height:1.35}
    @media print{ body{margin:12mm} .pagebreak{page-break-before:always} }
  </style>
</head>
<body>
  <div class="top">
    <div class="brand">
      <img src="${logoUrl}" alt="Koesio Data Solutions">
      <div>
        <h1>${title}</h1>
        <div class="meta">Généré le ${generatedAt}</div>
      </div>
    </div>
    <div class="meta">Seuil: <span class="badge">${threshold}%</span> • Taux CSG: <span class="badge">${tauxCsg}%</span></div>
  </div>

  <div class="card">
    <div class="kpi">
      <div class="box">
        <div class="t">MNS calculé (bulletin)</div>
        <div class="v">${$("mns-estime").textContent}</div>
        <div class="meta">${$("socle-mode").textContent}</div>
      </div>
      <div class="box">
        <div class="t">Écart vs MNS imprimé</div>
        <div class="v">${$("ecart-eur").textContent}</div>
        <div class="meta">${$("ecart-pct").textContent}</div>
      </div>
    </div>
    <div style="margin-top:10px" class="note">${$("alert").innerHTML}</div>
  </div>

  <h2>Saisie — récapitulatif</h2>
  <div class="card">
    ${inputsTable}
  </div>

  <h2>Primes — S21.G00.52</h2>
  <div class="card">
    ${primesTable}
  </div>

  <div class="pagebreak"></div>
  <h2>Détail du calcul (socle + ajouts − déductions)</h2>
  <div class="card">
    ${getHtml("steps")}
  </div>

  ${isAuditShown ? `
    <div class="pagebreak"></div>\n    <h2>Mode audit DSN — mapping blocs attendus</h2>
    <div class="card">${auditHtml}</div>
  ` : ""}

  <div class="meta">Référence URSSAF : voir page Références de l’outil.</div>
</body>
</html>`;

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.open();
    w.document.write(report);
    w.document.close();
    w.onload = () => { w.focus(); w.print(); };
  }

  function resetAll(){
    const ids = [
      "mns-bulletin","netimpo","rnf-regul",
      "pas-98960","pas-98970","pni-98941","pni-98911",
      "indu","hs-exo","mutuelles-pp","abondements-epargne",
      "assiette-csg","ppv-placee","ijss-net"
    ];
    ids.forEach(id => { $(id).value = ""; });
    $("case-toggle").value = "standard";
    document.querySelectorAll('#primes-body input').forEach(i => i.value = "");
    setEnabledByCase();
    compute();
  }

  function showToast(msg){
    if(!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    setTimeout(()=>toastEl.classList.remove("show"), 2200);
  }

  
  // --- Quick wins: erreurs douces + diagnostic actionnable + résumé copiable ---
  function getFieldLabel(id){
    const el = $(id);
    const field = el?.closest?.(".field");
    const lab = field?.querySelector?.("label");
    if(!lab) return id;
    return lab.textContent.replace(/\s+/g," ").trim();
  }

  function ensureSoftMsg(id){
    const el = $(id);
    if(!el) return null;
    const field = el.closest?.(".field");
    if(!field) return null;
    let msg = field.querySelector(`.soft-msg[data-for="${id}"]`);
    if(!msg){
      msg = document.createElement("div");
      msg.className = "soft-msg";
      msg.setAttribute("data-for", id);
      field.appendChild(msg);
    }
    return msg;
  }

  function setSoftMsg(id, text, level="warn"){
    const msg = ensureSoftMsg(id);
    if(!msg) return;
    msg.className = "soft-msg " + (level || "warn");
    msg.textContent = text || "";
  }

  function clearSoftMsgs(){
    document.querySelectorAll(".soft-msg").forEach(n => n.textContent = "");
  }

  function touchedOrFilled(id){
    const el = $(id);
    return !!(el?.dataset?.touched === "1" || isFilled(id));
  }

  function buildActionableCauses({ caseMode, gap, gapPct, threshold }){
    const causes = [];

    // Always suggest checking the selected mode
    causes.push("Vérifiez que le mode sélectionné (cas général / cas particulier) correspond au bulletin.");

    const common = [
      { id:"assiette-csg", hint:"Assiette CSG (code 04) non renseignée → CSG non déductible potentiellement sous-estimée." },
      { id:"mutuelles-pp", hint:"Mutuelles / prévoyance (type 92) non renseignées → déductions potentiellement manquantes." }
    ];

    if(caseMode === "exception"){
      if(!isFilled("netimpo") && !isFilled("rnf-regul")) causes.push("RNF reconstituée : NETIMPO et régularisations sont vides (RNF prise à 0).");
      if(!isFilled("indu")) causes.push("Indu (type 03) non saisi (pris à 0).");
    } else {
      if(!isFilled("pas-98960") && !isFilled("pas-98970")) causes.push("Base PAS : codes 98960/98970 non saisis (pris à 0).");
      if(!isFilled("pni-98941") && !isFilled("pni-98911")) causes.push("Part non imposable : codes 98941/98911 non saisis (pris à 0).");
    }

    common.forEach(c => { if(!isFilled(c.id)) causes.push(c.hint); });

    // Directionnel
    if(Number.isFinite(gap) && Number.isFinite(gapPct) && gapPct > threshold){
      if(gap > 0){
        causes.push("Le MNS calculé est supérieur au bulletin : vérifiez en priorité les déductions (mutuelles PP, CSG non déductible) et la part non imposable.");
      } else if(gap < 0){
        causes.push("Le MNS calculé est inférieur au bulletin : vérifiez en priorité les ajouts (primes, HS/HC exonérées) et la Base PAS / RNF.");
      }
    }

    // Remove duplicates
    return Array.from(new Set(causes));
  }

  function updateSoftValidation(caseMode, bulletinFilled, gapPct, threshold){
    // Reset all
    clearSoftMsgs();

    const show = (id) => (bulletinFilled || (Number.isFinite(gapPct) && gapPct > threshold) || touchedOrFilled(id));

    // Bulletin MNS (enabling verification)
    if(show("mns-bulletin") && !isFilled("mns-bulletin")){
      setSoftMsg("mns-bulletin", "Saisissez le MNS du bulletin pour activer la vérification (sinon l’écart reste inactif).", "warn");
    }

    if(caseMode === "exception"){
      if(show("netimpo") && !isFilled("netimpo")) setSoftMsg("netimpo", "Champ non saisi : valeur 0 utilisée dans le calcul RNF.", "warn");
      if(show("rnf-regul") && !isFilled("rnf-regul")) setSoftMsg("rnf-regul", "Champ non saisi : valeur 0 utilisée dans le calcul RNF.", "warn");
      if(show("indu") && !isFilled("indu")) setSoftMsg("indu", "Champ non saisi : Indu prise à 0 (peut expliquer un écart).", "warn");
    } else {
      if(show("pas-98960") && !isFilled("pas-98960")) setSoftMsg("pas-98960", "Champ non saisi : valeur 0 utilisée (peut expliquer un écart).", "warn");
      if(show("pas-98970") && !isFilled("pas-98970")) setSoftMsg("pas-98970", "Champ non saisi : valeur 0 utilisée (peut expliquer un écart).", "warn");
      if(show("pni-98941") && !isFilled("pni-98941")) setSoftMsg("pni-98941", "Champ non saisi : valeur 0 utilisée (peut expliquer un écart).", "warn");
      if(show("pni-98911") && !isFilled("pni-98911")) setSoftMsg("pni-98911", "Champ non saisi : valeur 0 utilisée (peut expliquer un écart).", "warn");
    }

    // Common fields
    if(show("assiette-csg") && !isFilled("assiette-csg")) setSoftMsg("assiette-csg", "Champ non saisi : CSG non déductible potentiellement sous-estimée.", "warn");
    if(show("mutuelles-pp") && !isFilled("mutuelles-pp")) setSoftMsg("mutuelles-pp", "Champ non saisi : déductions potentiellement manquantes.", "warn");

    // IJSS : rappel visible uniquement si une valeur est saisie
    if (isFilled("ijss-net")) {
      setSoftMsg(
        "ijss-net",
        "À saisir uniquement en cas de subrogation employeur (montant des IJSS nettes tel qu’imprimé sur le bulletin).",
        "warn"
      );
    }
  }

  // -----------------------------
  // Mode audit DSN (mapping)
  // -----------------------------
  const AUDIT_STORAGE_KEY = "mns_audit_dsn";

  function isAuditEnabled(){
    return localStorage.getItem(AUDIT_STORAGE_KEY) === "1";
  }

  function setAuditEnabled(v){
    localStorage.setItem(AUDIT_STORAGE_KEY, v ? "1" : "0");
  }

  function renderDsnAudit(){
    const wrap = $("dsn-audit");
    const tbody = $("dsn-audit-body");
    const toggle = $("audit-toggle");
    if (!wrap || !tbody || !toggle) return;

    const enabled = !!toggle.checked;
    wrap.style.display = enabled ? "" : "none";
    if (!enabled) { tbody.innerHTML = ""; return; }

    const r = window.__mns_lastResults || {};
    const b = r.breakdown || {};
    const caseMode = r.case_mode || $("case-toggle")?.value || "standard";

    const rows = [];
    const icon = (s) => s === "ok" ? "✅" : (s === "bad" ? "⛔" : "⚠️");
    const f2 = (x) => (Number.isFinite(x) ? fmt(roundTo(x,2)) : "—");

    const addRow = ({ status, bloc, ref, label, value, source }) => {
      rows.push({ status, bloc, ref, label, value, source });
    };

    if (caseMode === "exception") {
      const okRnf = isFilled("netimpo") || isFilled("rnf-regul");
      addRow({
        status: okRnf ? "ok" : "warn",
        bloc: "S21.G00.50",
        ref: "RNF (reconstituée)",
        label: "Revenu net fiscal (utile au socle cas particulier)",
        value: b.rnfB,
        source: "NETIMPO + régularisations RNF"
      });

      addRow({
        status: isFilled("indu") ? "ok" : "warn",
        bloc: "S21.G00.56",
        ref: "S21.G00.56.002 (type 03)",
        label: "Indu (régularisation)"
        ,
        value: b.induB,
        source: "Champ Indu"
      });
    } else {
      addRow({
        status: (isFilled("pas-98960") || isFilled("pas-98970")) ? "ok" : "warn",
        bloc: "S21.G00.50",
        ref: "S21.G00.50.013",
        label: "Base Prélèvement à la source",
        value: b.pasB,
        source: "98960 + 98970"
      });

      addRow({
        status: (isFilled("pni-98941") || isFilled("pni-98911")) ? "ok" : "warn",
        bloc: "S21.G00.50",
        ref: "S21.G00.50.011",
        label: "Part non imposable",
        value: b.pniB,
        source: "98941 − 98911"
      });
    }

    // Primes S21.G00.52 (uniquement si renseignées)
    const primes = getPrimeDetails();
    primes
      .filter(p => p.filled || p.amount !== 0)
      .forEach(p => addRow({
        status: p.filled ? "ok" : "warn",
        bloc: "S21.G00.52",
        ref: `type ${p.type}`,
        label: p.label,
        value: p.amount,
        source: "Table primes (montant bulletin)"
      }));

    // PPV placée (type 906) — si renseignée
    if (isFilled("ppv-placee") || (b.ppvB || 0) !== 0) {
      addRow({
        status: isFilled("ppv-placee") ? "ok" : "warn",
        bloc: "S21.G00.52",
        ref: "type 906",
        label: "PPV placée",
        value: b.ppvB,
        source: "Champ PPV placée"
      });
    }

    // HS/HC exonérées fiscalement (S21.G00.58 type 01) — si renseignées
    if (isFilled("hs-exo") || (b.hsB || 0) !== 0) {
      addRow({
        status: isFilled("hs-exo") ? "ok" : "warn",
        bloc: "S21.G00.58",
        ref: "type 01",
        label: "HS/HC exonérées fiscalement",
        value: b.hsB,
        source: "Rubrique Sage 79900"
      });
    }

    // IJSS nettes (Sage 84100) — à saisir uniquement en cas de subrogation
    const ijss = getIjssNet();
    if (ijss.ijssNet > 0) {
      addRow({
        status: isFilled("ijss-net") ? "ok" : "warn",
        bloc: "S21.G00.58",
        ref: "type 10",
        label: "IJSS subrogées (nettes)",
        value: ijss.includeInMns,
        source: "Rubrique Sage 84100 — IJSS nettes"
      });
    }

    // Cotisations / déductions
    addRow({
      status: isFilled("mutuelles-pp") ? "ok" : "warn",
      bloc: "S21.G00.54",
      ref: "type 92",
      label: "Parts patronales de mutuelles",
      value: b.mutB,
      source: "Champ Mutuelles PP"
    });

    if (isFilled("abondements-epargne") || (b.abB || 0) !== 0) {
      addRow({
        status: isFilled("abondements-epargne") ? "ok" : "warn",
        bloc: "S21.G00.54",
        ref: "types 14/15/16",
        label: "Abondements plan d’épargne",
        value: b.abB,
        source: "Champ Abondements"
      });
    }

    addRow({
      status: isFilled("assiette-csg") ? "ok" : "warn",
      bloc: "S21.G00.78",
      ref: "code 04",
      label: "Assiette CSG",
      value: b.assCsgB,
      source: "Champ Assiette CSG"
    });

    tbody.innerHTML = rows.map(row => `
      <tr>
        <td class="ic ${row.status}">${icon(row.status)}</td>
        <td class="mono">${row.bloc}</td>
        <td class="mono">${row.ref}</td>
        <td>${row.label}</td>
        <td class="right mono">${f2(row.value)}</td>
        <td>${row.source}</td>
      </tr>
    `).join("");
  }

function bind(){
    document.querySelectorAll("input,select").forEach(el => {
      el.addEventListener("input", () => { el.dataset.touched = "1"; compute(); });
      el.addEventListener("blur", () => { el.dataset.touched = "1"; compute(); });
    });
    $("case-toggle").addEventListener("change", () => { setEnabledByCase(); compute(); });
    const _btnReset = $("btn-reset");
    if (_btnReset) _btnReset.addEventListener("click", () => { resetAll(); showToast("Réinitialisé"); });
    const _btnCsv = $("btn-export-csv");
    if (_btnCsv) _btnCsv.addEventListener("click", exportCsv);
    const _btnXls = $("btn-export-xls");
    if (_btnXls) _btnXls.addEventListener("click", exportExcel);
    const btnExportJson = $("btn-export-json");
    if (btnExportJson) btnExportJson.addEventListener("click", exportJson);

    const btnImportJson = $("btn-import-json");
    const fileImport = $("file-import-json");
    if (btnImportJson && fileImport) {
      btnImportJson.addEventListener("click", () => fileImport.click());
      fileImport.addEventListener("change", async () => {
        const f = fileImport.files?.[0];
        if (!f) return;
        try {
          await importJsonFile(f);
        } catch (e) {
          console.error(e);
          alert("Impossible d’importer ce JSON (format invalide).");
        } finally {
          fileImport.value = "";
        }
      });
    }
    const _btnPdf = $("btn-export-pdf");
    if (_btnPdf) _btnPdf.addEventListener("click", exportPdfAllInOne);

    const btnCopy = $("btn-copy-summary");
    if (btnCopy) btnCopy.addEventListener("click", copySummaryToClipboard);

    // Mode audit DSN
    const auditToggle = $("audit-toggle");
    if (auditToggle) {
      auditToggle.checked = getAuditEnabled();
      auditToggle.addEventListener("change", () => {
        setAuditEnabled(!!auditToggle.checked);
        renderDsnAudit();
      });
    }

  }

  if (IS_SIMULATOR_PAGE) {
    renderPrimes();
    bind();
  }

  // ------------------------------------------------------------
  // API interne (tests / intégrations)
  // ------------------------------------------------------------
  // Expose un sous-ensemble sûr pour piloter le simulateur (page Tests).
  // NB : ces méthodes dépendent du DOM de index.html.
  // API interne: utile pour la page Tests (via iframe). Exposée uniquement sur la page simulateur.
  if (IS_SIMULATOR_PAGE) {
    window.__mns_api = {
      applyState,
      collectState,
      compute,
      getResults: () => (window.__mns_lastResults || null),
      setParams: ({ threshold, tauxCsg } = {}) => {
        if (Number.isFinite(threshold)) localStorage.setItem("mns_threshold_pct", String(threshold));
        if (Number.isFinite(tauxCsg)) localStorage.setItem("mns_taux_csg_pct", String(tauxCsg));
      }
    };
  }

  // Contrat de messagerie pour piloter le simulateur depuis un iframe (page Tests)
  if (IS_SIMULATOR_PAGE) window.addEventListener("message", (ev) => {
    const msg = ev?.data;
    if (!msg || typeof msg !== "object") return;

    try {
      if (msg.type === "MNS_SET_PARAMS") {
        window.__mns_api.setParams(msg.params || {});
        compute();
        ev.source?.postMessage({ type: "MNS_ACK", requestId: msg.requestId || null }, "*");
      }
      if (msg.type === "MNS_APPLY_STATE") {
        applyState(msg.state || {});
        ev.source?.postMessage({ type: "MNS_STATE_APPLIED", requestId: msg.requestId || null }, "*");
      }
      if (msg.type === "MNS_GET_RESULTS") {
        ev.source?.postMessage({
          type: "MNS_RESULTS",
          requestId: msg.requestId || null,
          results: window.__mns_lastResults || null
        }, "*");
      }
    } catch (e) {
      console.error(e);
      ev.source?.postMessage({ type: "MNS_ERROR", requestId: msg.requestId || null, message: String(e?.message || e) }, "*");
    }
  });

  function initUiAndCompute(){
    if (!IS_SIMULATOR_PAGE) return;
    try { setEnabledByCase(); } catch(e){ console.error(e); }
    try { compute(); } catch(e){ console.error(e); }
  }

  // Apply initial UI state even if DOMContentLoaded already fired (local file / cached loads).
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initUiAndCompute);
  } else {
    initUiAndCompute();
  }
})();