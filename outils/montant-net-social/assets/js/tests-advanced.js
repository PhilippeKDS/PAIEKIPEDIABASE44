/**
 * Interface de tests avancés
 * Connecte l'UI avec le test suite et le test runner
 */
(() => {
  const nf = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmt = (x) => nf.format(x);
  
  const frame = document.getElementById('sim-frame');
  const tbody = document.getElementById('tests-body');
  const toastEl = document.getElementById('toast');
  const progressBar = document.getElementById('progress-bar');
  const progressContainer = document.getElementById('progress-container');
  
  let currentSummary = null;
  let filteredTests = [];
  
  const showToast = (msg) => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toastEl.classList.remove('show'), 2500);
  };
  
  // ═════════════════════════════════════════════════════════════════════════
  // INTERFACE SIMULATEUR (communication via iframe)
  // ═════════════════════════════════════════════════════════════════════════
  
  const waitFrame = () => new Promise((resolve) => {
    if (!frame) return resolve();
    if (frame.dataset.loaded === '1') return resolve();
    
    const onLoad = () => {
      frame.dataset.loaded = '1';
      resolve();
    };
    
    frame.addEventListener('load', onLoad, { once: true });
    setTimeout(() => resolve(), 2000);
  });
  
  const send = (type, payload = {}) => {
    const requestId = Math.random().toString(36).slice(2);
    return new Promise((resolve, reject) => {
      if (!frame || !frame.contentWindow) {
        return reject(new Error("Iframe simulateur indisponible"));
      }
      
      const onMsg = (ev) => {
        const d = ev.data;
        if (!d || d.requestId !== requestId) return;
        window.removeEventListener('message', onMsg);
        if (d.type === 'MNS_ERROR') reject(new Error(d.message || 'Erreur'));
        else resolve(d);
      };
      
      window.addEventListener('message', onMsg);
      
      try {
        frame.contentWindow.postMessage({ type, requestId, ...payload }, '*');
      } catch (e) {
        window.removeEventListener('message', onMsg);
        return reject(e);
      }
      
      setTimeout(() => {
        window.removeEventListener('message', onMsg);
        reject(new Error('Timeout'));
      }, 8000);
    });
  };
  
  const simulatorInterface = {
    calculate: async function(inputs) {
      await send('MNS_APPLY_STATE', { state: inputs });
      const res = await send('MNS_GET_RESULTS');
      const results = res.results || {};
      
      return {
        mns: results.mns_calcule || 0,
        socle: results.breakdown?.socle || 0,
        ajouts: (results.breakdown?.primesB || 0) + (results.breakdown?.hsB || 0),
        deductions: (results.breakdown?.mutB || 0) + (results.breakdown?.dedCsg || 0)
      };
    }
  };
  
  // ═════════════════════════════════════════════════════════════════════════
  // AFFICHAGE DES STATISTIQUES
  // ═════════════════════════════════════════════════════════════════════════
  
  const displayStats = () => {
    if (typeof MNS_TEST_SUITE === 'undefined') {
      console.error('MNS_TEST_SUITE non chargé');
      return;
    }
    
    const stats = MNS_TEST_SUITE.getTestStatistics();
    
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-general').textContent = stats.byType.cas_general || 0;
    document.getElementById('stat-particulier').textContent = stats.byType.cas_particulier || 0;
    document.getElementById('stat-categories').textContent = Object.keys(stats.byCategory).length;
  };
  
  // ═════════════════════════════════════════════════════════════════════════
  // FILTRAGE DES TESTS
  // ═════════════════════════════════════════════════════════════════════════
  
  const applyFilters = () => {
    const category = document.getElementById('filter-category').value;
    const type = document.getElementById('filter-type').value;
    
    filteredTests = MNS_TEST_SUITE.testCases.filter(test => {
      if (category && test.category !== category) return false;
      if (type && test.type_cas !== type) return false;
      return true;
    });
    
    document.getElementById('stat-total').textContent = filteredTests.length;
    showToast(`${filteredTests.length} test(s) sélectionné(s)`);
  };
  
  // ═════════════════════════════════════════════════════════════════════════
  // RENDU DES RÉSULTATS
  // ═════════════════════════════════════════════════════════════════════════
  
  const renderRow = (result) => {
    const icon = result.success ? '✅' : '❌';
    const statusClass = result.success ? 'pass' : 'fail';
    
    const categoryBadge = {
      'base': '🔵',
      'ajouts': '➕',
      'deductions': '➖',
      'boss_reference': '📚',
      'edge_cases': '⚠️'
    }[result.category] || '•';
    
    const description = MNS_TEST_SUITE.testCases.find(t => t.id === result.test_id)?.description || '';
    
    return `
      <tr class="${statusClass}">
        <td style="text-align:center; font-size:18px">${icon}</td>
        <td>
          <div style="font-weight:600; font-family:monospace; font-size:13px">${result.test_id}</div>
          <div style="font-size:11px; color:#666">${categoryBadge} ${result.category}</div>
        </td>
        <td>
          <div style="font-weight:600">${result.test_name}</div>
          ${description ? `<div style="font-size:12px; color:#666; margin-top:2px">${description}</div>` : ''}
          ${!result.success && result.issues && result.issues.length > 0 ? 
            `<div style="margin-top:4px; color:#e74c3c; font-size:12px">
              ${result.issues.map(issue => `⚠️ ${issue}`).join('<br>')}
            </div>` : ''}
        </td>
        <td class="right mono">${fmt(result.expected.mns)} €</td>
        <td class="right mono">${fmt(result.obtained.mns)} €</td>
        <td class="right mono ${result.deltas.mns > 0.01 ? 'bad' : ''}">${fmt(result.deltas.mns)} €</td>
        <td class="right" style="font-size:11px">${result.duration}ms</td>
      </tr>
    `;
  };
  
  const displayResults = (summary) => {
    currentSummary = summary;
    tbody.innerHTML = '';
    
    summary.all_results.forEach(result => {
      tbody.insertAdjacentHTML('beforeend', renderRow(result));
    });
    
    // Résumé
    const summaryEl = document.getElementById('results-summary');
    const successRate = parseFloat(summary.summary.success_rate);
    const statusClass = successRate === 100 ? 'ok' : successRate >= 80 ? 'warning' : 'bad';
    
    summaryEl.innerHTML = `
      <div class="note ${statusClass}">
        <b>Résultat :</b> ${summary.summary.passed}/${summary.summary.total} tests réussis 
        (${summary.summary.success_rate}%) en ${summary.summary.duration_sec}s
        ${summary.summary.failed > 0 ? 
          `<br><b>⚠️ ${summary.summary.failed} test(s) échoué(s)</b> - Vérifier le détail ci-dessous` : 
          `<br><b>✅ Tous les tests sont passés avec succès</b>`
        }
      </div>
    `;
    
    // Footer
    const footerEl = document.getElementById('tests-footer');
    footerEl.textContent = `Exécution terminée le ${new Date().toLocaleString('fr-FR')} • Durée totale: ${summary.summary.duration_sec}s`;
  };
  
  // ═════════════════════════════════════════════════════════════════════════
  // EXÉCUTION DES TESTS
  // ═════════════════════════════════════════════════════════════════════════
  
  const runAllTests = async () => {
    try {
      tbody.innerHTML = '';
      document.getElementById('results-summary').innerHTML = '';
      progressContainer.style.display = 'block';
      progressBar.style.width = '0%';
      
      showToast('Initialisation du simulateur...');
      await waitFrame();
      
      if (!frame || frame.dataset.loaded !== '1') {
        throw new Error("Le simulateur n'a pas pu être chargé dans l'iframe");
      }
      
      await new Promise(r => setTimeout(r, 50));
      await send('MNS_SET_PARAMS', { params: { threshold: 20, tauxCsg: 2.9 } });
      
      // Utiliser les tests filtrés ou tous les tests
      const testsToRun = filteredTests.length > 0 ? filteredTests : MNS_TEST_SUITE.testCases;
      showToast(`Exécution de ${testsToRun.length} test(s)...`);
      
      // Créer une version personnalisée du test suite avec seulement les tests filtrés
      const customTestSuite = {
        ...MNS_TEST_SUITE,
        testCases: testsToRun
      };
      
      // Exécuter avec suivi de progression
      let completed = 0;
      const originalRunSingle = MNS_TEST_RUNNER.runSingleTest.bind(MNS_TEST_RUNNER);
      MNS_TEST_RUNNER.runSingleTest = async function(test, suite, simInterface) {
        const result = await originalRunSingle(test, suite, simInterface);
        completed++;
        const progress = (completed / testsToRun.length) * 100;
        progressBar.style.width = `${progress}%`;
        return result;
      };
      
      const summary = await MNS_TEST_RUNNER.runAll(customTestSuite, simulatorInterface);
      
      // Restaurer la méthode originale
      MNS_TEST_RUNNER.runSingleTest = originalRunSingle;
      
      progressContainer.style.display = 'none';
      displayResults(summary);
      
      showToast(`Tests terminés : ${summary.summary.passed}/${summary.summary.total}`);
      
    } catch (e) {
      console.error(e);
      progressContainer.style.display = 'none';
      showToast('Erreur lors des tests');
      
      const summaryEl = document.getElementById('results-summary');
      summaryEl.innerHTML = `
        <div class="note bad">
          <b>❌ Impossible d'exécuter les tests</b><br>
          ${e.message || e}<br>
          <small>Conseil : Lancez le simulateur via une URL (http/https). 
          En local (file://), certains navigateurs restreignent les iframes.</small>
        </div>
      `;
    }
  };
  
  // ═════════════════════════════════════════════════════════════════════════
  // EXPORTS
  // ═════════════════════════════════════════════════════════════════════════
  
  const exportHTML = () => {
    if (!currentSummary) {
      showToast('Exécutez les tests avant d\'exporter');
      return;
    }
    
    const html = MNS_TEST_RUNNER.generateHTMLReport(currentSummary);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-tests-mns-${new Date().toISOString().slice(0,10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Rapport HTML téléchargé');
  };
  
  const exportJSON = () => {
    if (!currentSummary) {
      showToast('Exécutez les tests avant d\'exporter');
      return;
    }
    
    const json = MNS_TEST_RUNNER.generateJSONReport(currentSummary);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-tests-mns-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Rapport JSON téléchargé');
  };
  
  const exportCSV = () => {
    if (!currentSummary) {
      showToast('Exécutez les tests avant d\'exporter');
      return;
    }
    
    const csv = MNS_TEST_RUNNER.generateCSVReport(currentSummary);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-tests-mns-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Rapport CSV téléchargé');
  };
  
  const copyReport = async () => {
    if (!currentSummary) {
      showToast('Exécutez les tests avant de copier');
      return;
    }
    
    const txt = MNS_TEST_RUNNER.generateTextReport(currentSummary);
    
    try {
      await navigator.clipboard.writeText(txt);
      showToast('Rapport copié dans le presse-papier');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = txt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      showToast('Rapport copié');
    }
  };
  
  // ═════════════════════════════════════════════════════════════════════════
  // INITIALISATION
  // ═════════════════════════════════════════════════════════════════════════
  
  const init = () => {
    // Vérifier que les modules sont chargés
    if (typeof MNS_TEST_SUITE === 'undefined') {
      console.error('❌ MNS_TEST_SUITE non chargé');
      document.getElementById('results-summary').innerHTML = `
        <div class="note bad">
          <b>❌ Erreur de chargement</b><br>
          Le module MNS_TEST_SUITE n'est pas chargé. Vérifiez que test-suite.js est bien inclus.
        </div>
      `;
      return;
    }
    
    if (typeof MNS_TEST_RUNNER === 'undefined') {
      console.error('❌ MNS_TEST_RUNNER non chargé');
      document.getElementById('results-summary').innerHTML = `
        <div class="note bad">
          <b>❌ Erreur de chargement</b><br>
          Le module MNS_TEST_RUNNER n'est pas chargé. Vérifiez que test-runner.js est bien inclus.
        </div>
      `;
      return;
    }
    
    // Afficher les statistiques
    displayStats();
    
    // Initialiser les tests filtrés
    filteredTests = MNS_TEST_SUITE.testCases;
    
    // Événements
    document.getElementById('btn-run-tests')?.addEventListener('click', runAllTests);
    document.getElementById('btn-export-html')?.addEventListener('click', exportHTML);
    document.getElementById('btn-export-json')?.addEventListener('click', exportJSON);
    document.getElementById('btn-export-csv')?.addEventListener('click', exportCSV);
    document.getElementById('btn-copy-report')?.addEventListener('click', copyReport);
    document.getElementById('filter-category')?.addEventListener('change', applyFilters);
    document.getElementById('filter-type')?.addEventListener('change', applyFilters);
    
    console.log('✓ Interface de tests avancés initialisée');
    showToast('Prêt - Cliquez sur "Lancer les tests"');
  };
  
  // Attendre le chargement du DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
