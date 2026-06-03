/**
 * Module Accessibilité (A11Y)
 * Gestion du focus trap, navigation clavier, et conformité RGAA
 * 
 * @module accessibility
 */

(() => {
  'use strict';

  const A11Y = {
    // Éléments focusables
    FOCUSABLE_SELECTORS: [
      'a[href]',
      'area[href]',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'button:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(','),

    /**
     * Active le focus trap sur un élément modal
     * @param {HTMLElement} element - Élément contenant le modal
     * @returns {Function} Fonction de nettoyage
     */
    enableFocusTrap(element) {
      if (!element) return () => {};

      const focusableElements = element.querySelectorAll(this.FOCUSABLE_SELECTORS);
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      const handleTabKey = (e) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      };

      element.addEventListener('keydown', handleTabKey);
      
      // Focus premier élément
      if (firstFocusable) {
        firstFocusable.focus();
      }

      // Fonction de nettoyage
      return () => {
        element.removeEventListener('keydown', handleTabKey);
      };
    },

    /**
     * Gère la fermeture d'un modal avec Escape
     * @param {HTMLElement} element - Modal
     * @param {Function} closeCallback - Fonction à appeler pour fermer
     * @returns {Function} Fonction de nettoyage
     */
    enableEscapeHandler(element, closeCallback) {
      if (!element || !closeCallback) return () => {};

      const handleEscape = (e) => {
        if (e.key === 'Escape' || e.key === 'Esc') {
          e.preventDefault();
          closeCallback();
        }
      };

      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    },

    /**
     * Active un modal avec accessibilité complète
     * @param {Object} options - Configuration
     * @param {HTMLElement} options.modal - Élément modal
     * @param {HTMLElement} options.overlay - Overlay (optionnel)
     * @param {Function} options.onClose - Callback de fermeture
     * @returns {Function} Fonction de nettoyage complète
     */
    activateModal({ modal, overlay, onClose }) {
      if (!modal) return () => {};

      // Sauvegarder le focus actuel
      const previousFocus = document.activeElement;

      // Marquer comme modal ouvert
      modal.setAttribute('aria-hidden', 'false');
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');

      if (overlay) {
        overlay.setAttribute('aria-hidden', 'false');
      }

      // Activer focus trap
      const cleanupFocusTrap = this.enableFocusTrap(modal);

      // Activer Escape handler
      const cleanupEscape = this.enableEscapeHandler(modal, onClose);

      // Fonction de nettoyage complète
      return () => {
        cleanupFocusTrap();
        cleanupEscape();
        
        modal.setAttribute('aria-hidden', 'true');
        if (overlay) {
          overlay.setAttribute('aria-hidden', 'true');
        }

        // Restaurer le focus
        if (previousFocus && previousFocus.focus) {
          previousFocus.focus();
        }
      };
    },

    /**
     * Améliore l'accessibilité d'un bouton toggle
     * @param {HTMLElement} button - Bouton
     * @param {string} target - ID de l'élément contrôlé
     */
    enhanceToggleButton(button, target) {
      if (!button) return;

      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', target);

      const toggle = () => {
        const expanded = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', !expanded);
      };

      button.addEventListener('click', toggle);
    },

    /**
     * Annonce un message aux lecteurs d'écran
     * @param {string} message - Message à annoncer
     * @param {string} priority - 'polite' ou 'assertive'
     */
    announce(message, priority = 'polite') {
      let announcer = document.getElementById('a11y-announcer');
      
      if (!announcer) {
        announcer = document.createElement('div');
        announcer.id = 'a11y-announcer';
        announcer.setAttribute('role', 'status');
        announcer.setAttribute('aria-live', priority);
        announcer.setAttribute('aria-atomic', 'true');
        announcer.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;';
        document.body.appendChild(announcer);
      }

      // Clear puis set pour forcer l'annonce
      announcer.textContent = '';
      setTimeout(() => {
        announcer.textContent = message;
      }, 100);
    },

    /**
     * Initialise l'accessibilité globale du simulateur
     */
    init() {
      // Drawer (détails)
      const drawer = document.getElementById('drawer');
      const drawerClose = document.getElementById('drawerClose');
      const drawerOverlay = document.getElementById('drawerOverlay');
      
      if (drawer && drawerClose) {
        let cleanupDrawer = null;

        const openDrawer = () => {
          cleanupDrawer = this.activateModal({
            modal: drawer.querySelector('.drawer-panel'),
            overlay: drawerOverlay,
            onClose: closeDrawer
          });
          this.announce('Panneau de détails ouvert', 'polite');
        };

        const closeDrawer = () => {
          if (cleanupDrawer) {
            cleanupDrawer();
            cleanupDrawer = null;
          }
          drawer.setAttribute('aria-hidden', 'true');
          this.announce('Panneau de détails fermé', 'polite');
        };

        // Événements
        drawerClose.addEventListener('click', closeDrawer);
        if (drawerOverlay) {
          drawerOverlay.addEventListener('click', closeDrawer);
        }

        // Stocker pour utilisation externe
        window.KDS_A11Y = window.KDS_A11Y || {};
        window.KDS_A11Y.openDrawer = openDrawer;
        window.KDS_A11Y.closeDrawer = closeDrawer;
      }

      // Modals
      const helpModal = document.getElementById('helpModal');
      const exampleModal = document.getElementById('exampleModal');

      if (helpModal) {
        this.setupModal(helpModal, 'help');
      }

      if (exampleModal) {
        this.setupModal(exampleModal, 'modal');
      }

      // Calculatrice
      const calc = document.getElementById('calc');
      const calcClose = document.getElementById('calcClose');
      
      if (calc && calcClose) {
        let cleanupCalc = null;

        const openCalc = () => {
          calc.setAttribute('aria-hidden', 'false');
          cleanupCalc = this.activateModal({
            modal: calc,
            onClose: closeCalc
          });
        };

        const closeCalc = () => {
          if (cleanupCalc) {
            cleanupCalc();
            cleanupCalc = null;
          }
          calc.setAttribute('aria-hidden', 'true');
        };

        calcClose.addEventListener('click', closeCalc);

        window.KDS_A11Y = window.KDS_A11Y || {};
        window.KDS_A11Y.openCalc = openCalc;
        window.KDS_A11Y.closeCalc = closeCalc;
      }

      console.info('[A11Y] Accessibilité initialisée');
    },

    /**
     * Configure un modal avec accessibilité
     * @param {HTMLElement} modal - Modal
     * @param {string} dataAttr - Attribut data pour les boutons de fermeture
     */
    setupModal(modal, dataAttr) {
      let cleanup = null;

      const close = () => {
        if (cleanup) {
          cleanup();
          cleanup = null;
        }
        modal.setAttribute('aria-hidden', 'true');
      };

      const open = () => {
        modal.setAttribute('aria-hidden', 'false');
        cleanup = this.activateModal({
          modal: modal.querySelector('[role="dialog"]'),
          overlay: modal.querySelector('.modal-overlay'),
          onClose: close
        });
      };

      // Boutons de fermeture
      modal.querySelectorAll(`[data-close="${dataAttr}"]`).forEach(btn => {
        btn.addEventListener('click', close);
      });

      // Stocker pour utilisation externe
      window.KDS_A11Y = window.KDS_A11Y || {};
      window.KDS_A11Y[`open_${dataAttr}`] = open;
      window.KDS_A11Y[`close_${dataAttr}`] = close;
    }
  };

  // Auto-initialisation
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => A11Y.init());
  } else {
    A11Y.init();
  }

  // Export global
  window.KDS_A11Y = window.KDS_A11Y || {};
  Object.assign(window.KDS_A11Y, A11Y);

})();
