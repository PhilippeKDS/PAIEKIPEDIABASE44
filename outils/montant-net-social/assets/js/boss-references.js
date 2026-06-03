/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RÉFÉRENCES BOSS & DSN — MONTANT NET SOCIAL (MNS)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Ce fichier centralise TOUTES les références réglementaires utilisées dans
 * le simulateur MNS. Il garantit la traçabilité, facilite la maintenance et
 * permet la génération automatique de documentation.
 * 
 * Structure :
 * - Métadonnées (dates, versions)
 * - Définitions BOSS officielles
 * - Mapping DSN → Sage → MNS
 * - Règles de calcul documentées
 * 
 * Version : 1.0.0
 * Date : 2026-02-11
 * Dernière validation réglementaire : 2026-02-06
 */

// ═══════════════════════════════════════════════════════════════════════════
// MÉTADONNÉES ET VERSIONING
// ═══════════════════════════════════════════════════════════════════════════

const METADATA = {
  version: "1.0.0",
  date_creation: "2026-02-11",
  date_derniere_validation: "2026-02-06",
  norme_dsn: "2026.1",
  sources: [
    "Cahier technique DSN 2026.1 (2025-12-24)",
    "Guide pratique DSN Net-entreprises",
    "Contrôle URSSAF DI_MNS_002",
    "BOSS (Base documentaire de la Sécurité Sociale)"
  ],
  avertissement: "Les références BOSS peuvent évoluer. Vérifier régulièrement les mises à jour sur boss.gouv.fr"
};

// ═══════════════════════════════════════════════════════════════════════════
// DÉFINITION OFFICIELLE DU MONTANT NET SOCIAL (MNS)
// ═══════════════════════════════════════════════════════════════════════════

const DEFINITION_MNS = {
  titre: "Montant Net Social (MNS)",
  source_legale: "Arrêté du 25 février 2016 modifié",
  reference_code_travail: "Article R. 3243-2",
  date_application: "2024-07-01",
  
  definition_officielle: `Le montant net social, conformément à la définition modifiant l'arrêté du 25 février 2016 fixant les libellés, l'ordre et le regroupement des informations figurant sur le bulletin de paie mentionnés à l'article R. 3243-2 du Code du travail, est une base de ressources de référence pour la sphère sociale. Le montant net social s'applique également aux revenus de remplacement pour établir une base de ressources de référence. Il est renseigné en date de versement.`,
  
  principes_cles: [
    "Base de ressources de référence pour la sphère sociale",
    "Applicable aux salariés ET aux revenus de remplacement",
    "Déclaré dans la DSN (bloc S21.G00.58.001 type 03)",
    "Utilisé pour le calcul de certaines prestations sociales"
  ],
  
  url_boss: "https://boss.gouv.fr/portail/accueil/montant-net-social.html"
};

// ═══════════════════════════════════════════════════════════════════════════
// FORMULE OFFICIELLE MNS (CONTRÔLE URSSAF DI_MNS_002)
// ═══════════════════════════════════════════════════════════════════════════

