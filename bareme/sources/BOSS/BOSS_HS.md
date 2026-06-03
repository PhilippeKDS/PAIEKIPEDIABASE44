# Source BOSS — Heures supplémentaires : Exonérations et réductions

**Type** : Fiche BOSS  
**Référence** : BOSS - Heures supplémentaires  
**URL officielle** : https://boss.gouv.fr/portail/accueil/heures-supplementaires.html  
**Validé par KDS le** : 10/02/2026  

## Périmètre

Dispositifs d'exonération et de réduction applicables aux heures supplémentaires et complémentaires :
- Réduction cotisations salariales
- Exonération impôt sur le revenu
- Déduction forfaitaire patronale

## Valeurs extraites — Réduction salariale

| Paramètre KDS | Valeur | Date d'effet |
|---------------|--------|--------------|
| hs.reduc_salariale.taux_max | 11,31% | 01/01/2026 |

**Principe** : Réduction maximale applicable si rémunération ≤ PASS.

## Valeurs extraites — Exonération IR

| Paramètre KDS | Valeur | Date d'effet | Description |
|---------------|--------|--------------|-------------|
| hs.ir.exo_cap_net | 7 500 € | 01/01/2026 | Plafond annuel (net imposable) |
| hs.ir.exo_cap_brut | ~8 754 € | 01/01/2026 | Équivalent brut indicatif |
| hs.ir.brut_to_net_coef | 0,8568 | 01/01/2026 | Coefficient DSN brut → net |

## Valeurs extraites — Déduction forfaitaire patronale

### Entreprises < 20 salariés

| Paramètre KDS | Valeur | Date d'effet |
|---------------|--------|--------------|
| hs.patronal.ded_h_lt20 | 1,50 € | 01/01/2026 |
| hs.patronal.ded_j_lt20 | [À vérifier] | 01/01/2026 |

### Entreprises ≥ 20 salariés (nouvelle tranche 2026)

| Paramètre KDS | Valeur | Date d'effet |
|---------------|--------|--------------|
| hs.patronal.ded_h_gt20 | 0,50 € | 01/01/2026 |
| hs.patronal.ded_j_gt20 | [À vérifier] | 01/01/2026 |

⚠️ **Note** : Pas de déduction pour les heures complémentaires (temps partiel).

## Conditions d'application

### Pour bénéficier des exonérations

1. ✅ Heures effectuées au-delà de la durée légale (35h/semaine)
2. ✅ Rémunération majorée (25% ou 50% selon cas)
3. ✅ Déclaration en DSN avec code CTP spécifique

### Cumul des dispositifs

Les 3 dispositifs (réduction salariale, exonération IR, déduction patronale) sont **cumulables**.

## Source des sources

- **BOSS - Heures supplémentaires** : Doctrine opposable
- **Code du travail** : Définition des HS
- **Loi TEPA** : Base légale des exonérations

## Actions à mener

- [ ] Vérifier la déduction forfaitaire par jour (forfait jours)
- [ ] Documenter les évolutions 2026 (nouvelle tranche ≥ 20)
- [ ] Archiver BOSS HS

**Statut** : 🟡 Fiche créée, déductions par jour à vérifier

---

*Créé le 10/02/2026*
