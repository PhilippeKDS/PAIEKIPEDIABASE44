/* =============================================================
   PaieKipédia — Réformes réglementaires
   FICHIER DE DONNÉES — NE PAS ÉCRASER lors des mises à jour

   Ce fichier est la source de vérité des fiches réformes.
   L'application le charge au démarrage et l'utilise comme
   données initiales si aucune donnée locale (localStorage)
   n'est trouvée.

   Structure d'une fiche :
   {
     id         : string  — identifiant unique (snake-case)
     titre      : string  — intitulé complet de la réforme
     statut     : "avenir" | "cours" | "traite" | "archive"
     dateEffet  : "YYYY-MM-DD" | null
     tags       : string[]
     source     : { texte: string, url: string|null }   — référence réglementaire
     impacts    : {
       sage  : { analyse: string, action: "needed"|"ok"|"na" },
       silae : { analyse: string, action: "needed"|"ok"|"na" },
       lucca : { analyse: string, action: "needed"|"ok"|"na" }
     }
     campagne   : {
       date       : "YYYY-MM-DD" | null,
       docKDS     : string | null,   — lien doc interne KDS (Teams, wiki…)
       noteClient : string | null,   — lien note ou support client
     }
   }
   ============================================================= */

/* global REFORMES_DATA */
var REFORMES_DATA = [

  // ── Passé ──────────────────────────────────────────────────
  {
    id: "smic-nov2025",
    titre: "Revalorisation SMIC — 12,02 €/h au 1er novembre 2025",
    statut: "traite",
    dateEffet: "2025-11-01",
    tags: ["SMIC", "Décret"],
    source: {
      texte: "Décret n° 2025-XXXX du 29 octobre 2025 — C. trav. art. L. 3231-1",
      url: "https://www.legifrance.gouv.fr"
    },
    impacts: {
      sage:  { analyse: "Mise à jour automatique via patch mensuel Sage.", action: "ok" },
      silae: { analyse: "Mise à jour automatique.", action: "ok" },
      lucca: { analyse: "Coût horaire à vérifier si des salariés sont valorisés au SMIC dans Lucca Time.", action: "ok" }
    },
    campagne: {
      date: "2025-11-05",
      docKDS: null,
      noteClient: "https://teams.kds.fr/notes/smic-nov2025"
    }
  },

  {
    id: "rgdu-boss-2026",
    titre: "Refonte section Présence RGDU — BOSS § 720 au 01/04/2026",
    statut: "traite",
    dateEffet: "2026-04-01",
    tags: ["RGDU", "BOSS", "Réduction générale"],
    source: {
      texte: "C. séc. soc. art. D. 241-7, IV — BOSS § 720 mis à jour au 01/04/2026",
      url: "https://boss.gouv.fr/portail/accueil/reductions-et-exonerations/reduction-generale/720-cas-particuliers.html"
    },
    impacts: {
      sage:  { analyse: "ENA à saisir manuellement — simulateur PaieKipédia disponible.", action: "ok" },
      silae: { analyse: "Module RGDU Silae mis à jour — vérifier cohérence ENA.", action: "ok" },
      lucca: { analyse: "Non concerné.", action: "na" }
    },
    campagne: {
      date: "2026-04-08",
      docKDS: null,
      noteClient: "https://teams.kds.fr/notes/rgdu-boss-avril2026"
    }
  },

  // ── En cours ───────────────────────────────────────────────
  {
    id: "lfss2026-dfp",
    titre: "Extension déduction forfaitaire patronale HS — entreprises ≥ 250 salariés",
    statut: "cours",
    dateEffet: "2026-01-01",
    tags: ["LFSS 2026", "Heures sup"],
    source: {
      texte: "LFSS 2026, art. 21 — C. séc. soc. art. L. 241-18",
      url: "https://www.legifrance.gouv.fr"
    },
    impacts: {
      sage:  { analyse: "Paramétrage déduction forfaitaire à vérifier pour les seuils ≥ 250 sal.", action: "needed" },
      silae: { analyse: "Mise à jour automatique annoncée — vérifier en production.", action: "ok" },
      lucca: { analyse: "Hors périmètre Lucca.", action: "na" }
    },
    campagne: {
      date: "2026-02-10",
      docKDS: null,
      noteClient: "https://teams.kds.fr/notes/lfss2026-dfp"
    }
  },

  {
    id: "cass-cp-hs-2026",
    titre: "Intégration des CP dans l'assiette HS — Cass. soc. 07/01/2026",
    statut: "cours",
    dateEffet: "2026-01-07",
    tags: ["Jurisprudence", "Heures sup", "Congés payés"],
    source: {
      texte: "Cass. soc. 07/01/2026 — dans la suite de Cass. soc. 10/09/2025",
      url: null
    },
    impacts: {
      sage:  { analyse: "Pas de paramétrage natif — traitement manuel ou bulletin de correction.", action: "needed" },
      silae: { analyse: "En attente de confirmation Silae sur la prise en charge.", action: "needed" },
      lucca: { analyse: "Non concerné.", action: "na" }
    },
    campagne: {
      date: null,
      docKDS: null,
      noteClient: null
    }
  },

  // ── À venir — mai 2026 ─────────────────────────────────────
  {
    id: "pas-bareme-2026",
    titre: "Nouveau barème PAS 2026 — publication BOFiP",
    statut: "avenir",
    dateEffet: "2026-05-01",
    tags: ["PAS", "BOFiP", "Barème"],
    source: {
      texte: "CGI art. 204 H — barème 2026-05-01 chargé dans params.js PaieKipédia",
      url: "https://bofip.impots.gouv.fr"
    },
    impacts: {
      sage:  { analyse: "Mise à jour déclarative DSN à vérifier après publication officielle.", action: "needed" },
      silae: { analyse: "Mise à jour prévue automatiquement à réception du fichier BOFiP.", action: "needed" },
      lucca: { analyse: "Non concerné.", action: "na" }
    },
    campagne: {
      date: null,
      docKDS: null,
      noteClient: null
    }
  },

  // ── À venir — juin 2026 ────────────────────────────────────
  {
    id: "smic-juin2026",
    titre: "Revalorisation automatique SMIC au 1er juin 2026 — confirmation chiffres définitifs INSEE le 13 mai",
    statut: "avenir",
    dateEffet: "2026-06-01",
    tags: ["SMIC", "IPC", "Revalorisation automatique", "RGDU"],
    source: {
      texte: "C. trav. art. L. 3231-4, L. 3231-5, R. 3231-2 et R. 3231-4 — résultats provisoires INSEE du 30/04/2026 (IPC hors tabac ménages 1er quintile : +2,5 % vs nov. 2025)",
      url: "https://www.insee.fr/fr/statistiques/8985365"
    },
    impacts: {
      sage:  { analyse: "Si arrêté publié : mettre à jour le SMIC dans les paramètres Sage. Important — impact RGDU : la valeur annuelle SMIC devient une somme pro rata avant/après revalorisation (art. D. 241-7, IV CSS). Attendre la position du gouvernement : un décret pourrait figer le paramètre SMIC RGDU à sa valeur du 1er janv. 2026.", action: "needed" },
      silae: { analyse: "Mise à jour automatique attendue dès publication de l'arrêté. Contrôler la prise en compte de la valeur annuelle SMIC composite pour la RGDU. Surveiller éventuel décret de neutralisation.", action: "needed" },
      lucca: { analyse: "Vérifier la valorisation horaire si des salariés sont rémunérés au SMIC dans Lucca Time.", action: "needed" }
    },
    campagne: {
      date: null,
      docKDS: null,
      noteClient: "https://www.insee.fr/fr/statistiques/8985365"
    }
  },

  // ── À venir — juillet 2026 ─────────────────────────────────
  {
    id: "aen-ve-2026",
    titre: "Abattement AEN véhicule électrique porté à 70 %",
    statut: "avenir",
    dateEffet: "2026-07-01",
    tags: ["Avantages en nature", "Véhicule électrique"],
    source: {
      texte: "Arrêté du … — BOSS AEN véhicule § … (abattement 50 % → 70 %)",
      url: "https://boss.gouv.fr"
    },
    impacts: {
      sage:  { analyse: "Taux d'abattement à modifier manuellement dans la fiche salarié.", action: "needed" },
      silae: { analyse: "Mise à jour paramétrique attendue.", action: "needed" },
      lucca: { analyse: "Lucca Notes de frais : impact sur la valorisation déclarative si AEN VE géré.", action: "needed" }
    },
    campagne: {
      date: null,
      docKDS: null,
      noteClient: null
    }
  },

  // ── À venir — novembre 2026 ────────────────────────────────
  {
    id: "agirc-2026",
    titre: "Revalorisation AGIRC-ARRCO au 01/11/2026",
    statut: "avenir",
    dateEffet: "2026-11-01",
    tags: ["AGIRC-ARRCO", "Retraite complémentaire"],
    source: {
      texte: "Accord paritaire AGIRC-ARRCO — C. trav. art. L. 921-1",
      url: null
    },
    impacts: {
      sage:  { analyse: "Tables de taux à mettre à jour après signature de l'accord paritaire.", action: "needed" },
      silae: { analyse: "Mise à jour paramétrique automatique attendue après accord.", action: "needed" },
      lucca: { analyse: "Non concerné.", action: "na" }
    },
    campagne: {
      date: null,
      docKDS: null,
      noteClient: null
    }
  },

  // ── À venir — 2027 ─────────────────────────────────────────
  {
    id: "naf2025-ape2027",
    titre: "Nouvelle nomenclature NAF 2025 — changement code APE en DSN et bulletins",
    statut: "avenir",
    dateEffet: "2027-01-01",
    tags: ["NAF 2025", "Code APE", "DSN", "Fiche établissement"],
    source: {
      texte: "Décret n° 2025-XXXX — remplacement NAF rév. 2 par NAF 2025 au 1er janv. 2027",
      url: "https://www.legifrance.gouv.fr"
    },
    impacts: {
      sage:  { analyse: "Mettre à jour le code APE dans chaque fiche établissement/société avant le 1er janv. 2027. Le code s'affiche sur les bulletins et est transmis en DSN. Évaluer les changements NAF rév. 2 → NAF 2025 pour chaque dossier.", action: "needed" },
      silae: { analyse: "Mise à jour du code APE dans les paramètres de chaque dossier. Évaluer les impacts sur les règles de cotisation ou exonérations liées au code NAF.", action: "needed" },
      lucca: { analyse: "Code APE non géré dans Lucca — impact paie uniquement.", action: "na" }
    },
    campagne: {
      date: null,
      docKDS: null,
      noteClient: null
    }
  },

  {
    id: "index-egalite-2027",
    titre: "Réforme Index Égalité F/H — transposition directive transparence salariale (loi du 7 juin 2026, application 2027)",
    statut: "avenir",
    dateEffet: "2027-01-01",
    tags: ["Index Égalité F/H", "Directive européenne", "DSN", "≥ 50 salariés"],
    source: {
      texte: "Directive UE 2023/970 du 10/05/2023 — Loi de transposition publiée le 7 juin 2026 — C. trav. art. L. 1142-8",
      url: "https://www.legifrance.gouv.fr"
    },
    impacts: {
      sage:  { analyse: "7 nouveaux indicateurs : écarts de rémunération moyen et médian (global et par catégorie), proportion de femmes/hommes recevant primes, augmentations, promotions. Les 6 premiers automatisés via DSN. Seuil maintenu à 50 salariés. Amendes admin. en cas de non-conformité. Surveiller les mises à jour Sage.", action: "needed" },
      silae: { analyse: "Automatisation des 6 premiers indicateurs via DSN prévue. Suivre les notes de version Silae pour la prise en charge des nouveaux exports.", action: "needed" },
      lucca: { analyse: "Lucca peut contribuer aux données de paie variables (primes, augmentations). Vérifier la compatibilité avec le nouveau dispositif d'index.", action: "needed" }
    },
    campagne: {
      date: null,
      docKDS: null,
      noteClient: null
    }
  },

  {
    id: "dpae-dsn-2027",
    titre: "DPAE via DSN — nouvelle modalité déclarative (optionnelle au lancement)",
    statut: "avenir",
    dateEffet: "2027-01-01",
    tags: ["DPAE", "DSN", "CDI", "CDD"],
    source: {
      texte: "C. trav. art. L. 1221-10 — norme DSN évolution 2027 (Net Entreprises)",
      url: "https://www.net-entreprises.fr"
    },
    impacts: {
      sage:  { analyse: "CDI/CDD uniquement, régime général au départ. Déclaration toujours avant embauche (J-8). Retour employeur via CRM XML. Optionnel au lancement — canaux actuels maintenus. Surveiller la mise à jour Sage.", action: "needed" },
      silae: { analyse: "Même périmètre. Optionnel au démarrage. Suivre les releases Silae pour activation de la fonctionnalité.", action: "needed" },
      lucca: { analyse: "Non concerné (hors périmètre paie/déclaratif).", action: "na" }
    },
    campagne: {
      date: null,
      docKDS: null,
      noteClient: null
    }
  },

  {
    id: "spst-dsn-2027",
    titre: "SPST en DSN mensuelle — déclaration obligatoire norme P27V01 (janvier 2027)",
    statut: "avenir",
    dateEffet: "2027-01-01",
    tags: ["SPST", "DSN", "Norme P27V01", "Santé au travail", "Arrêts de travail", "Désinsertion professionnelle"],
    source: {
      texte: "Loi n° 2021-1018 du 2 août 2021, art. 19 — Fiche consigne n° 3370, net-entreprises.fr, créée le 11/03/2026",
      url: "https://www.net-entreprises.fr"
    },
    impacts: {
      sage: {
        analyse: "Onglet Service de Santé au Travail de la fiche établissement existe déjà, mais le champ code est libre (risque d'erreur de codification). Attendre la V8.10 : Sage devrait proposer une liste déroulante alimentée par le référentiel sst_dpae URSSAF. La gestion des blocs S20.G00.07 (coordonnées contact médecine du travail) et S21.G00.30.030 (SPST niveau individu) reste à confirmer en V8.10. Ne rien paramétrer avant la V8.10.",
        action: "needed"
      },
      silae: {
        analyse: "Architecture déclarative Silae semble outillée pour les blocs concernés, hormis les 3 infos de contact SPST autonome (nom/prénom, téléphone, e-mail habilité données médicales). Interface de saisie et calendrier à confirmer. Surveiller les communications Silae.",
        action: "needed"
      },
      lucca: { analyse: "Non concerné.", action: "na" }
    },
    campagne: {
      date: null,
      docKDS: null,
      noteClient: null
    }
  },

  {
    id: "forfait-jours-reduit-p27v01",
    titre: "Proratisation plafond SS et forfait jours réduit — nouvelle rubrique DSN S21.G00.40.084 norme P27V01",
    statut: "avenir",
    dateEffet: "2027-01-01",
    tags: ["Forfait jours réduit", "Temps partiel", "Plafond Sécurité sociale", "Proratisation", "DSN", "Norme P27V01", "Rubrique S21.G00.40.084"],
    source: {
      texte: "GIP-MDS, fiche consigne n° 3369, net-entreprises.fr, créée le 10/03/2026 — C. trav. art. L. 3121-58 et s.",
      url: "https://www.net-entreprises.fr"
    },
    impacts: {
      sage: {
        analyse: "Nouvelle rubrique S21.G00.40.084 à alimenter (Oui/Non) : proratisation du plafond SS à hauteur de la quotité de travail. Concerne temps partiel ET forfait jours réduit (déclaré à temps plein, modalité 10). Forfait jours réduit avec prorata : accord salarié obligatoire. Temps partiel sans prorata : exceptions admises (décision générale employeur, situations spécifiques doctrine BOSS) — pas de choix individuel libre. Sage : attendre clarification éditeur sur implémentation de la rubrique.",
        action: "needed"
      },
      silae: {
        analyse: "Même rubrique S21.G00.40.084. Sur Silae, probablement pas de changement majeur sauf formalisation plus précise des choix de prorata dans la fiche salarié. Surveiller les communications Silae. Pas d'action immédiate — intégration norme P27V01 à la charge de l'éditeur.",
        action: "needed"
      },
      lucca: {
        analyse: "Forfait jours géré dans Lucca Time — vérifier la cohérence de la configuration (plafond avec ou sans prorata) avec la position déclarée en DSN.",
        action: "needed"
      }
    },
    campagne: {
      date: null,
      docKDS: null,
      noteClient: null
    }
  },

  // ── Juin 2026 ──────────────────────────────────────────────

  {
    id: "smic-juin2026",
    titre: "Revalorisation SMIC — 12,31 €/h au 1er juin 2026 (+2,41 %)",
    statut: "cours",
    dateEffet: "2026-06-01",
    tags: ["SMIC", "Arrêté", "Minimum garanti", "Revalorisation automatique"],
    source: {
      texte: "Arrêté du 22 mai 2026, texte 12, JO du 24 — C. trav. art. L. 3231-1",
      url: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000054126589"
    },
    impacts: {
      sage: {
        analyse: "Mise à jour du taux horaire SMIC à 12,31 € via patch mensuel Sage (juin 2026). Vérifier également le SMIC mensuel 35h à 1 867,02 € et le minimum garanti à 4,35 €. Contrôler les salariés rémunérés au SMIC ou dont la rémunération était inférieure au nouveau plancher.",
        action: "needed"
      },
      silae: {
        analyse: "Mise à jour automatique attendue. Vérifier que le paramètre SMIC est bien à 12,31 € dans les paramètres généraux. Contrôler les bulletins de juin pour les salariés au voisinage du SMIC.",
        action: "needed"
      },
      lucca: {
        analyse: "Vérifier le coût horaire paramétré dans Lucca Time pour les salariés valorisés au SMIC. Minimum garanti à mettre à jour si utilisé pour l'avantage en nature nourriture.",
        action: "needed"
      }
    },
    campagne: {
      date: null,
      docKDS: null,
      noteClient: null
    }
  },

  {
    id: "rgdu-gel-smic-juin2026",
    titre: "RGDU — Gel du paramètre SMIC malgré la hausse du 1er juin 2026",
    statut: "cours",
    dateEffet: "2026-06-01",
    tags: ["RGDU", "SMIC", "Allègements patronaux", "Gel paramètre", "Décret attendu"],
    source: {
      texte: "Annonce ministère de l'Action et des comptes publics du 22 mai 2026 — Décret à paraître",
      url: null
    },
    impacts: {
      sage: {
        analyse: "Le coefficient de la RGDU continuera à se calculer en fonction du SMIC au 1er janvier 2026 (12,02 €), malgré la hausse au 1er juin 2026. Attendre la publication du décret avant toute mise à jour du paramètre SMIC dans Sage. NE PAS mettre à jour le paramètre SMIC de la RGDU à 12,31 € dans l'attente du décret.",
        action: "needed"
      },
      silae: {
        analyse: "Même principe : le SMIC de référence pour la RGDU reste gelé à 12,02 €. Surveiller les communications Silae et attendre le décret avant toute modification du paramètre SMIC RGDU.",
        action: "needed"
      },
      lucca: {
        analyse: "Non directement concerné pour le calcul RGDU (calcul en paie). Lucca Cleemy/Poplee : pas d'impact sur ce point.",
        action: "na"
      }
    },
    campagne: {
      date: null,
      docKDS: null,
      noteClient: null
    }
  },

  {
    id: "pas-contrats-courts-juin2026",
    titre: "PAS — Abattement contrats courts et seuil apprentis/stagiaires au 1er juin 2026",
    statut: "cours",
    dateEffet: "2026-06-01",
    tags: ["PAS", "Prélèvement à la source", "Contrats courts", "CDD", "Apprentis", "Stagiaires", "SMIC"],
    source: {
      texte: "GIP-MDS actualité du 27 mai 2026 — fiche consigne DSN n° 2454 — BOFiP-IR-PAS-20-20-30-10-§ 260 — BOFiP-IR-PAS-20-10-10-§ 20",
      url: "https://www.net-entreprises.fr"
    },
    impacts: {
      sage: {
        analyse: "Abattement ½ SMIC contrats courts : passe de 748 € à 766 € au 1er juin 2026. Tolérance : 748 € admis sur toute l'année 2026 (simplification BOFiP). Seuil exonération IR apprentis/stagiaires : 22 184 € (proratisé) ou 21 876 € par tolérance. Vérifier le paramétrage PAS dans Sage pour les contrats courts et les apprentis si ces valeurs sont saisies manuellement.",
        action: "needed"
      },
      silae: {
        analyse: "Vérifier que Silae intègre automatiquement la mise à jour de l'abattement ½ SMIC et du seuil apprentis. En pratique, la tolérance (748 € / 21 876 €) peut être conservée sur toute l'année 2026 sans risque.",
        action: "needed"
      },
      lucca: {
        analyse: "Non concerné directement (PAS calculé en paie, pas dans Lucca).",
        action: "na"
      }
    },
    campagne: {
      date: null,
      docKDS: null,
      noteClient: null
    }
  }

]; // fin REFORMES_DATA
