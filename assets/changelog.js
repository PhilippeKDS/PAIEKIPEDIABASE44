/**
 * PaieKipédia — Changelog des mises à jour du portail
 * ─────────────────────────────────────────────────────
 * Chaque entrée :
 *   date    : "YYYY-MM-DD"
 *   module  : "Bareme" | "Outils" | "Reforme" | "Veille" | "Portail"
 *   titre   : texte court affiché
 *   lien    : URL relative (depuis paie/) ou null
 *
 * Les 5 entrées les plus récentes sont affichées sur l'accueil.
 * Ajouter toujours en tête de tableau.
 */

window.PAIEKIPEDIA_CHANGELOG = [
  {
    date: "2026-06-01",
    module: "Reforme",
    titre: "3 nouvelles fiches : SMIC juin 2026, gel RGDU, PAS contrats courts/apprentis",
    lien: "reforme/"
  },
  {
    date: "2026-06-01",
    module: "Bareme",
    titre: "SMIC 12,31 €/h au 1er juin 2026 — Minimum garanti 4,35 € — PAS contrats courts & apprentis",
    lien: "bareme/"
  },
  {
    date: "2026-06-01",
    module: "Outils",
    titre: "RGDU : pop-up information gel du paramètre SMIC (décret attendu)",
    lien: "outils/rgdu/"
  },
  {
    date: "2026-06-01",
    module: "Outils",
    titre: "Accès Simulateurs divers rétabli depuis le portail Outils",
    lien: "outils/simulateurs/"
  },
  {
    date: "2026-05-03",
    module: "Bareme",
    titre: "Notes explicatives AGIRC-ARRCO et IRCANTEC ajoutées (ch. 7)",
    lien: "bareme/"
  }
];
