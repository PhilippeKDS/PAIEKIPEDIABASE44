/**
 * PaieKipédia — version-selector.js  v2.0
 * ════════════════════════════════════════
 * Sélecteur de date simple pour les barèmes du mémo paie.
 *
 * FONCTIONNEMENT
 * ──────────────
 * • Au chargement : active l'input#asOf, le remplit avec la date du jour,
 *   corrige le label, déclenche refresh().
 * • Quand l'utilisateur modifie la date : refresh() est appelé.
 *   Un bouton "Aujourd'hui" apparaît si la date diffère du jour.
 * • Le bouton "Aujourd'hui" remet la date courante et relance refresh().
 *
 * CONTRAT avec app.js
 * ───────────────────
 * app.js lit $asOf.value (format YYYY-MM-DD) et expose refresh().
 * Ce fichier s'exécute APRÈS app.js (chargé en defer dans index.html).
 *
 * ════════════════════════════════════════
 */

(function () {
  "use strict";

  /* ── Utilitaires ───────────────────────────────────────────────────── */

  /** Date du jour en YYYY-MM-DD */
  function today() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  /** Formate YYYY-MM-DD → DD/MM/YYYY pour l'affichage */
  function fmt(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  /* ── Styles injectés ───────────────────────────────────────────────── */

  function injectStyles() {
    if (document.getElementById("vs2-styles")) return;
    const s = document.createElement("style");
    s.id = "vs2-styles";
    s.textContent = `
      /* ── Sélecteur de date v2 ── */

      #vs2-wrap {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      #asOf {
        height: 36px;
        padding: 0 10px;
        border: 1px solid var(--border, #d1c8e0);
        border-radius: 10px;
        background: rgba(255,255,255,.85);
        font-size: 13px;
        color: var(--text, #1a1a2e);
        cursor: pointer;
        outline: none;
        min-width: 148px;
        transition: border-color .2s, box-shadow .2s;
      }

      #asOf:hover {
        border-color: var(--koesio-violet, #6e398e);
      }

      #asOf:focus {
        border-color: var(--koesio-violet, #6e398e);
        box-shadow: 0 0 0 3px rgba(110,57,142,.12);
      }

      #vs2-today-btn {
        display: none;
        height: 30px;
        padding: 0 10px;
        border-radius: 999px;
        border: 1px solid rgba(110,57,142,.35);
        background: rgba(110,57,142,.08);
        color: var(--koesio-violet, #6e398e);
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
        transition: background .15s;
      }

      #vs2-today-btn:hover {
        background: rgba(110,57,142,.16);
      }

      #vs2-today-btn.vs2-visible {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      /* Bannière date non courante */
      #vs2-banner {
        display: none;
        margin: 0 16px 12px;
        padding: 9px 14px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 500;
        align-items: center;
        gap: 10px;
      }

      #vs2-banner.vs2-banner-on {
        display: flex;
      }

      #vs2-banner.vs2-past {
        background: rgba(120,120,140,.08);
        border: 1px solid rgba(120,120,140,.2);
        color: var(--muted, #666);
      }

      #vs2-banner.vs2-future {
        background: rgba(232,75,87,.07);
        border: 1px solid rgba(232,75,87,.2);
        color: #c0392b;
      }
    `;
    document.head.appendChild(s);
  }

  /* ── Construction ──────────────────────────────────────────────────── */

  function init() {
    injectStyles();

    const $input = document.getElementById("asOf");
    if (!$input) return;

    /* 1. Activer l'input et fixer la date du jour */
    const t = today();
    $input.removeAttribute("disabled");
    $input.value = t;
    $input.type = "date";
    $input.min = "2023-01-01";   // première version des données
    $input.max = (() => {        // aujourd'hui + 6 mois
      const d = new Date(); d.setMonth(d.getMonth() + 6);
      return d.toISOString().slice(0, 10);
    })();

    /* 2. Corriger le label */
    const $label = document.querySelector('label[for="asOf"]');
    if ($label) $label.textContent = "Barèmes applicables au";

    /* 3. Injecter le bouton "Aujourd'hui" à côté de l'input */
    const $wrap = $input.parentElement;
    $wrap.id = "vs2-wrap";
    // Vider le badge "Auto" hérité si présent
    [...$wrap.children].forEach(c => {
      if (c !== $input && c.id !== "vs2-today-btn") c.remove();
    });

    const $btn = document.createElement("button");
    $btn.id = "vs2-today-btn";
    $btn.type = "button";
    $btn.title = "Revenir à la date du jour";
    $btn.innerHTML = "↺ Aujourd'hui";
    $wrap.appendChild($btn);

    /* D3. Span date lisible en français */
    const $dateLabel = document.createElement("span");
    $dateLabel.id = "vs2-date-label";
    $dateLabel.style.cssText = "font-size:12px;color:var(--color-text-secondary,#888);white-space:nowrap;";
    $wrap.appendChild($dateLabel);

    /* D4. Boutons raccourcis millésimes clés */
    const shortcuts = [
      { label: "2026-05-01", title: "PAS mai 2026" },
      { label: "2025-05-01", title: "PAS mai 2025" },
      { label: "2026-01-01", title: "01/01/2026" },
      { label: "2025-01-01", title: "01/01/2025" },
    ];
    const $shortcutsWrap = document.createElement("div");
    $shortcutsWrap.id = "vs2-shortcuts";
    $shortcutsWrap.style.cssText = "display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;";
    shortcuts.forEach(s => {
      const sb = document.createElement("button");
      sb.type = "button";
      sb.textContent = s.title;
      sb.title = "Barèmes au " + fmt(s.label);
      sb.style.cssText = "font-size:10px;padding:2px 7px;border-radius:999px;border:1px solid var(--color-border-secondary,#ddd);background:var(--color-background-secondary,#f5f5f5);color:var(--color-text-secondary,#666);cursor:pointer;";
      sb.addEventListener("click", () => {
        $input.value = s.label;
        syncState(s.label);
        if (typeof refresh === "function") refresh();
      });
      $shortcutsWrap.appendChild(sb);
    });
    const $controlDiv = $wrap.closest(".control") || $wrap.parentElement;
    if ($controlDiv) $controlDiv.appendChild($shortcutsWrap);

    /* 4. Injecter la bannière sous le header */
    let $banner = document.getElementById("vs2-banner");
    if (!$banner) {
      $banner = document.createElement("div");
      $banner.id = "vs2-banner";
      const $anchor = document.getElementById("tiles") || document.getElementById("kpis");
      if ($anchor && $anchor.parentNode) {
        $anchor.parentNode.insertBefore($banner, $anchor);
      }
    }

    /* 4b. Badge visible dans le header (zone gauche, à côté du bouton Portail) */
    let $headerBadge = document.getElementById("vs2-header-badge");
    if (!$headerBadge) {
      $headerBadge = document.createElement("div");
      $headerBadge.id = "vs2-header-badge";
      // Insérer avant le bouton Portail (dans .control)
      const $control = document.querySelector(".control");
      if ($control) $control.insertBefore($headerBadge, $control.firstChild);
    }

    /* 5. Fonctions d'état */
    function syncState(val) {
      // D3. Date lisible en français
      if ($dateLabel) {
        $dateLabel.textContent = val && val !== t ? "(" + fmt(val) + ")" : "";
      }

      // Bouton aujourd'hui
      if (val && val !== t) {
        $btn.classList.add("vs2-visible");
      } else {
        $btn.classList.remove("vs2-visible");
      }

      // D2. Colorer le header + badge visible dans le header
      const $header = document.querySelector(".app-header");
      const $hBadge = document.getElementById("vs2-header-badge");
      if (!val || val === t) {
        if ($header) { $header.style.background = ""; $header.style.borderBottom = ""; }
        if ($hBadge) $hBadge.textContent = "";
      } else if (val > t) {
        if ($header) {
          $header.style.background = "rgba(232,75,87,.08)";
          $header.style.borderBottom = "2px solid rgba(232,75,87,.5)";
        }
        if ($hBadge) {
          $hBadge.className = "vs2-header-badge vs2-badge-future";
          $hBadge.innerHTML = "⚠️ Barèmes futurs — " + fmt(val);
        }
      } else {
        if ($header) {
          $header.style.background = "rgba(180,140,0,.06)";
          $header.style.borderBottom = "2px solid rgba(180,140,0,.3)";
        }
        if ($hBadge) {
          $hBadge.className = "vs2-header-badge vs2-badge-past";
          $hBadge.innerHTML = "🕐 Consultation historique — " + fmt(val);
        }
      }

      // Bannière
      if (!val || val === t) {
        $banner.className = "vs2-banner";
        return;
      }
      if (val > t) {
        $banner.className = "vs2-banner vs2-banner-on vs2-future";
        $banner.textContent = `⏳ Aperçu — barèmes à venir au ${fmt(val)}, pas encore en vigueur.`;
      } else {
        $banner.className = "vs2-banner vs2-banner-on vs2-past";
        $banner.textContent = `🕐 Consultation historique — barèmes applicables au ${fmt(val)}.`;
      }
    }

    /* 6. Écouter les changements */
    $input.addEventListener("change", function () {
      syncState($input.value);
      if (typeof refresh === "function") refresh();
    });

    /* 7. Bouton Aujourd'hui */
    $btn.addEventListener("click", function () {
      $input.value = t;
      syncState(t);
      if (typeof refresh === "function") refresh();
    });

    /* 8. Déclencher refresh avec la date du jour */
    syncState(t);
    if (typeof refresh === "function") refresh();

    // ── Menu Outils — initialiser les URLs depuis config ────────────────────
    const cfg = window.PAIEKIPEDIA_CONFIG || {};
    const menuLinks = {
      "linkMNS":          cfg.URL_MNS          || "../outils/montant-net-social/",
      "linkReintegration":cfg.URL_REINTEGRATION || "../outils/reintegration-excedents/",
      "linkSimulateurs":  cfg.URL_SIMULATEURS   || "../outils/simulateurs/",
      "linkOutils":       cfg.URL_OUTILS        || "../outils/",
      "linkReforme":      cfg.URL_REFORME       || "../reforme/",
      "linkVeille":       cfg.URL_VEILLE        || "../veille/",
    };
    Object.entries(menuLinks).forEach(([id, url]) => {
      const el = document.getElementById(id);
      if (el) el.href = url;
    });

    const $outilsBtn  = document.getElementById("outilsMenuBtn");
    const $outilsMenu = document.getElementById("outilsMenu");
    if ($outilsBtn && $outilsMenu) {
      $outilsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = !$outilsMenu.classList.contains("hidden");
        $outilsMenu.classList.toggle("hidden", isOpen);
        $outilsBtn.setAttribute("aria-expanded", String(!isOpen));
      });
      document.addEventListener("click", () => {
        $outilsMenu.classList.add("hidden");
        $outilsBtn.setAttribute("aria-expanded", "false");
      });
    }

    console.log("[version-selector v2] ✅ Initialisé —", t);
  }

  /* ── Point d'entrée ────────────────────────────────────────────────── */

  // app.js s'exécute en defer, version-selector aussi.
  // On attend DOMContentLoaded + un tick pour que app.js ait fini son init().
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(init, 0);
    });
  } else {
    setTimeout(init, 0);
  }

})();
