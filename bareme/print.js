(function(){
  const D = window.MEMO_DATA;
  if(!D){ return; }

  const LEGAL = `Ce document est fourni à titre strictement informatif et ne constitue ni un conseil juridique, ni une prise de position.
Chaque entreprise demeure responsable de vérifier, pour sa situation propre, l’exactitude, l’actualité et l’applicabilité des règles (textes, doctrine, conventions, paramétrage logiciel) et de procéder à ses propres validations.
Dans la limite permise par la réglementation, Koesio Data Solutions décline toute responsabilité quant à l’usage qui pourrait être fait des informations, calculs et simulateurs.`;

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

  function maxDateStr(a,b){
    if(!a) return b;
    if(!b) return a;
    return (a > b) ? a : b;
  }

  function computeGlobalLatestFrom(data){
    let latest = null;
    const values = data.parameters || {};
    for(const v of Object.values(values)){
      const versions = v.versions || [];
      for(const ver of versions){
        if(ver && ver.from) latest = maxDateStr(latest, ver.from);
      }
    }
    if(!latest) return data.meta?.default_as_of || new Date().toISOString().slice(0,10);
    return latest;
  }

  function parseDate(d){
    const dt = new Date(d);
    return Number.isFinite(dt.getTime()) ? dt : new Date(D.meta.default_as_of);
  }

  function getParamValue(id, asOf){
    const p = D.parameters[id];
    if(!p) return null;
    const target = parseDate(asOf || D.meta.default_as_of);
    const versions = (p.versions || []).slice().sort((a,b)=> new Date(a.from)-new Date(b.from));
    let chosen = versions[0]?.value ?? null;
    for(const ver of versions){
      if(new Date(ver.from) <= target) chosen = ver.value;
    }
    return chosen;
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

  function fmtGeneric(v, unit){
    if(v == null) return "—";
    if(typeof v === "string") return v;
    if(unit && unit.includes("%")){
      return fmtPct(v, (v<1?3:2));
    }
    if(unit && unit.includes("€")) return fmtMoney(v);
    return String(v);
  }

  function valueCell(v, asOf){
    if(v && typeof v === "object" && "param" in v){
      const id = v.param;
      const p = D.parameters[id];
      const val = getParamValue(id, v.asOf || asOf);
      const unit = p?.unit || "";
      return fmtGeneric(val, unit);
    }
    return (v == null ? "—" : String(v));
  }

  function buildTable(block, asOf){
    const table = el("table",{class:"table"});
    table.appendChild(el("thead",{},[
      el("tr",{}, block.columns.map(c=> el("th",{},[c])))
    ]));
    const tbody = el("tbody");
    for(const row of block.rows){
      const tr = el("tr");
      for(const cell of row){
        tr.appendChild(el("td",{},[valueCell(cell, asOf)]));
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    return el("div",{class:"block"},[
      el("h4",{},[block.title]),
      table
    ]);
  }

  function buildNote(block, asOf){
    const text = block.textParam ? getParamValue(block.textParam, asOf) : block.text;
    return el("div",{class:"block"},[
      el("h4",{},[block.title]),
      el("div",{class:"note", style:"white-space:pre-wrap"},[text || "—"])
    ]);
  }

  function buildList(block, asOf){
    const items = block.itemsParam ? (getParamValue(block.itemsParam, asOf) || []) : (block.items || []);
    const ul = el("ul",{style:"margin:0; padding-left: 18px; color: var(--text)"});
    for(const it of items){
      ul.appendChild(el("li",{style:"margin: 6px 0; color: var(--muted); font-size: 13px"},[String(it)]));
    }
    return el("div",{class:"block"},[
      el("h4",{},[block.title]),
      ul
    ]);
  }

  function buildBlock(block){
    return el("div",{class:"block"},[
      el("h4",{},[block.title]),
      el("div",{class:"note", style:"white-space:pre-wrap"},[block.text || "—"])
    ]);
  }

  function buildKPIs(asOf){
    const wrap = el("div",{class:"print-kpis"},[]);
    for(const k of (D.kpis || [])){
      const p = D.parameters?.[k.param];
      const val = getParamValue(k.param, asOf);
      wrap.appendChild(el("div",{class:"print-kpi"},[
        el("div",{class:"k"},[k.label]),
        el("div",{class:"v"},[fmtGeneric(val, p?.unit || "")]),
        el("div",{class:"m"},[k.meta || ""])
      ]));
    }
    return wrap;
  }


  function fractionLabel(frac){
    if(frac == null) return "—";
    const f = Number(frac);
    if(!Number.isFinite(f)) return "—";
    const close = (a,b)=> Math.abs(a-b) < 1e-6;
    if(close(f, 1/20)) return "1/20";
    if(close(f, 1/10)) return "1/10";
    if(close(f, 1/5)) return "1/5";
    if(close(f, 1/4)) return "1/4";
    if(close(f, 1/3)) return "1/3";
    if(close(f, 2/3)) return "2/3";
    if(close(f, 1)) return "en totalité";
    return (f*100).toLocaleString("fr-FR",{maximumFractionDigits:2}) + " %";
  }

  function fmtEuroAmount(n, digits=0){
    const v = Number(n);
    if(!Number.isFinite(v)) return "—";
    return v.toLocaleString("fr-FR",{minimumFractionDigits:digits, maximumFractionDigits:digits}) + " €";
  }

  function buildCustomGarnishBareme(block, asOf){
    const thresholds = getParamValue("garnish.thresholds", asOf) || [4480, 8730, 13000, 17230, 21470, 25810];
    const fractions = getParamValue("garnish.fractions", asOf) || [1/20, 1/10, 1/5, 1/4, 1/3, 2/3, 1];

    const rows = [];
    let prev = 0;
    for(let i=0; i<thresholds.length; i++){
      const t = thresholds[i];
      const isFirst = i===0;
      const annualRange = isFirst
        ? `Jusqu’à ${fmtEuroAmount(t,0)}`
        : `Au-delà de ${fmtEuroAmount(prev,0)} et jusqu’à ${fmtEuroAmount(t,0)}`;
      const mPrev = prev/12;
      const mT = t/12;
      const monthlyRange = isFirst
        ? `Jusqu’à ${fmtEuroAmount(mT,2)}`
        : `Au-delà de ${fmtEuroAmount(mPrev,2)} et jusqu’à ${fmtEuroAmount(mT,2)}`;

      rows.push([annualRange, monthlyRange, fractionLabel(fractions[i])]);
      prev = t;
    }
    rows.push([`Au-delà de ${fmtEuroAmount(prev,0)}`, `Au-delà de ${fmtEuroAmount(prev/12,2)}`, fractionLabel(fractions[thresholds.length] ?? 1)]);

    return buildTable({
      title: block.title || "Barème",
      columns: [
        "Tranche annuelle de rémunération (sans personne à charge)",
        "Tranche mensuelle de rémunération (indicative)",
        "Quotité saisissable"
      ],
      rows
    }, asOf);
  }

  function buildChapter(ch, asOf){
    const details = D.chapter_details?.[ch.id];
    const blocks = details?.blocks || [];
    const sec = el("section",{class:"print-section print-chapter"},[
      el("h2",{},[`${details?.kicker || ("Chapitre "+ch.id)} — ${ch.title}`]),
      el("div",{class:"hint"},[ch.desc || ""])
    ]);

    for(const b of blocks){
      if(b.type === "table") sec.appendChild(buildTable(b, asOf));
      else if(b.type === "note") sec.appendChild(buildNote(b, asOf));
      else if(b.type === "list") sec.appendChild(buildList(b, asOf));
      else if(b.type === "block") sec.appendChild(buildBlock(b));
      else if(b.type === "custom_logement") sec.appendChild(buildNote({title:"Logement", text:"Voir l'application pour le détail du barème."}, asOf));
      else if(b.type === "custom_tr_examples") sec.appendChild(buildNote({title:"Titres-restaurant", text:"Voir l'application pour les exemples."}, asOf));
      else if(b.type === "custom_events") sec.appendChild(buildNote({title:"Congés/absences", text:"Voir l'application pour les durées."}, asOf));
      else if(b.type === "custom_garnish_bareme") sec.appendChild(buildCustomGarnishBareme(b, asOf));
      else if(b.type === "cta") sec.appendChild(buildNote({title: b.title || "Simulateur", text: b.label ? (b.label + " (disponible dans l’application)") : "Disponible dans l’application."}, asOf));
      else sec.appendChild(buildNote({title:b.title || "Bloc", text:"(bloc non supporté en impression)"}, asOf));
    }
    return sec;
  }

  function qs(name){
    const u = new URL(window.location.href);
    return u.searchParams.get(name);
  }

  const asOf = qs("asof") || computeGlobalLatestFrom(D);


  const params = new URLSearchParams(location.search);
  const onlyChapter = params.get("chapitre");
  const chapters = onlyChapter ? (D.chapters || []).filter(c=>String(c.id)===String(onlyChapter)) : (D.chapters || []);
  const root = document.getElementById("printApp");
  root.innerHTML = "";

  // Page de garde + sommaire
  const tocList = el("ul",{class:"print-toc"},[
    el("li",{},["Indicateurs clés"]),
    ...((chapters||[]).map(ch=>{
      const details = D.chapter_details?.[ch.id];
      const kicker = details?.kicker || ("Chapitre " + ch.id);
      return el("li",{},[`${kicker} — ${ch.title}`]);
    }))
  ]);

  const cover = el("section",{class:"print-cover"},[
    el("div",{class:"cover-inner"},[
      el("img",{class:"cover-logo", src:"assets/logo-koesio-ds.png", alt:"Koesio Data Solutions"}),
      el("div",{class:"cover-title"},["Mémo Paie 2026"]),
      el("div",{class:"cover-sub"},["Indicateurs & chapitres — Koesio Data Solutions"]),
      el("div",{class:"cover-meta"},[
        "Date de dernière mise à jour : ",
        el("strong",{},[String(asOf)])
      ]),
      el("div",{class:"cover-box"},[
        el("div",{class:"cover-box-title"},["Sommaire"]),
        tocList
      ]),
      el("div",{class:"cover-legal"},[LEGAL])
    ])
  ]);
  root.appendChild(cover);

  const top = el("div",{class:"print-top"},[
    el("div",{class:"print-brand"},[
      el("img",{class:"print-logo", src:"assets/logo-koesio-ds.png", alt:"Koesio Data Solutions"}),
      el("div",{},[
        el("div",{class:"print-title"},["Mémo Paie 2026 — Indicateurs & chapitres"]),
        el("div",{class:"print-sub"},["Koesio Data Solutions"])
      ])
    ]),
    el("div",{class:"print-meta"},[
      el("div",{},["Date de dernière mise à jour : ", el("strong",{},[String(asOf)])]),
      el("div",{style:"margin-top:6px"},[
        el("span",{class:"no-print"},["Astuce : dans la fenêtre d’impression, choisir “Enregistrer en PDF”."])
      ])
    ])
  ]);
  root.appendChild(top);

  root.appendChild(el("section",{class:"print-section"},[
    el("h2",{},["Indicateurs clés"]),
    buildKPIs(asOf)
  ]));

  for(const ch of (chapters || [])){
    root.appendChild(buildChapter(ch, asOf));
  }

  root.appendChild(el("div",{class:"print-legal"},[
    el("strong",{},["Protection juridique — "]),
    el("span",{},[LEGAL])
  ]));

  // Auto-open print dialog (user can cancel)
  setTimeout(()=>{ try{ window.print(); }catch(e){} }, 350);
})();
