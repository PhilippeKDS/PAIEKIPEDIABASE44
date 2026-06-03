/**
 * PRIORITÉ 3 : GLOSSAIRE INTELLIGENT
 * 
 * Système d'auto-détection et surlignage des termes du glossaire
 * dans tout le contenu de l'application avec tooltips et modal.
 */

// ============================================
// ÉTAPE 1 : Ajouter DGFiP et BOFiP au glossaire
// ============================================

const NEW_GLOSSARY_TERMS = [
  {
    "term": "DGFiP",
    "def": "Direction Générale des Finances Publiques. Administration fiscale française responsable de l'impôt sur le revenu, du prélèvement à la source (PAS) et de la publication des barèmes fiscaux via le BOFiP.",
    "source": "Ministère de l'Économie / bofip.impots.gouv.fr"
  },
  {
    "term": "BOFiP",
    "def": "Bulletin Officiel des Finances Publiques - Impôts. Base documentaire de la DGFiP contenant la doctrine fiscale opposable de l'administration. Publié sur bofip.impots.gouv.fr, il fait référence pour les barèmes du prélèvement à la source, indemnités kilométriques, frais professionnels, etc.",
    "source": "DGFiP"
  }
];

// ============================================
// ÉTAPE 2 : Fonction d'auto-détection
// ============================================

/**
 * Détecte et surligne automatiquement les termes du glossaire
 * dans tout le contenu de la page
 */
function autoHighlightGlossary() {
  const glossary = window.MEMO_DATA?.meta?.glossary || [];
  
  if (glossary.length === 0) {
    console.warn('Glossaire vide, auto-détection annulée');
    return;
  }
  
  // Sélectionner tous les contenus où détecter les termes
  const selectors = [
    '.tile .desc',           // Descriptions des tuiles
    '.kpi .label',           // Labels des KPIs
    '.data-desc',            // Descriptions des données
    '.drawer-body p',        // Paragraphes dans les tiroirs
    '.drawer-body li',       // Listes dans les tiroirs
    'td',                    // Cellules de tableaux
  ];
  
  const targets = document.querySelectorAll(selectors.join(', '));
  
  console.log(`Auto-détection glossaire : ${targets.length} éléments à analyser`);
  
  let totalDetections = 0;
  
  targets.forEach(element => {
    // Ne pas traiter si déjà traité
    if (element.dataset.glossaryProcessed === 'true') return;
    
    let html = element.innerHTML;
    let hasChanges = false;
    
    // Pour chaque terme du glossaire
    glossary.forEach(entry => {
      const term = entry.term;
      const def = entry.def;
      const source = entry.source || '';
      
      // Échapper les caractères spéciaux pour regex
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Regex pour trouver le terme (word boundary, case insensitive)
      // Ne pas remplacer si déjà dans une balise
      const regex = new RegExp(`\\b(${escapedTerm})\\b(?![^<]*>|[^<>]*<\/)`, 'gi');
      
      // Compter les occurrences
      const matches = html.match(regex);
      if (matches) {
        totalDetections += matches.length;
      }
      
      // Remplacer par version surlignée avec tooltip
      const replacement = html.replace(regex, (match) => {
        hasChanges = true;
        return `<span class="glossary-term" 
                      data-term="${term}"
                      data-definition="${def.replace(/"/g, '&quot;')}"
                      data-source="${source.replace(/"/g, '&quot;')}"
                      title="Cliquez pour voir la définition">${match}</span>`;
      });
      
      html = replacement;
    });
    
    if (hasChanges) {
      element.innerHTML = html;
      element.dataset.glossaryProcessed = 'true';
    }
  });
  
  console.log(`✅ Auto-détection terminée : ${totalDetections} termes surlignés`);
  
  // Ajouter les événements de clic
  attachGlossaryEvents();
}

/**
 * Attache les événements de clic sur les termes surlignés
 */
function attachGlossaryEvents() {
  const terms = document.querySelectorAll('.glossary-term');
  
  terms.forEach(term => {
    // Retirer les anciens listeners
    term.removeEventListener('click', handleGlossaryClick);
    
    // Ajouter le nouveau listener
    term.addEventListener('click', handleGlossaryClick);
  });
  
  console.log(`✅ ${terms.length} termes glossaire cliquables`);
}

/**
 * Gestionnaire de clic sur un terme
 */
function handleGlossaryClick(e) {
  e.stopPropagation();
  
  const term = this.dataset.term;
  const definition = this.dataset.definition;
  const source = this.dataset.source;
  
  showGlossaryModal(term, definition, source);
}

// ============================================
// ÉTAPE 3 : Modal glossaire
// ============================================

/**
 * Affiche un modal avec la définition complète du terme
 */
function showGlossaryModal(term, definition, source) {
  // Supprimer modal existant si présent
  const existing = document.querySelector('.glossary-modal-overlay');
  if (existing) existing.remove();
  
  // Créer le modal
  const modal = document.createElement('div');
  modal.className = 'glossary-modal-overlay';
  modal.innerHTML = `
    <div class="glossary-modal">
      <div class="glossary-modal-header">
        <h3>📖 ${term}</h3>
        <button class="btn-close" onclick="this.closest('.glossary-modal-overlay').remove()" aria-label="Fermer">✕</button>
      </div>
      <div class="glossary-modal-body">
        <p class="definition">${definition}</p>
        ${source ? `<p class="source"><strong>Source :</strong> ${source}</p>` : ''}
        <div class="modal-actions">
          <a href="glossary.html?term=${encodeURIComponent(term)}" class="btn btn-sm btn-primary">
            Voir dans le glossaire complet →
          </a>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Fermeture au clic sur overlay
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  
  // Fermeture au clavier (Escape)
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

// ============================================
// ÉTAPE 4 : Initialisation
// ============================================

/**
 * Initialiser l'auto-détection après le chargement
 */
function initGlossaryAutoDetection() {
  // Attendre que le DOM soit prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(autoHighlightGlossary, 500);
    });
  } else {
    setTimeout(autoHighlightGlossary, 500);
  }
  
  // Ré-appliquer après ouverture d'un tiroir
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1 && node.classList?.contains('drawer-body')) {
            setTimeout(autoHighlightGlossary, 100);
          }
        });
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Lancer l'initialisation
console.log('📖 Glossaire intelligent initialisé');

