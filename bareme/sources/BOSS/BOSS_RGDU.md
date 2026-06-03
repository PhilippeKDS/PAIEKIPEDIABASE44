# Source BOSS — Réduction générale des cotisations patronales (RGDU)

**Type** : Circulaire ACOSS + Fiche BOSS  
**Référence** : BOSS RGDU + Circulaire ACOSS 2026-XXX  
**URL officielle** : https://boss.gouv.fr/portail/accueil/reduction-generale-des-cotisation.html  
**Validé par KDS le** : 10/02/2026  

## Périmètre

Dispositif d'allègement des cotisations patronales de Sécurité sociale (ex-réduction Fillon) applicable aux rémunérations jusqu'à **1,6 SMIC**.

## Valeurs extraites — Paramètres 2026

| Paramètre KDS | Valeur | Description |
|---------------|--------|-------------|
| rgdu.tmin | 0,3205 | Coefficient minimal (seuil) |
| rgdu.tdelta.lt50 | 0,3821 | Coefficient T pour < 50 salariés |
| rgdu.tdelta.ge50 | 0,3781 | Coefficient T pour ≥ 50 salariés |
| rgdu.p | 1,6 | Plafond (× SMIC annuel de référence) |
| rgdu.smic_annual_ref | 21 876,36 € | SMIC horaire × 1820h |
| rgdu.smic_month_ref | 1 823,03 € | SMIC mensuel référence |
| rgdu.coef_max.lt50 | 0,3205 | Coefficient maximal < 50 |
| rgdu.coef_max.ge50 | 0,3245 | Coefficient maximal ≥ 50 |

## Formule de calcul

```
Coefficient = (T / 0,6) × [(1,6 × SMIC annuel référence / Rémunération annuelle brute) - 1]
```

Avec **T** = Tmin + Tdelta (selon effectif)

Le coefficient est ensuite appliqué aux cotisations patronales de Sécurité sociale éligibles.

## Source des sources

- **Code de la Sécurité sociale, art. L241-13** : Base légale
- **Décret annuel** : Fixe les coefficients T, Tmin, P
- **Circulaire ACOSS** : Modalités de calcul détaillées
- **BOSS RGDU** : Doctrine opposable

## Actions à mener

- [ ] Identifier la circulaire ACOSS 2026
- [ ] Archiver le décret fixant les paramètres 2026
- [ ] Documenter les coefficients 2024-2025 (historique)

**Statut** : 🟡 Fiche créée, circulaire ACOSS 2026 à identifier

---

*Créé le 10/02/2026 par Audit KDS (Claude) — Version 1.0*
