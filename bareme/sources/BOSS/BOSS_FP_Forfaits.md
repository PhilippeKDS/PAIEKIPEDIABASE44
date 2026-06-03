# Source BOSS — Frais professionnels : Forfaits repas et grands déplacements

**Type** : Fiche BOSS  
**Référence** : BOSS - Frais professionnels  
**URL officielle** : https://boss.gouv.fr/portail/accueil/frais-professionnels.html  
**Validé par KDS le** : 10/02/2026  

## Périmètre

Barèmes forfaitaires applicables aux remboursements de frais professionnels liés aux déplacements et repas.

Distinction entre :
- **Petits déplacements** : Repas pris hors locaux de l'entreprise dans le cadre du travail habituel
- **Grands déplacements** : Missions nécessitant un découcher (repas + hébergement)

## Valeurs extraites — Petits déplacements

| Paramètre KDS | Valeur | Date d'effet | Usage |
|---------------|--------|--------------|-------|
| fp.small.meal_workplace | 7,50 € | 01/01/2026 | Restauration sur lieu de travail |
| fp.small.meal_restaurant | 21,40 € | 01/01/2026 | Repas au restaurant (contrainte pro) |
| fp.small.meal_offsite | [voir BOSS] | 01/01/2026 | Restauration hors locaux |

**Principe** : Ces montants sont **exonérés de cotisations sociales** s'ils correspondent à des frais réels et justifiés.

## Valeurs extraites — Grands déplacements

### Paris & Île-de-France

| Paramètre KDS | Valeur | Date d'effet |
|---------------|--------|--------------|
| fp.large.meal.paris | [À vérifier BOSS] | 01/01/2026 |
| fp.large.lodging_breakfast.paris | [À vérifier BOSS] | 01/01/2026 |

### Autres départements

| Paramètre KDS | Valeur | Date d'effet |
|---------------|--------|--------------|
| fp.large.meal.other | [À vérifier BOSS] | 01/01/2026 |
| fp.large.lodging_breakfast.other | [À vérifier BOSS] | 01/01/2026 |

## Abattements spécifiques

**Grands déplacements > 3 mois** :
- `fp.large.abatement.3m_2y` : Abattement applicable entre 3 mois et 2 ans
- `fp.large.abatement.2y_6y` : Abattement applicable entre 2 ans et 6 ans

## Cas particuliers

### Distinction avec AEN Nourriture

⚠️ **Ne pas confondre** :
- **Frais professionnels** : Remboursement de frais engagés lors de déplacements/missions
- **AEN Nourriture** : Repas fournis gratuitement sur le lieu de travail habituel

### Justificatifs

Les frais doivent être :
- ✅ **Réels** : Engagés effectivement par le salarié
- ✅ **Justifiés** : Liés à l'activité professionnelle
- ✅ **Facturés** : Notes de frais avec pièces justificatives

## Source des sources

- **BOSS - Frais professionnels** : Doctrine opposable
- **Code de la Sécurité sociale** : Exclusion de l'assiette des cotisations
- **Barèmes URSSAF** : Actualisation annuelle

## Actions à mener

- [ ] Vérifier les montants exacts sur BOSS (petits/grands déplacements)
- [ ] Documenter les abattements pour déplacements longue durée
- [ ] Archiver capture BOSS FP

**Statut** : 🟡 Fiche créée, montants exacts à vérifier sur BOSS

---

*Créé le 10/02/2026*
