# Source BOSS — Titres-restaurant

**Type** : Fiche BOSS  
**Référence** : BOSS - Titres-restaurant  
**URL officielle** : https://boss.gouv.fr/portail/accueil/titres-restaurant.html  
**Validé par KDS le** : 10/02/2026  

## Périmètre

Conditions d'exonération sociale et fiscale des titres-restaurant (TR).

## Valeurs extraites — Conditions 2026

| Paramètre KDS | Valeur | Date d'effet | Description |
|---------------|--------|--------------|-------------|
| tr.employer_min | 50% | 01/01/2026 | Part patronale minimale |
| tr.employer_max | 60% | 01/01/2026 | Part patronale maximale |
| tr.exempt_cap | [À vérifier] | 01/01/2026 | Plafond d'exonération par titre |
| tr.employee_share | ≥ 40% | 01/01/2026 | Part salariale minimum |

## Conditions cumulatives d'exonération

Pour être exonéré de cotisations sociales, le TR doit respecter :

1. ✅ **Part patronale** : Entre 50% et 60% de la valeur faciale
2. ✅ **Part salariale** : Entre 40% et 50% de la valeur faciale
3. ✅ **Attribution** : Maximum 1 titre par jour travaillé
4. ✅ **Utilisation** : Jours travaillés uniquement (pas CP, arrêt maladie, etc.)

**Si une condition n'est pas respectée** → Totalité réintégrée dans l'assiette des cotisations.

## Exemples de calcul

### Exemple 1 : TR conforme (exonéré)

```
Valeur faciale du TR : 10 €
Part patronale : 5,50 € (55%) ✅
Part salariale : 4,50 € (45%) ✅
→ TR exonéré de cotisations
```

### Exemple 2 : TR non conforme (part patronale < 50%)

```
Valeur faciale du TR : 10 €
Part patronale : 4,50 € (45%) ❌
Part salariale : 5,50 € (55%)
→ Totalité (10 €) réintégrée dans l'assiette
```

### Exemple 3 : TR non conforme (part patronale > 60%)

```
Valeur faciale du TR : 10 €
Part patronale : 6,50 € (65%) ❌
Part salariale : 3,50 € (35%)
→ Excédent (0,50 €) réintégré + risque de redressement
```

## Cas particuliers

### Télétravail

Les TR peuvent être attribués aux télétravailleurs selon les mêmes conditions.

### Stagiaires et apprentis

Les TR peuvent être attribués aux stagiaires et apprentis (exonération identique).

### Utilisation

- ✅ Restaurants, commerces alimentaires
- ✅ Validité jusqu'au 31 décembre de l'année N+1
- ❌ Pas d'achat de boissons alcoolisées uniquement

## Liens avec autres barèmes

- **Chapitre 3 (AEN Nourriture)** : Alternative à la fourniture de repas
- **Chapitre 4 (Frais pro repas)** : Distinction TR vs remboursement frais

## Source des sources

- **BOSS - Titres-restaurant** : Doctrine opposable
- **Code de la Sécurité sociale** : Exclusion de l'assiette (conditions)
- **URSSAF** : Barèmes et plafonds

## Actions à mener

- [ ] Vérifier le plafond d'exonération 2026
- [ ] Archiver capture BOSS TR
- [ ] Documenter les évolutions récentes (dématérialisation)

**Statut** : 🟡 Fiche créée, plafond exact à vérifier

---

*Créé le 10/02/2026*
