# Source URSSAF — Taux de cotisations sociales 2026

**Type** : Barème URSSAF  
**Référence** : Barème cotisations 2026  
**URL officielle** : https://www.urssaf.fr/portail/home/taux-et-baremes.html  
**Validé par KDS le** : 10/02/2026  

## Périmètre

Taux des cotisations et contributions sociales applicables en 2026 (régime général).

## Cotisations patronales

| Cotisation | Assiette | Taux patronal | Paramètre KDS |
|------------|----------|---------------|---------------|
| **Maladie** | Salaire total | 13,00% | cot.maladie.patronal |
| **Vieillesse plafonnée** | 0-1 PMSS | 8,55% | cot.vieillesse.plaf.patronal |
| **Vieillesse déplafonnée** | Salaire total | 2,11% | cot.vieillesse.deplaf.patronal |
| **Allocations familiales** | Salaire total | 5,25% / 3,45%* | cot.alloc_fam.patronal |
| **Accident du travail** | Salaire total | Variable** | cot.atmp.note |
| **FNAL** | Salaire total | 0,10% / 0,50%*** | cot.fnal |
| **Assurance chômage** | 0-4 PMSS | 4,00% | cot.chomage.patronal |
| **CSA** | Salaire total | 0,30% | cot.csa.patronal |

\* 3,45% si rémunération ≤ 3,5 SMIC annuel  
\*\* Variable selon secteur d'activité (taux AT/MP)  
\*\*\* 0,10% si < 50 salariés, 0,50% si ≥ 50

## Cotisations salariales

| Cotisation | Assiette | Taux salarial | Paramètre KDS |
|------------|----------|---------------|---------------|
| **Vieillesse plafonnée** | 0-1 PMSS | 6,90% | cot.vieillesse.plaf.salarial |
| **Vieillesse déplafonnée** | Salaire total | 0,40% | cot.vieillesse.deplaf.salarial |
| **Alsace-Moselle (complément)** | Salaire total | 1,50% | cot.alsace_moselle.salarial |

## Contributions (CSG/CRDS)

| Contribution | Assiette | Taux | Dont déductible |
|--------------|----------|------|-----------------|
| **CSG** | 98,25% salaire | 9,20% | 6,80% |
| **CRDS** | 98,25% salaire | 0,50% | Non déductible |

**Total CSG/CRDS** : 9,70% sur 98,25% du salaire brut.

## Retraite complémentaire (AGIRC-ARRCO)

| Tranche | Assiette | Taux global | Dont salarial | Dont patronal |
|---------|----------|-------------|---------------|---------------|
| **T1** | 0-1 PMSS | 7,87% | 3,15% | 4,72% |
| **T2** | 1-8 PMSS | 21,59% | 8,64% | 12,95% |

**CEG (Contribution d'équilibre général)** :
- T1 : 2,15% (0,86% salarial + 1,29% patronal)
- T2 : 2,70% (1,08% salarial + 1,62% patronal)

## Source des sources

- **URSSAF** : Barèmes et taux officiels
- **Code de la Sécurité sociale** : Base légale
- **AGIRC-ARRCO** : Retraite complémentaire
- **LFSS** : Loi de financement de la Sécurité sociale (évolutions annuelles)

## Actions à mener

- [ ] Vérifier tous les taux 2026 (stables vs 2025 ?)
- [ ] Archiver tableau URSSAF complet
- [ ] Documenter les cas particuliers (Alsace-Moselle, DOM)

**Statut** : 🟢 Fiche complète (taux à revalider annuellement)

---

*Créé le 10/02/2026*
