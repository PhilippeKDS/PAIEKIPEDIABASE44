# Source BOSS — Indemnités journalières de Sécurité sociale (IJSS)

**Type** : Fiche BOSS + AMELI  
**Référence** : BOSS - IJSS  
**URL officielle** : https://boss.gouv.fr/portail/accueil/indemnites-journalieres.html  
**Validé par KDS le** : 10/02/2026  

## Périmètre

Plafonds et modalités de calcul des indemnités journalières versées par la Sécurité sociale en cas de :
- Maladie
- Maternité / Paternité / Adoption
- Accident du travail / Maladie professionnelle (AT/MP)

## Valeurs extraites — IJSS Maladie (maxima)

| Paramètre KDS | Valeur | Date d'effet | Base de calcul |
|---------------|--------|--------------|----------------|
| ijss.sickness.max_daily | [À vérifier] | 01/01/2026 | 1/730 du plafond annuel SS |
| ijss.sickness.rate | 50% | - | Salaire journalier de base |

**Calcul IJSS maladie** :
```
Salaire journalier de base = Salaires 3 derniers mois / 91,25
IJSS = 50% × Salaire journalier (plafonné)
```

## Valeurs extraites — IJSS Maternité

| Paramètre KDS | Valeur | Date d'effet | Base |
|---------------|--------|--------------|------|
| ijss.maternity.max_daily | [À vérifier] | 01/01/2026 | 1/730 du plafond annuel SS |
| ijss.maternity.rate | 100% | - | Salaire journalier net (plafonné) |

## Valeurs extraites — AT/MP

| Paramètre KDS | Valeur | Période | Taux |
|---------------|--------|---------|------|
| ijss.atmp.phase1 | [À vérifier] | Jours 1-28 | 60% salaire |
| ijss.atmp.phase2 | [À vérifier] | À partir J29 | 80% salaire |

## Subrogation et complément employeur

### Subrogation

L'employeur peut verser le salaire complet et se faire rembourser les IJSS par la CPAM (maintien de salaire).

### Complément employeur

Selon la convention collective, l'employeur complète les IJSS pour maintenir le salaire.

## Régime social et fiscal des IJSS

- **Cotisations sociales** : IJSS soumises à CSG/CRDS uniquement
- **Impôt sur le revenu** : IJSS imposables (sauf AT/MP dans certains cas)

## Source des sources

- **BOSS - IJSS** : Doctrine opposable
- **AMELI** : Caisse d'assurance maladie
- **Code de la Sécurité sociale** : Modalités de calcul

## Actions à mener

- [ ] Vérifier les plafonds IJSS 2026 (maladie, maternité, AT/MP)
- [ ] Documenter les durées d'indemnisation
- [ ] Archiver barèmes AMELI

**Statut** : 🟡 Fiche créée, plafonds 2026 à vérifier

---

*Créé le 10/02/2026*
