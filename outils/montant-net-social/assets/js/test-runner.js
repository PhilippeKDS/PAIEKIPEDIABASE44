/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TEST RUNNER AVANCÉ
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Moteur d'exécution automatique des tests avec :
 * - Exécution séquentielle et parallèle
 * - Reporting détaillé (JSON, CSV, HTML, TXT)
 * - Historique des exécutions
 * - Détection de régressions
 * - Export des résultats
 * 
 * Version : 1.0.0
 * Date : 2026-02-11
 */

const MNS_TEST_RUNNER = {
  
  // ═════════════════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═════════════════════════════════════════════════════════════════════════
  
  config: {
    timeout: 8000,           // Timeout par test (ms)
    retryFailed: false,      // Ré-essayer les tests échoués
    stopOnFirstFailure: false, // Arrêter à la première erreur
    verbose: true            // Affichage détaillé
  },
  
  // État de l'exécution
  state: {
    running: false,
    currentTest: null,
    results: [],
    startTime: null,
    endTime: null
  },
  
  // Historique (stockage local)
  history: [],
  
  // ═════════════════════════════════════════════════════════════════════════
  // EXÉCUTION DES TESTS
  // ═════════════════════════════════════════════════════════════════════════
  
  runAll: async function(testSuite, simulatorInterface) {
    if (this.state.running) {
      throw new Error('Une exécution de tests est déjà en cours');
    }
    
    this.state.running = true;
    this.state.startTime = Date.now();
    this.state.results = [];
    
    const tests = testSuite.testCases;
    
    console.log('');
    console.log('🧪 Démarrage de l\'exécution des tests...');
    console.log(`   ${tests.length} test(s) à exécuter`);
    console.log('');
    
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      this.state.currentTest = test;
      
      if (this.config.verbose) {
        console.log(`[${i + 1}/${tests.length}] ${test.id} - ${test.name}...`);
      }
      
      try {
        const result = await this.runSingleTest(test, testSuite, simulatorInterface);
        this.state.results.push(result);
        
        if (!result.success && this.config.stopOnFirstFailure) {
          console.log('⛔ Arrêt sur première erreur');
          break;
        }
      } catch (error) {
        console.error(`❌ Erreur test ${test.id}:`, error);
        this.state.results.push({
          test_id: test.id,
          test_name: test.name,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    this.state.endTime = Date.now();
    this.state.running = false;
    
    const summary = this.generateSummary();
    this.saveToHistory(summary);
    
    return summary;
  },
  
  runSingleTest: async function(test, testSuite, simulatorInterface) {
    const startTime = Date.now();
    
    // Préparer les inputs avec valeurs par défaut
    const fullInputs = this.prepareInputs(test.inputs);
    
    // Calculer les valeurs attendues
    const expected = testSuite.calcExpected(fullInputs);
    
    // Exécuter via l'interface simulateur
    let obtained;
    try {
      obtained = await simulatorInterface.calculate(fullInputs);
    } catch (error) {
      return {
        test_id: test.id,
        test_name: test.name,
        category: test.category,
        success: false,
        error: `Erreur calcul simulateur: ${error.message}`,
        expected,
        obtained: null,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
    
    // Comparer les résultats
    const comparison = this.compareResults(expected, obtained, testSuite.config.tolerance);
    
    const result = {
      test_id: test.id,
      test_name: test.name,
      category: test.category,
      type_cas: test.type_cas,
      success: comparison.success,
      expected,
      obtained,
      deltas: comparison.deltas,
      issues: comparison.issues,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      references_boss: test.references_boss || []
    };
    
    if (this.config.verbose) {
      const icon = result.success ? '✅' : '❌';
      console.log(`   ${icon} ${result.test_id} - ${result.success ? 'PASS' : 'FAIL'} (${result.duration}ms)`);
      if (!result.success && result.issues.length > 0) {
        result.issues.forEach(issue => {
          console.log(`      • ${issue}`);
        });
      }
    }
    
    return result;
  },
  
  prepareInputs: function(inputs) {
    const defaults = {
      'case-toggle': 'standard',
      'mns-bulletin': '',
      'netimpo': '',
      'rnf-regul': '',
      'pas-98960': '',
      'pas-98970': '',
      'pni-98941': '',
      'pni-98911': '',
      'indu': '',
      'hs-exo': '0',
      'mutuelles-pp': '0',
      'abondements-epargne': '0',
      'assiette-csg': '0',
      'ppv-placee': '0',
      'ijss-net': '0',
      primes: {}
    };
    
    return { ...defaults, ...inputs };
  },
  
  compareResults: function(expected, obtained, tolerance) {
    const issues = [];
    const deltas = {};
    
    // Comparer MNS
    deltas.mns = Math.abs(expected.mns - obtained.mns);
    if (deltas.mns > tolerance) {
      issues.push(`MNS: écart de ${deltas.mns.toFixed(2)} € (attendu: ${expected.mns.toFixed(2)}, obtenu: ${obtained.mns.toFixed(2)})`);
    }
    
    // Comparer socle (si disponible)
    if (obtained.socle !== undefined) {
      deltas.socle = Math.abs(expected.socle - obtained.socle);
      if (deltas.socle > tolerance) {
        issues.push(`Socle: écart de ${deltas.socle.toFixed(2)} €`);
      }
    }
    
    // Comparer ajouts (si disponible)
    if (obtained.ajouts !== undefined) {
      deltas.ajouts = Math.abs(expected.ajouts - obtained.ajouts);
      if (deltas.ajouts > tolerance) {
        issues.push(`Ajouts: écart de ${deltas.ajouts.toFixed(2)} €`);
      }
    }
    
    // Comparer déductions (si disponible)
    if (obtained.deductions !== undefined) {
      deltas.deductions = Math.abs(expected.deductions - obtained.deductions);
      if (deltas.deductions > tolerance) {
        issues.push(`Déductions: écart de ${deltas.deductions.toFixed(2)} €`);
      }
    }
    
    return {
      success: issues.length === 0,
      deltas,
      issues
    };
  },
  
  // ═════════════════════════════════════════════════════════════════════════
  // GÉNÉRATION DU RÉSUMÉ
  // ═════════════════════════════════════════════════════════════════════════
  
  generateSummary: function() {
    const results = this.state.results;
    const total = results.length;
    const passed = results.filter(r => r.success).length;
    const failed = total - passed;
    const duration = this.state.endTime - this.state.startTime;
    
    // Résultats par catégorie
    const byCategory = {};
    results.forEach(r => {
      if (!byCategory[r.category]) {
        byCategory[r.category] = { total: 0, passed: 0, failed: 0 };
      }
      byCategory[r.category].total++;
      if (r.success) {
        byCategory[r.category].passed++;
      } else {
        byCategory[r.category].failed++;
      }
    });
    
    // Résultats par type de cas
    const byType = {};
    results.forEach(r => {
      if (!byType[r.type_cas]) {
        byType[r.type_cas] = { total: 0, passed: 0, failed: 0 };
      }
      byType[r.type_cas].total++;
      if (r.success) {
        byType[r.type_cas].passed++;
      } else {
        byType[r.type_cas].failed++;
      }
    });
    
    // Tests échoués détaillés
    const failures = results.filter(r => !r.success).map(r => ({
      test_id: r.test_id,
      test_name: r.test_name,
      category: r.category,
      issues: r.issues,
      references_boss: r.references_boss
    }));
    
    return {
      summary: {
        total,
        passed,
        failed,
        success_rate: total > 0 ? ((passed / total) * 100).toFixed(2) : 0,
        duration_ms: duration,
        duration_sec: (duration / 1000).toFixed(2),
        timestamp: new Date().toISOString()
      },
      by_category: byCategory,
      by_type: byType,
      failures,
      all_results: results
    };
  },
  
  // ═════════════════════════════════════════════════════════════════════════
  // REPORTING
  // ═════════════════════════════════════════════════════════════════════════
  
  generateTextReport: function(summary) {
    const lines = [];
    
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('  RAPPORT DE TESTS NON-RÉGRESSIFS - MNS');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('');
    lines.push(`Date : ${new Date().toLocaleString('fr-FR')}`);
    lines.push(`Durée totale : ${summary.summary.duration_sec}s`);
    lines.push('');
    
    lines.push('─── RÉSULTATS GLOBAUX ─────────────────────────────────────────');
    lines.push(`Total de tests : ${summary.summary.total}`);
    lines.push(`✅ Réussis : ${summary.summary.passed}`);
    lines.push(`❌ Échoués : ${summary.summary.failed}`);
    lines.push(`Taux de réussite : ${summary.summary.success_rate}%`);
    lines.push('');
    
    if (Object.keys(summary.by_category).length > 0) {
      lines.push('─── RÉSULTATS PAR CATÉGORIE ───────────────────────────────────');
      Object.entries(summary.by_category).forEach(([cat, stats]) => {
        const icon = stats.failed === 0 ? '✅' : '⚠️';
        lines.push(`${icon} ${cat} : ${stats.passed}/${stats.total} (${((stats.passed/stats.total)*100).toFixed(0)}%)`);
      });
      lines.push('');
    }
    
    if (Object.keys(summary.by_type).length > 0) {
      lines.push('─── RÉSULTATS PAR TYPE DE CAS ─────────────────────────────────');
      Object.entries(summary.by_type).forEach(([type, stats]) => {
        const icon = stats.failed === 0 ? '✅' : '⚠️';
        lines.push(`${icon} ${type} : ${stats.passed}/${stats.total} (${((stats.passed/stats.total)*100).toFixed(0)}%)`);
      });
      lines.push('');
    }
    
    if (summary.failures.length > 0) {
      lines.push('─── TESTS ÉCHOUÉS ─────────────────────────────────────────────');
      summary.failures.forEach((failure, i) => {
        lines.push(`${i + 1}. ${failure.test_id} - ${failure.test_name}`);
        lines.push(`   Catégorie : ${failure.category}`);
        if (failure.issues && failure.issues.length > 0) {
          lines.push(`   Problèmes :`);
          failure.issues.forEach(issue => {
            lines.push(`     • ${issue}`);
          });
        }
        if (failure.references_boss && failure.references_boss.length > 0) {
          lines.push(`   Références BOSS :`);
          failure.references_boss.forEach(ref => {
            lines.push(`     - ${ref}`);
          });
        }
        lines.push('');
      });
    } else {
      lines.push('─── AUCUN ÉCHEC ───────────────────────────────────────────────');
      lines.push('✅ Tous les tests sont passés avec succès !');
      lines.push('');
    }
    
    lines.push('═══════════════════════════════════════════════════════════════');
    
    return lines.join('\n');
  },
  
  generateJSONReport: function(summary) {
    return JSON.stringify({
      version: '1.0.0',
      timestamp: summary.summary.timestamp,
      summary: summary.summary,
      by_category: summary.by_category,
      by_type: summary.by_type,
      failures: summary.failures,
      results: summary.all_results
    }, null, 2);
  },
  
  generateCSVReport: function(summary) {
    const lines = [];
    
    // En-tête
    lines.push('Test ID;Nom;Catégorie;Type Cas;Statut;MNS Attendu;MNS Obtenu;Delta;Durée (ms);Problèmes');
    
    // Résultats
    summary.all_results.forEach(r => {
      const status = r.success ? 'PASS' : 'FAIL';
      const mns_expected = r.expected.mns.toFixed(2).replace('.', ',');
      const mns_obtained = r.obtained.mns.toFixed(2).replace('.', ',');
      const delta = r.deltas.mns.toFixed(2).replace('.', ',');
      const issues = (r.issues || []).join(' | ');
      
      lines.push(`${r.test_id};${r.test_name};${r.category};${r.type_cas};${status};${mns_expected};${mns_obtained};${delta};${r.duration};${issues}`);
    });
    
    return lines.join('\n');
  },
  
  generateHTMLReport: function(summary) {
    const successRate = parseFloat(summary.summary.success_rate);
    const statusColor = successRate === 100 ? '#27ae60' : successRate >= 80 ? '#f39c12' : '#e74c3c';
    
    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport de Tests MNS - ${new Date().toLocaleDateString('fr-FR')}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 40px auto; padding: 20px; background: #f5f5f5; }
    .header { background: linear-gradient(135deg, #003366 0%, #0055aa 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; }
    .header h1 { margin: 0 0 10px 0; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .summary-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .summary-card .label { font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 8px; }
    .summary-card .value { font-size: 32px; font-weight: bold; color: ${statusColor}; }
    .section { background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .section h2 { margin-top: 0; color: #003366; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #003366; color: white; }
    .pass { color: #27ae60; font-weight: bold; }
    .fail { color: #e74c3c; font-weight: bold; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
    .badge.pass { background: #27ae60; color: white; }
    .badge.fail { background: #e74c3c; color: white; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Rapport de Tests Non-Régressifs</h1>
    <div>Montant Net Social (MNS) - Koesio Data Solutions</div>
    <div>Généré le ${new Date().toLocaleString('fr-FR')}</div>
  </div>

  <div class="summary">
    <div class="summary-card">
      <div class="label">Total de tests</div>
      <div class="value">${summary.summary.total}</div>
    </div>
    <div class="summary-card">
      <div class="label">Réussis</div>
      <div class="value" style="color: #27ae60">${summary.summary.passed}</div>
    </div>
    <div class="summary-card">
      <div class="label">Échoués</div>
      <div class="value" style="color: #e74c3c">${summary.summary.failed}</div>
    </div>
    <div class="summary-card">
      <div class="label">Taux de réussite</div>
      <div class="value">${summary.summary.success_rate}%</div>
    </div>
  </div>

  <div class="section">
    <h2>Résultats par catégorie</h2>
    <table>
      <thead><tr><th>Catégorie</th><th>Total</th><th>Réussis</th><th>Échoués</th><th>Taux</th></tr></thead>
      <tbody>
        ${Object.entries(summary.by_category).map(([cat, stats]) => `
          <tr>
            <td>${cat}</td>
            <td>${stats.total}</td>
            <td class="pass">${stats.passed}</td>
            <td class="fail">${stats.failed}</td>
            <td>${((stats.passed/stats.total)*100).toFixed(1)}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  ${summary.failures.length > 0 ? `
  <div class="section">
    <h2>Tests échoués (${summary.failures.length})</h2>
    <table>
      <thead><tr><th>Test ID</th><th>Nom</th><th>Catégorie</th><th>Problèmes</th></tr></thead>
      <tbody>
        ${summary.failures.map(f => `
          <tr>
            <td><span class="badge fail">FAIL</span> ${f.test_id}</td>
            <td>${f.test_name}</td>
            <td>${f.category}</td>
            <td>${(f.issues || []).join('<br>')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : `
  <div class="section">
    <h2>✅ Aucun échec</h2>
    <p>Tous les tests sont passés avec succès !</p>
  </div>
  `}

  <div class="section">
    <h2>Tous les résultats</h2>
    <table>
      <thead><tr><th>Test</th><th>Statut</th><th>MNS Attendu</th><th>MNS Obtenu</th><th>Écart</th><th>Durée</th></tr></thead>
      <tbody>
        ${summary.all_results.map(r => `
          <tr>
            <td><strong>${r.test_id}</strong><br>${r.test_name}</td>
            <td><span class="badge ${r.success ? 'pass' : 'fail'}">${r.success ? 'PASS' : 'FAIL'}</span></td>
            <td>${r.expected.mns.toFixed(2)} €</td>
            <td>${r.obtained.mns.toFixed(2)} €</td>
            <td>${r.deltas.mns.toFixed(2)} €</td>
            <td>${r.duration} ms</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;
  },
  
  // ═════════════════════════════════════════════════════════════════════════
  // HISTORIQUE
  // ═════════════════════════════════════════════════════════════════════════
  
  saveToHistory: function(summary) {
    this.history.push({
      timestamp: summary.summary.timestamp,
      total: summary.summary.total,
      passed: summary.summary.passed,
      failed: summary.summary.failed,
      success_rate: summary.summary.success_rate,
      duration: summary.summary.duration_ms
    });
    
    // Garder seulement les 50 dernières exécutions
    if (this.history.length > 50) {
      this.history = this.history.slice(-50);
    }
    
    // Sauvegarder dans localStorage si disponible
    try {
      localStorage.setItem('mns_test_history', JSON.stringify(this.history));
    } catch (e) {
      // Ignore si localStorage non disponible
    }
  },
  
  loadHistory: function() {
    try {
      const stored = localStorage.getItem('mns_test_history');
      if (stored) {
        this.history = JSON.parse(stored);
      }
    } catch (e) {
      this.history = [];
    }
  },
  
  getHistory: function() {
    return this.history;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
  window.MNS_TEST_RUNNER = MNS_TEST_RUNNER;
  
  // Charger l'historique au démarrage
  MNS_TEST_RUNNER.loadHistory();
  
  console.log('✓ Module MNS_TEST_RUNNER chargé');
}
