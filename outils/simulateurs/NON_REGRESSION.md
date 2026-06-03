# Méthode de non‑régression (Simulateurs Paie)

Avant toute modification (CSS ou calculs), appliquer systématiquement :

1. **Exécuter les tests**
   - Windows : double‑cliquez `run-tests.bat`
   - Mac/Linux : `./run-tests.sh`

2. **Contrôle visuel (smoke test)**
   - Ouvrir `index.html` dans Chrome
   - Vérifier :
     - le **logo** (taille normale) + clic → Portail Outils
     - le bouton **Retour Mémo Paie**
     - l’affichage des cartes (toutes visibles, pas de « page vide »)
     - 1 calcul par simulateur (valeurs simples) + affichage du résultat

3. **Après modification**
   - Rejouer les tests
   - Refaire le contrôle visuel

Les tests sont dans `tests-simulateurs.js` (Node.js).
