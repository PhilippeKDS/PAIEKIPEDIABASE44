(() => {
  // ========================================
  // DISCLAIMER RENFORCÉ - PAIEKIPÉDIA BY KDS
  // Version juridiquement renforcée
  // ========================================
  
  const DISCLAIMER_VERSION = "2026-02-v2"; // Incrémenter pour forcer réaffichage
  const LS_ACK = "kds_paie_disclaimer_ack_v";
  const LS_BANNER_CLOSED = "kds_paie_disclaimer_banner_closed_v";
  const ackKey = `${LS_ACK}${DISCLAIMER_VERSION}`;
  const bannerKey = `${LS_BANNER_CLOSED}${DISCLAIMER_VERSION}`;

  const title = "Avertissement – Conditions d'utilisation";
  
  // TEXTE RENFORCÉ JURIDIQUEMENT
  const text = `**IMPORTANT – Veuillez lire attentivement avant utilisation**

**1. NATURE DES CONTENUS**

Les contenus, outils et simulateurs accessibles depuis ce portail sont mis à disposition par Koesio Data Solutions à titre informatif uniquement. Ils constituent des outils d'aide à la compréhension, à l'analyse et au contrôle de mécanismes de paie et déclaratifs.

**2. ABSENCE DE VALEUR JURIDIQUE**

Les résultats produits par ces outils :
• N'ont AUCUNE valeur légale, réglementaire ou contractuelle
• Ne constituent PAS des bulletins de paie officiels
• Ne remplacent PAS un conseil juridique ou fiscal personnalisé
• Ne constituent PAS une validation de conformité

**3. LIMITES DE FIABILITÉ**

Bien que conçus et maintenus avec soin, ces outils :
• Sont basés sur des hypothèses génériques qui peuvent ne pas correspondre à votre situation
• Ne prennent pas en compte toutes les spécificités (conventions collectives, accords d'entreprise, statuts particuliers, exonérations, taux dérogatoires, etc.)
• Peuvent contenir des erreurs, imprécisions ou devenir obsolètes
• Sont susceptibles d'évoluer sans préavis

**4. OBLIGATION DE VÉRIFICATION**

L'utilisateur s'engage à :
• Vérifier SYSTÉMATIQUEMENT les résultats dans son environnement de paie réel
• Valider les calculs avec son expert-comptable, expert paie ou conseiller juridique
• Ne PAS utiliser ces résultats comme base unique de déclaration officielle
• Prendre toute décision sous sa seule et entière responsabilité

**5. LIMITATION DE RESPONSABILITÉ**

Koesio Data Solutions décline toute responsabilité en cas de :
• Erreurs, inexactitudes ou omissions dans les résultats
• Dommages directs ou indirects résultant de l'utilisation de ces outils
• Décisions, déclarations ou traitements effectués sur la base de ces résultats
• Pertes financières, sanctions administratives ou contentieux

**6. DONNÉES PERSONNELLES**

Les calculs sont effectués localement dans votre navigateur. Aucune donnée saisie n'est transmise à nos serveurs. Seules des statistiques d'usage anonymes peuvent être collectées pour améliorer les outils.

**7. PROPRIÉTÉ INTELLECTUELLE**

Le code, les algorithmes et les contenus de ce portail sont protégés par le droit d'auteur. Toute reproduction, adaptation ou diffusion sans autorisation est interdite.

**8. ACCEPTATION**

L'utilisation de ce portail vaut acceptation sans réserve des présentes conditions. En cas de désaccord, veuillez ne pas utiliser ces outils.

**Version : ${DISCLAIMER_VERSION} – Dernière mise à jour : Février 2026**`;

  // Version courte pour le bandeau
  const shortText = "Les outils de ce portail sont fournis à titre informatif. Les résultats n'ont aucune valeur officielle et doivent être systématiquement vérifiés dans votre environnement de paie. Koesio Data Solutions décline toute responsabilité en cas d'erreur ou de décision prise sur la base de ces résultats.";

  // ========================================
  // FONCTIONS UTILITAIRES
  // ========================================
  
  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v]) => {
      if (k === "class") node.className = v;
      else if (k.startsWith("aria-")) node.setAttribute(k, v);
      else node.setAttribute(k, v);
    });
    ([]).concat(children).forEach(ch => {
      if (ch == null) return;
      if (typeof ch === "string") {
        // Support du markdown basique pour le texte
        const formatted = ch
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\n\n/g, '</p><p>')
          .replace(/\n/g, '<br>');
        const wrapper = document.createElement('div');
        wrapper.innerHTML = '<p>' + formatted + '</p>';
        Array.from(wrapper.childNodes).forEach(child => node.appendChild(child));
      } else {
        node.appendChild(ch);
      }
    });
    return node;
  }

  // ========================================
  // MODAL DISCLAIMER
  // ========================================
  
  function buildModal() {
    const backdrop = el("div", {
      class: "kds-modal-backdrop",
      role: "dialog",
      "aria-modal": "true",
      "aria-hidden": "true",
      "aria-label": title,
      id: "kdsDisclaimerModal"
    });

    const modal = el("div", { class: "kds-modal kds-modal--large" }); // Version large pour plus de contenu

    const header = el("div", { class: "kds-modal-header" }, [
      el("h2", { class: "kds-modal-title" }, [title]),
      el("button", { 
        class: "kds-btn kds-btn--ghost kds-btn--small", 
        type: "button", 
        id: "kdsDisclaimerCloseX",
        "aria-label": "Fermer la fenêtre"
      }, ["×"])
    ]);

    const body = el("div", { 
      class: "kds-modal-body kds-modal-body--scrollable",
      style: "max-height: 60vh; overflow-y: auto;"
    }, [text]);

    // Checkbox d'acceptation (optionnel mais recommandé)
    const checkboxWrapper = el("div", { 
      class: "kds-checkbox-wrapper",
      style: "margin: 16px 0; padding: 12px; background: #fff3cd; border-radius: 8px;"
    }, [
      el("label", { 
        style: "display: flex; align-items: flex-start; gap: 10px; cursor: pointer;" 
      }, [
        el("input", { 
          type: "checkbox", 
          id: "kdsDisclaimerCheckbox",
          style: "margin-top: 3px; cursor: pointer;"
        }),
        el("span", {}, [
          "Je reconnais avoir lu et compris l'avertissement ci-dessus. J'accepte d'utiliser ces outils sous ma seule responsabilité et de vérifier systématiquement les résultats."
        ])
      ])
    ]);

    const actions = el("div", { class: "kds-modal-actions" }, [
      el("button", { 
        class: "kds-btn kds-btn--ghost", 
        type: "button", 
        id: "kdsDisclaimerClose" 
      }, ["Fermer"]),
      el("button", { 
        class: "kds-btn kds-btn--coral", 
        type: "button", 
        id: "kdsDisclaimerAck",
        disabled: "disabled" // Désactivé jusqu'à ce que la checkbox soit cochée
      }, ["J'accepte et je continue"])
    ]);

    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(checkboxWrapper);
    modal.appendChild(actions);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    // Gestion de la checkbox
    const checkbox = document.getElementById("kdsDisclaimerCheckbox");
    const ackBtn = document.getElementById("kdsDisclaimerAck");
    
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        ackBtn.removeAttribute("disabled");
      } else {
        ackBtn.setAttribute("disabled", "disabled");
      }
    });

    const close = () => {
      backdrop.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };
    
    const open = () => {
      backdrop.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      checkbox.checked = false;
      ackBtn.setAttribute("disabled", "disabled");
      setTimeout(() => {
        const btn = document.getElementById("kdsDisclaimerClose");
        btn && btn.focus();
      }, 20);
    };

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        // Ne pas permettre de fermer en cliquant à l'extérieur la première fois
        const acknowledged = localStorage.getItem(ackKey) === "1";
        if (acknowledged) close();
      }
    });
    
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && backdrop.getAttribute("aria-hidden") === "false") {
        const acknowledged = localStorage.getItem(ackKey) === "1";
        if (acknowledged) close();
      }
    });

    document.getElementById("kdsDisclaimerCloseX").addEventListener("click", () => {
      const acknowledged = localStorage.getItem(ackKey) === "1";
      if (acknowledged) {
        close();
      } else {
        if (confirm("Vous devez accepter les conditions avant de continuer. Souhaitez-vous quitter le site ?")) {
          window.history.back();
        }
      }
    });
    
    document.getElementById("kdsDisclaimerClose").addEventListener("click", () => {
      const acknowledged = localStorage.getItem(ackKey) === "1";
      if (acknowledged) {
        close();
      } else {
        if (confirm("Vous devez accepter les conditions avant de continuer. Souhaitez-vous quitter le site ?")) {
          window.history.back();
        }
      }
    });
    
    document.getElementById("kdsDisclaimerAck").addEventListener("click", () => {
      if (checkbox.checked) {
        try { 
          localStorage.setItem(ackKey, "1");
          // Enregistrer aussi la date d'acceptation
          localStorage.setItem(ackKey + "_date", new Date().toISOString());
        } catch (_) {}
        close();
      }
    });

    return { open, close };
  }

  // ========================================
  // BANDEAU DISCLAIMER
  // ========================================
  
  function buildBanner(modalApi) {
    const banner = el("div", { class: "kds-banner", id: "kdsDisclaimerBanner" });

    const head = el("div", { class: "kds-banner-head" }, [
      el("div", {}, [
        el("strong", {}, ["⚠️ Avertissement important"]),
        el("span", { class: "kds-muted", style: "margin-left:10px;" }, ["(cliquer pour afficher)"])
      ]),
      el("div", {}, [
        el("button", { 
          class: "kds-btn kds-btn--ghost kds-btn--small", 
          type: "button", 
          id: "kdsBannerToggle" 
        }, ["Afficher"]),
        el("button", { 
          class: "kds-btn kds-btn--ghost kds-btn--small", 
          type: "button", 
          id: "kdsBannerClose" 
        }, ["Fermer"])
      ])
    ]);

    const body = el("div", { class: "kds-banner-body kds-hidden", id: "kdsBannerBody" }, [
      shortText,
      el("div", { class: "kds-banner-actions" }, [
        el("button", { 
          class: "kds-btn kds-btn--ghost kds-btn--small", 
          type: "button", 
          id: "kdsBannerModal" 
        }, ["Lire l'avertissement complet"]),
        el("button", { 
          class: "kds-btn kds-btn--small", 
          type: "button", 
          id: "kdsBannerReduce" 
        }, ["Réduire"])
      ])
    ]);

    banner.appendChild(head);
    banner.appendChild(body);
    document.body.appendChild(banner);

    const toggleBtn = document.getElementById("kdsBannerToggle");
    const closeBtn = document.getElementById("kdsBannerClose");
    const reduceBtn = document.getElementById("kdsBannerReduce");
    const modalBtn = document.getElementById("kdsBannerModal");
    const bodyEl = document.getElementById("kdsBannerBody");

    const expand = () => {
      bodyEl.classList.remove("kds-hidden");
      toggleBtn.textContent = "Réduire";
    };
    
    const collapse = () => {
      bodyEl.classList.add("kds-hidden");
      toggleBtn.textContent = "Afficher";
    };
    
    const isExpanded = () => !bodyEl.classList.contains("kds-hidden");

    toggleBtn.addEventListener("click", () => {
      isExpanded() ? collapse() : expand();
    });
    
    reduceBtn.addEventListener("click", collapse);

    closeBtn.addEventListener("click", () => {
      try { localStorage.setItem(bannerKey, "1"); } catch (_) {}
      banner.remove();
    });

    head.addEventListener("click", (e) => {
      const t = e.target;
      if (t && (t.closest("button"))) return;
      isExpanded() ? collapse() : expand();
    });

    modalBtn.addEventListener("click", () => modalApi.open());

    try {
      if (localStorage.getItem(bannerKey) === "1") {
        banner.remove();
      }
    } catch (_) {}
  }

  // ========================================
  // INITIALISATION
  // ========================================
  
  function init() {
    const modalApi = buildModal();
    buildBanner(modalApi);

    // Permettre d'ouvrir le modal via data-attribute
    document.addEventListener("click", (e) => {
      const target = e.target && e.target.closest && e.target.closest("[data-kds-disclaimer]");
      if (target) {
        e.preventDefault();
        modalApi.open();
      }
    });

    // Afficher le modal si pas encore accepté
    let acknowledged = false;
    try { 
      acknowledged = localStorage.getItem(ackKey) === "1"; 
    } catch (_) {}
    
    if (!acknowledged) {
      // Attendre un petit délai pour que la page soit bien chargée
      setTimeout(() => modalApi.open(), 300);
    }
  }

  // Démarrage
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
