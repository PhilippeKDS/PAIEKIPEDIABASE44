# Source BOFiP — Prélèvement à la source (Taux neutre)

**Type** : Documentation fiscale (BOFiP)  
**Référence** : BOI-IR-PAS-20-20-30  
**URL officielle** : https://bofip.impots.gouv.fr/bofip/2041-PGP.html  
**Validé par KDS le** : 10/02/2026  

## Périmètre

Barème des **taux par défaut** (taux neutre) applicable au prélèvement à la source de l'impôt sur le revenu — **Métropole, mensuel**.

Le taux neutre s'applique :
- En l'absence de taux transmis par la DGFiP
- Sur demande du salarié (confidentialité)

## Valeurs extraites

Le barème complet est intégré dans `pas.*` (data.js).

**Principe** : Taux progressif par tranche de net imposable mensuel.

| Net imposable mensuel | Taux neutre |
|-----------------------|-------------|
| < 1 569 € | 0% |
| 1 569 € – 1 676 € | 0,5% |
| 1 676 € – 1 791 € | 1,3% |
| ... | ... |
| > 57 813 € | 43% |

(Voir data.js pour barème complet)

## Source des sources

- **Code général des impôts** : Base légale PAS
- **BOFiP** : Doctrine fiscale opposable
- **DGFiP** : Administration fiscale

## Actions à mener

- [ ] Vérifier si le barème 2026 est identique à 2025
- [ ] Archiver capture BOFiP

**Statut** : 🟢 Fiche complète (barème stable)

---

*Créé le 10/02/2026*
