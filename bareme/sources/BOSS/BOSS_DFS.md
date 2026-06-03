# Source BOSS — Déduction forfaitaire spécifique (DFS)

**Type** : Fiche BOSS  
**Référence** : BOSS - DFS  
**URL officielle** : https://boss.gouv.fr/portail/accueil/deduction-forfaitaire-specifique.html  
**Validé par KDS le** : 10/02/2026  

## Périmètre

La DFS est un **abattement forfaitaire pour frais professionnels** applicable à certains secteurs d'activité où les salariés supportent des frais professionnels importants.

**Principe** : L'assiette des cotisations sociales est réduite d'un pourcentage forfaitaire.

## Secteurs éligibles et taux

| Secteur | Taux DFS | Paramètre KDS |
|---------|----------|---------------|
| Journalistes | 30% | dfs.journalistes |
| VRP multi-cartes | 30% | dfs.vrp |
| Ouvriers du BTP | 10% | dfs.btp |
| Artistes (spectacles) | 25% | dfs.artistes |
| Mannequins | 10% | dfs.mannequins |
| Dockers | 10% | dfs.dockers |
| Marins | [Variable] | dfs.marins |

## Conditions d'application

1. ✅ Appartenance à un secteur éligible
2. ✅ Pas d'option pour le régime réel de frais professionnels
3. ✅ Respect des plafonds (si applicables)

## Calcul de l'assiette

```
Assiette cotisations = Salaire brut × (1 - Taux DFS)
```

**Exemple (journaliste - 30%)** :
```
Salaire brut : 3 000 €
Assiette cotisations : 3 000 × (1 - 30%) = 2 100 €
Économie de cotisations sur 900 € d'assiette
```

## Incompatibilité

⚠️ La DFS est **incompatible** avec :
- Le remboursement de frais réels
- D'autres dispositifs d'abattement (sauf exceptions)

## Source des sources

- **BOSS - DFS** : Doctrine opposable
- **Code de la Sécurité sociale** : Secteurs éligibles
- **Conventions collectives** : Modalités sectorielles

## Actions à mener

- [ ] Compléter la liste des secteurs éligibles
- [ ] Vérifier les taux 2026 (évolutions ?)
- [ ] Archiver BOSS DFS

**Statut** : 🟡 Fiche créée, liste complète à vérifier

---

*Créé le 10/02/2026*
