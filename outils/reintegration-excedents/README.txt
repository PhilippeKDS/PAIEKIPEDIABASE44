Simulateur — Réintégration sociale & fiscale (excédents retraite / prévoyance)
=============================================================================

Démarrage
- Ouvrez simplement index.html dans un navigateur (Chrome/Edge/Firefox).
- Aucune dépendance, aucun serveur requis.

Fonctionnalités
- Calcul de la réintégration sociale (excédent soumis aux cotisations de sécurité sociale)
- Calcul de la réintégration fiscale (excédent à réintégrer au net imposable), ventilé :
  - part salariale = cotisations non déductibles
  - part patronale = complément de salaire imposable
- Explications progressives (accordéons) + détails complets.

Paramètres clés
- PASS (valeur par année pré-remplie, modifiable manuellement si besoin)
- R_fisc : rémunération annuelle brute de référence fiscale (peut inclure la part patronale "frais de santé" imposable)
- R_soc : rémunération brute soumise à cotisations (brut sécu de référence)
- Option "Synchroniser R_fisc/R_soc" : activée par défaut, permet de saisir une seule fois

Ajustements possibles
- Remplacement du logo : assets/logo.png (ou assets/logo.svg)
- Ajustements charte : styles.css (variables CSS en haut du fichier)

Remarque
Le simulateur calcule les excédents annuels. En paie, la régularisation est souvent progressive
et peut dépendre des plafonnements de certaines cotisations (vieillesse plafonnée, chômage, etc.).

Export Excel
- Le bouton "Exporter Excel" génère un fichier au format SpreadsheetML 2003.
  Il s'ouvre directement dans Microsoft Excel.
  Le fichier est volontairement nommé en .xml pour éviter l'avertissement
  "le format et l'extension ne correspondent pas".

Mode d'emploi
- Ouvrez mode_emploi.html pour une aide pas à pas et la mention de protection juridique.
