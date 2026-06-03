/**
 * PaieKipédia — edit-mode.js
 * Mode édition protégé pour reforme/data.js et veille/data.js
 *
 * Déverrouillage :
 *   - Séquence de touches : K → D → S (dans les 2 secondes)
 *   - URL parameter : ?edit=KDS2026
 *   - Code saisi dans la modale si aucune des deux ci-dessus
 */
(function () {
  'use strict';

  const EDIT_CODE = 'KDS2026';
  const SEQ = ['k', 'd', 's'];
  let seqBuf = [], seqTimer = null;
  let editUnlocked = false;

  // ── Déverrouillage URL param ──────────────────────────────────────────────
  if (new URLSearchParams(location.search).get('edit') === EDIT_CODE) {
    unlock();
  }

  // ── Déverrouillage séquence clavier ──────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    if (editUnlocked) return;
    const k = e.key.toLowerCase();
    if (SEQ.includes(k)) {
      clearTimeout(seqTimer);
      seqBuf.push(k);
      seqTimer = setTimeout(() => { seqBuf = []; }, 2000);
      if (seqBuf.join('') === SEQ.join('')) {
        seqBuf = [];
        unlock();
      }
    } else {
      seqBuf = [];
    }
  });

  // ── Déverrouillage ────────────────────────────────────────────────────────
  function unlock() {
    if (editUnlocked) return;
    editUnlocked = true;
    sessionStorage.setItem('kds_edit', '1');
    showEditBar();
  }

  function showEditBar() {
    const bar = document.createElement('div');
    bar.id = 'kds-edit-bar';
    bar.innerHTML = `
      <span>✏️ Mode édition actif</span>
      <button id="kds-edit-add" type="button">＋ Ajouter une fiche</button>
      <button id="kds-edit-export" type="button">⬇ Exporter JSON</button>
      <button id="kds-edit-quit" type="button">✕ Quitter</button>
    `;
    document.body.insertBefore(bar, document.body.firstChild);

    document.getElementById('kds-edit-add').onclick = openAddForm;
    document.getElementById('kds-edit-export').onclick = exportData;
    document.getElementById('kds-edit-quit').onclick = function () {
      sessionStorage.removeItem('kds_edit');
      bar.remove();
      editUnlocked = false;
      document.querySelectorAll('[data-kds-edit]').forEach(el => el.remove());
    };

    // Ajouter les boutons modifier/supprimer sur les éléments existants
    activateEditButtons();
  }

  // ── Boutons Modifier / Supprimer sur les éléments ────────────────────────
  function activateEditButtons() {
    // Délégation : surveiller les clics sur les items (REFORMS ou VEILLE_DATA)
    document.addEventListener('click', function (e) {
      if (!editUnlocked) return;
      const editBtn = e.target.closest('[data-kds-edit-id]');
      if (!editBtn) return;
      const id = editBtn.dataset.kdsEditId;
      const action = editBtn.dataset.kdsEditAction;
      if (action === 'edit') openEditForm(id);
      if (action === 'delete') confirmDelete(id);
    });
  }

  // ── Formulaire Ajouter / Modifier ────────────────────────────────────────
  function detectMode() {
    if (typeof window.REFORMES_DATA !== 'undefined') return 'reforme';
    if (typeof window.VEILLE_DATA !== 'undefined') return 'veille';
    return null;
  }

  function getData() {
    const m = detectMode();
    return m === 'reforme' ? window.REFORMES_DATA : window.VEILLE_DATA;
  }

  function openAddForm() { openForm(null); }
  function openEditForm(id) {
    const item = getData().find(x => x.id === id);
    if (item) openForm(item);
  }

  function openForm(item) {
    const mode = detectMode();
    const isEdit = !!item;
    const overlay = document.createElement('div');
    overlay.id = 'kds-form-overlay';

    const fields = mode === 'reforme'
      ? reformeFields(item)
      : veilleFields(item);

    overlay.innerHTML = `
      <div id="kds-form-box">
        <h2>${isEdit ? 'Modifier' : 'Nouvelle'} fiche</h2>
        <form id="kds-form-inner">
          ${fields}
          <div class="kds-form-btns">
            <button type="submit" class="kds-btn-primary">${isEdit ? 'Enregistrer' : 'Ajouter'}</button>
            <button type="button" id="kds-form-cancel">Annuler</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('kds-form-cancel').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    document.getElementById('kds-form-inner').onsubmit = function (e) {
      e.preventDefault();
      const data = collectForm(mode);
      saveItem(data, isEdit);
      overlay.remove();
    };
  }

  function reformeFields(item) {
    const v = item || {};
    const statuts = ['avenir','cours','traite','archive'];
    return `
      <label>ID (snake-case) <input name="id" value="${v.id||''}" ${item?'readonly':''} required placeholder="ex: smic-juin2027"/></label>
      <label>Titre <input name="titre" value="${esc(v.titre||'')}" required /></label>
      <label>Statut <select name="statut">${statuts.map(s=>`<option value="${s}" ${v.statut===s?'selected':''}>${s}</option>`).join('')}</select></label>
      <label>Date d'effet <input name="dateEffet" type="date" value="${v.dateEffet||''}" /></label>
      <label>Tags (séparés par virgule) <input name="tags" value="${(v.tags||[]).join(', ')}" /></label>
      <label>Source — texte <input name="sourceTxt" value="${esc((v.source||{}).texte||'')}" /></label>
      <label>Source — URL <input name="sourceUrl" value="${(v.source||{}).url||''}" placeholder="https://..." /></label>
      <label>Sage — analyse <textarea name="sage_analyse">${esc((v.impacts||{}).sage?.analyse||'')}</textarea></label>
      <label>Sage — action <select name="sage_action"><option value="needed" ${((v.impacts||{}).sage?.action)==='needed'?'selected':''}>⚠️ needed</option><option value="ok" ${((v.impacts||{}).sage?.action)==='ok'?'selected':''}>✅ ok</option><option value="na" ${((v.impacts||{}).sage?.action)==='na'?'selected':''}>— na</option></select></label>
      <label>Silae — analyse <textarea name="silae_analyse">${esc((v.impacts||{}).silae?.analyse||'')}</textarea></label>
      <label>Silae — action <select name="silae_action"><option value="needed" ${((v.impacts||{}).silae?.action)==='needed'?'selected':''}>⚠️ needed</option><option value="ok" ${((v.impacts||{}).silae?.action)==='ok'?'selected':''}>✅ ok</option><option value="na" ${((v.impacts||{}).silae?.action)==='na'?'selected':''}>— na</option></select></label>
      <label>Lucca — analyse <textarea name="lucca_analyse">${esc((v.impacts||{}).lucca?.analyse||'')}</textarea></label>
      <label>Lucca — action <select name="lucca_action"><option value="needed" ${((v.impacts||{}).lucca?.action)==='needed'?'selected':''}>⚠️ needed</option><option value="ok" ${((v.impacts||{}).lucca?.action)==='ok'?'selected':''}>✅ ok</option><option value="na" ${((v.impacts||{}).lucca?.action)==='na'?'selected':''}>— na</option></select></label>
      <label>Date campagne KDS <input name="campagne_date" type="date" value="${(v.campagne||{}).date||''}" /></label>
      <label>Note client (URL) <input name="campagne_note" value="${(v.campagne||{}).noteClient||''}" placeholder="https://..." /></label>
    `;
  }

  function veilleFields(item) {
    const v = item || {};
    return `
      <label>ID <input name="id" value="${v.id||''}" ${item?'readonly':''} required placeholder="ex: pub-smic-juin2027"/></label>
      <label>Titre <input name="titre" value="${esc(v.titre||'')}" required /></label>
      <label>Date de publication <input name="datePublication" type="date" value="${v.datePublication||''}" /></label>
      <label>Résumé <textarea name="resume">${esc(v.resume||'')}</textarea></label>
      <label>Texte intégral <textarea name="texteIntegral" rows="6">${esc(v.texteIntegral||'')}</textarea></label>
      <label>Thèmes (séparés par virgule) <input name="themes" value="${(v.themes||[]).join(', ')}" /></label>
      <label>Logiciels (séparés par virgule) <input name="logiciels" value="${(v.logiciels||[]).join(', ')}" /></label>
      <label>Source <input name="source" value="${esc(v.source||'')}" /></label>
      <label>Lien Teams (URL) <input name="lienTeams" value="${v.lienTeams||''}" placeholder="https://..." /></label>
      <label>ID réforme liée <input name="reformeId" value="${v.reformeId||''}" placeholder="ex: smic-juin2027"/></label>
    `;
  }

  function collectForm(mode) {
    const f = document.getElementById('kds-form-inner');
    const g = name => f.elements[name]?.value.trim() || null;
    const arr = name => (g(name)||'').split(',').map(s=>s.trim()).filter(Boolean);

    if (mode === 'reforme') {
      return {
        id:        g('id'),
        titre:     g('titre'),
        statut:    g('statut'),
        dateEffet: g('dateEffet'),
        tags:      arr('tags'),
        source:    { texte: g('sourceTxt'), url: g('sourceUrl') },
        impacts: {
          sage:  { analyse: g('sage_analyse'),  action: g('sage_action')  },
          silae: { analyse: g('silae_analyse'), action: g('silae_action') },
          lucca: { analyse: g('lucca_analyse'), action: g('lucca_action') },
        },
        campagne: { date: g('campagne_date'), docKDS: null, noteClient: g('campagne_note') },
      };
    } else {
      return {
        id:             g('id'),
        titre:          g('titre'),
        datePublication:g('datePublication'),
        resume:         g('resume'),
        texteIntegral:  g('texteIntegral'),
        themes:         arr('themes'),
        logiciels:      arr('logiciels'),
        source:         g('source'),
        lienTeams:      g('lienTeams'),
        reformeId:      g('reformeId'),
      };
    }
  }

  function saveItem(newItem, isEdit) {
    const arr = getData();
    if (isEdit) {
      const idx = arr.findIndex(x => x.id === newItem.id);
      if (idx >= 0) arr[idx] = newItem;
    } else {
      arr.unshift(newItem);
    }
    // Sauvegarder en localStorage pour persistance
    const key = detectMode() === 'reforme' ? 'kds_reformes_edits' : 'kds_veille_edits';
    try { localStorage.setItem(key, JSON.stringify(arr)); } catch(e) {}
    // Recharger la vue si possible
    if (typeof window.renderAll === 'function') window.renderAll();
    else if (typeof window.refresh === 'function') window.refresh();
    else location.reload();
  }

  // ── Supprimer ─────────────────────────────────────────────────────────────
  function confirmDelete(id) {
    if (!confirm('Supprimer la fiche "' + id + '" ?\nCette action ne modifie pas data.js — utilisez Export JSON pour pérenniser.')) return;
    const arr = getData();
    const idx = arr.findIndex(x => x.id === id);
    if (idx >= 0) arr.splice(idx, 1);
    const key = detectMode() === 'reforme' ? 'kds_reformes_edits' : 'kds_veille_edits';
    try { localStorage.setItem(key, JSON.stringify(arr)); } catch(e) {}
    if (typeof window.renderAll === 'function') window.renderAll();
    else location.reload();
  }

  // ── Export JSON ───────────────────────────────────────────────────────────
  function exportData() {
    const arr = getData();
    const mode = detectMode();
    const varName = mode === 'reforme' ? 'REFORMES_DATA' : 'VEILLE_DATA';
    const header = mode === 'reforme'
      ? '/* PaieKipédia — reforme/data.js — REMPLACER le fichier existant */\nvar REFORMES_DATA = '
      : '/* PaieKipédia — veille/data.js — REMPLACER le fichier existant */\nvar VEILLE_DATA = ';
    const content = header + JSON.stringify(arr, null, 2) + ';\n';
    const blob = new Blob([content], { type: 'text/javascript' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = mode === 'reforme' ? 'reforme_data_export.js' : 'veille_data_export.js';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ── CSS ───────────────────────────────────────────────────────────────────
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }

  const style = document.createElement('style');
  style.textContent = `
    #kds-edit-bar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
      background: #1a1a2e; color: #fff;
      display: flex; align-items: center; gap: 12px;
      padding: 8px 16px; font-size: 13px; font-family: sans-serif;
      box-shadow: 0 2px 12px rgba(0,0,0,.4);
    }
    #kds-edit-bar span { flex: 1; font-weight: 600; }
    #kds-edit-bar button {
      padding: 5px 14px; border-radius: 6px; border: none;
      font-size: 12px; font-weight: 600; cursor: pointer;
    }
    #kds-edit-add    { background: #6e398e; color: #fff; }
    #kds-edit-export { background: #185fa5; color: #fff; }
    #kds-edit-quit   { background: rgba(255,255,255,.15); color: #fff; }
    body.kds-edit-active { padding-top: 42px; }

    #kds-form-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.6);
      z-index: 999999; display: flex; align-items: center; justify-content: center;
      overflow-y: auto; padding: 20px;
    }
    #kds-form-box {
      background: #fff; border-radius: 12px; padding: 28px 32px;
      max-width: 620px; width: 100%; max-height: 90vh; overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,.3);
    }
    #kds-form-box h2 { margin: 0 0 20px; font-size: 18px; color: #1a1a2e; }
    #kds-form-inner label {
      display: block; margin-bottom: 12px;
      font-size: 12px; font-weight: 600; color: #555;
    }
    #kds-form-inner input,
    #kds-form-inner select,
    #kds-form-inner textarea {
      display: block; width: 100%; margin-top: 3px;
      padding: 7px 10px; border: 1px solid #d0d0d0; border-radius: 6px;
      font-size: 13px; font-family: sans-serif;
    }
    #kds-form-inner textarea { resize: vertical; min-height: 60px; }
    .kds-form-btns { display: flex; gap: 10px; margin-top: 20px; }
    .kds-btn-primary { background: #6e398e; color: #fff; padding: 9px 20px; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; }
    #kds-form-cancel { background: #f0f0f0; color: #333; padding: 9px 20px; border: none; border-radius: 7px; font-size: 13px; cursor: pointer; }
  `;
  document.head.appendChild(style);

  // ── Restaurer depuis localStorage si déjà édité ──────────────────────────
  function restoreEdits() {
    const mode = detectMode();
    if (!mode) return;
    const key = mode === 'reforme' ? 'kds_reformes_edits' : 'kds_veille_edits';
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const arr = JSON.parse(saved);
        if (mode === 'reforme') window.REFORMES_DATA = arr;
        else window.VEILLE_DATA = arr;
      }
    } catch(e) {}
  }

  // Restaurer au chargement
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restoreEdits);
  } else {
    restoreEdits();
  }

  // Exposer pour usage externe
  window.KDS_EDIT = { unlock, openAddForm, openEditForm, confirmDelete, exportData };

})();
