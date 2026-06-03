/**
 * PaieKipédia — params.js
 * ═══════════════════════════════════════════════════════════════════════
 * Source de vérité unique pour TOUTES les valeurs chiffrées du mémo paie.
 *
 * PRINCIPE DE VERSIONING
 * ─────────────────────
 * Chaque paramètre contient un tableau `versions` trié par date d'effet.
 * La version active est la plus récente dont `from` ≤ date du jour.
 * Les versions futures (from > aujourd'hui) sont stockées mais inactives.
 *
 * AJOUTER UNE FUTURE VALEUR
 * ─────────────────────────
 * 1. Ajouter un objet dans le tableau `versions` du paramètre concerné
 * 2. Renseigner `from` avec la date d'entrée en vigueur (YYYY-MM-DD)
 * 3. Renseigner `sourceRef` et `sourceUrl` dès que le texte est publié
 * 4. La valeur sera automatiquement activée à partir de cette date
 *
 * UTILISATION
 * ──────────────────────────────────────────────────────────────────────
 *   // Valeur en vigueur aujourd'hui
 *   PARAMS.resolve("smic.hourly")              // → 12.02
 *
 *   // Valeur à une date passée
 *   PARAMS.resolve("smic.hourly", "2024-01-01") // → 11.65
 *
 *   // Valeur future (1er mai 2026)
 *   PARAMS.resolve("pas.neutral_rates", "2026-05-01")
 *
 *   // Toutes les versions d'un paramètre
 *   PARAMS.versions("smic.hourly")
 *
 *   // Toutes les dates de changement (pour le sélecteur)
 *   PARAMS.allDates()
 *
 * ═══════════════════════════════════════════════════════════════════════
 * Généré le 2026-04-20 — Ne pas modifier manuellement les données.
 * Mettre à jour en ajoutant des versions, jamais en écrasant l'existant.
 * ═══════════════════════════════════════════════════════════════════════
 */

"use strict";

