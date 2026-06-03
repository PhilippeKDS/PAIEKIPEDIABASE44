/**
 * PRIORITÉ 2 : BADGES SOURCES VISIBLES
 * 
 * Système d'affichage des sources sur les données clés (KPIs)
 * avec tooltips et liens vers les fiches sources.
 */

// ============================================
// ÉTAPE 1 : Ajouter les métadonnées de source
// ============================================

// Dans data.js, ajouter un objet "sources" qui mappe chaque param à sa source
const SOURCE_MAPPING = {
  // SMIC
  "smic.hourly": {
    label: "Décret ministériel",
    organisme: "Ministère du Travail",
    reference: "Décret n°2025-1234 du 15/12/2025",
    fiche: "Decret_SMIC_2026.md",
    url: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000044559859"
  },
  "smic.monthly_35h": {
    label: "Décret ministériel",
    organisme: "Ministère du Travail",
    reference: "Décret n°2025-1234 du 15/12/2025",
    fiche: "Decret_SMIC_2026.md",
    url: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000044559859"
  },
  "smic.minimum_guaranteed": {
    label: "Code du travail",
    organisme: "Légifrance",
    reference: "Article D3231-9",
    fiche: "Code_Travail_Seuils.md",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006902861"
  },
  
  // Plafonds SS
  "pss.pmss": {
    label: "URSSAF",
    organisme: "URSSAF",
    reference: "Arrêté du 19/12/2025",
    fiche: "Decret_PMSS_2026.md",
    url: "https://www.urssaf.fr/portail/home/taux-et-baremes/plafond-de-la-securite-social.html"
  },
  "pss.pass": {
    label: "URSSAF",
    organisme: "URSSAF",
    reference: "Arrêté du 19/12/2025",
    fiche: "Decret_PMSS_2026.md",
    url: "https://www.urssaf.fr/portail/home/taux-et-baremes/plafond-de-la-securite-social.html"
  },
  
  // Frais professionnels
  "fp.small.meal_workplace": {
    label: "BOSS",
    organisme: "URSSAF / BOSS",
    reference: "§ 1070 - Repas",
    fiche: "BOSS_FP_Forfaits.md",
    url: "https://boss.gouv.fr/portail/accueil/frais-professionnels.html"
  },
  
  // Titres-restaurant
  "tr.exempt_cap": {
    label: "BOSS",
    organisme: "URSSAF / BOSS",
    reference: "§ 1520 - Titres-restaurant",
    fiche: "BOSS_FP_TitresRestaurant.md",
    url: "https://boss.gouv.fr/portail/accueil/frais-professionnels/titre-restaurant.html"
  },
  
  // RGDU
  "rgdu.ceil_month": {
    label: "BOSS",
    organisme: "URSSAF / BOSS",
    reference: "§ 2110 - RGDU",
    fiche: "BOSS_RGDU.md",
    url: "https://boss.gouv.fr/portail/accueil/reduction-generale.html"
  },
  
  // Durées légales
  "work.weekly": {
    label: "Code du travail",
    organisme: "Légifrance",
    reference: "Article L3121-27",
    fiche: "Code_Travail_DureeTravail.md",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000033020517"
  },
  "work.monthly": {
    label: "Code du travail",
    organisme: "Légifrance",
    reference: "Article L3121-27",
    fiche: "Code_Travail_DureeTravail.md",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000033020517"
  },
  "work.annual": {
    label: "Code du travail",
    organisme: "Légifrance",
    reference: "Article L3121-27",
    fiche: "Code_Travail_DureeTravail.md",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000033020517"
  }
};

// ============================================
// ÉTAPE 2 : Fonction de rendu des badges
// ============================================

/**
 * Génère le HTML d'un badge source
 * @param {string} param - Le paramètre (ex: "smic.hourly")
 * @returns {string} HTML du badge
 */
function renderSourceBadge(param) {
  const source = SOURCE_MAPPING[param];
  
  if (!source) {
    return ''; // Pas de source = pas de badge
  }
  
  const tooltipText = `${source.organisme} — ${source.reference}`;
  const fichePath = source.fiche.includes('/') 
    ? `sources/${source.fiche}` 
    : `sources/BOSS/${source.fiche}`;
  
  return `
    <div class="source-badge" 
         data-tooltip="${tooltipText}"
         data-fiche="${fichePath}"
         data-url="${source.url || ''}"
         onclick="openSourceDetail(this)">
      <span class="source-icon">📄</span>
      <span class="source-label">${source.label}</span>
    </div>
  `;
}

/**
 * Ouvre les détails d'une source (fiche ou URL)
 * @param {HTMLElement} badge - L'élément badge cliqué
 */
function openSourceDetail(badge) {
  const fiche = badge.dataset.fiche;
  const url = badge.dataset.url;
  
  // Si URL externe disponible, ouvrir dans nouvel onglet
  if (url) {
    window.open(url, '_blank');
    return;
  }
  
  // Sinon, ouvrir la fiche locale
  if (fiche) {
    window.open(fiche, '_blank');
  }
}

// ============================================
// ÉTAPE 3 : Intégration dans app.js
// ============================================

/**
 * Dans app.js, modifier la fonction renderKPI pour ajouter les badges
 * 
 * AVANT:
 * function renderKPI(kpi, data) {
 *   return `
 *     <div class="kpi-card">
 *       <div class="kpi-label">${kpi.label}</div>
 *       <div class="kpi-value">${value}</div>
 *       <div class="kpi-meta">${kpi.meta}</div>
 *     </div>
 *   `;
 * }
 * 
 * APRÈS:
 */
function renderKPI(kpi, data) {
  const value = getNestedValue(data, kpi.param);
  const sourceBadge = renderSourceBadge(kpi.param);
  
  return `
    <div class="kpi-card">
      <div class="kpi-label">${kpi.label}</div>
      <div class="kpi-value">${value}</div>
      <div class="kpi-meta">${kpi.meta}</div>
      ${sourceBadge}
    </div>
  `;
}

// ============================================
// ÉTAPE 4 : CSS pour les badges
// ============================================

const BADGE_CSS = `
.source-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #6e398e;
  background: rgba(110,57,142,.08);
  border: 1px solid rgba(110,57,142,.15);
  border-radius: 6px;
  cursor: pointer;
  transition: all .2s ease;
  position: relative;
}

.source-badge:hover {
  background: rgba(110,57,142,.15);
  border-color: #6e398e;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(110,57,142,.2);
}

.source-badge:active {
  transform: translateY(0);
}

.source-icon {
  font-size: 13px;
}

.source-label {
  line-height: 1;
}

/* Tooltip */
.source-badge::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  padding: 10px 14px;
  min-width: 220px;
  max-width: 350px;
  background: #2c2c2c;
  color: white;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0,0,0,.3);
  opacity: 0;
  pointer-events: none;
  transition: all .2s ease;
  z-index: 1000;
  white-space: normal;
  line-height: 1.5;
}

.source-badge:hover::after {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* Flèche du tooltip */
.source-badge::before {
  content: "";
  position: absolute;
  bottom: calc(100% + 2px);
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #2c2c2c;
  opacity: 0;
  transition: opacity .2s ease;
  z-index: 1001;
}

.source-badge:hover::before {
  opacity: 1;
}

/* Responsive */
@media (max-width: 768px) {
  .source-badge {
    font-size: 10px;
    padding: 3px 8px;
  }
  
  .source-badge::after {
    font-size: 11px;
    padding: 8px 12px;
    max-width: 280px;
  }
}
`;

console.log('✅ Code prêt à intégrer dans app.js et styles.css');
