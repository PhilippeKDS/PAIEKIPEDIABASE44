/* Module export PDF (addon) — isolé pour éviter de casser le simulateur en cas d'erreur. */
(() => {
  function $(id){ return document.getElementById(id); }

  function exportPdf(){
    const steps = $('drawerSteps');
    const rules = $('drawerRules');

    // Paramètres / saisies
    const year = $('year') ? $('year').value : '';
    const period = $('period') ? $('period').value : '';
    const pass = $('pass') ? $('pass').value : '';
    const capMode = $('capMode') ? ($('capMode').value || '') : '';
    const allowNeg = $('allowNegative') ? $('allowNegative').checked : false;

    const getVal = (id) => ($(id) ? ($(id).value || '') : '');
    const inputs = {
      rsoc: getVal('rsoc'),
      rfisc: getVal('rfisc'),
      ret_sal: getVal('ret_sal'),
      ret_pat: getVal('ret_pat'),
      ret_pereob_sal: getVal('ret_pereob_sal'),
      ret_pereob_pat: getVal('ret_pereob_pat'),
      ret_cet_to_ret: getVal('ret_cet_to_ret'),
      ret_abond_perco: getVal('ret_abond_perco'),
      ret_cet_ir_exempt: getVal('ret_cet_ir_exempt'),
      prev_sal: getVal('prev_sal'),
      prev_pat_hors_fs: getVal('prev_pat_hors_fs'),
      prev_pat_fs: getVal('prev_pat_fs'),
      prev_part_cse: getVal('prev_part_cse'),
      ytd_soc_done: getVal('ytdSocDone'),
      ytd_fisc_done: getVal('ytdFiscDone'),
      ytd_fisc_done_sal: getVal('ytdFiscDoneSal'),
      ytd_fisc_done_pat: getVal('ytdFiscDonePat')
    };

    // Récupère les contenus affichés dans les drawers (déjà formatés)
    const stepsHtml = steps ? steps.innerHTML : '';
    const rulesHtml = rules ? rules.innerHTML : '';

    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    const row = (k,v) => `<tr><td class="k">${esc(k)}</td><td class="v">${esc(v)}</td></tr>`;

    const w = window.open('', '_blank');
    if(!w){ alert("Impossible d'ouvrir la fenêtre d'impression (popup bloquée)."); return; }

    w.document.open();
    w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Export PDF — Réintégration sociale & fiscale</title>
      <style>
        :root{
          --violet:#6e398e; --coral:#ea4b58; --ink:#1f2430; --muted:#6b7280; --bg:#ffffff; --line:#e5e7eb;
        }
        *{box-sizing:border-box}
        body{font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:var(--ink); background:var(--bg); margin:24px}
        h1{font-size:18px; margin:0 0 6px}
        .sub{color:var(--muted); font-size:12px; margin-bottom:16px}
        .card{border:1px solid var(--line); border-radius:14px; padding:14px 16px; margin:12px 0}
        .card h2{font-size:14px; margin:0 0 10px; color:var(--violet)}
        table{width:100%; border-collapse:collapse; font-size:12px}
        td{padding:6px 8px; border-bottom:1px solid var(--line); vertical-align:top}
        td.k{width:42%; color:var(--muted)}
        .pill{display:inline-block; font-size:11px; padding:3px 8px; border-radius:999px; border:1px solid var(--line); color:var(--muted)}
        .page-break{break-before: page; page-break-before: always;}
        /* drawer content cleanup */
        .drawerSection h3{font-size:13px; margin:8px 0; color:var(--ink)}
        .drawerSection .muted{color:var(--muted)}
        @media print{
          body{margin:10mm}
          a{color:inherit; text-decoration:none}
        }
      </style></head><body>
        <h1>Réintégration sociale & fiscale — Export</h1>
        <div class="sub"><span class="pill">Année ${esc(year || '—')}</span>
          <span class="pill">Période ${esc(period || '—')}</span>
          <span class="pill">PASS ${esc(pass || '—')}</span>
          <span class="pill">Mode ${esc(capMode || '—')}</span>
          <span class="pill">Delta négatif ${allowNeg ? 'autorisé' : 'non'}</span>
        </div>

        <div class="card">
          <h2>Synthèse des saisies (cumul)</h2>
          <table>
            ${row('Rémunération sociale de référence (R_soc)', inputs.rsoc)}
            ${row('Rémunération fiscale de référence (R_fisc)', inputs.rfisc)}
            ${row('Retraite suppl. — cotisations salariales', inputs.ret_sal)}
            ${row('Retraite suppl. — cotisations employeur', inputs.ret_pat)}
            ${row('Retraite PERE-OB — part salariée', inputs.ret_pereob_sal)}
            ${row('Retraite PERE-OB — part employeur', inputs.ret_pereob_pat)}
            ${row('CET affecté retraite (Expert)', inputs.ret_cet_to_ret)}
            ${row('Abondement PERCO/PERE-CO (Expert)', inputs.ret_abond_perco)}
            ${row('Jours CET/repos exonérés IR (Expert)', inputs.ret_cet_ir_exempt)}
            ${row('Prévoyance — cotisations salariales', inputs.prev_sal)}
            ${row('Prévoyance — cotisations employeur hors frais de santé', inputs.prev_pat_hors_fs)}
            ${row('Frais de santé — part employeur', inputs.prev_pat_fs)}
            ${row('Participation CSE (Expert)', inputs.prev_part_cse)}
          </table>
        </div>

        <div class="card drawerSection">
          <h2>1) Détails de calcul</h2>
          ${stepsHtml || '<div class="muted">Détails indisponibles.</div>'}
        </div>

        <div class="page-break"></div>

        <div class="card drawerSection">
          <h2>2) Règles utilisées</h2>
          ${rulesHtml || '<div class="muted">Règles indisponibles.</div>'}
        </div>

        <div class="sub">Astuce : choisissez “Enregistrer en PDF” dans la boîte de dialogue d’impression.</div>
        <script>window.onload=()=>{setTimeout(()=>window.print(),250)};</script>
      </body></html>`);
    w.document.close();
  }

  window.KDS_Addons = window.KDS_Addons || {};
  window.KDS_Addons.exportPdf = exportPdf;
})();