window.PARAMS = (function() {

  // ── Données ──────────────────────────────────────────────────────────

  const DATA = {

    // ────────────────────────────────────────────────────────────
    // SMIC & Minimum garanti
    // ────────────────────────────────────────────────────────────

    "smic.hourly": {
      "label": "SMIC horaire brut",
      "unit":  "€",
      "versions": [
        {
          "from":      "2023-01-01",
          "value":     11.27,
          "sourceRef": "Décret SMIC — Légifrance",
          "sourceUrl": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053042520"
        },
        {
          "from":      "2023-05-01",
          "value":     11.52,
          "sourceRef": "Décret SMIC — Légifrance",
          "sourceUrl": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053042520"
        },
        {
          "from":      "2024-01-01",
          "value":     11.65,
          "sourceRef": "Décret SMIC — Légifrance",
          "sourceUrl": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053042520"
        },
        {
          "from":      "2024-11-01",
          "value":     11.88,
          "sourceRef": "Décret SMIC — Légifrance",
          "sourceUrl": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053042520"
        },
        {
          "from":      "2026-01-01",
          "value":     12.02,
          "sourceRef": "Décret SMIC — Légifrance",
          "sourceUrl": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053042520"
        },
        {
          "from":      "2026-06-01",
          "value":     12.31,
          "sourceRef": "Arrêté du 22 mai 2026, JO du 24 — Revalorisation automatique (+2,41 %)",
          "sourceUrl": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000054126589"
        }
      ]
    },
    "smic.monthly_35h": {
      "label": "SMIC mensuel (35h)",
      "unit":  "€",
      "versions": [
        {
          "from":      "2023-01-01",
          "value":     1709.28,
          "sourceRef": "Décret SMIC — Légifrance",
          "sourceUrl": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053042520"
        },
        {
          "from":      "2023-05-01",
          "value":     1747.2,
          "sourceRef": "Décret SMIC — Légifrance",
          "sourceUrl": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053042520"
        },
        {
          "from":      "2024-01-01",
          "value":     1766.92,
          "sourceRef": "Décret SMIC — Légifrance",
          "sourceUrl": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053042520"
        },
        {
          "from":      "2024-11-01",
          "value":     1801.8,
          "sourceRef": "Décret SMIC — Légifrance",
          "sourceUrl": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053042520"
        },
        {
          "from":      "2026-01-01",
          "value":     1823.03,
          "sourceRef": "Décret SMIC — Légifrance",
          "sourceUrl": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053042520"
        },
        {
          "from":      "2026-06-01",
          "value":     1867.02,
          "sourceRef": "Arrêté du 22 mai 2026, JO du 24 — Revalorisation automatique (+2,41 %)",
          "sourceUrl": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000054126589"
        }
      ]
    },
    "smic.revalo_note": {
      "label": "Revalorisation",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     "+1,18% vs nov. 2024",
          "sourceRef": "Décret SMIC — Légifrance",
          "sourceUrl": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053042520"
        },
        {
          "from":      "2026-06-01",
          "value":     "+2,41% vs jan. 2026 — revalorisation automatique (IPC +2%)",
          "sourceRef": "Arrêté du 22 mai 2026, JO du 24",
          "sourceUrl": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000054126589"
        }
      ]
    },
    "smic.minimum_guaranteed": {
      "label": "Minimum garanti",
      "unit":  "€",
      "versions": [
        {
          "from":      "2023-01-01",
          "value":     4.01,
          "sourceRef": "Décret SMIC — Légifrance",
          "sourceUrl": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053042520"
        },
        {
          "from":      "2023-05-01",
          "value":     4.1,
          "sourceRef": "Décret SMIC — Légifrance",
          "sourceUrl": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053042520"
        },
        {
          "from":      "2024-01-01",
          "value":     4.15,
          "sourceRef": "Décret SMIC — Légifrance",
          "sourceUrl": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053042520"
        },
        {
          "from":      "2024-11-01",
          "value":     4.22,
          "sourceRef": "Décret SMIC — Légifrance",
          "sourceUrl": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053042520"
        },
        {
          "from":      "2026-01-01",
          "value":     4.25,
          "sourceRef": "Décret SMIC — Légifrance",
          "sourceUrl": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053042520"
        },
        {
          "from":      "2026-06-01",
          "value":     4.35,
          "sourceRef": "Arrêté du 22 mai 2026, JO du 24 — Revalorisation concomitante au SMIC",
          "sourceUrl": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000054126589"
        }
      ]
    },


    // ────────────────────────────────────────────────────────────
    // Plafonds de la Sécurité sociale
    // ────────────────────────────────────────────────────────────

    "pss.hourly": {
      "label": "Plafond horaire",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     30,
          "sourceRef": "Arrêté PASS — Légifrance",
          "sourceUrl": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053143451"
        }
      ]
    },
    "pss.daily": {
      "label": "Plafond journalier",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     220,
          "sourceRef": "Arrêté PASS — Légifrance",
          "sourceUrl": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053143451"
        }
      ]
    },
    "pss.pmss": {
      "label": "Plafond mensuel (PMSS)",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     4005,
          "sourceRef": "Arrêté PASS — Légifrance",
          "sourceUrl": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053143451"
        }
      ]
    },
    "pss.quarterly": {
      "label": "Plafond trimestriel",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     12015,
          "sourceRef": "Arrêté PASS — Légifrance",
          "sourceUrl": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053143451"
        }
      ]
    },
    "pss.pass": {
      "label": "Plafond annuel (PASS)",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     48060,
          "sourceRef": "Arrêté PASS — Légifrance",
          "sourceUrl": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053143451"
        }
      ]
    },
    "pss.revalo_note": {
      "label": "Revalorisation",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     "+2% vs 2025 (PASS 2025 : 47 100 €)",
          "sourceRef": "Arrêté PASS — Légifrance",
          "sourceUrl": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053143451"
        }
      ]
    },
    "pss.pmss_mayotte": {
      "label": "Plafond mensuel (PMSS) - Mayotte",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     3022,
          "sourceRef": "Arrêté PASS — Légifrance",
          "sourceUrl": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053143451"
        }
      ]
    },


    // ────────────────────────────────────────────────────────────
    // Avantages en nature
    // ────────────────────────────────────────────────────────────

    "aen.meal.general.1": {
      "label": "Nourriture (cas général) — 1 repas",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     5.5,
          "sourceRef": "BOSS — Avantages en nature",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/avantages-en-nature.html"
        }
      ]
    },
    "aen.meal.general.2": {
      "label": "Nourriture (cas général) — 2 repas",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     11.0,
          "sourceRef": "BOSS — Avantages en nature",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/avantages-en-nature.html"
        }
      ]
    },
    "aen.meal.hcr.1": {
      "label": "Nourriture (secteur HCR) — 1 repas",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     4.25,
          "sourceRef": "BOSS — Avantages en nature",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/avantages-en-nature.html"
        }
      ]
    },
    "aen.meal.hcr.2": {
      "label": "Nourriture (secteur HCR) — 2 repas",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     8.5,
          "sourceRef": "BOSS — Avantages en nature",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/avantages-en-nature.html"
        }
      ]
    },
    "aen.logement.brackets": {
      "label": "Logement — barème mensuel",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     [
                    {
                              "range": "< 2 002,50 €",
                              "one_room": 79.7,
                              "multi_room": 42.6
                    },
                    {
                              "range": "2 002,50 € – 2 402,99 €",
                              "one_room": 93.0,
                              "multi_room": 59.7
                    },
                    {
                              "range": "2 403,00 € – 2 803,49 €",
                              "one_room": 106.2,
                              "multi_room": 79.7
                    },
                    {
                              "range": "2 803,50 € – 3 604,49 €",
                              "one_room": 119.4,
                              "multi_room": 99.5
                    },
                    {
                              "range": "3 604,50 € – 4 405,49 €",
                              "one_room": 146.4,
                              "multi_room": 126.1
                    },
                    {
                              "range": "4 405,50 € – 5 206,49 €",
                              "one_room": 172.6,
                              "multi_room": 152.4
                    },
                    {
                              "range": "5 206,50 € – 6 007,49 €",
                              "one_room": 199.4,
                              "multi_room": 185.7
                    },
                    {
                              "range": "≥ 6 007,50 €",
                              "one_room": 225.6,
                              "multi_room": 212.3
                    }
          ],
          "sourceRef": "BOSS — Avantages en nature",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/avantages-en-nature.html"
        }
      ]
    },
    "aen.vehicle.purchased.no_fuel.le5": {
      "label": "Véhicule acheté (sans carburant) — ≤ 5 ans",
      "unit":  "% prix TTC",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     15,
          "sourceRef": "BOSS — Avantages en nature",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/avantages-en-nature.html"
        }
      ]
    },
    "aen.vehicle.purchased.no_fuel.gt5": {
      "label": "Véhicule acheté (sans carburant) — > 5 ans",
      "unit":  "% prix TTC",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     10,
          "sourceRef": "BOSS — Avantages en nature",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/avantages-en-nature.html"
        }
      ]
    },
    "aen.vehicle.purchased.fuel.le5": {
      "label": "Véhicule acheté (avec carburant) — ≤ 5 ans",
      "unit":  "% prix TTC",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     20,
          "sourceRef": "BOSS — Avantages en nature",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/avantages-en-nature.html"
        }
      ]
    },
    "aen.vehicle.purchased.fuel.gt5": {
      "label": "Véhicule acheté (avec carburant) — > 5 ans",
      "unit":  "% prix TTC",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     15,
          "sourceRef": "BOSS — Avantages en nature",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/avantages-en-nature.html"
        }
      ]
    },
    "aen.vehicle.leased.no_fuel": {
      "label": "Véhicule loué (sans carburant)",
      "unit":  "% coût global",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     50,
          "sourceRef": "BOSS — Avantages en nature",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/avantages-en-nature.html"
        }
      ]
    },
    "aen.vehicle.leased.fuel": {
      "label": "Véhicule loué (avec carburant)",
      "unit":  "% coût global",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     67,
          "sourceRef": "BOSS — Avantages en nature",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/avantages-en-nature.html"
        }
      ]
    },
    "aen.ev.abatement_2020_2025": {
      "label": "Véhicule 100% électrique — abattement 50% plafonné (mise à dispo 01/01/2020→31/01/2025)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     "50% (plafonné à 2 026,30 € / an)",
          "sourceRef": "BOSS — Avantages en nature",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/avantages-en-nature.html"
        }
      ]
    },
    "aen.ev.abatement_2025_2027": {
      "label": "Véhicules 100% électriques — abattement 01/02/2025→31/12/2027",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     "70% (plafonné à 4 641,60 € / an)",
          "sourceRef": "BOSS — Avantages en nature",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/avantages-en-nature.html"
        }
      ]
    },
    "aen.ev.conditions": {
      "label": "Conditions abattement renforcé (depuis 01/02/2025)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     [
                    "Véhicule exclusivement électrique",
                    "Score environnemental ≥ 60 (éligible bonus écologique)",
                    "Frais d'électricité payés par l'employeur non pris en compte dans le calcul"
          ],
          "sourceRef": "BOSS — Avantages en nature",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/avantages-en-nature.html"
        }
      ]
    },
    "aen.charging.workplace": {
      "label": "Borne au travail",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     "0 € (exonéré, électricité incluse)",
          "sourceRef": "BOSS — Avantages en nature",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/avantages-en-nature.html"
        }
      ]
    },
    "aen.charging.home": {
      "label": "Borne au domicile (achat/installation non restituée)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     "Si la borne (achat+installation au domicile) n’est pas restituée : exonération dans la limite de 50% des dépenses réelles plafonné à 1 057,10 € (75% plafonné à 1 585,50 € si borne > 5 ans).",
          "sourceRef": "BOSS — Avantages en nature",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/avantages-en-nature.html"
        }
      ]
    },


    // ────────────────────────────────────────────────────────────
    // Frais professionnels
    // ────────────────────────────────────────────────────────────

    "fp.small.meal_workplace": {
      "label": "Restauration sur le lieu de travail",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     7.5,
          "sourceRef": "BOSS — Frais professionnels",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/frais-professionnels.html"
        }
      ]
    },
    "fp.small.meal_restaurant": {
      "label": "Repas au restaurant (contrainte professionnelle)",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     21.4,
          "sourceRef": "BOSS — Frais professionnels",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/frais-professionnels.html"
        }
      ]
    },
    "fp.small.meal_offsite": {
      "label": "Restauration hors locaux de l'entreprise",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     10.4,
          "sourceRef": "BOSS — Frais professionnels",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/frais-professionnels.html"
        }
      ]
    },
    "fp.large.meal.paris": {
      "label": "Grands déplacements — repas (Paris & IDF)",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     21.4,
          "sourceRef": "BOSS — Frais professionnels",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/frais-professionnels.html"
        }
      ]
    },
    "fp.large.meal.other": {
      "label": "Grands déplacements — repas (autres départements)",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     21.4,
          "sourceRef": "BOSS — Frais professionnels",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/frais-professionnels.html"
        }
      ]
    },
    "fp.large.lodging_breakfast.paris": {
      "label": "Grands déplacements — logement + petit-déjeuner (Paris & IDF)",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     76.6,
          "sourceRef": "BOSS — Frais professionnels",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/frais-professionnels.html"
        }
      ]
    },
    "fp.large.lodging_breakfast.other": {
      "label": "Grands déplacements — logement + petit-déjeuner (autres départements)",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     56.8,
          "sourceRef": "BOSS — Frais professionnels",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/frais-professionnels.html"
        }
      ]
    },
    "fp.large.abatement.3m_2y": {
      "label": "Abattement (3 mois → 2 ans)",
      "unit":  "%",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     15,
          "sourceRef": "BOSS — Frais professionnels",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/frais-professionnels.html"
        }
      ]
    },
    "fp.large.abatement.2y_6y": {
      "label": "Abattement (2 ans → 6 ans)",
      "unit":  "%",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     30,
          "sourceRef": "BOSS — Frais professionnels",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/frais-professionnels.html"
        }
      ]
    },
    "fp.cadeaux.plafond": {
      "label": "Chèques et bons cadeaux — plafond annuel d'exonération",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     200.25,
          "sourceRef": "URSSAF — Cadeaux et bons d'achat 2026",
          "sourceUrl": "https://www.urssaf.fr/accueil/employeur/cotisations/avantages-en-nature/cadeaux-bons-achat.html"
        }
      ]
    },
    "tr.employer_min": {
      "label": "Titres-restaurant — part patronale minimale",
      "unit":  "%",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     50,
          "sourceRef": "BOSS — Titres-restaurant",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/frais-professionnels.html"
        }
      ]
    },
    "tr.employer_max": {
      "label": "Titres-restaurant — part patronale maximale",
      "unit":  "%",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     60,
          "sourceRef": "BOSS — Titres-restaurant",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/frais-professionnels.html"
        }
      ]
    },
    "tr.exempt_cap": {
      "label": "Titres-restaurant — plafond exonération par titre",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     7.32,
          "sourceRef": "BOSS — Titres-restaurant",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/frais-professionnels.html"
        }
      ]
    },
    "tr.employee_share": {
      "label": "Titres-restaurant — part salariale (reste à charge)",
      "unit":  "%",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     "40% à 50%",
          "sourceRef": "BOSS — Titres-restaurant",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/frais-professionnels.html"
        }
      ]
    },
    "tr.examples": {
      "label": "Titres-restaurant — exemples (valeur faciale → exonéré)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     [
                    {
                              "face": 10.0,
                              "exempt": 5.5
                    },
                    {
                              "face": 12.0,
                              "exempt": 6.6
                    },
                    {
                              "face": 13.0,
                              "exempt": 7.15
                    },
                    {
                              "face": 15.0,
                              "exempt": 7.32
                    }
          ],
          "sourceRef": "BOSS — Titres-restaurant",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/frais-professionnels.html"
        }
      ]
    },
    "ik.rules": {
      "label": "Indemnités kilométriques (voiture)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     {
                    "threshold1": 5000,
                    "threshold2": 20000,
                    "bands": [
                              {
                                        "label": "≤ 3 CV",
                                        "key": "le3",
                                        "t1": {
                                                  "k": 0.529,
                                                  "b": 0
                                        },
                                        "t2": {
                                                  "k": 0.316,
                                                  "b": 1065
                                        },
                                        "t3": {
                                                  "k": 0.37,
                                                  "b": 0
                                        }
                              },
                              {
                                        "label": "4 CV",
                                        "key": "4",
                                        "t1": {
                                                  "k": 0.606,
                                                  "b": 0
                                        },
                                        "t2": {
                                                  "k": 0.34,
                                                  "b": 1330
                                        },
                                        "t3": {
                                                  "k": 0.407,
                                                  "b": 0
                                        }
                              },
                              {
                                        "label": "5 CV",
                                        "key": "5",
                                        "t1": {
                                                  "k": 0.636,
                                                  "b": 0
                                        },
                                        "t2": {
                                                  "k": 0.357,
                                                  "b": 1395
                                        },
                                        "t3": {
                                                  "k": 0.427,
                                                  "b": 0
                                        }
                              },
                              {
                                        "label": "6 CV",
                                        "key": "6",
                                        "t1": {
                                                  "k": 0.665,
                                                  "b": 0
                                        },
                                        "t2": {
                                                  "k": 0.374,
                                                  "b": 1457
                                        },
                                        "t3": {
                                                  "k": 0.447,
                                                  "b": 0
                                        }
                              },
                              {
                                        "label": "≥ 7 CV",
                                        "key": "ge7",
                                        "t1": {
                                                  "k": 0.697,
                                                  "b": 0
                                        },
                                        "t2": {
                                                  "k": 0.394,
                                                  "b": 1515
                                        },
                                        "t3": {
                                                  "k": 0.47,
                                                  "b": 0
                                        }
                              }
                    ]
          },
          "sourceRef": "DGFiP — Brochure pratique 2026 (p.109) — Barèmes inchangés pour la 4e année consécutive (BOFiP non encore mis à jour)",
          "sourceUrl": "https://www.impots.gouv.fr/www2/fichiers/documentation/brochure/ir_2026/accueil.htm"
        }
      ]
    },
    "ik.ev.bonus": {"label":"IK VE +20%","unit":"","versions":[{"from":"2026-01-01","value":"+20% sur les taux du barème","sourceRef":"DGFiP Barème kilo 2026","sourceUrl":"https://bofip.impots.gouv.fr/bofip/2185-PGP.html"}]},
    "frais.teletravail.forfait_1j_semaine_accord": {
      "label": "Télétravail — allocation forfaitaire (1j/sem) — accord/groupe",
      "unit":  "€/mois",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     13.2,
          "sourceRef": "BOSS — Frais professionnels",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/frais-professionnels.html"
        }
      ]
    },
    "frais.teletravail.forfait_1j_semaine": {
      "label": "Télétravail — allocation forfaitaire (1j/sem) — autres cas",
      "unit":  "€/mois",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     11.0,
          "sourceRef": "BOSS — Frais professionnels",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/frais-professionnels.html"
        }
      ]
    },
    "frais.teletravail.forfait_par_jour_accord": {
      "label": "Télétravail — allocation forfaitaire (par jour) — accord/groupe",
      "unit":  "€/jour",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     3.3,
          "sourceRef": "BOSS — Frais professionnels",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/frais-professionnels.html"
        }
      ]
    },
    "frais.teletravail.reel_par_jour": {
      "label": "Télétravail — allocation forfaitaire (par jour) — autres cas",
      "unit":  "€/jour",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     2.7,
          "sourceRef": "BOSS — Frais professionnels",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/frais-professionnels.html"
        }
      ]
    },
    "frais.teletravail.plafond_mensuel_accord": {
      "label": "Télétravail — plafond mensuel (par jour) — accord/groupe",
      "unit":  "€/mois",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     72.6,
          "sourceRef": "BOSS — Frais professionnels",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/frais-professionnels.html"
        }
      ]
    },
    "frais.teletravail.plafond_mensuel": {
      "label": "Télétravail — plafond mensuel (par jour) — autres cas",
      "unit":  "€/mois",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     59.4,
          "sourceRef": "BOSS — Frais professionnels",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/frais-professionnels.html"
        }
      ]
    },
    "frais.ntic.plafond_mensuel": {
      "label": "Outils NTIC — plafond",
      "unit":  "€/mois",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     55.2,
          "sourceRef": "BOSS — Frais professionnels",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/frais-professionnels.html"
        }
      ]
    },


    // ────────────────────────────────────────────────────────────
    // Réduction générale (RGDU)
    // ────────────────────────────────────────────────────────────

    "rgdu.reduc_max.lt50": {
      "label": "RGDU — réduction maximale (< 50)",
      "unit":  "%",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     39.81,
          "sourceRef": "BOSS — Réduction générale dégressive unique (RGDU), opposable au 01/04/2026",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/reduction-generale-degressive-unique.html"
        }
      ]
    },
    "rgdu.reduc_max.ge50": {
      "label": "RGDU — réduction maximale (≥ 50)",
      "unit":  "%",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     40.21,
          "sourceRef": "BOSS — Réduction générale dégressive unique (RGDU), opposable au 01/04/2026",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/reduction-generale-degressive-unique.html"
        }
      ]
    },
    "rgdu.tdelta.lt50": {
      "label": "RGDU — Tdelta (< 50)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     0.3781,
          "sourceRef": "BOSS — Réduction générale dégressive unique (RGDU), opposable au 01/04/2026",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/reduction-generale-degressive-unique.html"
        }
      ]
    },
    "rgdu.tdelta.ge50": {
      "label": "RGDU — Tdelta (≥ 50)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     0.3821,
          "sourceRef": "BOSS — Réduction générale dégressive unique (RGDU), opposable au 01/04/2026",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/reduction-generale-degressive-unique.html"
        }
      ]
    },
    "rgdu.coef_max.lt50": {
      "label": "RGDU — coefficient maximal (< 50)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     0.3981,
          "sourceRef": "BOSS — Réduction générale dégressive unique (RGDU), opposable au 01/04/2026",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/reduction-generale-degressive-unique.html"
        }
      ]
    },
    "rgdu.coef_max.ge50": {
      "label": "RGDU — coefficient maximal (≥ 50)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     0.4021,
          "sourceRef": "BOSS — Réduction générale dégressive unique (RGDU), opposable au 01/04/2026",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/reduction-generale-degressive-unique.html"
        }
      ]
    },
    "rgdu.smic_annual_ref": {
      "label": "RGDU — SMIC annuel de référence",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     21876.36,
          "sourceRef": "BOSS — Réduction générale dégressive unique (RGDU), opposable au 01/04/2026",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/reduction-generale-degressive-unique.html"
        }
      ]
    },
    "rgdu.smic_month_ref": {
      "label": "RGDU — SMIC mensuel de référence",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     1823.03,
          "sourceRef": "BOSS — Réduction générale dégressive unique (RGDU), opposable au 01/04/2026",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/reduction-generale-degressive-unique.html"
        }
      ]
    },
    "rgdu.tmin": {
      "label": "RGDU — Tmin (seuil minimal d'exonération)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     0.02,
          "sourceRef": "BOSS — Réduction générale dégressive unique (RGDU), opposable au 01/04/2026",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/reduction-generale-degressive-unique.html"
        }
      ]
    },
    "rgdu.p": {
      "label": "RGDU — P (coefficient de puissance)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     1.75,
          "sourceRef": "BOSS — Réduction générale dégressive unique (RGDU), opposable au 01/04/2026",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/reduction-generale-degressive-unique.html"
        }
      ]
    },
    "rgdu.ceil_month": {
      "label": "RGDU — plafond mensuel (3 SMIC)",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     5469.09,
          "sourceRef": "BOSS — Réduction générale dégressive unique (RGDU), opposable au 01/04/2026",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/reduction-generale-degressive-unique.html"
        }
      ]
    },
    "rgdu.ceil_annual": {
      "label": "RGDU — plafond annuel (3 SMIC)",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     65629.08,
          "sourceRef": "BOSS — Réduction générale dégressive unique (RGDU), opposable au 01/04/2026",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/reduction-generale-degressive-unique.html"
        }
      ]
    },
    "rgdu.min_guarantee": {
      "label": "RGDU — réduction minimale garantie",
      "unit":  "%",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     2,
          "sourceRef": "BOSS — Réduction générale dégressive unique (RGDU), opposable au 01/04/2026",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/reduction-generale-degressive-unique.html"
        }
      ]
    },
    "rgdu.notes": {
      "label": "RGDU — notes",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     [
                    "Applicable jusqu'à 3 SMIC brut (au-delà : coefficient = 0).",
                    "La Prime de Partage de la Valeur (PPV) est intégrée dans le calcul depuis 2025.",
                    "2026 : suppression des taux réduits (maladie & allocations familiales) → taux uniques."
          ],
          "sourceRef": "BOSS — Réduction générale dégressive unique (RGDU), opposable au 01/04/2026",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/reduction-generale-degressive-unique.html"
        }
      ]
    },
    "rgcp.tmin": {
      "label": "RGCP 2026 — Tmin (exonération minimale)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     0.02,
          "sourceRef": "BOSS — Réduction générale dégressive unique (RGDU), opposable au 01/04/2026",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/reduction-generale-degressive-unique.html"
        }
      ]
    },
    "rgcp.p": {
      "label": "RGCP 2026 — coefficient de puissance P",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     1.75,
          "sourceRef": "BOSS — Réduction générale dégressive unique (RGDU), opposable au 01/04/2026",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/reduction-generale-degressive-unique.html"
        }
      ]
    },
    "rgcp.tdelta.fnal010": {
      "label": "RGCP 2026 — Tdelta (FNAL 0,10%)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     0.3773,
          "sourceRef": "BOSS — Réduction générale dégressive unique (RGDU), opposable au 01/04/2026",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/reduction-generale-degressive-unique.html"
        }
      ]
    },
    "rgcp.tdelta.fnal050": {
      "label": "RGCP 2026 — Tdelta (FNAL 0,50%)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     0.3813,
          "sourceRef": "BOSS — Réduction générale dégressive unique (RGDU), opposable au 01/04/2026",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/reduction-generale-degressive-unique.html"
        }
      ]
    },
    "rgcp.hours.month": {
      "label": "RGCP 2026 — heures SMIC mensuelles",
      "unit":  "h",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     151.67,
          "sourceRef": "BOSS — Réduction générale dégressive unique (RGDU), opposable au 01/04/2026",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/reduction-generale-degressive-unique.html"
        }
      ]
    },
    "rgcp.hours.year": {
      "label": "RGCP 2026 — heures SMIC annuelles",
      "unit":  "h",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     1820,
          "sourceRef": "BOSS — Réduction générale dégressive unique (RGDU), opposable au 01/04/2026",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/reduction-generale-degressive-unique.html"
        }
      ]
    },
    "rgcp.rates.fnal010.total": {
      "label": "RGCP 2026 — total des taux (FNAL 0,10%)",
      "unit":  "%",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     39.73,
          "sourceRef": "BOSS — Réduction générale dégressive unique (RGDU), opposable au 01/04/2026",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/reduction-generale-degressive-unique.html"
        }
      ]
    },
    "rgcp.rates.fnal010.urssaf": {
      "label": "RGCP 2026 — taux URSSAF (FNAL 0,10%)",
      "unit":  "%",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     33.72,
          "sourceRef": "BOSS — Réduction générale dégressive unique (RGDU), opposable au 01/04/2026",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/reduction-generale-degressive-unique.html"
        }
      ]
    },
    "rgcp.rates.fnal050.total": {
      "label": "RGCP 2026 — total des taux (FNAL 0,50%)",
      "unit":  "%",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     40.13,
          "sourceRef": "BOSS — Réduction générale dégressive unique (RGDU), opposable au 01/04/2026",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/reduction-generale-degressive-unique.html"
        }
      ]
    },
    "rgcp.rates.fnal050.urssaf": {
      "label": "RGCP 2026 — taux URSSAF (FNAL 0,50%)",
      "unit":  "%",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     34.12,
          "sourceRef": "BOSS — Réduction générale dégressive unique (RGDU), opposable au 01/04/2026",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/reduction-generale-degressive-unique.html"
        }
      ]
    },


    // ────────────────────────────────────────────────────────────
    // Indemnités journalières (IJSS)
    // ────────────────────────────────────────────────────────────

    "ijss.max.before_2025_03_31": {
      "label": "IJSS maladie — max (arrêts prescrits jusqu'au 31/03/2025)",
      "unit":  "€ / jour",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     53.31,
          "sourceRef": "BOSS — IJSS / AMELI",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/indemnites-journalieres-de-securite-sociale.html"
        }
      ]
    },
    "ijss.max.from_2025_04_01": {
      "label": "IJSS maladie — max (arrêts débutant à partir du 01/04/2025)",
      "unit":  "€ / jour",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     41.47,
          "sourceRef": "BOSS — IJSS / AMELI",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/indemnites-journalieres-de-securite-sociale.html"
        }
      ]
    },
    "ijss.max.jan_2026": {
      "label": "IJSS maladie — max (arrêts prescrits en janvier 2026)",
      "unit":  "€ / jour",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     41.47,
          "sourceRef": "BOSS — IJSS / AMELI",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/indemnites-journalieres-de-securite-sociale.html"
        }
      ]
    },
    "ijss.max.from_feb_2026": {
      "label": "IJSS maladie — max (arrêts prescrits à partir de février 2026)",
      "unit":  "€ / jour",
      "versions": [
        {
          "from":      "2026-02-01",
          "value":     41.95,
          "sourceRef": "BOSS — IJSS / AMELI",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/indemnites-journalieres-de-securite-sociale.html"
        }
      ]
    },
    "ijss.sjb_div": {
      "label": "IJSS maladie — diviseur SJB",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     91.25,
          "sourceRef": "BOSS — IJSS / AMELI",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/indemnites-journalieres-de-securite-sociale.html"
        }
      ]
    },
    "ijss.smic_cap_factor": {
      "label": "IJSS maladie — plafond salaire pris en compte",
      "unit":  "× SMIC",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     1.4,
          "sourceRef": "BOSS — IJSS / AMELI",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/indemnites-journalieres-de-securite-sociale.html"
        }
      ]
    },
    "ijss.smic_cap_month": {
      "label": "IJSS maladie — plafond mensuel (1,4 SMIC)",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     2552.24,
          "sourceRef": "BOSS — IJSS / AMELI",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/indemnites-journalieres-de-securite-sociale.html"
        }
      ]
    },
    "ijss.rate": {
      "label": "IJSS maladie — taux indemnité",
      "unit":  "%",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     50,
          "sourceRef": "BOSS — IJSS / AMELI",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/indemnites-journalieres-de-securite-sociale.html"
        }
      ]
    },
    "ijss.carence": {
      "label": "IJSS maladie — délai de carence",
      "unit":  "jours",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     3,
          "sourceRef": "BOSS — IJSS / AMELI",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/indemnites-journalieres-de-securite-sociale.html"
        }
      ]
    },
    "ijss.mpaternity": {
      "label": "IJ maternité / paternité / adoption — max",
      "unit":  "€ / jour",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     104.02,
          "sourceRef": "BOSS — IJSS / AMELI",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/indemnites-journalieres-de-securite-sociale.html"
        }
      ]
    },
    "ijss.atmp.max_1_28": {
      "label": "IJ AT/MP — max (1 à 28)",
      "unit":  "€ / jour",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     240.49,
          "sourceRef": "BOSS — IJSS / AMELI",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/indemnites-journalieres-de-securite-sociale.html"
        }
      ]
    },
    "ijss.atmp.max_29_plus": {
      "label": "IJ AT/MP — max (à partir du 29e)",
      "unit":  "€ / jour",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     320.66,
          "sourceRef": "BOSS — IJSS / AMELI",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/indemnites-journalieres-de-securite-sociale.html"
        }
      ]
    },
    "ijss.atmp.rate_1_28": {
      "label": "IJ AT/MP — taux (1 à 28)",
      "unit":  "%",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     60,
          "sourceRef": "BOSS — IJSS / AMELI",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/indemnites-journalieres-de-securite-sociale.html"
        }
      ]
    },
    "ijss.atmp.rate_29_plus": {
      "label": "IJ AT/MP — taux (à partir du 29e)",
      "unit":  "%",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     80,
          "sourceRef": "BOSS — IJSS / AMELI",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/indemnites-journalieres-de-securite-sociale.html"
        }
      ]
    },


    // ────────────────────────────────────────────────────────────
    // Cotisations & contributions
    // ────────────────────────────────────────────────────────────

    "cot.maladie.patronal": {
      "label": "Maladie - Maternité - Invalidité - Décès",
      "unit":  "% patronal (salaire total)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     13.0,
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.alsace_moselle.salarial": {
      "label": "Alsace-Moselle (complément maladie)",
      "unit":  "% salarial (salaire total)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     1.3,
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.residence_hors_fr.salarial": {
      "label": "Résidence hors de France",
      "unit":  "% salarial (salaire total)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     5.5,
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.prevoyance_deces_cadres": {
      "label": "Prévoyance décès (cadres obligatoire) — 0 à 1 PMSS",
      "unit":  "% (mention source)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     1.5,
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.atmp.note": {
      "label": "AT/MP",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     "Taux patronal variable selon activité (notifié annuellement CARSAT/URSSAF).",
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.vieillesse.plaf.salarial": {
      "label": "Assurance vieillesse plafonnée (0 à 1 PMSS)",
      "unit":  "% salarial",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     6.9,
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.vieillesse.plaf.patronal": {
      "label": "Assurance vieillesse plafonnée (0 à 1 PMSS)",
      "unit":  "% patronal",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     8.55,
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.vieillesse.deplaf.salarial": {
      "label": "Assurance vieillesse déplafonnée (salaire total)",
      "unit":  "% salarial",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     0.4,
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.vieillesse.deplaf.patronal": {
      "label": "Assurance vieillesse déplafonnée (salaire total)",
      "unit":  "% patronal",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     2.11,
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.agirc.t1.salarial": {
      "label": "AGIRC-ARRCO — Complémentaire T1 (0 à 1 PMSS)",
      "unit":  "% salarial",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     3.15,
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.agirc.t1.patronal": {
      "label": "AGIRC-ARRCO — Complémentaire T1 (0 à 1 PMSS)",
      "unit":  "% patronal",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     4.72,
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.agirc.t2.salarial": {
      "label": "AGIRC-ARRCO — Complémentaire T2 (1 à 8 PMSS)",
      "unit":  "% salarial",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     8.64,
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.agirc.t2.patronal": {
      "label": "AGIRC-ARRCO — Complémentaire T2 (1 à 8 PMSS)",
      "unit":  "% patronal",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     12.95,
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.ceg.t1.salarial": {
      "label": "CEG T1 (0 à 1 PMSS)",
      "unit":  "% salarial",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     0.86,
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.ceg.t1.patronal": {
      "label": "CEG T1 (0 à 1 PMSS)",
      "unit":  "% patronal",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     1.29,
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.ceg.t2.salarial": {
      "label": "CEG T2 (1 à 8 PMSS)",
      "unit":  "% salarial",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     1.08,
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.ceg.t2.patronal": {
      "label": "CEG T2 (1 à 8 PMSS)",
      "unit":  "% patronal",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     1.62,
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.cet.salarial": {
      "label": "CET (si rémunération > 1 PMSS) — 1 à 8 PMSS",
      "unit":  "% salarial",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     0.14,
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.cet.patronal": {
      "label": "CET (si rémunération > 1 PMSS) — 1 à 8 PMSS",
      "unit":  "% patronal",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     0.21,
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.ircantec.t1.salarial": {"label":"IRCANTEC T1 sal.","unit":"% salarial","versions":[{"from":"2026-01-01","value":2.80,"sourceRef":"Décret n°70-1277","sourceUrl":"https://www.caisse-des-depots.fr/ircantec/"}]},
    "cot.ircantec.t1.patronal": {"label":"IRCANTEC T1 pat.","unit":"% patronal","versions":[{"from":"2026-01-01","value":4.20,"sourceRef":"Décret n°70-1277","sourceUrl":"https://www.caisse-des-depots.fr/ircantec/"}]},
    "cot.ircantec.t2.salarial": {"label":"IRCANTEC T2 sal.","unit":"% salarial","versions":[{"from":"2026-01-01","value":7.80,"sourceRef":"Décret n°70-1277","sourceUrl":"https://www.caisse-des-depots.fr/ircantec/"}]},
    "cot.ircantec.t2.patronal": {"label":"IRCANTEC T2 pat.","unit":"% patronal","versions":[{"from":"2026-01-01","value":11.70,"sourceRef":"Décret n°70-1277","sourceUrl":"https://www.caisse-des-depots.fr/ircantec/"}]},
    "cot.ircantec.point":       {"label":"IRCANTEC — Valeur du point","unit":"€","versions":[{"from":"2026-01-01","value":0.56053,"sourceRef":"Caisse des Dépôts IRCANTEC 2026","sourceUrl":"https://www.caisse-des-depots.fr/ircantec/"}]},
    "agirc.point.value":        {"label":"AGIRC-ARRCO — Valeur du point","unit":"€","versions":[{"from":"2024-11-01","value":1.4386,"sourceRef":"AGIRC-ARRCO Accord 05/10/2023","sourceUrl":"https://www.agirc-arrco.fr/"}]},
    "agirc.salaire_ref":        {"label":"AGIRC-ARRCO — Salaire de référence","unit":"€","versions":[{"from":"2025-01-01","value":20.1877,"sourceRef":"AGIRC-ARRCO Accord 05/10/2023","sourceUrl":"https://www.agirc-arrco.fr/"}]},
    "cot.famille.patronal": {
      "label": "Allocations familiales (salaire total)",
      "unit":  "% patronal",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     5.25,
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.chomage.patronal": {
      "label": "Assurance chômage (0 à 4 PMSS)",
      "unit":  "% patronal",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     4.0,
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.ags.patronal": {
      "label": "AGS (0 à 4 PMSS)",
      "unit":  "% patronal",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     0.25,
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.apec.salarial": {
      "label": "APEC (cadres) — 0 à 8 PMSS",
      "unit":  "% salarial",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     0.024,
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.apec.patronal": {
      "label": "APEC (cadres) — 0 à 8 PMSS",
      "unit":  "% patronal",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     0.036,
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.fnal.lt50": {
      "label": "FNAL (< 50) — 0 à 1 PMSS",
      "unit":  "% patronal",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     0.1,
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.fnal.ge50": {
      "label": "FNAL (≥ 50) — salaire total",
      "unit":  "% patronal",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     0.5,
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.vm.note": {
      "label": "Versement mobilité",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     "Variable (0% à 2,95%) selon localisation — consulter URSSAF.",
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.dialogue_social": {
      "label": "Contribution dialogue social",
      "unit":  "% (salaire total)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     0.016,
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.csa": {
      "label": "Contribution solidarité autonomie",
      "unit":  "% (salaire total)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     0.3,
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.forfait_social.reduced": {
      "label": "Forfait social — taux réduit (> 11 salariés)",
      "unit":  "%",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     8,
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "cot.forfait_social.full": {
      "label": "Forfait social — taux plein (> 11 salariés)",
      "unit":  "%",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     20,
          "sourceRef": "URSSAF — Taux cotisations secteur privé",
          "sourceUrl": "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
        }
      ]
    },
    "csg.assiette": {
      "label": "CSG/CRDS — assiette",
      "unit":  "% du salaire",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     98.25,
          "sourceRef": "URSSAF — CSG/CRDS",
          "sourceUrl": "https://www.urssaf.fr/accueil/employeur/cotisations/csg-crds.html"
        }
      ]
    },
    "csg.deductible": {
      "label": "CSG déductible",
      "unit":  "%",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     6.8,
          "sourceRef": "URSSAF — CSG/CRDS",
          "sourceUrl": "https://www.urssaf.fr/accueil/employeur/cotisations/csg-crds.html"
        }
      ]
    },
    "csg.non_deductible": {
      "label": "CSG non déductible",
      "unit":  "%",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     2.4,
          "sourceRef": "URSSAF — CSG/CRDS",
          "sourceUrl": "https://www.urssaf.fr/accueil/employeur/cotisations/csg-crds.html"
        }
      ]
    },
    "crds": {
      "label": "CRDS",
      "unit":  "%",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     0.5,
          "sourceRef": "URSSAF — CSG/CRDS",
          "sourceUrl": "https://www.urssaf.fr/accueil/employeur/cotisations/csg-crds.html"
        }
      ]
    },
    "csg.total": {
      "label": "TOTAL CSG + CRDS",
      "unit":  "%",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     9.7,
          "sourceRef": "URSSAF — CSG/CRDS",
          "sourceUrl": "https://www.urssaf.fr/accueil/employeur/cotisations/csg-crds.html"
        }
      ]
    },
    "csg.abatement": {
      "label": "Abattement frais professionnels (forfaitaire)",
      "unit":  "%",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     1.75,
          "sourceRef": "URSSAF — CSG/CRDS",
          "sourceUrl": "https://www.urssaf.fr/accueil/employeur/cotisations/csg-crds.html"
        }
      ]
    },
    "csg.abatement_cap_mult_pass": {
      "label": "Limite d'application abattement",
      "unit":  "× PASS",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     4,
          "sourceRef": "URSSAF — CSG/CRDS",
          "sourceUrl": "https://www.urssaf.fr/accueil/employeur/cotisations/csg-crds.html"
        }
      ]
    },
    "csg.abatement_cap_amount": {
      "label": "Limite d'application abattement (montant)",
      "unit":  "€ / an",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     192240,
          "sourceRef": "URSSAF — CSG/CRDS",
          "sourceUrl": "https://www.urssaf.fr/accueil/employeur/cotisations/csg-crds.html"
        }
      ]
    },
    "taxe_salaires.t1.max": {
      "label": "Taxe sur les salaires — tranche 1",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     9229,
          "sourceRef": "Art. 231 CGI — BOFiP",
          "sourceUrl": "https://bofip.impots.gouv.fr/bofip/6927-PGP.html"
        }
      ]
    },
    "taxe_salaires.t1.rate": {
      "label": "Taxe sur les salaires — tranche 1",
      "unit":  "%",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     4.25,
          "sourceRef": "Art. 231 CGI — BOFiP",
          "sourceUrl": "https://bofip.impots.gouv.fr/bofip/6927-PGP.html"
        }
      ]
    },
    "taxe_salaires.t2.min": {
      "label": "Taxe sur les salaires — tranche 2 min",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     9229,
          "sourceRef": "Art. 231 CGI — BOFiP",
          "sourceUrl": "https://bofip.impots.gouv.fr/bofip/6927-PGP.html"
        }
      ]
    },
    "taxe_salaires.t2.max": {
      "label": "Taxe sur les salaires — tranche 2 max",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     18423,
          "sourceRef": "Art. 231 CGI — BOFiP",
          "sourceUrl": "https://bofip.impots.gouv.fr/bofip/6927-PGP.html"
        }
      ]
    },
    "taxe_salaires.t2.rate": {
      "label": "Taxe sur les salaires — tranche 2",
      "unit":  "%",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     8.5,
          "sourceRef": "Art. 231 CGI — BOFiP",
          "sourceUrl": "https://bofip.impots.gouv.fr/bofip/6927-PGP.html"
        }
      ]
    },
    "taxe_salaires.t3.min": {
      "label": "Taxe sur les salaires — tranche 3 min",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     18423,
          "sourceRef": "Art. 231 CGI — BOFiP",
          "sourceUrl": "https://bofip.impots.gouv.fr/bofip/6927-PGP.html"
        }
      ]
    },
    "taxe_salaires.t3.rate": {
      "label": "Taxe sur les salaires — tranche 3",
      "unit":  "%",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     13.6,
          "sourceRef": "Art. 231 CGI — BOFiP",
          "sourceUrl": "https://bofip.impots.gouv.fr/bofip/6927-PGP.html"
        }
      ]
    },
    "taxe_salaires.abattement": {
      "label": "Taxe sur les salaires — abattement annuel (organismes sans but lucratif)",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     24256,
          "sourceRef": "Art. 231 CGI — BOFiP",
          "sourceUrl": "https://bofip.impots.gouv.fr/bofip/6927-PGP.html"
        }
      ]
    },
    "peec.rate": {
      "label": "Participation à l'effort de construction (≥ 50)",
      "unit":  "% (salaire total)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     0.45,
          "sourceRef": "Art. L313-1 CCH",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006824888"
        }
      ]
    },
    "taxe_apprentissage": {
      "label": "Taxe d'apprentissage",
      "unit":  "% (salaire total)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     0.68,
          "sourceRef": "Art. 1599 ter A CGI",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006303476"
        }
      ]
    },
    "taxe_apprentissage_am": {
      "label": "Taxe d'apprentissage Alsace-Moselle (supplément)",
      "unit":  "% (salaire total)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     0.44,
          "sourceRef": "Art. 1599 ter A CGI Alsace-Moselle",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006303476"
        }
      ]
    },
    "csa_apprentissage.note": {
      "label": "Contribution supplémentaire apprentissage",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     "Variable (≥ 250 salariés si < 5% alternants).",
          "sourceRef": "Art. 1609 quinvicies CGI",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006304092"
        }
      ]
    },
    "formation.lt11": {
      "label": "Formation professionnelle (< 11 salariés)",
      "unit":  "% (salaire total)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     0.55,
          "sourceRef": "Art. L6331-2 Code du travail",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006904211"
        }
      ]
    },
    "formation.ge11": {
      "label": "Formation professionnelle (11 salariés et +)",
      "unit":  "% (salaire total)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     1.0,
          "sourceRef": "Art. L6331-2 Code du travail",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006904211"
        }
      ]
    },
    "cpf_cdd": {
      "label": "CPF-CDD (contribution spécifique CDD)",
      "unit":  "% (salaire CDD)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     1.0,
          "sourceRef": "Art. L6331-6 Code du travail",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006904217"
        }
      ]
    },


    // ────────────────────────────────────────────────────────────
    // Heures supplémentaires
    // ────────────────────────────────────────────────────────────

    "hs.reduc_salariale.taux_max": {
      "label": "Réduction cotisations salariales — taux maximal (heures sup/compl)",
      "unit":  "%",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     11.31,
          "sourceRef": "BOSS — Exonérations heures supplémentaires et complémentaires (01/04/2026)",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/exonerations-heures-supplementaires-et-complementaires.html"
        }
      ]
    },
    "hs.ir.exo_cap_net": {
      "label": "Exonération IR — plafond annuel (net imposable)",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     7500,
          "sourceRef": "BOSS — Exonérations heures supplémentaires et complémentaires (01/04/2026)",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/exonerations-heures-supplementaires-et-complementaires.html"
        }
      ]
    },
    "hs.ir.exo_cap_brut": {
      "label": "Exonération IR — plafond annuel (équivalent brut indicatif)",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     8037,
          "sourceRef": "BOSS — Exonérations heures supplémentaires et complémentaires (01/04/2026)",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/exonerations-heures-supplementaires-et-complementaires.html"
        }
      ]
    },
    "hs.ir.brut_to_net_coef": {
      "label": "Conversion brut → net imposable (indicatif)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     0.93319,
          "sourceRef": "BOSS — Exonérations heures supplémentaires et complémentaires (01/04/2026)",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/exonerations-heures-supplementaires-et-complementaires.html"
        }
      ]
    },
    "hs.patronal.ded_h_lt20": {
      "label": "Déduction forfaitaire patronale — par heure (< 20 salariés)",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     1.5,
          "sourceRef": "BOSS — Exonérations heures supplémentaires et complémentaires (01/04/2026)",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/exonerations-heures-supplementaires-et-complementaires.html"
        }
      ]
    },
    "hs.patronal.ded_h_gt20": {
      "label": "Déduction forfaitaire patronale — par heure (20 à 249 salariés, et ≥ 250 depuis 01/01/2026)",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     0.5,
          "sourceRef": "BOSS — Exonérations heures supplémentaires et complémentaires (01/04/2026)",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/exonerations-heures-supplementaires-et-complementaires.html"
        }
      ]
    },
    "hs.patronal.ded_j_lt20": {
      "label": "Déduction forfaitaire patronale — par jour forfait jours (< 20 salariés)",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     10.5,
          "sourceRef": "BOSS — Exonérations heures supplémentaires et complémentaires (01/04/2026)",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/exonerations-heures-supplementaires-et-complementaires.html"
        }
      ]
    },
    "hs.patronal.ded_j_gt20": {
      "label": "Déduction forfaitaire patronale — par jour forfait jours > 218 (20 à 249 salariés, et ≥ 250 depuis 01/01/2026)",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     3.5,
          "sourceRef": "BOSS — Exonérations heures supplémentaires et complémentaires (01/04/2026)",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/exonerations-heures-supplementaires-et-complementaires.html"
        }
      ]
    },


    // ────────────────────────────────────────────────────────────
    // Saisies sur rémunérations
    // ────────────────────────────────────────────────────────────

    "garnish.thresholds": {
      "label": "Saisie sur rémunérations — seuils annuels",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     [
                    4480,
                    8730,
                    13000,
                    17230,
                    21470,
                    25810
          ],
          "sourceRef": "Code du travail — Saisies art. R3252",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006072050/LEGISCTA000006189648/"
        }
      ]
    },
    "garnish.fractions": {
      "label": "Saisie sur rémunérations — fractions par tranche",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     [
                    0.05,
                    0.1,
                    0.2,
                    0.25,
                    0.3333333333,
                    0.6666666667,
                    1
          ],
          "sourceRef": "Code du travail — Saisies art. R3252",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006072050/LEGISCTA000006189648/"
        }
      ]
    },
    "garnish.dependent_allowance": {
      "label": "Saisie sur rémunérations — majoration par personne à charge (annuel)",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     1740,
          "sourceRef": "Code du travail — Saisies art. R3252",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006072050/LEGISCTA000006189648/"
        }
      ]
    },
    "garnish.rsa_floor.metro": {
      "label": "RSA (plancher à laisser) — Métropole & DOM",
      "unit":  "€",
      "versions": [
        {
          "from":      "2025-04-01",
          "value":     646.52,
          "sourceRef": "Décret RSA 2025 — Code du travail art. R3252-5",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006072050/LEGISCTA000006189648/"
        },
        {
          "from":      "2026-04-01",
          "value":     651.69,
          "sourceRef": "Décret n°2026-220 du 30/03/2026, JO du 31 — RSA revalorisé",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006072050/LEGISCTA000006189648/"
        }
      ]
    },
    "garnish.rsa_floor.mayotte": {
      "label": "RSA (plancher à laisser) — Mayotte",
      "unit":  "€",
      "versions": [
        {
          "from":      "2025-04-01",
          "value":     323.26,
          "sourceRef": "Décret RSA 2025 — Code du travail art. R3252-5",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006072050/LEGISCTA000006189648/"
        },
        {
          "from":      "2026-04-01",
          "value":     325.85,
          "sourceRef": "Décret n°2026-221 du 30/03/2026, JO du 31 — RSA Mayotte revalorisé",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006072050/LEGISCTA000006189648/"
        }
      ]
    },


    // ────────────────────────────────────────────────────────────
    // Gratification de stage
    // ────────────────────────────────────────────────────────────

    "stage.gratification.rate": {
      "label": "Gratification de stage — taux (plafond horaire SS)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     0.15,
          "sourceRef": "BOSS — Stagiaires",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/stagiaires.html"
        }
      ]
    },


    // ────────────────────────────────────────────────────────────
    // DFS
    // ────────────────────────────────────────────────────────────

    "dfs.construction.rate": {
      "label": "DFS — Construction",
      "unit":  "%",
      "versions": [
        {
          "from":      "2025-01-01",
          "value":     8,
          "sourceRef": "BOSS — DFS",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/deduction-forfaitaire-specifique.html"
        },
        {
          "from":      "2026-01-01",
          "value":     7,
          "sourceRef": "BOSS — DFS",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/deduction-forfaitaire-specifique.html"
        }
      ]
    },
    "dfs.proprete.rate": {
      "label": "DFS — Propreté",
      "unit":  "%",
      "versions": [
        {
          "from":      "2025-01-01",
          "value":     4,
          "sourceRef": "BOSS — DFS",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/deduction-forfaitaire-specifique.html"
        },
        {
          "from":      "2026-01-01",
          "value":     3,
          "sourceRef": "BOSS — DFS",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/deduction-forfaitaire-specifique.html"
        }
      ]
    },
    "dfs.journalistes.rate": {
      "label": "DFS — Journalistes",
      "unit":  "%",
      "versions": [
        {
          "from":      "2025-01-01",
          "value":     26,
          "sourceRef": "BOSS — DFS",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/deduction-forfaitaire-specifique.html"
        },
        {
          "from":      "2026-01-01",
          "value":     24,
          "sourceRef": "BOSS — DFS",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/deduction-forfaitaire-specifique.html"
        }
      ]
    },
    "dfs.transport_marchandises.rate": {
      "label": "DFS — Transport routier de marchandises",
      "unit":  "%",
      "versions": [
        {
          "from":      "2025-01-01",
          "value":     18,
          "sourceRef": "BOSS — DFS",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/deduction-forfaitaire-specifique.html"
        },
        {
          "from":      "2026-01-01",
          "value":     17,
          "sourceRef": "BOSS — DFS",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/deduction-forfaitaire-specifique.html"
        }
      ]
    },
    "dfs.aviation_civile.rate": {
      "label": "DFS — Aviation civile",
      "unit":  "%",
      "versions": [
        {
          "from":      "2025-01-01",
          "value":     27,
          "sourceRef": "BOSS — DFS",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/deduction-forfaitaire-specifique.html"
        },
        {
          "from":      "2026-01-01",
          "value":     26,
          "sourceRef": "BOSS — DFS",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/deduction-forfaitaire-specifique.html"
        }
      ]
    },
    "dfs.casino_cercle_jeux.rate": {
      "label": "DFS — Casino et cercle de jeux",
      "unit":  "%",
      "versions": [
        {
          "from":      "2025-01-01",
          "value":     6,
          "sourceRef": "BOSS — DFS",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/deduction-forfaitaire-specifique.html"
        },
        {
          "from":      "2026-01-01",
          "value":     5,
          "sourceRef": "BOSS — DFS",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/deduction-forfaitaire-specifique.html"
        }
      ]
    },
    "dfs.vrp.rate": {
      "label": "DFS — VRP",
      "unit":  "%",
      "versions": [
        {
          "from":      "2025-01-01",
          "value":     26,
          "sourceRef": "BOSS — DFS",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/deduction-forfaitaire-specifique.html"
        },
        {
          "from":      "2026-01-01",
          "value":     24,
          "sourceRef": "BOSS — DFS",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/deduction-forfaitaire-specifique.html"
        }
      ]
    },
    "dfs.spectacle.musiciens.rate": {
      "label": "DFS — Spectacle (musiciens/choristes/chefs d’orchestre/régisseurs théâtre)",
      "unit":  "%",
      "versions": [
        {
          "from":      "2025-01-01",
          "value":     18,
          "sourceRef": "BOSS — DFS",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/deduction-forfaitaire-specifique.html"
        },
        {
          "from":      "2026-01-01",
          "value":     16,
          "sourceRef": "BOSS — DFS",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/deduction-forfaitaire-specifique.html"
        }
      ]
    },
    "dfs.spectacle.artistes_dramatiques.rate": {
      "label": "DFS — Spectacle (artistes dramatiques/lyriques/cinématographiques/chorégraphiques)",
      "unit":  "%",
      "versions": [
        {
          "from":      "2025-01-01",
          "value":     21,
          "sourceRef": "BOSS — DFS",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/deduction-forfaitaire-specifique.html"
        },
        {
          "from":      "2026-01-01",
          "value":     18,
          "sourceRef": "BOSS — DFS",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/deduction-forfaitaire-specifique.html"
        }
      ]
    },
    "dfs.other.reduction_factor": {
      "label": "DFS — Facteur de réduction (autres professions)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     0.15,
          "sourceRef": "BOSS — DFS",
          "sourceUrl": "https://boss.gouv.fr/portail/accueil/deduction-forfaitaire-specifique.html"
        }
      ]
    },


    // ────────────────────────────────────────────────────────────
    // PAS — Prélèvement à la source
    // ────────────────────────────────────────────────────────────

    "pas.neutral.metropole.monthly.brackets": {
      "label": "PAS — Barème métropole (taux neutre mensuel)",
      "versions": [
        {
          "from":      "2025-05-01",
          "value":     [
                    {
                              "max": 1620,
                              "rate": 0.0
                    },
                    {
                              "min": 1620,
                              "max": 1683,
                              "rate": 0.5
                    },
                    {
                              "min": 1683,
                              "max": 1791,
                              "rate": 1.3
                    },
                    {
                              "min": 1791,
                              "max": 1911,
                              "rate": 2.1
                    },
                    {
                              "min": 1911,
                              "max": 2042,
                              "rate": 2.9
                    },
                    {
                              "min": 2042,
                              "max": 2151,
                              "rate": 3.5
                    },
                    {
                              "min": 2151,
                              "max": 2294,
                              "rate": 4.1
                    },
                    {
                              "min": 2294,
                              "max": 2714,
                              "rate": 5.3
                    },
                    {
                              "min": 2714,
                              "max": 3107,
                              "rate": 7.5
                    },
                    {
                              "min": 3107,
                              "max": 3539,
                              "rate": 9.9
                    },
                    {
                              "min": 3539,
                              "max": 3983,
                              "rate": 11.9
                    },
                    {
                              "min": 3983,
                              "max": 4648,
                              "rate": 13.8
                    },
                    {
                              "min": 4648,
                              "max": 5574,
                              "rate": 15.8
                    },
                    {
                              "min": 5574,
                              "max": 6974,
                              "rate": 17.9
                    },
                    {
                              "min": 6974,
                              "max": 8711,
                              "rate": 20.0
                    },
                    {
                              "min": 8711,
                              "max": 12091,
                              "rate": 24.0
                    },
                    {
                              "min": 12091,
                              "max": 16376,
                              "rate": 28.0
                    },
                    {
                              "min": 16376,
                              "max": 25706,
                              "rate": 33.0
                    },
                    {
                              "min": 25706,
                              "max": 55062,
                              "rate": 38.0
                    },
                    {
                              "min": 55062,
                              "rate": 43.0
                    }
          ],
          "sourceRef": "DGFiP — BOFiP BOI-BAREME-000037",
          "sourceUrl": "https://bofip.impots.gouv.fr/bofip/11062-PGP.html"
        }
      ]
    },
    "pas.neutral_rates": {
      "label": "Grilles PAS taux neutre",
      "unit":  "object",
      "versions": [
        {
          "from":      "2025-05-01",
          "value":     {
                    "metropole": [
                              {
                                        "min": 0,
                                        "max": 1620,
                                        "rate": 0
                              },
                              {
                                        "min": 1620,
                                        "max": 1683,
                                        "rate": 0.5
                              },
                              {
                                        "min": 1683,
                                        "max": 1791,
                                        "rate": 1.3
                              },
                              {
                                        "min": 1791,
                                        "max": 1911,
                                        "rate": 2.1
                              },
                              {
                                        "min": 1911,
                                        "max": 2042,
                                        "rate": 2.9
                              },
                              {
                                        "min": 2042,
                                        "max": 2151,
                                        "rate": 3.5
                              },
                              {
                                        "min": 2151,
                                        "max": 2294,
                                        "rate": 4.1
                              },
                              {
                                        "min": 2294,
                                        "max": 2714,
                                        "rate": 5.3
                              },
                              {
                                        "min": 2714,
                                        "max": 3107,
                                        "rate": 7.5
                              },
                              {
                                        "min": 3107,
                                        "max": 3539,
                                        "rate": 9.9
                              },
                              {
                                        "min": 3539,
                                        "max": 3983,
                                        "rate": 11.9
                              },
                              {
                                        "min": 3983,
                                        "max": 4648,
                                        "rate": 13.8
                              },
                              {
                                        "min": 4648,
                                        "max": 5574,
                                        "rate": 15.8
                              },
                              {
                                        "min": 5574,
                                        "max": 6974,
                                        "rate": 17.9
                              },
                              {
                                        "min": 6974,
                                        "max": 8711,
                                        "rate": 20
                              },
                              {
                                        "min": 8711,
                                        "max": 12091,
                                        "rate": 24
                              },
                              {
                                        "min": 12091,
                                        "max": 16376,
                                        "rate": 28
                              },
                              {
                                        "min": 16376,
                                        "max": 25706,
                                        "rate": 33
                              },
                              {
                                        "min": 25706,
                                        "max": 55062,
                                        "rate": 38
                              },
                              {
                                        "min": 55062,
                                        "max": 999999,
                                        "rate": 43
                              }
                    ],
                    "dom_1": [
                              {
                                        "min": 0,
                                        "max": 1858,
                                        "rate": 0
                              },
                              {
                                        "min": 1858,
                                        "max": 1971,
                                        "rate": 0.5
                              },
                              {
                                        "min": 1971,
                                        "max": 2171,
                                        "rate": 1.3
                              },
                              {
                                        "min": 2171,
                                        "max": 2371,
                                        "rate": 2.1
                              },
                              {
                                        "min": 2371,
                                        "max": 2618,
                                        "rate": 2.9
                              },
                              {
                                        "min": 2618,
                                        "max": 2761,
                                        "rate": 3.5
                              },
                              {
                                        "min": 2761,
                                        "max": 2855,
                                        "rate": 4.1
                              },
                              {
                                        "min": 2855,
                                        "max": 3142,
                                        "rate": 5.3
                              },
                              {
                                        "min": 3142,
                                        "max": 3885,
                                        "rate": 7.5
                              },
                              {
                                        "min": 3885,
                                        "max": 4971,
                                        "rate": 9.9
                              },
                              {
                                        "min": 4971,
                                        "max": 5646,
                                        "rate": 11.9
                              },
                              {
                                        "min": 5646,
                                        "max": 6540,
                                        "rate": 13.8
                              },
                              {
                                        "min": 6540,
                                        "max": 7836,
                                        "rate": 15.8
                              },
                              {
                                        "min": 7836,
                                        "max": 8711,
                                        "rate": 17.9
                              },
                              {
                                        "min": 8711,
                                        "max": 9900,
                                        "rate": 20
                              },
                              {
                                        "min": 9900,
                                        "max": 13615,
                                        "rate": 24
                              },
                              {
                                        "min": 13615,
                                        "max": 18090,
                                        "rate": 28
                              },
                              {
                                        "min": 18090,
                                        "max": 27610,
                                        "rate": 33
                              },
                              {
                                        "min": 27610,
                                        "max": 60350,
                                        "rate": 38
                              },
                              {
                                        "min": 60350,
                                        "max": 999999,
                                        "rate": 43
                              }
                    ],
                    "dom_2": [
                              {
                                        "min": 0,
                                        "max": 1990,
                                        "rate": 0
                              },
                              {
                                        "min": 1990,
                                        "max": 2151,
                                        "rate": 0.5
                              },
                              {
                                        "min": 2151,
                                        "max": 2398,
                                        "rate": 1.3
                              },
                              {
                                        "min": 2398,
                                        "max": 2704,
                                        "rate": 2.1
                              },
                              {
                                        "min": 2704,
                                        "max": 2808,
                                        "rate": 2.9
                              },
                              {
                                        "min": 2808,
                                        "max": 2904,
                                        "rate": 3.5
                              },
                              {
                                        "min": 2904,
                                        "max": 2999,
                                        "rate": 4.1
                              },
                              {
                                        "min": 2999,
                                        "max": 3332,
                                        "rate": 5.3
                              },
                              {
                                        "min": 3332,
                                        "max": 4598,
                                        "rate": 7.5
                              },
                              {
                                        "min": 4598,
                                        "max": 5951,
                                        "rate": 9.9
                              },
                              {
                                        "min": 5951,
                                        "max": 6712,
                                        "rate": 11.9
                              },
                              {
                                        "min": 6712,
                                        "max": 7788,
                                        "rate": 13.8
                              },
                              {
                                        "min": 7788,
                                        "max": 8567,
                                        "rate": 15.8
                              },
                              {
                                        "min": 8567,
                                        "max": 9492,
                                        "rate": 17.9
                              },
                              {
                                        "min": 9492,
                                        "max": 11016,
                                        "rate": 20
                              },
                              {
                                        "min": 11016,
                                        "max": 14820,
                                        "rate": 24
                              },
                              {
                                        "min": 14820,
                                        "max": 18850,
                                        "rate": 28
                              },
                              {
                                        "min": 18850,
                                        "max": 30210,
                                        "rate": 33
                              },
                              {
                                        "min": 30210,
                                        "max": 63767,
                                        "rate": 38
                              },
                              {
                                        "min": 63767,
                                        "max": 999999,
                                        "rate": 43
                              }
                    ]
          },
          "sourceRef": "DGFiP — BOFiP BOI-BAREME-000037",
          "sourceUrl": "https://bofip.impots.gouv.fr/bofip/11062-PGP.html"
        }

        // ── BARÈME 2026-05-01 — Loi n°2026-103 du 19/02/2026, art. 4 ──────
        // Revalorisation +0,9% — Applicable au 1er mai 2026
        // Grilles inactives jusqu'au 01/05/2026 (version-selector les affiche en "À venir")
        ,{
          "from":      "2026-05-01",
          "sourceRef": "Loi n°2026-103 du 19/02/2026, art. 4 — BOFiP BOI-BAREME-000037 (07/04/2026)",
          "sourceUrl": "https://www.legifrance.gouv.fr/jorf/article_jo/JORFARTI000053508182",
          "value": {
            "metropole": [
              {"min": 0, "max": 1635,  "rate": 0.0},
              {"min": 1635,  "max": 1698,  "rate": 0.5},
              {"min": 1698,  "max": 1807,  "rate": 1.3},
              {"min": 1807,  "max": 1928,  "rate": 2.1},
              {"min": 1928,  "max": 2060,  "rate": 2.9},
              {"min": 2060,  "max": 2170,  "rate": 3.5},
              {"min": 2170,  "max": 2315,  "rate": 4.1},
              {"min": 2315,  "max": 2738,  "rate": 5.3},
              {"min": 2738,  "max": 3135,  "rate": 7.5},
              {"min": 3135,  "max": 3571,  "rate": 9.9},
              {"min": 3571,  "max": 4019,  "rate": 11.9},
              {"min": 4019,  "max": 4690,  "rate": 13.8},
              {"min": 4690,  "max": 5624,  "rate": 15.8},
              {"min": 5624,  "max": 7037,  "rate": 17.9},
              {"min": 7037,  "max": 8789,  "rate": 20.0},
              {"min": 8789,  "max": 12200, "rate": 24.0},
              {"min": 12200, "max": 16523, "rate": 28.0},
              {"min": 16523, "max": 25937, "rate": 33.0},
              {"min": 25937, "max": 55558, "rate": 38.0},
              {"min": 55558, "max": 999999, "rate": 43.0}
            ],
            "dom_1": [
              {"min": 0, "max": 1875,  "rate": 0.0},
              {"min": 1875,  "max": 1989,  "rate": 0.5},
              {"min": 1989,  "max": 2191,  "rate": 1.3},
              {"min": 2191,  "max": 2392,  "rate": 2.1},
              {"min": 2392,  "max": 2642,  "rate": 2.9},
              {"min": 2642,  "max": 2786,  "rate": 3.5},
              {"min": 2786,  "max": 2881,  "rate": 4.1},
              {"min": 2881,  "max": 3170,  "rate": 5.3},
              {"min": 3170,  "max": 3920,  "rate": 7.5},
              {"min": 3920,  "max": 5016,  "rate": 9.9},
              {"min": 5016,  "max": 5697,  "rate": 11.9},
              {"min": 5697,  "max": 6599,  "rate": 13.8},
              {"min": 6599,  "max": 7907,  "rate": 15.8},
              {"min": 7907,  "max": 8789,  "rate": 17.9},
              {"min": 8789,  "max": 9989,  "rate": 20.0},
              {"min": 9989,  "max": 13738, "rate": 24.0},
              {"min": 13738, "max": 18253, "rate": 28.0},
              {"min": 18253, "max": 27858, "rate": 33.0},
              {"min": 27858, "max": 60893, "rate": 38.0},
              {"min": 60893, "max": 999999, "rate": 43.0}
            ],
            "dom_2": [
              {"min": 0, "max": 2008,  "rate": 0.0},
              {"min": 2008,  "max": 2170,  "rate": 0.5},
              {"min": 2170,  "max": 2420,  "rate": 1.3},
              {"min": 2420,  "max": 2728,  "rate": 2.1},
              {"min": 2728,  "max": 2833,  "rate": 2.9},
              {"min": 2833,  "max": 2930,  "rate": 3.5},
              {"min": 2930,  "max": 3026,  "rate": 4.1},
              {"min": 3026,  "max": 3362,  "rate": 5.3},
              {"min": 3362,  "max": 4639,  "rate": 7.5},
              {"min": 4639,  "max": 6005,  "rate": 9.9},
              {"min": 6005,  "max": 6772,  "rate": 11.9},
              {"min": 6772,  "max": 7858,  "rate": 13.8},
              {"min": 7858,  "max": 8644,  "rate": 15.8},
              {"min": 8644,  "max": 9577,  "rate": 17.9},
              {"min": 9577,  "max": 11115, "rate": 20.0},
              {"min": 11115, "max": 14953, "rate": 24.0},
              {"min": 14953, "max": 19020, "rate": 28.0},
              {"min": 19020, "max": 30482, "rate": 33.0},
              {"min": 30482, "max": 64341, "rate": 38.0},
              {"min": 64341, "max": 999999, "rate": 43.0}
            ]
          }
        }
      ]
    },


    // ────────────────────────────────────────────────────────────
    // Seuils & obligations
    // ────────────────────────────────────────────────────────────

    "thresholds.11": {
      "label": "Seuil 11 salariés",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     [
                    "Élection du Comité Social et Économique (CSE)",
                    "Formation professionnelle à 1,00% (au lieu de 0,55%)",
                    "Versement mobilité (selon localisation)",
                    "Forfait social applicable (8% ou 20% selon les sommes)",
                    "Partage de la valeur obligatoire si bénéfice net fiscal ≥ 1% du CA pendant 3 exercices consécutifs"
          ],
          "sourceRef": "Code du travail — seuils effectif",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },
    "thresholds.50": {
      "label": "Seuil 50 salariés",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     [
                    "FNAL à 0,50% sur la totalité du salaire (au lieu de 0,10% plafonné)",
                    "Participation aux bénéfices obligatoire*",
                    "Effort de construction à 0,45% (PEEC)",
                    "Obligations renforcées en matière de CSE"
          ],
          "sourceRef": "Code du travail — seuils effectif",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },
    "thresholds.50.note": {
      "label": "Note participation bénéfices (loi PACTE)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     "Participation aux bénéfices : Depuis la loi PACTE, l'obligation ne s'applique qu'à compter du premier exercice ouvert postérieurement à une période de 5 années civiles consécutives au cours desquelles le seuil de 50 salariés a été atteint ou dépassé (moratoire de 5 ans).",
          "sourceRef": "Code du travail — seuils effectif",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },
    "thresholds.250": {
      "label": "Seuil 250 salariés",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     [
                    "Contribution supplémentaire à l'apprentissage si quota de 5% d'alternants non atteint",
                    "Obligations accrues en matière d'emploi des travailleurs handicapés"
          ],
          "sourceRef": "Code du travail — seuils effectif",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },


    // ────────────────────────────────────────────────────────────
    // Durée du travail
    // ────────────────────────────────────────────────────────────

    "work.weekly": {
      "label": "Durée légale hebdomadaire",
      "unit":  "heures",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     35,
          "sourceRef": "Code du travail — Durée du travail",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },
    "work.monthly": {
      "label": "Durée légale mensuelle",
      "unit":  "heures",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     151.67,
          "sourceRef": "Code du travail — Durée du travail",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },
    "work.annual": {
      "label": "Durée légale annuelle",
      "unit":  "heures",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     1807,
          "sourceRef": "Code du travail — Durée du travail",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },
    "work.max_daily": {
      "label": "Durée maximale quotidienne",
      "unit":  "heures",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     "10 (12 sur dérogation)",
          "sourceRef": "Code du travail — Durée du travail",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },
    "work.max_week_abs": {
      "label": "Durée maximale hebdomadaire absolue",
      "unit":  "heures",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     48,
          "sourceRef": "Code du travail — Durée du travail",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },
    "work.max_week_avg": {
      "label": "Durée maximale hebdomadaire moyenne (12 semaines)",
      "unit":  "heures",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     44,
          "sourceRef": "Code du travail — Durée du travail",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },
    "work.rest_daily": {
      "label": "Repos quotidien minimum",
      "unit":  "heures",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     11,
          "sourceRef": "Code du travail — Durée du travail",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },
    "work.rest_weekly": {
      "label": "Repos hebdomadaire minimum",
      "unit":  "heures",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     "35 (24 + 11)",
          "sourceRef": "Code du travail — Durée du travail",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },
    "work.ot_36_43": {
      "label": "Majoration HS (36e→43e)",
      "unit":  "%",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     25,
          "sourceRef": "Code du travail — Durée du travail",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },
    "work.ot_44_plus": {
      "label": "Majoration HS (≥ 44e)",
      "unit":  "%",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     50,
          "sourceRef": "Code du travail — Durée du travail",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },


    // ────────────────────────────────────────────────────────────
    // Congés & absences
    // ────────────────────────────────────────────────────────────

    "leave.paid.acq": {
      "label": "Congés payés — acquisition",
      "unit":  "jours ouvrables",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     "2,5 / mois travaillé",
          "sourceRef": "Code du travail — Congés",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },
    "leave.paid.total": {
      "label": "Congés payés — total",
      "unit":  "jours ouvrables",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     "30 / an (5 semaines)",
          "sourceRef": "Code du travail — Congés",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },
    "leave.paid.indemnity": {
      "label": "Congés payés — indemnité",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     "Le plus favorable entre 1/10e de la rémunération brute et maintien du salaire",
          "sourceRef": "Code du travail — Congés",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },
    "leave.maternity.1_2": {
      "label": "Maternité — 1er/2e enfant",
      "unit":  "semaines",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     "16 (6 avant + 10 après)",
          "sourceRef": "Code du travail — Congés",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },
    "leave.maternity.3_plus": {
      "label": "Maternité — 3e enfant et +",
      "unit":  "semaines",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     "26 (8 avant + 18 après)",
          "sourceRef": "Code du travail — Congés",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },
    "leave.maternity.multiple": {
      "label": "Maternité — grossesse multiple (jumeaux)",
      "unit":  "semaines",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     "34 (12 avant + 22 après)",
          "sourceRef": "Code du travail — Congés",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },
    "leave.paternity.single": {
      "label": "Paternité — naissance simple",
      "unit":  "jours calendaires",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     25,
          "sourceRef": "Code du travail — Congés",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },
    "leave.paternity.multiple": {
      "label": "Paternité — naissance multiple",
      "unit":  "jours calendaires",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     32,
          "sourceRef": "Code du travail — Congés",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },
    "leave.adoption.1_2": {
      "label": "Adoption — 1er/2e enfant au foyer",
      "unit":  "semaines",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     16,
          "sourceRef": "Code du travail — Congés",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },
    "leave.adoption.3_plus": {
      "label": "Adoption — 3e enfant au foyer (ou plus)",
      "unit":  "semaines",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     18,
          "sourceRef": "Code du travail — Congés",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },
    "leave.adoption.multiple": {
      "label": "Adoption — adoptions multiples",
      "unit":  "semaines",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     22,
          "sourceRef": "Code du travail — Congés",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },
    "leave.family.precisions": {
      "label": "Précisions",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     [
                    "Maternité et adoption : durées exprimées en semaines.",
                    "Paternité : durées exprimées en jours calendaires.",
                    "Congé paternité : dont 4 jours obligatoires à prendre immédiatement après la naissance (congé de naissance).",
                    "Congé d'adoption : durées selon le nombre d'enfants au foyer après l'adoption."
          ],
          "sourceRef": "Code du travail — Congés",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },
    "leave.events": {
      "label": "Congés pour événements familiaux",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     [
                    {
                              "event": "Naissance ou adoption d'un enfant",
                              "duration": "3 jours"
                    },
                    {
                              "event": "Arrivée d'un enfant placé en vue de son adoption",
                              "duration": "3 jours"
                    },
                    {
                              "event": "Décès d'un enfant (cas général)",
                              "duration": "12 jours ouvrables"
                    },
                    {
                              "event": "Décès d'un enfant de moins de 25 ans",
                              "duration": "14 jours ouvrables"
                    },
                    {
                              "event": "Mariage ou conclusion d'un PACS du salarié",
                              "duration": "4 jours"
                    },
                    {
                              "event": "Mariage d'un enfant",
                              "duration": "1 jour"
                    },
                    {
                              "event": "Décès du conjoint / partenaire PACS / concubin",
                              "duration": "3 jours"
                    },
                    {
                              "event": "Décès d'un parent / beau-parent / frère / sœur",
                              "duration": "3 jours"
                    },
                    {
                              "event": "Annonce survenue handicap chez un enfant",
                              "duration": "5 jours"
                    },
                    {
                              "event": "Annonce survenue cancer chez un enfant",
                              "duration": "5 jours"
                    },
                    {
                              "event": "Congé de deuil (décès enfant < 25 ans) — indemnisé par la Sécurité sociale",
                              "duration": "8 jours"
                    }
          ],
          "sourceRef": "Code du travail — Congés",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },
    "leave.events.note": {
      "label": "Note",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     "Ces durées sont les minima légaux ; les conventions collectives peuvent prévoir plus favorable.",
          "sourceRef": "Code du travail — Congés",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },
    "leave.paid.acq_ouvres": {
      "label": "Congés payés — acquisition (jours ouvrés)",
      "unit":  "jours ouvrés",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     "2,0833 / mois travaillé",
          "sourceRef": "Code du travail — Congés",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },
    "leave.paid.total_ouvres": {
      "label": "Congés payés — total (jours ouvrés)",
      "unit":  "jours ouvrés",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     "25 / an (5 semaines)",
          "sourceRef": "Code du travail — Congés",
          "sourceUrl": "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/"
        }
      ]
    },


    // ────────────────────────────────────────────────────────────
    // Échéances & calendrier
    // ────────────────────────────────────────────────────────────

    "deadlines.payroll": {
      "label": "Paiement des salaires",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     "À la date habituelle fixée",
          "sourceRef": "URSSAF — Calendrier DSN",
          "sourceUrl": "https://www.urssaf.fr/accueil/employeur/cotisations/calendrier-employeur.html"
        }
      ]
    },
    "deadlines.dsn_monthly": {
      "label": "DSN mensuelle",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     "5 ou 15 du mois suivant",
          "sourceRef": "URSSAF — Calendrier DSN",
          "sourceUrl": "https://www.urssaf.fr/accueil/employeur/cotisations/calendrier-employeur.html"
        }
      ]
    },
    "deadlines.urssaf": {
      "label": "Paiement cotisations URSSAF",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     "5 ou 15 du mois suivant",
          "sourceRef": "URSSAF — Calendrier DSN",
          "sourceUrl": "https://www.urssaf.fr/accueil/employeur/cotisations/calendrier-employeur.html"
        }
      ]
    },
    "deadlines.dsn_event": {
      "label": "DSN événementielle (fin contrat, arrêt maladie…)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     "J+5 ouvrés",
          "sourceRef": "URSSAF — Calendrier DSN",
          "sourceUrl": "https://www.urssaf.fr/accueil/employeur/cotisations/calendrier-employeur.html"
        }
      ]
    },
    "deadlines.dat": {
      "label": "DAT (Déclaration d'Accident du Travail)",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     "48 heures",
          "sourceRef": "URSSAF — Calendrier DSN",
          "sourceUrl": "https://www.urssaf.fr/accueil/employeur/cotisations/calendrier-employeur.html"
        }
      ]
    },
    "deadlines.notes": {
      "label": "Précisions",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     [
                    "DSN mensuelle : 5 du mois pour < 50 salariés ; 15 du mois pour ≥ 50 (choix possible).",
                    "Paiement URSSAF : s'aligne sur les dates de déclaration DSN.",
                    "DAT : 48h hors dimanches et jours fériés après connaissance par l'employeur ; à ne pas confondre avec le délai de 24h du salarié pour informer."
          ],
          "sourceRef": "URSSAF — Calendrier DSN",
          "sourceUrl": "https://www.urssaf.fr/accueil/employeur/cotisations/calendrier-employeur.html"
        }
      ]
    },
    "rupture.plafond.ss_2x_pass": {"label":"Rupture — plafond exo SS","unit":"€","versions":[{"from":"2026-01-01","value":96120,"sourceRef":"CSS art. L.242-1","sourceUrl":"https://www.urssaf.fr/"}]},
    "rupture.plafond.ir_6x_pass": {"label":"Rupture — plafond exo IR","unit":"€","versions":[{"from":"2026-01-01","value":288360,"sourceRef":"CGI art. 80 duodecies","sourceUrl":"https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006303387"}]},
    "rupture.csr.taux": {"label":"CSR sur indemnités de rupture","unit":"%","versions":[{"from":"2026-01-01","value":30,"sourceRef":"CSS art. L.137-12","sourceUrl":"https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006742869"}]},

    // ────────────────────────────────────────────────────────────
    // PAS — Contrats courts & Apprentis/Stagiaires
    // ────────────────────────────────────────────────────────────

    "pas.abattement_contrat_court": {
      "label": "PAS taux neutre — Abattement ½ SMIC (contrats courts ≤ 2 mois)",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     748,
          "sourceRef": "BOFiP-IR-PAS-20-20-30-10-§ 260 — GIP-MDS fiche consigne n° 2454",
          "sourceUrl": "https://www.net-entreprises.fr"
        },
        {
          "from":      "2026-06-01",
          "value":     766,
          "note":      "Tolérance : l'abattement au 1er janvier (748 €) peut être appliqué sur toute l'année 2026 (doctrine BOFiP).",
          "sourceRef": "GIP-MDS actualité du 27 mai 2026 — fiche consigne n° 2454 mise à jour",
          "sourceUrl": "https://www.net-entreprises.fr"
        }
      ]
    },

    "pas.seuil_exo_apprenti": {
      "label": "PAS — Seuil annuel d'exonération IR apprentis/stagiaires (1 820 × SMIC horaire)",
      "unit":  "€",
      "versions": [
        {
          "from":      "2026-01-01",
          "value":     21876,
          "sourceRef": "CGI art. 81 bis — BOFiP-IR-PAS-20-10-10-§ 20",
          "sourceUrl": "https://bofip.impots.gouv.fr"
        },
        {
          "from":      "2026-06-01",
          "value":     22184,
          "note":      "Calcul proratisé : (5/12 × 1820 × 12,02 €) + (7/12 × 1820 × 12,31 €). Tolérance : calcul sur la base du SMIC au 1er janvier admis (→ 21 876 €).",
          "sourceRef": "net-entreprises.fr information du 27 mai 2026 — CGI art. 81 bis",
          "sourceUrl": "https://www.net-entreprises.fr"
        }
      ]
    }

  }; // fin DATA


  // ── API publique ──────────────────────────────────────────────────────────

  /**
   * Résout la valeur active d'un paramètre à une date donnée.
   * @param {string} key        - Clé du paramètre (ex: "smic.hourly")
   * @param {string|Date} [ref] - Date de référence (défaut : aujourd'hui)
   * @returns La valeur en vigueur, ou null si le paramètre n'existe pas
   */
  function resolve(key, ref) {
    const param = DATA[key];
    if (!param || !param.versions || param.versions.length === 0) return null;
    const d = ref ? new Date(ref) : new Date();
    const active = param.versions
      .filter(v => new Date(v.from) <= d)
      .at(-1);
    return active ? active.value : null;
  }

  /**
   * Retourne toutes les versions d'un paramètre (pour affichage historique).
   * @param {string} key
   * @returns {Array} Tableau des versions triées chronologiquement
   */
  function versions(key) {
    const param = DATA[key];
    if (!param) return [];
    return [...param.versions].sort((a, b) =>
      new Date(a.from) - new Date(b.from)
    );
  }

  /**
   * Retourne la version active avec ses métadonnées (source, url).
   * @param {string} key
   * @param {string|Date} [ref]
   * @returns {object|null} { from, value, sourceRef, sourceUrl }
   */
  function resolveWithMeta(key, ref) {
    const param = DATA[key];
    if (!param || !param.versions) return null;
    const d = ref ? new Date(ref) : new Date();
    return param.versions
      .filter(v => new Date(v.from) <= d)
      .at(-1) ?? null;
  }

  /**
   * Retourne toutes les dates de changement uniques dans l'ensemble des
   * paramètres. Utilisé pour construire le sélecteur de date.
   * @returns {string[]} Dates triées (YYYY-MM-DD), futures incluses
   */
  function allDates() {
    const dates = new Set();
    for (const param of Object.values(DATA)) {
      for (const v of (param.versions || [])) {
        dates.add(v.from);
      }
    }
    return [...dates].sort();
  }

  /**
   * Retourne toutes les dates de changement passées + futures proches.
   * Format enrichi pour le sélecteur UI.
   * @returns {Array} [{date, label, isFuture, isPast}]
   */
  function dateOptions() {
    const today = new Date();
    return allDates().map(d => {
      const dt = new Date(d);
      const isFuture = dt > today;
      const y = dt.getFullYear(), m = dt.getMonth()+1, day = dt.getDate();
      const label = isFuture
        ? `À partir du ${day.toString().padStart(2,'0')}/${m.toString().padStart(2,'0')}/${y} (à venir)`
        : `${day.toString().padStart(2,'0')}/${m.toString().padStart(2,'0')}/${y}`;
      return { date: d, label, isFuture, isPast: !isFuture };
    }).reverse(); // Plus récent en premier
  }

  /**
   * Retourne le label d'un paramètre.
   */
  function label(key) {
    return DATA[key]?.label ?? key;
  }

  /**
   * Retourne l'unité d'un paramètre.
   */
  function unit(key) {
    return DATA[key]?.unit ?? "";
  }

  // ── Export ─────────────────────────────────────────────────────────────────
  return {
    resolve,
    resolveWithMeta,
    versions,
    allDates,
    dateOptions,
    label,
    unit,
    // Accès direct aux données brutes (lecture seule)
    data: DATA,
  };
})();
