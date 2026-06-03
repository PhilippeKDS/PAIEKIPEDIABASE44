/**
 * Bareme Paiekipédia — app.js — V2 « Linear Mosaic »
 * Drawer latéral : clic sur une carte chapitre → panneau glissant depuis la droite
 */
;(function () {
  'use strict';

  var CHAPTER_COLOR = {
    '1':'#6e398e','2':'#2b53a0','3':'#d97757','4':'#3fc0f0',
    '5':'#ffb800','6':'#13a538','7':'#1f6f8b','8':'#465ad0',
    '9':'#2c8c98','10':'#5fb55f','11':'#ea804b','12':'#c14a8c',
    '13':'#566075','14':'#946aab','15':'#a17e3b','16':'#7c5cff',
    '17':'#ea4b58','18':'#9b2c5d',
  };

  var CHAPTER_DATA = {
    '1':  { sourceName:'Légifrance',  sourceUrl:'https://www.legifrance.gouv.fr', simId:null,        params:[['SMIC horaire brut','12,02 €'],['SMIC mensuel 35h','1\u202f823,03 €'],['SMIC annuel','21\u202f876,36 €'],['Minimum garanti','4,30 €'],['SMIC mensuel 39h','2\u202f065,05 €'],['Revalorisation 01/01/2026','+1,18 %']] },
    '2':  { sourceName:'URSSAF',      sourceUrl:'https://www.urssaf.fr',          simId:null,        params:[['PMSS (mensuel)','4\u202f005 €'],['PASS (annuel)','48\u202f060 €'],['Plafond horaire SS','30 €'],['Plafond journalier SS','228 €'],['Plafond trimestriel SS','12\u202f015 €'],['Revalorisation 2026','+2,00 %']] },
    '3':  { sourceName:'BOSS',        sourceUrl:'https://boss.gouv.fr',           simId:null,        params:[['Repas fourni / repas','5,45 €'],['Chambre (< 65k€)','79,00 €/mois'],['Chambre (> 65k€)','158,00 €/mois'],['Abattement VE (AEN)','50 %'],['Bornes recharge VE','0 €'],['Avantage véhicule élec.','réd. 30 %']] },
    '4':  { sourceName:'BOSS',        sourceUrl:'https://boss.gouv.fr',           simId:null,        params:[['Repas déplacement site','10,00 €'],['Repas hors locaux','21,40 €'],['IK vélo / km','0,35 €'],['IK moto 5cv ≤ 3 000km','0,477 €'],['IK auto 4cv ≤ 5 000km','0,529 €'],['Nuitée + repas Province','70,40 €']] },
    '5':  { sourceName:'URSSAF',      sourceUrl:'https://www.urssaf.fr',          simId:'rgdu',      params:[['Sortie RGDU (3×SMIC mens.)','5\u202f469,09 €'],['Coef T < 50 salariés','0,3194'],['Coef T ≥ 50 salariés','0,3234'],['SMIC annuel réf.','21\u202f879,64 €'],['Coef T agri < 50','0,3194'],['Formule','(T/0,6)×(1,6×SMIC×12/rém.−1)']], formula:'Coef = (T / 0,6) × <hl>(</hl>1,6 × SMIC × 12 / rém. brute annuelle <hl>−</hl> 1<hl>)</hl>' },
    '6':  { sourceName:'Ameli',       sourceUrl:'https://www.ameli.fr',           simId:null,        params:[['IJ maladie (91e–360e j)','50 % du SJB plafonné'],['Plafond SJB maladie','81,86 €/j'],['IJ maternité','100 % du SJB'],['Plafond SJB maternité','100,36 €/j'],['IJ AT/MP','60 % j1-28 / 80 % j29+'],['Délai de carence maladie','3 jours']] },
    '7':  { sourceName:'URSSAF',      sourceUrl:'https://www.urssaf.fr',          simId:null,        params:[['Maladie patronal','7,00 %'],['Vieillesse plafonné','15,45 %'],['Chômage patronal','4,05 %'],['FNAL ≥ 50 salariés','0,50 %'],['CSG imposable','2,40 %'],['CSG/CRDS non imposable','2,90 %']] },
    '8':  { sourceName:'Légifrance',  sourceUrl:'https://www.legifrance.gouv.fr', simId:null,        params:[['Seuil taxe transport','11 salariés'],['Seuil participation','50 salariés'],['Seuil intéressement légal','1 salarié'],['Taxe apprentissage','0,68 %'],['Formation prof. < 11 sal.','0,55 %'],['Formation prof. ≥ 11 sal.','1,00 %']] },
    '9':  { sourceName:'Légifrance',  sourceUrl:'https://www.legifrance.gouv.fr', simId:'heures-supp',params:[['Durée légale hebdo','35 h'],['Durée mensuelle','151,67 h'],['Durée annuelle','1\u202f607 h'],['Majoration HS 25 %','36e–43e heure'],['Majoration HS 50 %','Au-delà 43e h.'],['Repos journalier','11 h consécutives']] },
    '10': { sourceName:'Service Public',sourceUrl:'https://www.service-public.fr',simId:null,        params:[['CP légaux annuels','25 j ouvrables'],['Congé maternité 1er enf.','16 semaines'],['Congé paternité','25 jours cal.'],['Décès conjoint','4 jours'],['Mariage / PACS','4 jours'],['Naissance / adoption','3 jours']] },
    '11': { sourceName:'URSSAF',      sourceUrl:'https://www.urssaf.fr',          simId:null,        params:[['DSN mensuelle','5 ou 15 du M+1'],['DSN annuelle < 10 sal.','31 janvier N+1'],['Déclaration AT','48 h (employeur)'],['DAT (embauche)','Avant le 1er jour'],['Solde IS grandes ent.','15 décembre'],['Arrêté comptes SA/SAS','6 mois après clôture']] },
    '12': { sourceName:'Légifrance',  sourceUrl:'https://www.legifrance.gouv.fr', simId:'saisie',    params:[['Quotité insaisissable','635,70 €/mois'],['Tranche ≤ 420 €','1/20e'],['Tranche 420–830 €','1/10e'],['Tranche 830–1 240 €','1/5e'],['Tranche 1 240–1 650 €','1/4e'],['Au-delà 3 620 €','Intégralement saisissable']] },
    '13': { sourceName:'BOSS',        sourceUrl:'https://boss.gouv.fr',           simId:null,        params:[['DFS taux standard','10 %'],['DFS plafond annuel','13\u202f522 €'],['PPV exonération SS','3\u202f000 € / 6\u202f000 €'],['Chèques cadeaux CE','200,25 €/an'],['Prime transport','500 €/an exo.'],['PPV avec accord intéressement','6\u202f000 €']] },
    '14': { sourceName:'DGFiP / BOFiP',sourceUrl:'https://www.impots.gouv.fr',   simId:'pas',       params:[['Taux nul (métropole)','Jusqu\'à 1\u202f583 €/mois'],['Taux bas','0,5 % → 4 %'],['Taux moyen','12 % → 22 %'],['Taux haut','jusqu\'à 43 %'],['Abattement 10 %','Min 481 € / Max 14\u202f171 €'],['Date application barème','01/05/2026']] },
    '15': { sourceName:'Service Public',sourceUrl:'https://www.service-public.fr',simId:null,        params:[['Jours fériés 2026','11 jours'],['1er janvier (jeudi)','01/01/2026'],['Fête du Travail (vendredi)','01/05/2026'],['8 mai (vendredi)','08/05/2026'],['14 juillet (mardi)','14/07/2026'],['Noël (vendredi)','25/12/2026']] },
    '16': { sourceName:'URSSAF',      sourceUrl:'https://www.urssaf.fr',          simId:null,        params:[['FS épargne salariale','20 %'],['FS PEE / PER entreprise','16 %'],['FS retraite supplémentaire','8 %'],['FS PERCO','16 %'],['Dispense FS < 50 sal.','0 % (exonéré)'],['FS prévoyance ≥ 11 sal.','8 %']] },
    '17': { sourceName:'Légifrance',  sourceUrl:'https://www.legifrance.gouv.fr', simId:'heures-supp',params:[['Exonération IR HS (plafond)','7\u202f500 €/an'],['Réduction salariale HS','11,31 % des rémun. HS'],['Déduction patronale < 20 sal.','1,50 €/h HS'],['Déduction patronale ≥ 20 sal.','0,50 €/h HS'],['Majoration légale HS','+25 % (36e–43e h.)'],['Contingent HS annuel','220 h/an']] },
    '18': { sourceName:'Légifrance',  sourceUrl:'https://www.legifrance.gouv.fr', simId:null,        params:[['Plafond exo. SS licenc.','2×PASS = 96\u202f120 €'],['Plafond exo. IR licenc.','87\u202f984 € (2×RR)'],['CSR seuil déclenchement','À partir du 1er €'],['Ancienneté requise IC','8 mois minimum'],['Préavis démission CDI','Convention collective'],['Indemnité légale de licenc.','1/4 mois/année (< 10 ans)']] },
  };

  var CHAPTERS = [
    {id:'1', num:'01',title:'Rémunération minimale',     desc:'SMIC 2026 et repères associés.',                                         source:'RFPaye',       count:8, icon:'salary',  variant:'big', pin:'À la une'},
    {id:'7', num:'05',title:'Cotisations & contributions',desc:'Tous les taux 2026 — santé, retraite, chômage, FNAL, CSG/CRDS.',        source:'URSSAF',       count:18,icon:'calc',    variant:'tall'},
    {id:'17',num:'03',title:'Heures supplémentaires',    desc:'Réduction salariale, exonération IR, déduction patronale.',              source:'RFPaye',       count:5, icon:'plus',    variant:'std', pin:'Nouv.'},
    {id:'5', num:'06',title:'Réduction générale (RGDU)', desc:'Paramètres, plafonds, formule et nouveautés 2026.',                      source:'URSSAF',       count:7, icon:'down',    variant:'std', pin:'Maj.'},
    {id:'2', num:'02',title:'Plafond Sécurité sociale',  desc:'PMSS, PASS, plafonds horaire, journalier et trimestriel.',               source:'URSSAF',       count:6, icon:'ceiling', variant:'feat'},
    {id:'3', num:'04',title:'Avantages en nature',       desc:'Nourriture, logement, véhicule, bornes & abattements VE.',               source:'BOSS',         count:12,icon:'home',    variant:'std'},
    {id:'4', num:'09',title:'Frais professionnels',      desc:'Petits/grands déplacements, IK, repas.',                                 source:'BOSS',         count:11,icon:'bag',     variant:'std'},
    {id:'6', num:'08',title:'Indemnités journalières',   desc:'Maladie, maternité/paternité/adoption, AT/MP.',                         source:'RFPaye',       count:9, icon:'med',     variant:'std'},
    {id:'9', num:'12',title:'Durée du travail',          desc:'Durées légales, limites, repos, majorations HS.',                       source:'Légifrance',   count:7, icon:'clock',   variant:'std'},
    {id:'10',num:'13',title:'Congés & absences',         desc:'CP, parental, événements familiaux.',                                   source:'RFPaye',       count:10,icon:'palm',    variant:'std'},
    {id:'8', num:'14',title:'Seuils & obligations',      desc:'Taxes/participations, seuils 11/50/250 salariés.',                      source:'Légifrance',   count:8, icon:'office',  variant:'std'},
    {id:'16',num:'07',title:'Forfait social',            desc:'Taux et contributions patronales spécifiques.',                         source:'URSSAF',       count:4, icon:'puzzle',  variant:'feat'},
    {id:'14',num:'10',title:'Prélèvement à la source',  desc:"Taux neutres (métropole) et repères d'application.",                    source:'RFPaye',       count:6, icon:'card',    variant:'std'},
    {id:'12',num:'11',title:'Saisies sur rémunération', desc:'Barème, fractions saisissables, quotité.',                               source:'Légifrance',   count:5, icon:'scale',   variant:'std'},
    {id:'11',num:'15',title:'Échéances & dates',         desc:'DSN, URSSAF, événementielle, DAT…',                                     source:'URSSAF',       count:12,icon:'calendar',variant:'std'},
    {id:'15',num:'16',title:'Calendrier 2026',           desc:'Jours fériés, ouvrés/ouvrables, vacances scolaires.',                   source:'Service Public',count:14,icon:'cal',    variant:'std'},
    {id:'18',num:'17',title:'Rupture du contrat',        desc:"Plafonds d'exonération SS & IR, CSR.",                                  source:'Légifrance',   count:6, icon:'doc',     variant:'std'},
    {id:'13',num:'18',title:'Autres évolutions 2026',    desc:'DFS (abattement frais pro) et rappels.',                               source:'BOSS',         count:4, icon:'balance', variant:'std'},
  ];

  function getKPIS(){
    var smicH    = fmtParamValue('smic.hourly');
    var smicM    = fmtParamValue('smic.monthly_35h');
    var smicMRaw = getParamValue('smic.monthly_35h') || 0;
    var revalo   = fmtParamValue('smic.revalo_note');
    var mg       = fmtParamValue('smic.minimum_guaranteed');
    var pmss     = fmtParamValue('pss.pmss');
    var pass     = fmtParamValue('pss.pass');
    var rgdu3val = (smicMRaw * 3).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2});
    return [
      {label:'SMIC horaire',       value:smicH,            unit:'',  trend:revalo,     source:'L\u00e9gifrance', color:'#6e398e'},
      {label:'SMIC mensuel 35h',   value:smicM,            unit:'',  trend:revalo,     source:'L\u00e9gifrance', color:'#6e398e'},
      {label:'Minimum garanti',    value:mg,               unit:'',  trend:null,       source:'L\u00e9gifrance', color:'#ea4b58'},
      {label:'PMSS',               value:pmss,             unit:'',  trend:'+2,00\u202f%', source:'URSSAF',   color:'#2b53a0'},
      {label:'PASS',               value:pass,             unit:'',  trend:'+2,00\u202f%', source:'URSSAF',   color:'#2b53a0'},
      {label:'Plafond horaire SS', value:'30\u202f\u20ac', unit:'', trend:'+2,00\u202f%', source:'URSSAF',  color:'#2b53a0'},
      {label:'Restauration site',  value:'5,45\u202f\u20ac',unit:'',trend:'+1,5\u202f%',  source:'BOSS',    color:'#d97757'},
      {label:'Plafond TR exon\u00e9r\u00e9', value:'8,13\u202f\u20ac',unit:'',trend:'stable',source:'BOSS',color:'#13a538'},
      {label:'Sortie RGDU 3\u00d7SMIC', value:rgdu3val+'\u202f\u20ac',unit:'',trend:null,source:'URSSAF',  color:'#ffb800'},
      {label:'Dur\u00e9e hebdo',   value:'35\u202fh',     unit:'',  trend:'stable',   source:'L\u00e9gifrance', color:'#1f6f8b'},
      {label:'Dur\u00e9e mensuelle',value:'151,67\u202fh',unit:'',  trend:'stable',   source:'L\u00e9gifrance', color:'#1f6f8b'},
      {label:'Dur\u00e9e annuelle', value:'1\u202f607\u202fh',unit:'',trend:'stable',source:'L\u00e9gifrance', color:'#1f6f8b'},
    ];
  }

  /* ─── Icônes ─── */
  function ico(name,size){
    size=size||18;
    var p='width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
    var s={
      salary:'<circle cx="12" cy="12" r="9"/><path d="M15 8.5c-.8-1-2-1.5-3-1.5-1.6 0-3 .8-3 2.2 0 1.4 1.3 1.9 3 2.3 1.7.4 3 .9 3 2.3 0 1.4-1.4 2.2-3 2.2-1.2 0-2.4-.5-3.2-1.5M12 5v2M12 17v2"/>',
      ceiling:'<path d="M3 8h18M5 8v12h14V8M9 8V4h6v4"/>',
      plus:'<path d="M12 4v16M4 12h16"/>',
      home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/>',
      calc:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M16 15h0M8 19h2M12 19h6"/>',
      down:'<path d="M4 7l8 8 8-8M4 14l8 8 8-8" opacity=".4"/><path d="M4 7l8 8 8-8"/>',
      puzzle:'<path d="M10 4a2 2 0 1 1 4 0v2h4v4a2 2 0 1 0 0 4v4h-4v-2a2 2 0 1 1-4 0v2H6v-4a2 2 0 1 0 0-4V6h4z"/>',
      med:'<path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z"/>',
      bag:'<path d="M5 8h14l-1 12H6zM9 8V5a3 3 0 1 1 6 0v3"/>',
      card:'<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/>',
      scale:'<path d="M12 3v18M5 6l-3 7c0 1.7 1.3 3 3 3s3-1.3 3-3l-3-7zM19 6l-3 7c0 1.7 1.3 3 3 3s3-1.3 3-3l-3-7zM4 21h16"/>',
      clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      palm:'<path d="M12 22V10M12 10c-3-3-7-2-7-2 0 4 3 6 7 6M12 10c3-3 7-2 7-2 0 4-3 6-7 6M12 10c0-3-2-5-2-5 0 0 4-1 5 2M12 10c0-3 2-5 2-5"/>',
      office:'<path d="M4 21V5h10v16M14 11h6v10M8 9h2M8 13h2M8 17h2M17 14h0M17 17h0"/>',
      calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
      cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M7 14h2M11 14h2M15 14h2M7 17h2M11 17h2"/>',
      doc:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4"/>',
      balance:'<path d="M12 3v18M3 21h18M6 6l-3 7c0 1.7 1.3 3 3 3s3-1.3 3-3l-3-7zM18 6l-3 7c0 1.7 1.3 3 3 3s3-1.3 3-3l-3-7zM6 6l6-2 6 2"/>',
      search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
      arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
      close:'<path d="M18 6 6 18M6 6l12 12"/>',
      link:'<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
      sim:'<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    };
    return '<svg '+p+'>'+(s[name]||s.salary)+'</svg>';
  }

  /* ─── Sparkline ─── */
  function spark(color,w,h){
    color=color||'#0f7a2a';w=w||90;h=h||30;
    var pts=[4,9,6,12,9,15,13,18,17,20,22].map(function(y,i){return(i*(w/10))+','+(h-y);}).join(' L ');
    var id='sg'+w+h;
    return '<svg width="'+w+'" height="'+h+'"><defs><linearGradient id="'+id+'" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="'+color+'" stop-opacity=".35"/><stop offset="100%" stop-color="'+color+'" stop-opacity="0"/></linearGradient></defs><path d="M 0 '+h+' L '+pts+' L '+w+' '+h+' Z" fill="url(#'+id+')"/><polyline points="'+pts+'" fill="none" stroke="'+color+'" stroke-width="1.8"/></svg>';
  }

  function darker(hex){
    var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
    return '#'+[Math.max(0,r-40),Math.max(0,g-40),Math.max(0,b-40)].map(function(v){return v.toString(16).padStart(2,'0');}).join('');
  }

  /* ═══════════════════════════════════════════
     DRAWER LATÉRAL
  ═══════════════════════════════════════════ */
  var _overlay, _drawer, _activeId=null;

  function setupDrawer(){
    _overlay=document.createElement('div');
    _overlay.id='pk-overlay';
    _overlay.style.cssText='position:fixed;inset:0;z-index:200;background:rgba(19,21,28,.5);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);opacity:0;pointer-events:none;transition:opacity .3s';
    document.body.appendChild(_overlay);

    _drawer=document.createElement('aside');
    _drawer.id='pk-drawer';
    _drawer.setAttribute('role','dialog');
    _drawer.setAttribute('aria-modal','true');
    _drawer.style.cssText='position:fixed;top:0;right:0;bottom:0;width:min(540px,96vw);z-index:201;background:#fbfaf7;color:#13151c;display:flex;flex-direction:column;transform:translateX(105%);transition:transform .38s cubic-bezier(.2,.7,.3,1);overflow:hidden;box-shadow:-16px 0 48px rgba(19,21,28,.18);border-left:1px solid rgba(19,21,28,.10)';
    _drawer.innerHTML='<div id="pk-drawer-scroll" style="height:100%;overflow-y:auto;overscroll-behavior:contain;display:flex;flex-direction:column;background:#fbfaf7"></div>';
    document.body.appendChild(_drawer);

    _overlay.addEventListener('click',closeDrawer);
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&_activeId)closeDrawer();});
  }

  function showRgduPopup(){
    if(typeof sessionStorage !== 'undefined'){
      try{ if(sessionStorage.getItem('kds_rgdu_popup_gel_smic_juin2026_dismissed')) return; }catch(e){}
    }
    var existing = document.getElementById('rgduInfoOverlay');
    if(existing) return;
    var overlay = document.createElement('div');
    overlay.id = 'rgduInfoOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;font-family:inherit';
    var box = document.createElement('div');
    box.style.cssText = 'background:#fff;border-radius:10px;padding:28px 32px;max-width:520px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,.22);position:relative';
    box.innerHTML = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;"><span style="font-size:24px;">\u26a0\ufe0f</span><strong style="font-size:16px;color:#b45309;">Information importante \u2014 RGDU juin 2026</strong></div>'
      +'<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#1e293b;">Le ministre de l\'Action et des comptes publics a annonc\u00e9 le <strong>22 mai 2026</strong> que la hausse du SMIC au 1er juin 2026 (<strong>12,31\u202f\u20ac/h</strong>) <u>ne sera pas r\u00e9percut\u00e9e</u> sur le calcul des all\u00e8gements g\u00e9n\u00e9raux (RGDU).</p>'
      +'<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#1e293b;">Le coefficient de r\u00e9duction continue \u00e0 se calculer en fonction du <strong>SMIC en vigueur au 1er janvier 2026 (12,02\u202f\u20ac)</strong>. Un d\u00e9cret officialisant ce gel est attendu.</p>'
      +'<p style="margin:0 0 18px;font-size:13px;color:#64748b;font-style:italic;">Ce simulateur utilise le SMIC de janvier 2026 (12,02\u202f\u20ac) pour le calcul RGDU, conform\u00e9ment \u00e0 l\'annonce minist\u00e9rielle.</p>'
      +'<div style="text-align:right;"><button id="rgduPopupClose" style="background:#0f4c81;color:#fff;border:none;border-radius:6px;padding:9px 22px;font-size:14px;cursor:pointer;font-weight:600;">J\'ai compris</button></div>';
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    function closePopup(){
      try{ sessionStorage.setItem('kds_rgdu_popup_gel_smic_juin2026_dismissed','1'); }catch(e){}
      overlay.remove();
    }
    document.getElementById('rgduPopupClose').addEventListener('click', closePopup);
    overlay.addEventListener('click', function(e){ if(e.target===overlay) closePopup(); });
    document.addEventListener('keydown', function onEsc(e){ if(e.key==='Escape'){ closePopup(); document.removeEventListener('keydown',onEsc); }});
  }

  function openDrawer(id){
    var ch=CHAPTERS.find(function(c){return c.id===id;});
    if(!ch)return;
    if(id==='5') showRgduPopup();
    _activeId=id;
    fillDrawer(ch);
    _overlay.style.opacity='1';_overlay.style.pointerEvents='auto';
    requestAnimationFrame(function(){_drawer.style.transform='translateX(0)';});
    document.body.style.overflow='hidden';
    // Highlight carte active
    document.querySelectorAll('#ch-grid .ch').forEach(function(c){
      c.style.boxShadow=c.dataset.id===id?'0 0 0 2px rgba(255,255,255,.6)':'';
    });
    setTimeout(function(){var b=_drawer.querySelector('.pk-close');if(b)b.focus();},380);
  }

  function closeDrawer(){
    _overlay.style.opacity='0';_overlay.style.pointerEvents='none';
    _drawer.style.transform='translateX(105%)';
    document.body.style.overflow='';
    document.querySelectorAll('#ch-grid .ch').forEach(function(c){c.style.boxShadow='';});
    _activeId=null;
  }

  /* ═══════════════════════════════════════════
     RESOLVER PARAMS data.js
  ═══════════════════════════════════════════ */
  function getParamValue(id){
    var p = window.MEMO_DATA && window.MEMO_DATA.parameters && window.MEMO_DATA.parameters[id];
    if(!p) return null;
    // Priorité : date du sélecteur > default_as_of > aujourd'hui
    var selInput = document.getElementById('vs2-date-input');
    var selVal = selInput && selInput.value ? selInput.value : null;
    var asOfStr = selVal || (window.MEMO_DATA.meta && window.MEMO_DATA.meta.default_as_of) || new Date().toISOString().slice(0,10);
    var asOf = new Date(asOfStr);
    var versions = (p.versions||[]).slice().sort(function(a,b){return new Date(a.from)-new Date(b.from);});
    var chosen = versions.length ? versions[0].value : null;
    for(var i=0;i<versions.length;i++){
      if(new Date(versions[i].from) <= asOf) chosen = versions[i].value;
    }
    return chosen;
  }

  function getParamValueAt(id, isoDate){
    // Résout un paramètre à une date précise (pour les tableaux historiques asOf)
    var p = window.MEMO_DATA && window.MEMO_DATA.parameters && window.MEMO_DATA.parameters[id];
    if(!p) return null;
    var asOf = new Date(isoDate);
    var versions = (p.versions||[]).slice().sort(function(a,b){return new Date(a.from)-new Date(b.from);});
    var chosen = versions.length ? versions[0].value : null;
    for(var i=0;i<versions.length;i++){
      if(new Date(versions[i].from) <= asOf) chosen = versions[i].value;
    }
    return chosen;
  }

  function fmtParamValueAt(id, isoDate){
    var p = window.MEMO_DATA && window.MEMO_DATA.parameters && window.MEMO_DATA.parameters[id];
    if(!p) return '—';
    var val = getParamValueAt(id, isoDate);
    if(val === null || val === undefined) return '—';
    if(typeof val === 'string') return val;
    var unit = p.unit||'';
    var formatted;
    if(Number.isInteger(val)){
      formatted = val.toLocaleString('fr-FR');
    } else {
      formatted = val.toLocaleString('fr-FR', {minimumFractionDigits:0, maximumFractionDigits:2});
    }
    return unit ? formatted + '\u202f' + unit : formatted;
  }

  function fmtParamValue(id){
    var p = window.MEMO_DATA && window.MEMO_DATA.parameters && window.MEMO_DATA.parameters[id];
    if(!p) return '—';
    var val = getParamValue(id);
    if(val === null || val === undefined) return '—';
    if(typeof val === 'string') return val;
    var unit = p.unit||'';
    // Formatage français des nombres
    var formatted;
    if(Number.isInteger(val)){
      formatted = val.toLocaleString('fr-FR');
    } else {
      // Arrondir à 2 décimales max mais trim les zéros inutiles
      formatted = val.toLocaleString('fr-FR', {minimumFractionDigits:0, maximumFractionDigits:2});
    }
    return unit ? formatted + '\u202f' + unit : formatted;
  }

  function resolveCell(cell){
    if(cell === null || cell === undefined) return '';
    if(typeof cell === 'string') return cell;
    if(typeof cell === 'number') return String(cell);
    if(cell.param) return cell.asOf ? fmtParamValueAt(cell.param, cell.asOf) : fmtParamValue(cell.param);
    if(cell.template && cell.params){
      var out = cell.template;
      for(var k in cell.params){
        var val = typeof cell.params[k] === 'string'
          ? fmtParamValue(cell.params[k])
          : String(cell.params[k]);
        out = out.replace('{'+k+'}', val);
      }
      return out;
    }
    if(cell.templates && cell.params){
      // Résoudre chaque template et joindre
      return cell.templates.map(function(tpl){
        var out = tpl.template || tpl;
        if(tpl.params) for(var k in tpl.params){ out = out.replace('{'+k+'}', fmtParamValue(tpl.params[k])); }
        else if(cell.params) for(var k in cell.params){ out = out.replace('{'+k+'}', fmtParamValue(cell.params[k])); }
        return out;
      }).join('<br>');
    }
    return JSON.stringify(cell);
  }

  /* ═══════════════════════════════════════════
     RENDERERS DE BLOCS
  ═══════════════════════════════════════════ */
  var _blockCount = 0;

  function renderBlockTable(block){
    var cols = block.columns || [];
    var rows = block.rows || [];
    var html = '<div class="dk-block">';
    if(block.title) html += '<div class="dk-block-title">'+esc(block.title)+'</div>';
    html += '<table class="dk-table"><thead><tr>'
      + cols.map(function(c){return '<th>'+esc(c)+'</th>';}).join('')
      + '</tr></thead><tbody>';
    rows.forEach(function(row){
      html += '<tr>';
      row.forEach(function(cell, ci){
        var val = resolveCell(cell);
        var isNum = ci > 0 && val && /^[\d\s,\.€%]+$/.test(val.trim());
        html += '<td'+(isNum?' class="dk-num"':'')+'>'+(val||'—')+'</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  function renderBlockNote(block){
    var text = block.text || (block.textParam ? (fmtParamValue(block.textParam)||'') : '');
    var html = '<div class="dk-note">';
    if(block.title && block.title !== 'Note') html += '<div class="dk-note-title">'+esc(block.title)+'</div>';
    html += '<div class="dk-note-text">'+esc(text)+'</div>';
    html += '</div>';
    return html;
  }

  function renderBlockList(block){
    var items = block.items || [];
    if(block.itemsParam){
      var raw = getParamValue(block.itemsParam);
      if(Array.isArray(raw)) items = raw;
    }
    var html = '<div class="dk-block">';
    if(block.title) html += '<div class="dk-block-title">'+esc(block.title)+'</div>';
    html += '<ul class="dk-list">'
      + items.map(function(it){ return '<li>'+esc(typeof it==='string'?it:JSON.stringify(it))+'</li>'; }).join('')
      + '</ul></div>';
    return html;
  }

  function renderBlockLinks(block){
    var items = block.items || [];
    var html = '<div class="dk-block">';
    if(block.title) html += '<div class="dk-block-title">'+esc(block.title)+'</div>';
    html += '<div class="dk-links">'
      + items.map(function(it){
          var href = '#';
          if(it.target && it.target.startsWith('sim:')) href = '../outils/'+it.target.replace('sim:','')+'/index.html';
          else if(it.target && it.target.startsWith('chapter:')) href = '#ch-'+it.target.replace('chapter:','');
          return '<a class="dk-link" href="'+href+'" '+(href!='#'?'target="_blank"':'')+'>'+(it.label||it)+'</a>';
        }).join('')
      + '</div></div>';
    return html;
  }

  function renderBlockCta(block){
    var simMap = {rgdu:'rgdu','heures-supp':'heures-supp','garnish':'saisie','ik':'ik'};
    var html = '<div class="dk-cta-wrap">';
    html += '<button class="dk-cta-btn" data-sim="'+(simMap[block.target]||block.target||'')+'">'+esc(block.label||'Ouvrir le simulateur')+' →</button>';
    html += '</div>';
    return html;
  }

  function renderBlockAlert(block){
    var level = block.level || 'info';
    var colors = {
      info:    {bg:'rgba(63,192,240,.08)',  border:'rgba(63,192,240,.25)',  text:'#1f6f8b'},
      warning: {bg:'rgba(255,184,0,.10)',   border:'rgba(255,184,0,.35)',   text:'#7a5800'},
      error:   {bg:'rgba(232,75,87,.08)',   border:'rgba(232,75,87,.30)',   text:'#c03040'},
    };
    var col = colors[level] || colors.info;
    var html = '<div class="dk-block" style="background:'+col.bg+';border-color:'+col.border+'">';
    if(block.title) html += '<div class="dk-block-title" style="color:'+col.text+'">'+esc(block.title)+'</div>';
    html += '<div class="dk-note-text" style="color:'+col.text+';font-size:13px;line-height:1.55">'+esc(block.text||'')+'</div>';
    html += '</div>';
    return html;
  }

  function renderBlock(block){
    switch(block.type){
      case 'table':              return renderBlockTable(block);
      case 'note':               return renderBlockNote(block);
      case 'list':               return renderBlockList(block);
      case 'links':              return renderBlockLinks(block);
      case 'cta':                return renderBlockCta(block);
      case 'block':              return renderBlockNote(block); // fallback
      case 'alert':              return renderBlockAlert(block);
      // custom types — rendu simplifié
      case 'custom_logement':
      case 'custom_tr_examples':
      case 'custom_events':
      case 'custom_garnish_bareme':
      case 'custom_pas_grid':
      case 'custom_pas_calculator': return '<div class="dk-custom-hint">'+ico('sim',14)+' Contenu interactif disponible dans le simulateur dédié.</div>';
      default: return '';
    }
  }

  /* ═══════════════════════════════════════════
     ESCAPE HTML
  ═══════════════════════════════════════════ */
  function esc(str){
    if(typeof str !== 'string') return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ═══════════════════════════════════════════
     INJECT DRAWER STYLES
  ═══════════════════════════════════════════ */
  function injectDrawerStyles(){
    if(document.getElementById('pk-drawer-css')) return;
    var s = document.createElement('style');
    s.id = 'pk-drawer-css';
    s.textContent = [
      /* Blocs */
      '.dk-block{padding:14px;border-radius:14px;background:#fff;border:1px solid rgba(19,21,28,.08)}',
      '.dk-block-title{font-size:13px;font-weight:700;color:#13151c;margin-bottom:10px;letter-spacing:-.01em;line-height:1.3}',
      /* Tables */
      '.dk-table{width:100%;border-collapse:collapse;font-size:13px}',
      '.dk-table th{text-align:left;font-weight:600;color:#6b6f7a;padding:7px 8px;border-bottom:2px solid rgba(19,21,28,.08);font-size:11px;letter-spacing:.06em;text-transform:uppercase;background:rgba(110,57,142,.04)}',
      '.dk-table td{padding:9px 8px;border-bottom:1px solid rgba(19,21,28,.05);vertical-align:top;color:#13151c;line-height:1.45}',
      '.dk-table tr:last-child td{border-bottom:0}',
      '.dk-table tr:hover td{background:rgba(110,57,142,.03)}',
      '.dk-num{font-family:"JetBrains Mono",monospace;font-weight:600;text-align:right!important;white-space:nowrap;color:#13151c}',
      /* Notes */
      '.dk-note{padding:12px 14px;border-radius:12px;background:#fff8f0;border-left:3px solid #ffb800}',
      '.dk-note-title{font-size:12px;font-weight:700;color:#8a6f1d;margin-bottom:6px;letter-spacing:.04em;text-transform:uppercase}',
      '.dk-note-text{font-size:13px;color:#5a4a14;line-height:1.55}',
      /* Lists */
      '.dk-list{margin:0;padding:0 0 0 16px;display:flex;flex-direction:column;gap:6px}',
      '.dk-list li{font-size:13px;color:#3a3e4a;line-height:1.5}',
      /* Links */
      '.dk-links{display:flex;flex-direction:column;gap:6px}',
      '.dk-link{display:block;padding:9px 12px;border-radius:10px;background:rgba(110,57,142,.06);border:1px solid rgba(110,57,142,.12);color:#6e398e;font-size:13px;font-weight:600;text-decoration:none;transition:background .15s}',
      '.dk-link:hover{background:rgba(110,57,142,.12)}',
      /* CTA */
      '.dk-cta-wrap{padding:4px 0}',
      '.dk-cta-btn{width:100%;height:40px;border-radius:12px;border:0;background:#ffd61e;color:#0b0c12;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:filter .15s}',
      '.dk-cta-btn:hover{filter:brightness(.95)}',
      /* Custom hint */
      '.dk-custom-hint{padding:10px 14px;border-radius:10px;background:rgba(63,192,240,.08);border:1px solid rgba(63,192,240,.18);font-size:13px;color:#1f6f8b;display:flex;align-items:center;gap:8px}',
      /* Source footer */
      '.dk-source{font-size:11px;color:#9499a6;padding-top:8px;border-top:1px solid rgba(19,21,28,.07);line-height:1.5}',
      '.dk-source b{color:#6b6f7a}',
    ].join('');
    document.head.appendChild(s);
  }

  /* ═══════════════════════════════════════════
     FILL DRAWER — lit data.js
  ═══════════════════════════════════════════ */
  function fillDrawer(ch){
    var c = CHAPTER_COLOR[ch.id]||'#6e398e';
    // Lire le contenu depuis MEMO_DATA si disponible
    var chData = window.MEMO_DATA && window.MEMO_DATA.chapter_details && window.MEMO_DATA.chapter_details[ch.id];
    var blocks  = (chData && chData.blocks) || [];
    var source  = (chData && chData.source) || ch.source || '';

    // Simulateur lié
    var simTargets = {
      '5':'rgdu','9':'heures-supp','17':'heures-supp',
      '12':'saisie','14':'pas','4':'ik'
    };
    var simId = simTargets[ch.id] || null;

    // Construire le HTML du body
    var blocksHTML = blocks.map(renderBlock).join('');

    // Source footer
    var sourceHTML = source
      ? '<div class="dk-source"><b>Source :</b> '+esc(source)+'</div>'
      : '';

    var inner = _drawer.querySelector('#pk-drawer-scroll');
    inner.innerHTML =
      // Header coloré
      '<div style="flex-shrink:0;background:linear-gradient(140deg,'+c+','+darker(c)+');padding:20px 22px 18px;position:relative;overflow:hidden">'
      +'<div style="position:absolute;right:-30px;top:-30px;width:150px;height:150px;border-radius:50%;background:rgba(255,255,255,.1);pointer-events:none"></div>'
      +'<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">'
        +'<div style="flex:1;min-width:0">'
          +'<div style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.65);font-weight:700;font-family:\'JetBrains Mono\',monospace">CHAPITRE '+esc(ch.num)+'</div>'
          +'<div style="font-size:21px;font-weight:700;letter-spacing:-.02em;color:#fff;line-height:1.2;margin-top:5px">'+esc(ch.title)+'</div>'
          +'<div style="font-size:13px;color:rgba(255,255,255,.75);margin-top:6px;line-height:1.4">'+esc(ch.desc)+'</div>'
        +'</div>'
        +'<button class="pk-close" aria-label="Fermer" style="flex-shrink:0;width:32px;height:32px;border-radius:9px;border:0;background:rgba(255,255,255,.18);color:#fff;cursor:pointer;display:grid;place-items:center;backdrop-filter:blur(4px)">'+ico('close',15)+'</button>'
      +'</div>'
      +'<div style="display:flex;gap:7px;margin-top:12px;flex-wrap:wrap">'
        +'<span style="padding:4px 10px;border-radius:7px;background:rgba(255,255,255,.18);font-size:10px;color:#fff;font-weight:700;letter-spacing:.06em">'+esc(ch.source)+'</span>'
        +'<span style="padding:4px 10px;border-radius:7px;background:rgba(255,255,255,.18);font-size:10px;color:#fff;font-weight:700">'+ch.count+' paramètres</span>'
        +(simId ? '<span style="padding:4px 10px;border-radius:7px;background:rgba(255,255,255,.18);font-size:10px;color:#fff;font-weight:700">Simulateur disponible</span>' : '')
      +'</div>'
      +'</div>'
      // Body — blocs réels depuis data.js
      +'<div style="flex:1;padding:16px;display:flex;flex-direction:column;gap:12px">'
        +(blocksHTML || '<div class="dk-note"><div class="dk-note-text">Contenu à venir.</div></div>')
        +sourceHTML
        // Bouton simuler si applicable
        +(simId ? '<button class="pk-sim-btn" data-sim="'+simId+'" style="margin-top:4px;height:44px;border-radius:12px;border:0;background:#ffd61e;color:#0b0c12;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;transition:filter .15s">'+ico('sim',15)+' Lancer le simulateur</button>' : '')
      +'</div>';

    // Events
    inner.querySelector('.pk-close').addEventListener('click', closeDrawer);

    // Bouton favori dans le drawer — état initial + toggle
    var favToggle = inner.querySelector('.pk-fav-toggle');
    if(favToggle){
      var isFavNow = getFavs().has(ch.id);
      favToggle.style.color = isFavNow ? '#ffd61e' : 'rgba(255,255,255,.6)';
      favToggle.style.background = isFavNow ? 'rgba(255,214,30,.25)' : 'rgba(255,255,255,.18)';
      favToggle.title = isFavNow ? 'Retirer des favoris' : 'Ajouter aux favoris';
      favToggle.addEventListener('click', function(){
        toggleFav(ch.id);
        var nowFav = getFavs().has(ch.id);
        favToggle.style.color = nowFav ? '#ffd61e' : 'rgba(255,255,255,.6)';
        favToggle.style.background = nowFav ? 'rgba(255,214,30,.25)' : 'rgba(255,255,255,.18)';
        favToggle.title = nowFav ? 'Retirer des favoris' : 'Ajouter aux favoris';
      });
    }
    // CTAs depuis les blocs
    inner.querySelectorAll('[data-sim]').forEach(function(btn){
      btn.addEventListener('click', function(){ navigateSim(btn.dataset.sim); });
    });
  }


  function navigateSim(id){
    var map={rgdu:'../outils/rgdu/index.html','heures-supp':'../outils/hs/index.html',saisie:'../outils/saisie/index.html',pas:'../outils/pas/index.html'};
    try{window.location.href=map[id]||'#';}catch(e){}
  }

  /* ─── Ticker ─── */
  function buildTicker(){
    var t=document.getElementById('ticker-track');if(!t)return;
    var kpis=getKPIS();var items=kpis.concat(kpis);
    t.innerHTML=items.map(function(k){
      return '<div class="tk"><span class="dot" style="background:'+k.color+'"></span><span class="lbl">'+k.label+'</span><span class="val num">'+k.value+' '+k.unit+'</span><span class="d'+(k.trend==='stable'?' flat':'')+'">'+k.trend+'</span></div>';
    }).join('');
  }

  /* ─── Essentiels ─── */
  function buildEss(){
    var g=document.getElementById('ess-grid');if(!g)return;
    var sp=spark('#5fe07b',180,50);
    // Valeurs dynamiques depuis MEMO_DATA.parameters
    var smicH  = fmtParamValue('smic.hourly');
    var smicM  = fmtParamValue('smic.monthly_35h');
    var revalo = fmtParamValue('smic.revalo_note');
    var mg     = fmtParamValue('smic.minimum_guaranteed');
    var pmss   = fmtParamValue('pss.pmss');
    var pass   = fmtParamValue('pss.pass');
    var smicMRaw = getParamValue('smic.monthly_35h');
    var smicMShort = smicMRaw ? Math.round(smicMRaw).toLocaleString('fr-FR') : smicM;
    var smicMVal = getParamValue('smic.monthly_35h') || 0;
    var rgdu3 = (smicMVal * 3).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+'\u202f\u20ac';
    var big='<div class="esscell big" tabindex="0" role="button" data-chapter="1">'
      +'<div class="acc"></div>'
      +'<div class="l"><span>SMIC mensuel 35h \u00b7 2026</span><span class="src">L\u00e9gifrance</span></div>'
      +'<div class="v num">'+smicMShort+'<span class="u">\u202f\u20ac</span></div>'
      +'<div class="delta"><span class="b">'+revalo+'</span></div>'
      +'<div class="sp">'+sp+'</div>'
      +'</div>';
    var wides=[
      {l:'PMSS',v:pmss,d:'+2,00\u202f%',n:'Plafond mensuel SS',ch:'2'},
      {l:'PASS',v:pass,d:'+2,00\u202f%',n:'Plafond annuel SS',ch:'2'},
    ].map(function(x){return'<div class="esscell wide" tabindex="0" role="button" data-chapter="'+x.ch+'"><div class="l"><span>'+x.l+'</span><span class="src">URSSAF</span></div><div class="v num">'+x.v+'</div><div class="delta"><span class="b">'+x.d+'</span><span class="n">'+x.n+'</span></div></div>';}).join('');
    var cells=[
      {l:'SMIC horaire',   src:'L\u00e9gifrance', v:smicH,              d:revalo,          ch:'1'},
      {l:'RGDU 3\u00d7SMIC',  src:'URSSAF',        v:rgdu3,              d:null,            ch:'5'},
      {l:'Plaf. TR exo.',  src:'BOSS',             v:'8,13\u202f\u20ac', d:'stable',        ch:'13'},
      {l:'Restau. site',   src:'BOSS',             v:'5,45\u202f\u20ac', d:'+1,5\u202f%',   ch:'4'},
      {l:'Dur\u00e9e hebdo',   src:'L.',           v:'35\u202fh',         d:'stable',        ch:'9'},
      {l:'Dur\u00e9e mensuelle',src:'L.',           v:'151,67\u202fh',    d:null,            ch:'9'},
      {l:'Dur\u00e9e annuelle', src:'L.',           v:'1\u202f607\u202fh', d:null,           ch:'9'},
      {l:'Min. garanti',   src:'L\u00e9gifrance', v:mg,                  d:null,            ch:'1'},
    ].map(function(x){
      var dh=x.d?'<div class="delta"><span class="b'+(x.d==='stable'?' flat':'')+'">'+x.d+'</span></div>':'';
      return'<div class="esscell cell" tabindex="0" role="button" data-chapter="'+x.ch+'"><div class="l"><span>'+x.l+'</span><span class="src">'+x.src+'</span></div><div class="v num">'+x.v+'</div>'+dh+'</div>';
    }).join('');
    g.innerHTML=big+wides+cells;
    g.querySelectorAll('[data-chapter]').forEach(function(el){
      el.addEventListener('click',function(){openDrawer(el.dataset.chapter);});
      el.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();openDrawer(el.dataset.chapter);}});
    });
  }

  /* ─── Chapitres ─── */
  function chCard(ch){
    var c=CHAPTER_COLOR[ch.id]||'#6e398e';
    var cls='ch'+(ch.variant&&ch.variant!=='std'?' '+ch.variant:'');
    var pin=ch.pin?'<span class="pin">'+ch.pin+'</span>':'';
    var extra='';
    if(ch.id==='1'){var _sh=fmtParamValue('smic.hourly');var _smRaw=getParamValue('smic.monthly_35h');var _sm=_smRaw?Math.round(_smRaw).toLocaleString('fr-FR'):'—';var _rv=fmtParamValue('smic.revalo_note');extra='<div class="extra"><div class="stat">SMIC h.<b>'+_sh+'</b></div><div class="stat">SMIC m.<b>'+_sm+'\u202f€</b></div><div class="stat">Revalo<b>'+_rv+'</b></div></div>';}
    else if(ch.id==='7')  extra='<div class="mini"><div class="r"><span>Maladie patr.</span><b>7,00\u202f%</b></div><div class="r"><span>Vieillesse pl.</span><b>15,45\u202f%</b></div><div class="r"><span>FNAL\u202f≥50</span><b>0,50\u202f%</b></div><div class="r"><span>CSG/CRDS</span><b>9,70\u202f%</b></div></div>';
    else if(ch.id==='2')  extra='<div class="extra"><div class="stat">PMSS<b>4\u202f005\u202f€</b></div><div class="stat">PASS<b>48\u202f060\u202f€</b></div><div class="stat">Plaf.\u00a0h.<b>30\u202f€</b></div></div>';
    else if(ch.id==='16') extra='<div class="extra"><div class="stat">Épargne<b>20\u202f%</b></div><div class="stat">PEE/PER<b>16\u202f%</b></div><div class="stat">Retraite<b>8\u202f%</b></div></div>';
    else extra='<div class="ft"><span>'+ch.source+'</span><span>'+ch.count+' param. →</span></div>';
    var isFav=getFavs().has(ch.id);
    // Pin placé dans .top pour éviter le chevauchement avec l'icône
    var topLeft = pin
      ? '<div class="top-left">'+pin+'<div class="num">CHAP '+ch.num+'</div></div>'
      : '<div class="num">CHAP '+ch.num+'</div>';
    return'<div class="'+cls+'" style="--c:'+c+'" data-id="'+ch.id+'" role="button" tabindex="0" aria-label="'+ch.title+'">'
      +'<div class="top">'+topLeft+'<div class="ic">'+ico(ch.icon,20)+'</div></div>'
      +'<div class="body"><div class="ttl">'+ch.title+'</div><div class="ds">'+ch.desc+'</div>'+extra+'</div>'
      +'<button class="fav-btn'+(isFav?' active':'')+'" data-fav="'+ch.id+'" aria-label="'+(isFav?'Retirer des':'Ajouter aux')+' favoris" title="Favori">★</button>'
      +'</div>';
  }

  function getFavs(){try{return new Set(JSON.parse(localStorage.getItem('pk_favs')||'[]'));}catch(e){return new Set();}}
  function saveFavs(set){try{localStorage.setItem('pk_favs',JSON.stringify([...set]));}catch(e){}}
  function toggleFav(id){
    var favs=getFavs();
    if(favs.has(id))favs.delete(id);else favs.add(id);
    saveFavs(favs);
    // Mettre à jour le bouton dans la carte sans re-render
    var btn=document.querySelector('.ch[data-id="'+id+'"] .fav-btn');
    if(btn){
      var active=favs.has(id);
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-label',(active?'Retirer des':'Ajouter aux')+' favoris');
    }
    // Si on est sur le filtre favoris, retirer la carte
    var activeSeg=document.querySelector('.seg button.active');
    if(activeSeg&&activeSeg.dataset.filter==='fav') buildCh('fav');
  }

  function buildCh(filter){
    var g=document.getElementById('ch-grid');if(!g)return;
    var list=CHAPTERS;
    if(filter==='fav')list=list.filter(function(c){return getFavs().has(c.id);});
    else if(filter==='new')list=list.filter(function(c){return c.pin==='Nouv.'||c.pin==='Maj.';});
    else if(filter&&filter!=='all')list=list.filter(function(c){return c.source===filter;});
    g.innerHTML=list.length?list.map(chCard).join(''):'<div style="grid-column:span 12;padding:48px;text-align:center;color:var(--muted);font-size:14px">Aucun chapitre pour ce filtre.</div>';
    g.classList.remove('stagger');void g.offsetWidth;g.classList.add('stagger');
    g.querySelectorAll('.ch').forEach(function(card){
      card.addEventListener('click',function(e){
        // Clic sur le bouton étoile : toggle favori, ne pas ouvrir drawer
        if(e.target.closest('.fav-btn')){
          e.stopPropagation();
          toggleFav(card.dataset.id);
          return;
        }
        openDrawer(card.dataset.id);
      });
      card.addEventListener('keydown',function(e){
        if(e.key==='Enter'||e.key===' '){e.preventDefault();openDrawer(card.dataset.id);}
      });
    });
  }

  /* ─── Simulators ─── */
  function buildSims(){
    var g=document.getElementById('sim-grid');if(!g)return;
    var feat='<div class="sim feat" tabindex="0" role="button"><div class="l"><span>Simulateur · RGDU 2026</span><span class="tag">★ Populaire</span></div><div class="tt">Réduction générale des cotisations</div><div class="form"><div class="fld"><label>Salaire brut mensuel</label><div class="fake">2\u202f350,00 <span class="u">€</span></div></div><div class="fld"><label>Effectif</label><div class="fake">≥ 50 salariés <span class="u">▾</span></div></div><div class="fld"><label>Heures travaillées</label><div class="fake">151,67 <span class="u">h</span></div></div><div class="fld"><label>Régime</label><div class="fake">Général <span class="u">▾</span></div></div></div><div class="res"><div><div class="lab">Réduction patronale</div><div class="val">−438,17 €</div></div><span class="delta-chip">Coef 0,1864</span></div><div class="bot"><span class="ghosted">Mis à jour le 11/02/2026 · Coef T 0,3234</span><button id="sim-rgdu-cta" style="padding:10px 16px;border-radius:10px;background:var(--ink);color:#fff;font-size:12px;font-weight:700;border:0;display:inline-flex;gap:8px;align-items:center;cursor:pointer;font-family:inherit">Lancer le simulateur '+ico('arrow',14)+'</button></div></div>';
    var stds=[
      {cls:'dim',tag:'URSSAF',title:'Montant Net Social',        desc:"Calcul selon arrêté du 31/01/2023 — exonérations, primes, intéressement.",          meta:'6 champs · 2 min'},
      {cls:'',   tag:'RFPaye',title:'Heures supplémentaires',    desc:'Réduction salariale, exonération IR et déduction patronale 2026.',                   meta:'4 champs · 1 min'},
      {cls:'',   tag:'Légifrance',title:'Saisie sur rémunération',desc:'Barème 2026, charges déductibles, quotités saisissables.',                          meta:'5 champs · 2 min'},
      {cls:'',   tag:'BOSS',  title:'Réintégration excédents',   desc:'Excédents de prévoyance, retraite supplémentaire — recalcul automatique.',            meta:'7 champs · 3 min'},
      {cls:'',   tag:'Koesio',title:'Stage de masse salariale',  desc:"Projections annuelles, comparaison N−1/N+1, allègements.",                           meta:'9 champs · 4 min'},
    ].map(function(s){return'<div class="sim '+s.cls+'" tabindex="0" role="button" aria-label="'+s.title+'"><div class="l"><span>Simulateur</span><span class="tag">'+s.tag+'</span></div><div class="tt">'+s.title+'</div><div class="ds">'+s.desc+'</div><div class="ft"><span class="meta">'+s.meta+'</span><span class="go">Lancer</span></div></div>';}).join('');
    g.innerHTML=feat+stds;
    var cta=document.getElementById('sim-rgdu-cta');
    if(cta)cta.addEventListener('click',function(){showRgduPopup();navigateSim('rgdu');});
  }

  /* ─── Panels latéraux ─── */
  function buildPanels(){
    var u=document.getElementById('side-updates');
    if(u)[['SMIC 2026 publié','11/02'],['PMSS 2026 confirmé','04/02'],['Forfait social · taux','28/01'],['BOSS · AEN MAJ','22/01'],['DGFiP · taux neutres','15/01']].forEach(function(r){u.insertAdjacentHTML('beforeend','<div class="row"><span>'+r[0]+'</span><span class="v">'+r[1]+'</span></div>');});
    var s=document.getElementById('side-simulateurs');
    if(s)['RGDU','Montant Net Social','Réintégration excédents','Saisies sur salaire','Heures supp.'].forEach(function(l){s.insertAdjacentHTML('beforeend','<div class="row"><span>'+l+'</span><span class="v up">Lancer →</span></div>');});
    var dp=document.getElementById('drawer-params');
    if(dp)[['Sortie RGDU (3×SMIC mens.)','5\u202f469,09\u202f€'],['Coef T · < 50 sal.','0,3194'],['Coef T · ≥ 50 sal.','0,3234'],['SMIC annuel réf.','21\u202f879,64\u202f€'],['Coef T agri < 50','0,3194']].forEach(function(r){dp.insertAdjacentHTML('beforeend','<tr><td>'+r[0]+'</td><td>'+r[1]+'</td></tr>');});
  }

  /* ─── Nav ─── */
  function buildNav(){
    var el=document.getElementById('nav-sync-label');if(!el)return;
    try{if(typeof PARAMS!=='undefined'&&PARAMS.version){el.textContent='Sync · '+PARAMS.version;return;}}catch(e){}
    el.textContent='Sync · 11 fév. 2026, 09:14';
  }

  /* ─── Search ─── */
  function doSearch(q){
    if(!q)return;
    var lq=q.toLowerCase(),found=false;
    var cards=document.querySelectorAll('#ch-grid .ch');
    for(var i=0;i<cards.length;i++){
      if(cards[i].innerText.toLowerCase().indexOf(lq)!==-1){
        openDrawer(cards[i].dataset.id);found=true;
        cards[i].scrollIntoView({behavior:'smooth',block:'center'});
        break;
      }
    }
    if(!found){
      document.querySelectorAll('#ess-grid [data-chapter]').forEach(function(el){
        if(!found&&el.innerText.toLowerCase().indexOf(lq)!==-1){
          found=true;el.scrollIntoView({behavior:'smooth',block:'center'});
          el.style.outline='2px solid var(--b1)';
          setTimeout(function(){el.style.outline='';},2500);
        }
      });
    }
  }

  /* ─── Events globaux ─── */
  function attachEvents(){
    var btn=document.getElementById('search-btn'),inp=document.getElementById('search-input');
    if(btn&&inp){btn.addEventListener('click',function(){doSearch(inp.value.trim());});inp.addEventListener('keydown',function(e){if(e.key==='Enter')doSearch(inp.value.trim());});}
    document.addEventListener('keydown',function(e){if((e.metaKey||e.ctrlKey)&&e.key==='k'||e.key==='K'){e.preventDefault();if(inp){inp.focus();inp.select();}}});
    document.querySelectorAll('.quick .q').forEach(function(b){b.addEventListener('click',function(){var q=b.dataset.search;if(inp)inp.value=q;doSearch(q);});});
    document.querySelectorAll('.seg button').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll('.seg button').forEach(function(x){x.classList.remove('active');});b.classList.add('active');buildCh(b.dataset.filter);});});
    var bs=document.getElementById('btn-source-urssaf'),bsim=document.getElementById('btn-simuler-drawer'),brgdu=document.getElementById('btn-rgdu');
    if(bs)bs.addEventListener('click',function(){window.open('https://www.urssaf.fr','_blank');});
    if(bsim)bsim.addEventListener('click',function(){navigateSim('rgdu');});
    if(brgdu)brgdu.addEventListener('click',function(){showRgduPopup();navigateSim('rgdu');});
  }

  /* ─── Boot ─── */
  function init(){
    injectDrawerStyles();
    setupDrawer();
    buildNav();
    buildTicker();
    buildEss();
    buildCh('all');
    buildSims();
    buildPanels();
    attachEvents();
    // Exposer refresh() globalement pour le sélecteur de date
    window.refresh = function(){
      buildTicker();
      buildEss();
      buildCh('all');
      // Mettre à jour hero-date
      var selInput = document.getElementById('vs2-date-input');
      var val = selInput && selInput.value ? selInput.value : (window.MEMO_DATA.meta && window.MEMO_DATA.meta.default_as_of);
      var el = document.getElementById('hero-date');
      if(el && val){
        var p = val.split('-');
        var months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
        el.textContent = parseInt(p[2],10) + ' ' + months[parseInt(p[1],10)-1] + ' ' + p[0];
      }
    };
    // Init hero-date avec la date de référence
    window.refresh();
    console.info('[PaieKipédia] V2 — drawer latéral actif.');
  }

  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}
})();
