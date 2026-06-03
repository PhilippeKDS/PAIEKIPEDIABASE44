/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYSTÈME DE VALIDATION BOSS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Ce module vérifie automatiquement la conformité du simulateur MNS avec
 * les références BOSS. Il peut être exécuté :
 * - Manuellement via la console
 * - Automatiquement lors des tests
 * - Intégré dans un pipeline CI/CD
 * 
 * Version : 1.0.0
 * Date : 2026-02-11
 */

if (typeof window.BOSS_REFERENCES === 'undefined') {
  console.error('❌ ERREUR : Le module BOSS_REFERENCES doit être chargé avant le validateur');
  throw new Error('Module BOSS_REFERENCES manquant');
}

const BOSS_VALIDATOR = {
  
  // ═════════════════════════════════════════════════════════════════════════
  // VALIDATION DES MÉTADONNÉES
  // ═════════════════════════════════════════════════════════════════════════
  
  validateMetadata: function() {
    const results = [];
    const meta = window.BOSS_REFERENCES.metadata;
    
    // Vérifier que la version est définie
    if (!meta.version) {
      results.push({
        type: 'error',
        category: 'metadata',
        message: 'Version non définie dans les métadonnées'
      });
    }
    
    // Vérifier que la date de validation n'est pas trop ancienne (> 6 mois)
    const validationDate = new Date(meta.date_derniere_validation);
    const today = new Date();
    const sixMonthsAgo = new Date(today.setMonth(today.getMonth() - 6));
    
    if (validationDate < sixMonthsAgo) {
      results.push({
        type: 'warning',
        category: 'metadata',
        message: `Dernière validation réglementaire datant de plus de 6 mois (${meta.date_derniere_validation}). Vérifier les mises à jour BOSS.`
      });
    }
    
    // Vérifier que toutes les sources sont documentées
    if (!meta.sources || meta.sources.length === 0) {
      results.push({
        type: 'error',
        category: 'metadata',
        message: 'Aucune source réglementaire documentée'
      });
    }
    
    return results;
  },
  
  // ═════════════════════════════════════════════════════════════════════════
  // VALIDATION DE LA COMPLÉTUDE DU MAPPING
  // ═════════════════════════════════════════════════════════════════════════
  
  validateMappingCompleteness: function() {
    const results = [];
    const mapping = window.BOSS_REFERENCES.mapping_dsn_sage;
    
    // Blocs essentiels qui DOIVENT être documentés
    const requiredBlocs = [
      'S21.G00.50',  // Versement individu
      'S21.G00.52',  // Primes
      'S21.G00.54',  // Cotisations
      'S21.G00.56',  // Régularisations
      'S21.G00.58',  // Éléments calculés en net
      'S21.G00.78'   // Bases assujetties
    ];
    
    requiredBlocs.forEach(bloc => {
      if (!mapping[bloc]) {
        results.push({
          type: 'error',
          category: 'mapping',
          message: `Bloc DSN essentiel manquant : ${bloc}`
        });
      } else {
        // Vérifier que le bloc a une description
        if (!mapping[bloc].description) {
          results.push({
            type: 'warning',
            category: 'mapping',
            message: `Bloc ${bloc} sans description`
          });
        }
        
        // Vérifier que le bloc a une URL de référence
        if (!mapping[bloc].url_dsn) {
          results.push({
            type: 'warning',
            category: 'mapping',
            message: `Bloc ${bloc} sans URL de référence DSN`
          });
        }
      }
    });
    
    return results;
  },
  
  // ═════════════════════════════════════════════════════════════════════════
  // VALIDATION DE LA COHÉRENCE AVEC LE CODE
  // ═════════════════════════════════════════════════════════════════════════
  
  validateCodeConsistency: function() {
    const results = [];
    
    // Vérifier que tous les champs du simulateur sont documentés dans le mapping
    const simulatorFields = [
      'netimpo', 'rnf-regul', 'pas-98960', 'pas-98970',
      'pni-98941', 'pni-98911', 'indu', 'hs-exo',
      'mutuelles-pp', 'abondements-epargne', 'assiette-csg',
      'ppv-placee', 'ijss-net'
    ];
    
    const mapping = window.BOSS_REFERENCES.mapping_dsn_sage;
    const documentedFields = new Set();
    
    // Parcourir le mapping pour extraire tous les champs simulateur documentés
    Object.values(mapping).forEach(bloc => {
      if (bloc.rubriques) {
        Object.values(bloc.rubriques).forEach(rubrique => {
          if (rubrique.simulateur && rubrique.simulateur.champ) {
            documentedFields.add(rubrique.simulateur.champ);
          }
          if (rubrique.simulateur && rubrique.simulateur.champs) {
            rubrique.simulateur.champs.forEach(c => documentedFields.add(c));
          }
        });
      }
      if (bloc.types_concernant_mns) {
        bloc.types_concernant_mns.forEach(type => {
          if (type.simulateur && type.simulateur.champ) {
            documentedFields.add(type.simulateur.champ);
          }
        });
      }
    });
    
    // Vérifier les champs manquants
    simulatorFields.forEach(field => {
      if (!documentedFields.has(field)) {
        results.push({
          type: 'warning',
          category: 'code_consistency',
          message: `Champ simulateur "${field}" non documenté dans le mapping BOSS`
        });
      }
    });
    
    return results;
  },
  
  // ═════════════════════════════════════════════════════════════════════════
  // VALIDATION DES CAS TESTS
  // ═════════════════════════════════════════════════════════════════════════
  
  validateTestCases: function() {
    const results = [];
    const casTests = window.BOSS_REFERENCES.cas_tests;
    
    // Vérifier qu'il y a au moins un cas test pour chaque type de cas
    const hasCasGeneral = casTests.some(ct => ct.type_cas === 'cas_general');
    const hasCasParticulier = casTests.some(ct => ct.type_cas === 'cas_particulier');
    
    if (!hasCasGeneral) {
      results.push({
        type: 'error',
        category: 'test_cases',
        message: 'Aucun cas test pour le cas général'
      });
    }
    
    if (!hasCasParticulier) {
      results.push({
        type: 'warning',
        category: 'test_cases',
        message: 'Aucun cas test pour le cas particulier'
      });
    }
    
    // Vérifier que chaque cas test a toutes les propriétés requises
    casTests.forEach((ct, index) => {
      const required = ['id', 'libelle', 'type_cas', 'inputs', 'expected_mns'];
      
      required.forEach(prop => {
        if (!ct[prop]) {
          results.push({
            type: 'error',
            category: 'test_cases',
            message: `Cas test ${index + 1} manque la propriété "${prop}"`
          });
        }
      });
      
      // Vérifier que les références BOSS sont présentes
      if (!ct.references_boss || ct.references_boss.length === 0) {
        results.push({
          type: 'warning',
          category: 'test_cases',
          message: `Cas test "${ct.id}" sans références BOSS`
        });
      }
    });
    
    return results;
  },
  
  // ═════════════════════════════════════════════════════════════════════════
  // VALIDATION COMPLÈTE
  // ═════════════════════════════════════════════════════════════════════════
  
  runFullValidation: function() {
    console.log('🔍 Démarrage de la validation BOSS...');
    console.log('');
    
    const allResults = [
      ...this.validateMetadata(),
      ...this.validateMappingCompleteness(),
      ...this.validateCodeConsistency(),
      ...this.validateTestCases()
    ];
    
    // Compter les résultats par type
    const errors = allResults.filter(r => r.type === 'error');
    const warnings = allResults.filter(r => r.type === 'warning');
    const infos = allResults.filter(r => r.type === 'info');
    
    // Afficher les résultats
    console.group('📊 Résultats de validation');
    console.log(`✅ Validations réussies : ${allResults.length === 0 ? 'Toutes' : 'Partielles'}`);
    console.log(`❌ Erreurs : ${errors.length}`);
    console.log(`⚠️  Avertissements : ${warnings.length}`);
    console.log(`ℹ️  Informations : ${infos.length}`);
    console.groupEnd();
    
    console.log('');
    
    // Afficher les erreurs
    if (errors.length > 0) {
      console.group('❌ ERREURS CRITIQUES');
      errors.forEach((err, i) => {
        console.log(`${i + 1}. [${err.category}] ${err.message}`);
      });
      console.groupEnd();
      console.log('');
    }
    
    // Afficher les avertissements
    if (warnings.length > 0) {
      console.group('⚠️  AVERTISSEMENTS');
      warnings.forEach((warn, i) => {
        console.log(`${i + 1}. [${warn.category}] ${warn.message}`);
      });
      console.groupEnd();
      console.log('');
    }
    
    // Afficher les infos
    if (infos.length > 0) {
      console.group('ℹ️  INFORMATIONS');
      infos.forEach((info, i) => {
        console.log(`${i + 1}. [${info.category}] ${info.message}`);
      });
      console.groupEnd();
      console.log('');
    }
    
    // Résumé final
    if (allResults.length === 0) {
      console.log('✅ VALIDATION RÉUSSIE : Toutes les références BOSS sont conformes');
    } else if (errors.length === 0) {
      console.log('⚠️  VALIDATION PARTIELLE : Pas d\'erreurs critiques, mais des améliorations sont recommandées');
    } else {
      console.log('❌ VALIDATION ÉCHOUÉE : Des erreurs critiques doivent être corrigées');
    }
    
    console.log('');
    console.log(`📅 Date de validation : ${new Date().toLocaleString('fr-FR')}`);
    console.log(`📦 Version références BOSS : ${window.BOSS_REFERENCES.metadata.version}`);
    
    return {
      success: errors.length === 0,
      errors: errors,
      warnings: warnings,
      infos: infos,
      timestamp: new Date().toISOString()
    };
  },
  
  // ═════════════════════════════════════════════════════════════════════════
  // RAPPORT HTML EXPORTABLE
  // ═════════════════════════════════════════════════════════════════════════
  
  generateHTMLReport: function() {
    const validation = this.runFullValidation();
    
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport de validation BOSS - ${new Date().toLocaleDateString('fr-FR')}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 1200px;
      margin: 40px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: linear-gradient(135deg, #003366 0%, #0055aa 100%);
      color: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .header .meta {
      font-size: 14px;
      opacity: 0.9;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .summary-card .label {
      font-size: 12px;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 8px;
    }
    .summary-card .value {
      font-size: 32px;
      font-weight: bold;
    }
    .summary-card.success .value { color: #27ae60; }
    .summary-card.error .value { color: #e74c3c; }
    .summary-card.warning .value { color: #f39c12; }
    .section {
      background: white;
      padding: 25px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .section h2 {
      margin-top: 0;
      color: #003366;
      font-size: 20px;
      border-bottom: 2px solid #0055aa;
      padding-bottom: 10px;
    }
    .issue {
      padding: 15px;
      margin-bottom: 10px;
      border-left: 4px solid;
      background: #f9f9f9;
      border-radius: 4px;
    }
    .issue.error {
      border-left-color: #e74c3c;
      background: #fef5f5;
    }
    .issue.warning {
      border-left-color: #f39c12;
      background: #fef9f5;
    }
    .issue.info {
      border-left-color: #3498db;
      background: #f5f9fe;
    }
    .issue-type {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 11px;
      margin-bottom: 5px;
    }
    .issue.error .issue-type { color: #e74c3c; }
    .issue.warning .issue-type { color: #f39c12; }
    .issue.info .issue-type { color: #3498db; }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      margin-left: 10px;
    }
    .badge.success {
      background: #27ae60;
      color: white;
    }
    .badge.partial {
      background: #f39c12;
      color: white;
    }
    .badge.failed {
      background: #e74c3c;
      color: white;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Rapport de validation BOSS
      ${validation.success 
        ? '<span class="badge success">Conforme</span>' 
        : validation.errors.length > 0 
          ? '<span class="badge failed">Non conforme</span>'
          : '<span class="badge partial">Partiel</span>'
      }
    </h1>
    <div class="meta">
      Montant Net Social (MNS) - Simulateur Sage<br>
      Généré le ${new Date().toLocaleString('fr-FR')}<br>
      Version références BOSS : ${window.BOSS_REFERENCES.metadata.version}
    </div>
  </div>

  <div class="summary">
    <div class="summary-card ${validation.success ? 'success' : 'error'}">
      <div class="label">Statut global</div>
      <div class="value">${validation.success ? '✓' : '✗'}</div>
    </div>
    <div class="summary-card error">
      <div class="label">Erreurs critiques</div>
      <div class="value">${validation.errors.length}</div>
    </div>
    <div class="summary-card warning">
      <div class="label">Avertissements</div>
      <div class="value">${validation.warnings.length}</div>
    </div>
    <div class="summary-card">
      <div class="label">Informations</div>
      <div class="value">${validation.infos.length}</div>
    </div>
  </div>

  ${validation.errors.length > 0 ? `
  <div class="section">
    <h2>❌ Erreurs critiques</h2>
    ${validation.errors.map(err => `
      <div class="issue error">
        <div class="issue-type">Erreur [${err.category}]</div>
        <div>${err.message}</div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${validation.warnings.length > 0 ? `
  <div class="section">
    <h2>⚠️ Avertissements</h2>
    ${validation.warnings.map(warn => `
      <div class="issue warning">
        <div class="issue-type">Avertissement [${warn.category}]</div>
        <div>${warn.message}</div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${validation.infos.length > 0 ? `
  <div class="section">
    <h2>ℹ️ Informations</h2>
    ${validation.infos.map(info => `
      <div class="issue info">
        <div class="issue-type">Info [${info.category}]</div>
        <div>${info.message}</div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${validation.errors.length === 0 && validation.warnings.length === 0 && validation.infos.length === 0 ? `
  <div class="section">
    <h2>✅ Validation réussie</h2>
    <p>Toutes les références BOSS sont conformes et à jour.</p>
    <ul>
      <li>✓ Métadonnées complètes et valides</li>
      <li>✓ Mapping DSN-Sage-Simulateur exhaustif</li>
      <li>✓ Cohérence avec le code du simulateur</li>
      <li>✓ Cas tests documentés avec références BOSS</li>
    </ul>
  </div>
  ` : ''}

  <div class="footer">
    Koesio Data Solutions - Simulateur MNS v4.3<br>
    Ce rapport est généré automatiquement par le système de validation BOSS.
  </div>
</body>
</html>
    `;
    
    return html;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT ET AUTO-EXÉCUTION
// ═══════════════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
  window.BOSS_VALIDATOR = BOSS_VALIDATOR;
  
  // Ajouter une commande console pour l'utilisateur
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SYSTÈME DE VALIDATION BOSS - Prêt');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('Commandes disponibles :');
  console.log('  • BOSS_VALIDATOR.runFullValidation()     - Valider toutes les références');
  console.log('  • BOSS_VALIDATOR.generateHTMLReport()    - Générer un rapport HTML');
  console.log('');
  console.log('Pour exécuter la validation maintenant, tapez :');
  console.log('  BOSS_VALIDATOR.runFullValidation()');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
}
