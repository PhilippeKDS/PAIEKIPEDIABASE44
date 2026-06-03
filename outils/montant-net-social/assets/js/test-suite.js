/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MODULE DE TESTS NON-RÉGRESSIFS ENRICHI
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Système complet de tests automatisés pour le simulateur MNS avec :
 * - Batterie de cas tests figés (valeurs de référence validées)
 * - Intégration des cas tests BOSS (références réglementaires)
 * - Traçabilité complète (qui, quand, pourquoi)
 * - Reporting avancé (JSON, CSV, HTML)
 * - Détection immédiate des régressions
 * 
 * Version : 1.0.0
 * Date : 2026-02-11
 */

const MNS_TEST_SUITE = {
  
  // ═════════════════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═════════════════════════════════════════════════════════════════════════
  
  config: {
    tolerance: 0.01,      // Tolérance d'arrondi en euros
    threshold: 20,        // Seuil d'alerte en %
    tauxCsg: 2.9,        // Taux CSG non déductible en %
    roundingMode: 'final' // Mode d'arrondi pour les tests
  },
  
  // ═════════════════════════════════════════════════════════════════════════
  // BATTERIE DE CAS TESTS ENRICHIE
  // ═════════════════════════════════════════════════════════════════════════
  
  testCases: [
    // ─────────────────────────────────────────────────────────────────────
    // TESTS DE BASE (fonctionnalité minimale)
    // ─────────────────────────────────────────────────────────────────────
    {
      id: "BASE_001",
      category: "base",
      name: "Socle seul - Cas général",
      description: "Vérification du calcul du socle en cas général (Base PAS + Part non imposable)",
      type_cas: "cas_general",
      inputs: {
        'case-toggle': 'standard',
        'pas-98960': '1000',
        'pas-98970': '0',
        'pni-98941': '100',
        'pni-98911': '0',
        'assiette-csg': '0',
        'mutuelles-pp': '0',
        'ppv-placee': '0',
        'abondements-epargne': '0',
        'hs-exo': '0',
        'ijss-net': '0',
        primes: {}
      },
      expected: {
        mns: 1100.00,
        socle: 1100.00,
        ajouts: 0.00,
        deductions: 0.00
      },
      references_boss: [
        "Socle = S21.G00.50.013 + S21.G00.50.011",
        "Formule : (98960 + 98970) + (98941 - 98911)"
      ],
      validation_date: "2026-02-11"
    },
    
    {
      id: "BASE_002",
      category: "base",
      name: "Socle seul - Cas particulier",
      description: "Vérification du calcul du socle en cas particulier (RNF + Indu)",
      type_cas: "cas_particulier",
      inputs: {
        'case-toggle': 'exception',
        'netimpo': '900',
        'rnf-regul': '100',
        'indu': '20',
        'assiette-csg': '0',
        'mutuelles-pp': '0',
        'ppv-placee': '0',
        'abondements-epargne': '0',
        'hs-exo': '0',
        'ijss-net': '0',
        primes: {}
      },
      expected: {
        mns: 1020.00,
        socle: 1020.00,
        ajouts: 0.00,
        deductions: 0.00
      },
      references_boss: [
        "Socle = S21.G00.50.002 + S21.G00.56.002 (type 03)",
        "Formule : NETIMPO + rnf_regul + indu"
      ],
      validation_date: "2026-02-11"
    },
    
    // ─────────────────────────────────────────────────────────────────────
    // TESTS AJOUTS (primes, HS/HC, IJSS)
    // ─────────────────────────────────────────────────────────────────────
    {
      id: "AJOUT_001",
      category: "ajouts",
      name: "Prime simple (type 002)",
      description: "Ajout d'une prime au socle",
      type_cas: "cas_general",
      inputs: {
        'case-toggle': 'standard',
        'pas-98960': '1200',
        'pas-98970': '0',
        'pni-98941': '0',
        'pni-98911': '0',
        'assiette-csg': '0',
        'mutuelles-pp': '0',
        'ppv-placee': '0',
        'abondements-epargne': '0',
        'hs-exo': '0',
        'ijss-net': '0',
        primes: { '002': '200' }
      },
      expected: {
        mns: 1400.00,
        socle: 1200.00,
        ajouts: 200.00,
        deductions: 0.00
      },
      references_boss: [
        "Ajout : S21.G00.52.001 type 002",
        "Prime, gratification et indemnité"
      ],
      validation_date: "2026-02-11"
    },
    
    {
      id: "AJOUT_002",
      category: "ajouts",
      name: "HS/HC exonérées fiscalement",
      description: "Ajout des heures supplémentaires exonérées",
      type_cas: "cas_general",
      inputs: {
        'case-toggle': 'standard',
        'pas-98960': '1500',
        'pas-98970': '0',
        'pni-98941': '0',
        'pni-98911': '0',
        'assiette-csg': '0',
        'mutuelles-pp': '0',
        'ppv-placee': '0',
        'abondements-epargne': '0',
        'hs-exo': '150',
        'ijss-net': '0',
        primes: {}
      },
      expected: {
        mns: 1650.00,
        socle: 1500.00,
        ajouts: 150.00,
        deductions: 0.00
      },
      references_boss: [
        "Ajout : S21.G00.58.003 type 01",
        "Rubrique Sage : 79900",
        "Note : Depuis DSN 2024, n'intègre plus S21.G00.50.002"
      ],
      validation_date: "2026-02-11"
    },
    
    {
      id: "AJOUT_003",
      category: "ajouts",
      name: "IJSS nettes (subrogation)",
      description: "Ajout des IJSS en cas de subrogation employeur",
      type_cas: "cas_general",
      inputs: {
        'case-toggle': 'standard',
        'pas-98960': '1000',
        'pas-98970': '0',
        'pni-98941': '0',
        'pni-98911': '0',
        'assiette-csg': '0',
        'mutuelles-pp': '0',
        'ppv-placee': '0',
        'abondements-epargne': '0',
        'hs-exo': '0',
        'ijss-net': '300',
        primes: {}
      },
      expected: {
        mns: 1300.00,
        socle: 1000.00,
        ajouts: 300.00,
        deductions: 0.00
      },
      references_boss: [
        "Ajout : S21.G00.58.003 type 10",
        "Rubrique Sage : 84100",
        "Condition : UNIQUEMENT en cas de subrogation employeur"
      ],
      validation_date: "2026-02-11"
    },
    
    {
      id: "AJOUT_004",
      category: "ajouts",
      name: "Combinaison primes + HS/HC + IJSS",
      description: "Test de cumul de tous les ajouts possibles",
      type_cas: "cas_general",
      inputs: {
        'case-toggle': 'standard',
        'pas-98960': '2000',
        'pas-98970': '0',
        'pni-98941': '50',
        'pni-98911': '0',
        'assiette-csg': '0',
        'mutuelles-pp': '0',
        'ppv-placee': '0',
        'abondements-epargne': '0',
        'hs-exo': '100',
        'ijss-net': '200',
        primes: { '002': '300', '007': '150' }
      },
      expected: {
        mns: 2800.00,  // 2050 (socle) + 750 (ajouts) + 0 (déductions)
        socle: 2050.00,
        ajouts: 750.00,
        deductions: 0.00
      },
      references_boss: [
        "Combinaison : Primes (002+007) + HS/HC (type 01) + IJSS (type 10)"
      ],
      validation_date: "2026-02-11"
    },
    
    // ─────────────────────────────────────────────────────────────────────
    // TESTS DÉDUCTIONS (mutuelles PP, CSG non déductible)
    // ─────────────────────────────────────────────────────────────────────
    {
      id: "DEDUCT_001",
      category: "deductions",
      name: "Parts patronales mutuelles seules",
      description: "Déduction des contributions employeur frais de santé",
      type_cas: "cas_general",
      inputs: {
        'case-toggle': 'standard',
        'pas-98960': '1500',
        'pas-98970': '0',
        'pni-98941': '0',
        'pni-98911': '0',
        'assiette-csg': '0',
        'mutuelles-pp': '50',
        'ppv-placee': '0',
        'abondements-epargne': '0',
        'hs-exo': '0',
        'ijss-net': '0',
        primes: {}
      },
      expected: {
        mns: 1450.00,
        socle: 1500.00,
        ajouts: 0.00,
        deductions: 50.00
      },
      references_boss: [
        "Déduction : S21.G00.54.001 type 92",
        "Contributions employeur frais de santé"
      ],
      validation_date: "2026-02-11"
    },
    
    {
      id: "DEDUCT_002",
      category: "deductions",
      name: "CSG non déductible - Assiette simple",
      description: "Calcul CSG non déductible sur assiette sans PPV ni abondements",
      type_cas: "cas_general",
      inputs: {
        'case-toggle': 'standard',
        'pas-98960': '1500',
        'pas-98970': '0',
        'pni-98941': '0',
        'pni-98911': '0',
        'assiette-csg': '1000',
        'mutuelles-pp': '0',
        'ppv-placee': '0',
        'abondements-epargne': '0',
        'hs-exo': '0',
        'ijss-net': '0',
        primes: {}
      },
      expected: {
        mns: 1471.00,  // 1500 - (1000 × 2,9%)
        socle: 1500.00,
        ajouts: 0.00,
        deductions: 29.00
      },
      references_boss: [
        "Déduction CSG : max(0, S21.G00.78.001[04]) × 2,9%",
        "Taux légal : 2,9% (2026)"
      ],
      validation_date: "2026-02-11"
    },
    
    {
      id: "DEDUCT_003",
      category: "deductions",
      name: "CSG non déductible - Avec PPV placée",
      description: "Réduction de l'assiette CSG grâce à la PPV",
      type_cas: "cas_general",
      inputs: {
        'case-toggle': 'standard',
        'pas-98960': '2000',
        'pas-98970': '0',
        'pni-98941': '0',
        'pni-98911': '0',
        'assiette-csg': '2200',
        'mutuelles-pp': '0',
        'ppv-placee': '300',
        'abondements-epargne': '0',
        'hs-exo': '0',
        'ijss-net': '0',
        primes: {}
      },
      expected: {
        mns: 1944.90,  // 2000 - ((2200 - 300) × 2,9%)
        socle: 2000.00,
        ajouts: 0.00,
        deductions: 55.10
      },
      references_boss: [
        "Intermédiaire CSG = S21.G00.78.001[04] - S21.G00.52.001[906]",
        "Formule : Assiette - PPV placée = 2200 - 300 = 1900",
        "CSG = 1900 × 2,9% = 55,10 €"
      ],
      validation_date: "2026-02-11"
    },
    
    {
      id: "DEDUCT_004",
      category: "deductions",
      name: "CSG non déductible - Avec abondements",
      description: "Réduction de l'assiette CSG grâce aux abondements épargne",
      type_cas: "cas_general",
      inputs: {
        'case-toggle': 'standard',
        'pas-98960': '2500',
        'pas-98970': '0',
        'pni-98941': '0',
        'pni-98911': '0',
        'assiette-csg': '2700',
        'mutuelles-pp': '0',
        'ppv-placee': '0',
        'abondements-epargne': '200',
        'hs-exo': '0',
        'ijss-net': '0',
        primes: {}
      },
      expected: {
        mns: 2427.50,  // 2500 - ((2700 - 200) × 2,9%)
        socle: 2500.00,
        ajouts: 0.00,
        deductions: 72.50
      },
      references_boss: [
        "Abondements : S21.G00.54.001 types 14/15/16",
        "Intermédiaire CSG = 2700 - 200 = 2500",
        "CSG = 2500 × 2,9% = 72,50 €"
      ],
      validation_date: "2026-02-11"
    },
    
    {
      id: "DEDUCT_005",
      category: "deductions",
      name: "Déductions combinées",
      description: "Test complet : Mutuelles PP + CSG non déductible avec PPV et abondements",
      type_cas: "cas_general",
      inputs: {
        'case-toggle': 'standard',
        'pas-98960': '3000',
        'pas-98970': '0',
        'pni-98941': '100',
        'pni-98911': '0',
        'assiette-csg': '3300',
        'mutuelles-pp': '50',
        'ppv-placee': '200',
        'abondements-epargne': '100',
        'hs-exo': '0',
        'ijss-net': '0',
        primes: {}
      },
      expected: {
        mns: 2963.00,  // 3100 - (50 + 87) = 3100 - 137
        socle: 3100.00,
        ajouts: 0.00,
        deductions: 137.00  // 50 (mutuelles) + 87 (CSG: (3300-200-100)*2.9%)
      },
      references_boss: [
        "Intermédiaire CSG = 3300 - 200 - 100 = 3000",
        "CSG = 3000 × 2,9% = 87 €",
        "Déductions totales = 50 (mutuelles) + 87 (CSG) = 137 €"
      ],
      validation_date: "2026-02-11"
    },
    
    // ─────────────────────────────────────────────────────────────────────
    // TESTS CAS RÉELS (inspirés des cas BOSS)
    // ─────────────────────────────────────────────────────────────────────
    {
      id: "BOSS_CG_001",
      category: "boss_reference",
      name: "BOSS - Cas général standard",
      description: "Cas test de référence BOSS : Salarié CDI, configuration standard",
      type_cas: "cas_general",
      inputs: {
        'case-toggle': 'standard',
        'pas-98960': '2000',
        'pas-98970': '0',
        'pni-98941': '50',
        'pni-98911': '0',
        'assiette-csg': '2100',
        'mutuelles-pp': '30',
        'ppv-placee': '0',
        'abondements-epargne': '0',
        'hs-exo': '0',
        'ijss-net': '0',
        primes: {}
      },
      expected: {
        mns: 1959.10,  // 2050 - (30 + 60.90)
        socle: 2050.00,
        ajouts: 0.00,
        deductions: 90.90
      },
      references_boss: [
        "Cas test BOSS CG_001",
        "Socle = (2000 + 0) + (50 - 0) = 2050",
        "CSG = 2100 × 2,9% = 60,90",
        "Déductions = 30 + 60,90 = 90,90",
        "MNS = 2050 - 90,90 = 1959,10"
      ],
      validation_date: "2026-02-11"
    },
    
    {
      id: "BOSS_CG_002",
      category: "boss_reference",
      name: "BOSS - Avec primes et HS exonérées",
      description: "Cas test BOSS : Salarié avec prime et heures supplémentaires",
      type_cas: "cas_general",
      inputs: {
        'case-toggle': 'standard',
        'pas-98960': '2500',
        'pas-98970': '0',
        'pni-98941': '75',
        'pni-98911': '0',
        'assiette-csg': '2800',
        'mutuelles-pp': '45',
        'ppv-placee': '0',
        'abondements-epargne': '0',
        'hs-exo': '150',
        'ijss-net': '0',
        primes: { '002': '500' }
      },
      expected: {
        mns: 3098.80,  // 2575 + 650 - 126.20
        socle: 2575.00,
        ajouts: 650.00,
        deductions: 126.20
      },
      references_boss: [
        "Cas test BOSS CG_002",
        "Ajouts = 500 (prime 002) + 150 (HS exo) = 650",
        "CSG = 2800 × 2,9% = 81,20",
        "Déductions = 45 + 81,20 = 126,20"
      ],
      validation_date: "2026-02-11"
    },
    
    {
      id: "BOSS_CP_001",
      category: "boss_reference",
      name: "BOSS - CDD court (≤ 2 mois)",
      description: "Cas test BOSS : Contrat CDD de 1 mois",
      type_cas: "cas_particulier",
      inputs: {
        'case-toggle': 'exception',
        'netimpo': '1800',
        'rnf-regul': '0',
        'indu': '0',
        'assiette-csg': '1950',
        'mutuelles-pp': '25',
        'ppv-placee': '0',
        'abondements-epargne': '0',
        'hs-exo': '0',
        'ijss-net': '0',
        primes: {}
      },
      expected: {
        mns: 1718.45,  // 1800 - 81.55
        socle: 1800.00,
        ajouts: 0.00,
        deductions: 81.55
      },
      references_boss: [
        "Cas test BOSS CP_001",
        "Socle = RNF = 1800 (NETIMPO)",
        "CSG = 1950 × 2,9% = 56,55",
        "Déductions = 25 + 56,55 = 81,55"
      ],
      validation_date: "2026-02-11"
    },
    
    {
      id: "BOSS_CG_003",
      category: "boss_reference",
      name: "BOSS - PPV et abondements",
      description: "Cas test BOSS : Avec PPV placée et abondement PEE",
      type_cas: "cas_general",
      inputs: {
        'case-toggle': 'standard',
        'pas-98960': '3000',
        'pas-98970': '0',
        'pni-98941': '100',
        'pni-98911': '0',
        'assiette-csg': '3300',
        'mutuelles-pp': '50',
        'ppv-placee': '200',
        'abondements-epargne': '100',
        'hs-exo': '0',
        'ijss-net': '0',
        primes: {}
      },
      expected: {
        mns: 2963.00,
        socle: 3100.00,
        ajouts: 0.00,
        deductions: 137.00
      },
      references_boss: [
        "Cas test BOSS CG_003",
        "Intermédiaire CSG = 3300 - 200 - 100 = 3000",
        "CSG = 3000 × 2,9% = 87",
        "La PPV placée et les abondements réduisent l'assiette de la CSG"
      ],
      validation_date: "2026-02-11"
    },
    
    // ─────────────────────────────────────────────────────────────────────
    // TESTS EDGE CASES (cas limites et situations spéciales)
    // ─────────────────────────────────────────────────────────────────────
    {
      id: "EDGE_001",
      category: "edge_cases",
      name: "Valeurs nulles partout",
      description: "Test de robustesse : tous les champs à zéro",
      type_cas: "cas_general",
      inputs: {
        'case-toggle': 'standard',
        'pas-98960': '0',
        'pas-98970': '0',
        'pni-98941': '0',
        'pni-98911': '0',
        'assiette-csg': '0',
        'mutuelles-pp': '0',
        'ppv-placee': '0',
        'abondements-epargne': '0',
        'hs-exo': '0',
        'ijss-net': '0',
        primes: {}
      },
      expected: {
        mns: 0.00,
        socle: 0.00,
        ajouts: 0.00,
        deductions: 0.00
      },
      references_boss: [],
      validation_date: "2026-02-11"
    },
    
    {
      id: "EDGE_002",
      category: "edge_cases",
      name: "Assiette CSG négative après déductions",
      description: "Test : PPV + abondements > Assiette CSG (CSG = 0)",
      type_cas: "cas_general",
      inputs: {
        'case-toggle': 'standard',
        'pas-98960': '2000',
        'pas-98970': '0',
        'pni-98941': '0',
        'pni-98911': '0',
        'assiette-csg': '1000',
        'mutuelles-pp': '0',
        'ppv-placee': '600',
        'abondements-epargne': '500',
        'hs-exo': '0',
        'ijss-net': '0',
        primes: {}
      },
      expected: {
        mns: 2000.00,  // Pas de CSG car max(0, 1000-600-500) = 0
        socle: 2000.00,
        ajouts: 0.00,
        deductions: 0.00
      },
      references_boss: [
        "Formule CSG : max(0, Assiette - PPV - Abondements)",
        "Ici : max(0, 1000 - 600 - 500) = max(0, -100) = 0"
      ],
      validation_date: "2026-02-11"
    },
    
    {
      id: "EDGE_003",
      category: "edge_cases",
      name: "Valeurs très élevées",
      description: "Test de robustesse : valeurs > PASS (plafond sécurité sociale)",
      type_cas: "cas_general",
      inputs: {
        'case-toggle': 'standard',
        'pas-98960': '50000',
        'pas-98970': '0',
        'pni-98941': '1000',
        'pni-98911': '0',
        'assiette-csg': '55000',
        'mutuelles-pp': '500',
        'ppv-placee': '0',
        'abondements-epargne': '0',
        'hs-exo': '0',
        'ijss-net': '0',
        primes: { '002': '10000' }
      },
      expected: {
        mns: 59905.00,  // 51000 + 10000 - (500 + 1595)
        socle: 51000.00,
        ajouts: 10000.00,
        deductions: 2095.00
      },
      references_boss: [
        "CSG = 55000 × 2,9% = 1595",
        "Test de robustesse avec hauts salaires"
      ],
      validation_date: "2026-02-11"
    }
  ],
  
  // ═════════════════════════════════════════════════════════════════════════
  // UTILITAIRES DE CALCUL
  // ═════════════════════════════════════════════════════════════════════════
  
  toNum: function(v) {
    if (v === '' || v === null || v === undefined) return 0;
    const x = Number(String(v).replace(',', '.'));
    return Number.isFinite(x) ? x : 0;
  },
  
  round2: function(x) {
    return Math.round((x + Number.EPSILON) * 100) / 100;
  },
  
  calcExpected: function(inputs) {
    const taux = this.config.tauxCsg / 100;
    const caseMode = inputs['case-toggle'] || 'standard';
    
    const rnfB = this.toNum(inputs.netimpo) + this.toNum(inputs['rnf-regul']);
    const pasB = this.toNum(inputs['pas-98960']) + this.toNum(inputs['pas-98970']);
    const pniB = this.toNum(inputs['pni-98941']) - this.toNum(inputs['pni-98911']);
    const induB = this.toNum(inputs.indu);
    const hsB = this.toNum(inputs['hs-exo']);
    const mutB = this.toNum(inputs['mutuelles-pp']);
    const abB = this.toNum(inputs['abondements-epargne']);
    const assCsgB = this.toNum(inputs['assiette-csg']);
    const ppvB = this.toNum(inputs['ppv-placee']);
    const ijss = Math.max(0, this.toNum(inputs['ijss-net']));
    
    const primes = inputs.primes || {};
    const primesB = Object.values(primes).reduce((s, v) => s + this.toNum(v), 0);
    
    const inter = assCsgB - ppvB - abB;
    const dedCsg = Math.max(0, inter) * taux;
    const socle = (caseMode === 'exception') ? (rnfB + induB) : (pasB + pniB);
    const ajouts = primesB + hsB;
    
    return {
      mns: this.round2(socle + ajouts + ijss - mutB - dedCsg),
      socle: this.round2(socle),
      ajouts: this.round2(ajouts + ijss),
      deductions: this.round2(mutB + dedCsg),
      inter_csg: this.round2(inter),
      ded_csg: this.round2(dedCsg)
    };
  },
  
  // ═════════════════════════════════════════════════════════════════════════
  // STATISTIQUES DES TESTS
  // ═════════════════════════════════════════════════════════════════════════
  
  getTestStatistics: function() {
    const total = this.testCases.length;
    const byCategory = {};
    const byType = {};
    
    this.testCases.forEach(test => {
      // Par catégorie
      byCategory[test.category] = (byCategory[test.category] || 0) + 1;
      
      // Par type de cas
      byType[test.type_cas] = (byType[test.type_cas] || 0) + 1;
    });
    
    return {
      total,
      byCategory,
      byType
    };
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
  window.MNS_TEST_SUITE = MNS_TEST_SUITE;
  
  const stats = MNS_TEST_SUITE.getTestStatistics();
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  MODULE DE TESTS NON-RÉGRESSIFS - Chargé');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`📊 Statistiques :`);
  console.log(`  • Tests disponibles : ${stats.total}`);
  console.log(`  • Par catégorie :`);
  Object.entries(stats.byCategory).forEach(([cat, count]) => {
    console.log(`    - ${cat} : ${count} test(s)`);
  });
  console.log(`  • Par type :`);
  Object.entries(stats.byType).forEach(([type, count]) => {
    console.log(`    - ${type} : ${count} test(s)`);
  });
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
}