const FORMULE_URSSAF = {
  reference_controle: "DI_MNS_002",
  date_document: "2025-05",
  seuil_ecart_acceptable: 20, // %
  
  cas_general: {
    nom: "Cas général : CDD > 2 mois ou CDI",
    socle: {
      composantes: [
        "Montant soumis au PAS (S21.G00.50.013)",
        "Part non imposable du revenu (S21.G00.50.011)"
      ],
      formule: "Socle = S21.G00.50.013 + S21.G00.50.011"
    }
  },
  
  cas_particulier: {
    nom: "Cas particulier : CDD ≤ 2 mois OU RNF négative",
    socle: {
      composantes: [
        "Rémunération nette fiscale (S21.G00.50.002)",
        "Indu avec RNF négative (S21.G00.56.002 type 03)"
      ],
      formule: "Socle = S21.G00.50.002 + S21.G00.56.002 (type 03)"
    }
  },
  
  ajouts: {
    description: "Sommes à ajouter au socle",
    elements: [
      {
        libelle: "Primes, gratifications et indemnités",
        bloc_dsn: "S21.G00.52.001",
        types: ["002", "007", "008", "009", "010", "013", "014", "015", "016", "021", "045", "903"],
        note: "Certains types sont exonérés de cotisations mais entrent dans le MNS"
      },
      {
        libelle: "Heures supplémentaires/complémentaires exonérées fiscalement",
        bloc_dsn: "S21.G00.58.003",
        type: "01",
        rubrique_sage: "79900",
        note: "Montant net des HS/HC exonérées"
      },
      {
        libelle: "IJSS nettes (si subrogation employeur)",
        bloc_dsn: "S21.G00.58.003",
        type: "10",
        rubrique_sage: "84100",
        note: "Uniquement en cas de subrogation"
      }
    ]
  },
  
  deductions: {
    description: "Sommes à déduire du socle",
    elements: [
      {
        libelle: "Parts patronales de mutuelles",
        bloc_dsn: "S21.G00.54.001",
        type: "92",
        note: "Contributions employeur frais de santé"
      },
      {
        libelle: "CSG non déductible",
        calcul: "max(0, Assiette CSG - PPV placée - Abondements) × 2,9%",
        composantes: [
          {
            libelle: "Assiette CSG",
            bloc_dsn: "S21.G00.78.001",
            type: "04"
          },
          {
            libelle: "PPV placée",
            bloc_dsn: "S21.G00.52.001",
            type: "906"
          },
          {
            libelle: "Abondements plan d'épargne",
            bloc_dsn: "S21.G00.54.001",
            types: ["14", "15", "16"]
          }
        ],
        taux_legal: 2.9,
        note: "Taux CSG non déductible applicable en 2026"
      }
    ]
  },
  
  formule_finale: "MNS = Socle + Ajouts - Déductions"
};

// ═══════════════════════════════════════════════════════════════════════════
// MAPPING DÉTAILLÉ : DSN ↔ SAGE ↔ SIMULATEUR
// ═══════════════════════════════════════════════════════════════════════════

