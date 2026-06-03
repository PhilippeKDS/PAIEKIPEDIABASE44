# Mémo Paie 2026 — Web app (lecture seule)

Cette mini web app reprend les données du PDF **pages 1 à 13** (la page 14 est ignorée), avec :
- un bandeau d'**essentiels** en haut,
- des **tuiles** par chapitre donnant accès à tout le détail,
- des **simulateurs** (titres-restaurant, RGCP 2026, saisie sur rémunérations, gratification de stage, indemnités km, avantage logement),
- un **système de versioning par date** (chaque valeur peut évoluer à une date différente).

Inclut aussi :
- un bouton **Télécharger PDF** (page de garde + sommaire + chapitres),
- une page **À propos**.

## Lancer localement (très simple)

Option A — Double clic (souvent OK) :
- Ouvrez `index.html` dans votre navigateur.

Option B — recommandé si votre navigateur bloque les fichiers locaux :
- Ouvrez un terminal dans le dossier,
- Lancez un petit serveur local :

```bash
python -m http.server 8000
```

Puis ouvrez :
- http://localhost:8000

## Mettre à jour une valeur (versioning)

Les valeurs sont dans `data.js`.

Chaque paramètre a une liste `versions` :

```js
"smic.hourly": {
  "label": "SMIC horaire brut",
  "unit": "€",
  "versions": [
    { "from": "2026-01-01", "value": 12.02 },
    { "from": "2026-07-01", "value": 12.15 } // exemple futur
  ]
}
```

La web app affiche automatiquement la dernière version dont la date `from` est **≤** à la date d'affichage.

## Personnaliser la charte

- Couleurs et styles : `styles.css` (variables CSS dans `:root`)
- Logo : `assets/logo-koesio-ds.png` (remplaçable)
- Police : fichiers TTF embarqués dans `assets/fonts/` (version 100% autonome)

## Déploiement ultra simple (optionnel)
- Copier-coller le dossier sur un intranet,
- ou GitHub Pages / Netlify (drag & drop du dossier).

---

## Source
Les données sont celles du PDF fourni (pages 1 à 13). Ce dépôt n'ajoute pas de contenu externe.


## Dépôt dans Teams / SharePoint
- Déposez le dossier de l'app (ou le ZIP) dans l'onglet **Fichiers** de votre équipe (Teams = SharePoint).
- Pour l'utiliser, privilégiez **Ouvrir dans le navigateur** (l'aperçu Teams/Office peut bloquer l'exécution JavaScript).
- Aucune donnée n'est envoyée : tout tourne en local dans le navigateur.

## Date de dernière mise à jour (automatique)
La date affichée est automatiquement fixée à la **date la plus récente** parmi toutes les versions (`from`) présentes dans `data.js`.
Si vous ajoutez une nouvelle version d'une valeur, la date se mettra à jour automatiquement.