const MAPPING_DSN_SAGE = {
  
  // ─────────────────────────────────────────────────────────────────────────
  // BLOC S21.G00.50 : Versement individu (Revenu fiscal)
  // ─────────────────────────────────────────────────────────────────────────
  
  "S21.G00.50": {
    titre: "Versement individu",
    description: "Bloc central du PAS (Prélèvement à la source) et du revenu fiscal",
    url_dsn: "Cahier technique DSN 2026.1 p.244-245",
    
    rubriques: {
      "S21.G00.50.002": {
        libelle: "Rémunération nette fiscale",
        nom_variable_dsn: "VersementIndividu.NetFiscal",
        definition: "Montant total des revenus nets imposables après déduction des cotisations sociales obligatoires (sauf CSG non déductible et CRDS)",
        type_donnee: "N [4,12]",
        obligatoire: true,
        sage: {
          constante: "NETIMPO",
          note: "Accessible via la constante NETIMPO dans Sage Paie"
        },
        simulateur: {
          champ: "netimpo",
          visible_si: "cas_particulier",
          utilise_pour: "Reconstitution RNF en cas particulier"
        }
      },
      
      "S21.G00.50.011": {
        libelle: "Montant de la part non imposable du revenu",
        nom_variable_dsn: "VersementIndividu.PartNonImposable",
        definition: "Éléments non soumis à l'impôt sur le revenu (ex: fraction exonérée des HS/HC)",
        type_donnee: "N [4,12]",
        obligatoire: true,
        sage: {
          rubriques: ["98941", "98911"],
          formule: "98941 - 98911",
          note: "98941 (ajouts) - 98911 (retraits)"
        },
        simulateur: {
          champs: ["pni-98941", "pni-98911"],
          visible_si: "cas_general",
          utilise_pour: "Socle MNS (cas général)"
        }
      },
      
      "S21.G00.50.013": {
        libelle: "Montant soumis au PAS",
        nom_variable_dsn: "VersementIndividu.MontantSoumisPAS",
        definition: "Base de calcul du prélèvement à la source (= RNF + Part non imposable)",
        type_donnee: "N [4,12]",
        obligatoire: true,
        sage: {
          rubriques: ["98960", "98970"],
          formule: "98960 + 98970",
          note: "Base PAS standard (98960) + ajustements (98970)"
        },
        simulateur: {
          champs: ["pas-98960", "pas-98970"],
          visible_si: "cas_general",
          utilise_pour: "Socle MNS (cas général)"
        },
        relation_mns: "Composante principale du socle en cas général"
      }
    }
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // BLOC S21.G00.52 : Prime / gratification / indemnité
  // ─────────────────────────────────────────────────────────────────────────
  
  "S21.G00.52": {
    titre: "Prime, gratification et indemnité",
    description: "Éléments de rémunération variables ou exceptionnels",
    url_dsn: "Cahier technique DSN 2026.1",
    
    types_concernant_mns: [
      {
        type: "002",
        libelle: "Prime, gratification et indemnité",
        impact_mns: "Ajout",
        note: "Type générique pour primes diverses"
      },
      {
        type: "007",
        libelle: "Indemnité légale de licenciement",
        impact_mns: "Ajout",
        exoneration_cotisation: "Partielle (selon conditions)",
        note: "Intègre le MNS même si exonérée de cotisations"
      },
      {
        type: "008",
        libelle: "Indemnité supplémentaire légale de licenciement",
        impact_mns: "Ajout"
      },
      {
        type: "009",
        libelle: "Indemnité spéciale légale de licenciement",
        impact_mns: "Ajout"
      },
      {
        type: "010",
        libelle: "Indemnité spécifique légale de licenciement",
        impact_mns: "Ajout"
      },
      {
        type: "013",
        libelle: "Journaliste — indemnité",
        impact_mns: "Ajout"
      },
      {
        type: "014",
        libelle: "Clientèle — indemnité",
        impact_mns: "Ajout"
      },
      {
        type: "015",
        libelle: "Personnel navigant — indemnité",
        impact_mns: "Ajout"
      },
      {
        type: "016",
        libelle: "Apprenti — indemnité légale",
        impact_mns: "Ajout"
      },
      {
        type: "021",
        libelle: "Indemnité conventionnelle supplémentaire",
        impact_mns: "Ajout"
      },
      {
        type: "045",
        libelle: "Dommages et intérêts",
        impact_mns: "Ajout"
      },
      {
        type: "903",
        libelle: "Autres primes exonérées de cotisations",
        impact_mns: "Ajout",
        note: "Exonérées de cotisations mais intègrent le MNS"
      },
      {
        type: "906",
        libelle: "PPV placée",
        impact_mns: "Déduction (via calcul CSG)",
        note: "Utilisée pour réduire l'assiette CSG"
      }
    ],
    
    simulateur: {
      tableau_saisie: "primes-body",
      note: "Un champ de saisie par type de prime"
    }
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // BLOC S21.G00.54 : Cotisation individuelle
  // ─────────────────────────────────────────────────────────────────────────
  
  "S21.G00.54": {
    titre: "Cotisation individuelle",
    description: "Contributions employeur et salarié (santé, prévoyance, épargne)",
    url_dsn: "Cahier technique DSN 2026.1",
    
    types_concernant_mns: [
      {
        type: "92",
        libelle: "Parts patronales de mutuelles",
        bloc_dsn: "S21.G00.54.001",
        impact_mns: "Déduction",
        definition: "Contributions employeur destinées à financer des garanties frais de santé",
        sage: {
          note: "Somme des parts patronales mutuelle (rubriques variables selon paramétrage)"
        },
        simulateur: {
          champ: "mutuelles-pp"
        }
      },
      {
        type: "14",
        libelle: "Abondement plan épargne entreprise (PEE)",
        bloc_dsn: "S21.G00.54.001",
        impact_mns: "Déduction (via calcul CSG)",
        simulateur: {
          champ: "abondements-epargne",
          note: "À sommer avec types 15 et 16"
        }
      },
      {
        type: "15",
        libelle: "Abondement plan épargne retraite collectif (PERCO)",
        bloc_dsn: "S21.G00.54.001",
        impact_mns: "Déduction (via calcul CSG)",
        simulateur: {
          champ: "abondements-epargne"
        }
      },
      {
        type: "16",
        libelle: "Abondement plan épargne retraite entreprise (PERE)",
        bloc_dsn: "S21.G00.54.001",
        impact_mns: "Déduction (via calcul CSG)",
        simulateur: {
          champ: "abondements-epargne"
        }
      }
    ]
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // BLOC S21.G00.56 : Régularisation
  // ─────────────────────────────────────────────────────────────────────────
  
  "S21.G00.56": {
    titre: "Régularisation",
    description: "Corrections sur périodes antérieures (PAS, RNF, indus)",
    url_dsn: "Cahier technique DSN 2026.1",
    
    rubriques: {
      "S21.G00.56.002": {
        libelle: "Indu",
        types: {
          "03": {
            libelle: "Indu avec RNF négative",
            impact_mns: "Ajout au socle (cas particulier)",
            definition: "Montant d'indu lorsque la RNF est négative",
            simulateur: {
              champ: "indu",
              visible_si: "cas_particulier"
            },
            note_controle_urssaf: "Utilisé uniquement pour CDD ≤ 2 mois ou RNF négative"
          }
        }
      }
    }
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // BLOC S21.G00.58 : Élément de revenu calculé en net
  // ─────────────────────────────────────────────────────────────────────────
  
  "S21.G00.58": {
    titre: "Élément de revenu calculé en net",
    description: "Éléments spécifiques calculés en montant net (HS/HC exonérées, IJSS...)",
    url_dsn: "Cahier technique DSN 2026.1 p.264",
    
    types_concernant_mns: [
      {
        type: "01",
        libelle: "HS/HC exonérées fiscalement",
        bloc_dsn: "S21.G00.58.003",
        impact_mns: "Ajout",
        definition: "Montant net des heures supplémentaires/complémentaires exonérées d'impôt sur le revenu",
        sage: {
          rubrique: "79900",
          note: "Montant net des HS/HC exonérées"
        },
        simulateur: {
          champ: "hs-exo"
        },
        note_importante: "Depuis la norme DSN 2024, n'intègre plus S21.G00.50.002"
      },
      {
        type: "03",
        libelle: "Montant Net Social",
        bloc_dsn: "S21.G00.58.003",
        impact_mns: "Déclaration finale",
        definition: "Montant net social calculé (résultat du simulateur)",
        note: "Type utilisé pour déclarer le MNS final dans la DSN"
      },
      {
        type: "10",
        libelle: "IJSS nettes",
        bloc_dsn: "S21.G00.58.003",
        impact_mns: "Ajout",
        definition: "Indemnités journalières de sécurité sociale (subrogation employeur)",
        sage: {
          rubrique: "84100",
          note: "À renseigner uniquement en cas de subrogation"
        },
        simulateur: {
          champ: "ijss-net"
        },
        condition: "Uniquement si subrogation employeur"
      }
    ]
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // BLOC S21.G00.78 : Base assujettie
  // ─────────────────────────────────────────────────────────────────────────
  
  "S21.G00.78": {
    titre: "Base assujettie",
    description: "Assiettes de cotisations sociales",
    url_dsn: "Cahier technique DSN 2026.1",
    
    codes_concernant_mns: [
      {
        code: "04",
        libelle: "Assiette CSG",
        bloc_dsn: "S21.G00.78.001",
        impact_mns: "Déduction (via CSG non déductible)",
        definition: "Base de calcul de la CSG/CRDS",
        simulateur: {
          champ: "assiette-csg"
        },
        formule_deduction: "max(0, Assiette CSG - PPV placée - Abondements) × 2,9%"
      }
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// RÈGLES DE CALCUL DÉTAILLÉES (ALGORITHME)
// ═══════════════════════════════════════════════════════════════════════════

const REGLES_CALCUL = {
  
  etape_1_determination_socle: {
    titre: "Détermination du socle",
    description: "Le socle varie selon la nature du contrat et la situation fiscale",
    
    arbre_decision: [
      {
        condition: "Contrat CDD avec terme initial ≤ 2 mois",
        ou: "Rémunération nette fiscale (RNF) négative",
        alors: {
          type_cas: "cas_particulier",
          socle: "RNF + Indu (type 03)",
          blocs_dsn: ["S21.G00.50.002", "S21.G00.56.002"],
          formule_simulateur: "NETIMPO + rnf_regul + indu"
        }
      },
      {
        condition: "Autres situations (CDI ou CDD > 2 mois avec RNF ≥ 0)",
        alors: {
          type_cas: "cas_general",
          socle: "Base PAS + Part non imposable",
          blocs_dsn: ["S21.G00.50.013", "S21.G00.50.011"],
          formule_simulateur: "(98960 + 98970) + (98941 - 98911)"
        }
      }
    ],
    
    references: [
      "Contrôle URSSAF DI_MNS_002",
      "Cahier technique DSN 2026.1 - S21.G00.50"
    ]
  },
  
  etape_2_calcul_ajouts: {
    titre: "Calcul des ajouts",
    description: "Éléments à ajouter au socle",
    
    composantes: [
      {
        element: "Primes et indemnités",
        types_dsn: ["002", "007", "008", "009", "010", "013", "014", "015", "016", "021", "045", "903"],
        bloc_dsn: "S21.G00.52.001",
        formule: "Somme de tous les types concernés"
      },
      {
        element: "HS/HC exonérées fiscalement",
        type_dsn: "01",
        bloc_dsn: "S21.G00.58.003",
        rubrique_sage: "79900",
        formule: "Montant rubrique 79900"
      },
      {
        element: "IJSS nettes (si subrogation)",
        type_dsn: "10",
        bloc_dsn: "S21.G00.58.003",
        rubrique_sage: "84100",
        condition: "Uniquement en cas de subrogation employeur",
        formule: "Montant rubrique 84100 si subrogation"
      }
    ],
    
    formule_finale: "Ajouts = Σ Primes + HS/HC exo + IJSS (si applicable)"
  },
  
  etape_3_calcul_deductions: {
    titre: "Calcul des déductions",
    description: "Éléments à déduire du socle",
    
    composantes: [
      {
        element: "Parts patronales mutuelles",
        type_dsn: "92",
        bloc_dsn: "S21.G00.54.001",
        formule: "Montant type 92"
      },
      {
        element: "CSG non déductible",
        calcul: {
          etape_1: {
            description: "Calculer l'intermédiaire CSG",
            formule: "Intermédiaire = Assiette CSG - PPV placée - Abondements",
            blocs_dsn: {
              assiette_csg: "S21.G00.78.001 (code 04)",
              ppv_placee: "S21.G00.52.001 (type 906)",
              abondements: "S21.G00.54.001 (types 14, 15, 16)"
            }
          },
          etape_2: {
            description: "Appliquer le taux CSG non déductible",
            formule: "CSG non déductible = max(0, Intermédiaire) × 2,9%",
            taux: 2.9,
            note: "Le taux de 2,9% est le taux légal de CSG non déductible en 2026"
          }
        }
      }
    ],
    
    formule_finale: "Déductions = Mutuelles PP + CSG non déductible"
  },
  
  etape_4_calcul_final: {
    titre: "Calcul final du MNS",
    description: "Formule finale selon le cas",
    
    cas_sans_ijss: {
      formule: "MNS = Socle + Ajouts - Déductions",
      exemple: "(2000 + 150) - (50 + 58) = 2042"
    },
    
    cas_avec_ijss: {
      formule: "MNS = Socle + Ajouts + IJSS - Déductions",
      exemple: "(2000 + 150 + 100) - (50 + 58) = 2142"
    },
    
    arrondis: {
      mode_recommande: "final",
      precision: "2 décimales",
      note: "Arrondir uniquement le résultat final (ou à chaque étape selon paramètre)"
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// CAS TESTS DE VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

const CAS_TESTS = [
  {
    id: "CG_001",
    libelle: "Cas général standard - CDI sans primes",
    description: "Salarié CDI, salaire de base uniquement, pas d'éléments particuliers",
    type_cas: "cas_general",
    
    inputs: {
      "pas-98960": 2000.00,
      "pas-98970": 0.00,
      "pni-98941": 50.00,
      "pni-98911": 0.00,
      "assiette-csg": 2100.00,
      "mutuelles-pp": 30.00,
      "ppv-placee": 0.00,
      "abondements-epargne": 0.00
    },
    
    calculs_intermediaires: {
      socle: 2050.00,
      ajouts: 0.00,
      inter_csg: 2100.00,
      ded_csg: 60.90,
      deductions: 90.90
    },
    
    expected_mns: 1959.10,
    tolerance: 0.01,
    
    references_boss: [
      "Socle = S21.G00.50.013 + S21.G00.50.011",
      "Déduction CSG = (S21.G00.78.001 - S21.G00.52.001[906] - S21.G00.54.001[14,15,16]) × 2,9%",
      "Déduction mutuelles = S21.G00.54.001[92]"
    ]
  },
  
  {
    id: "CG_002",
    libelle: "Cas général avec primes et HS exonérées",
    description: "Salarié CDI avec prime exceptionnelle et heures supplémentaires exonérées",
    type_cas: "cas_general",
    
    inputs: {
      "pas-98960": 2500.00,
      "pas-98970": 0.00,
      "pni-98941": 75.00,
      "pni-98911": 0.00,
      "prime-002": 500.00,
      "hs-exo": 150.00,
      "assiette-csg": 2800.00,
      "mutuelles-pp": 45.00,
      "ppv-placee": 0.00,
      "abondements-epargne": 0.00
    },
    
    calculs_intermediaires: {
      socle: 2575.00,
      ajouts: 650.00,
      inter_csg: 2800.00,
      ded_csg: 81.20,
      deductions: 126.20
    },
    
    expected_mns: 3098.80,
    tolerance: 0.01,
    
    references_boss: [
      "Ajouts = S21.G00.52.001[002] + S21.G00.58.003[01]"
    ]
  },
  
  {
    id: "CP_001",
    libelle: "Cas particulier - CDD court (≤ 2 mois)",
    description: "Contrat CDD de 1 mois, utilisation du socle RNF + Indu",
    type_cas: "cas_particulier",
    
    inputs: {
      "netimpo": 1800.00,
      "rnf-regul": 0.00,
      "indu": 0.00,
      "assiette-csg": 1950.00,
      "mutuelles-pp": 25.00,
      "ppv-placee": 0.00,
      "abondements-epargne": 0.00
    },
    
    calculs_intermediaires: {
      rnf: 1800.00,
      socle: 1800.00,
      ajouts: 0.00,
      inter_csg: 1950.00,
      ded_csg: 56.55,
      deductions: 81.55
    },
    
    expected_mns: 1718.45,
    tolerance: 0.01,
    
    references_boss: [
      "Socle = S21.G00.50.002 + S21.G00.56.002[03]",
      "Cas particulier pour CDD ≤ 2 mois"
    ]
  },
  
  {
    id: "CG_003",
    libelle: "Cas avec PPV et abondements (réduction assiette CSG)",
    description: "Salarié avec PPV placée et abondement PEE, réduisant l'assiette CSG",
    type_cas: "cas_general",
    
    inputs: {
      "pas-98960": 3000.00,
      "pas-98970": 0.00,
      "pni-98941": 100.00,
      "pni-98911": 0.00,
      "assiette-csg": 3300.00,
      "mutuelles-pp": 50.00,
      "ppv-placee": 200.00,
      "abondements-epargne": 100.00
    },
    
    calculs_intermediaires: {
      socle: 3100.00,
      ajouts: 0.00,
      inter_csg: 3000.00, // 3300 - 200 - 100
      ded_csg: 87.00,
      deductions: 137.00
    },
    
    expected_mns: 2963.00,
    tolerance: 0.01,
    
    references_boss: [
      "Intermédiaire CSG = S21.G00.78.001[04] - S21.G00.52.001[906] - S21.G00.54.001[14,15,16]",
      "La PPV placée et les abondements réduisent l'assiette de la CSG non déductible"
    ]
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT DU MODULE
// ═══════════════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
  window.BOSS_REFERENCES = {
    metadata: METADATA,
    definition_mns: DEFINITION_MNS,
    formule_urssaf: FORMULE_URSSAF,
    mapping_dsn_sage: MAPPING_DSN_SAGE,
    regles_calcul: REGLES_CALCUL,
    cas_tests: CAS_TESTS,
    
    // Fonctions utilitaires
    getReference: function(bloc, rubrique) {
      const blocData = this.mapping_dsn_sage[bloc];
      if (!blocData) return null;
      if (rubrique && blocData.rubriques) {
        return blocData.rubriques[rubrique];
      }
      return blocData;
    },
    
    getCasTest: function(id) {
      return this.cas_tests.find(c => c.id === id);
    },
    
    getVersion: function() {
      return this.metadata.version;
    }
  };
  
  console.log('✓ Module BOSS_REFERENCES chargé - Version', METADATA.version);
}
