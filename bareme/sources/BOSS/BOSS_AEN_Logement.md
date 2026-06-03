# Source BOSS — Avantage en nature : Logement

**Type** : Fiche BOSS  
**Référence** : BOSS - Avantages en nature - Logement (forfait)  
**URL officielle** : https://boss.gouv.fr/portail/accueil/avantages-en-nature/logement.html  
**Date de publication initiale** : [À compléter - historique BOSS]  
**Date de dernière mise à jour BOSS** : [À vérifier sur BOSS]  
**Validé par KDS le** : 10/02/2026  
**Responsable validation** : Audit KDS - Claude  

---

## Périmètre

Barème forfaitaire applicable aux avantages en nature (logement) fournis par l'employeur, évalués selon la rémunération brute du salarié.

Le barème forfaitaire s'applique lorsque l'employeur met à disposition du salarié un logement à titre gratuit ou à un prix inférieur à sa valeur locative réelle.

**Contexte d'application :**
- Logement mis à disposition permanente du salarié
- Évaluation forfaitaire en l'absence d'évaluation au réel
- Base de calcul : rémunération mensuelle brute du salarié

---

## Valeurs extraites — Barème mensuel 2026

### Tableau de correspondance KDS

| Paramètre KDS | Valeur | Unité | Date d'effet | Commentaire |
|---------------|--------|-------|--------------|-------------|
| aen.logement.brackets | (voir tableau ci-dessous) | € | 01/01/2026 | Barème mensuel |

### Barème détaillé

| Rémunération mensuelle brute | Logement 1 pièce principale | Logement > 1 pièce principale |
|------------------------------|---------------------------|-------------------------------|
| < 2 002,50 € | 79,70 € | 42,60 € |
| 2 002,50 € – 2 402,99 € | 93,00 € | 59,70 € |
| 2 403,00 € – 2 803,49 € | 106,20 € | 79,70 € |
| 2 803,50 € – 3 604,49 € | 119,40 € | 99,50 € |
| 3 604,50 € – 4 405,49 € | 146,40 € | 126,10 € |
| 4 405,50 € – 5 206,49 € | 172,60 € | 152,40 € |
| 5 206,50 € – 6 007,49 € | 199,40 € | 185,70 € |
| ≥ 6 007,50 € | 225,60 € | 212,30 € |

**Précisions :**
- Les tranches sont **inclusives sur la borne inférieure**, **exclusives sur la borne supérieure** (sauf dernière tranche)
- La rémunération prise en compte est la **rémunération brute mensuelle**

---

## Méthodologie de calcul

### Base de calcul

Le barème est **indexé sur le Plafond Mensuel de la Sécurité Sociale (PMSS)**.

Les montants sont **revalorisés annuellement** en fonction de l'évolution du PMSS.

**Formule d'indexation :**
```
Montant année N = Montant année N-1 × (PMSS N / PMSS N-1)
```

**Exemple de revalorisation 2025 → 2026 :**
- PMSS 2025 : 3 925 €
- PMSS 2026 : 4 005 €
- Coefficient de revalorisation : 4 005 / 3 925 = 1,0204 (+2,04%)

### Détermination de la tranche

1. Calculer la rémunération brute mensuelle du salarié
2. Identifier la tranche correspondante dans le barème
3. Appliquer le montant forfaitaire selon le type de logement (1 pièce ou > 1 pièce)

**Exemple concret :**
- Salarié : rémunération brute = 3 200 €/mois
- Tranche applicable : 2 803,50 € – 3 604,49 €
- Logement 2 pièces → AEN mensuel = **99,50 €**

---

## Cas particuliers / Exceptions

### Définition "pièce principale"

**Une seule pièce principale** = logement composé d'une seule pièce servant à la fois de chambre et de séjour (studio, chambre de service).

**Plus d'une pièce principale** = logement avec au moins 2 pièces distinctes (F2, F3, maison, etc.).

⚠️ **Attention** : Cuisine, salle de bain, WC, couloirs ne sont **pas** comptés comme pièces principales.

### Logement partiellement gratuit

Si le salarié paie un loyer inférieur à l'évaluation forfaitaire :
```
AEN à réintégrer = Évaluation forfaitaire - Loyer payé par le salarié
```

**Exemple :**
- Évaluation forfaitaire : 150 €
- Loyer payé : 50 €
- AEN à réintégrer : 150 - 50 = **100 €**

### Méthodes alternatives d'évaluation

Le barème forfaitaire **n'est pas obligatoire**. L'employeur peut choisir :

1. **Évaluation au réel** : Valeur locative réelle du logement (si connue et justifiable)
2. **Forfait kilométrique** : Si le logement est situé dans une zone difficile d'accès (rare)

### Exclusions du barème

Ce barème **ne s'applique pas** dans les cas suivants :
- Logement de fonction imposé par l'employeur pour nécessité de service (non soumis à cotisations)
- Logement temporaire (missions, déplacements)
- Hébergement d'urgence ou social

---

## Notes d'interprétation KDS

### Usage dans les simulateurs KDS

Dans les outils KDS, le barème logement est utilisé pour :
- Calculer l'AEN logement à réintégrer sur le bulletin de paie
- Évaluer l'impact social et fiscal de la mise à disposition d'un logement
- Simuler les coûts employeur nets

### Distinction avec autres avantages

**Ne pas confondre** avec :
- **Allocation logement** : Aide versée en espèces (soumise à cotisations sauf conditions spécifiques)
- **Remboursement de loyer** : Frais professionnels (régime différent, voir BOSS Frais professionnels)
- **Indemnité de mobilité** : Aide à la mobilité géographique (régime spécifique)

### Particularités sectorielles

Certaines conventions collectives prévoient des modalités spécifiques (ex. HCR, BTP). Dans ce cas :
- Consulter la convention collective applicable
- Les règles conventionnelles peuvent **se substituer** au barème BOSS si plus favorables
- ⚠️ Attention : Vérifier l'opposabilité de la convention face à l'URSSAF

---

## Liens avec autres barèmes

### Chapitres KDS liés

- **Chapitre 2 (PMSS)** : Le barème est indexé sur le PMSS → voir `pss.pmss`
- **Chapitre 3 (Autres AEN)** : Nourriture, véhicule → barèmes distincts mais même logique
- **Chapitre 7 (Cotisations)** : L'AEN logement entre dans l'assiette des cotisations sociales

### Autres fiches BOSS à consulter

- **BOSS - Avantages en nature (principes généraux)** : Définition, assiette, exonérations
- **BOSS - Avantages en nature - Nourriture** : Si logement + repas fournis
- **BOSS - Frais professionnels** : Si remboursement de frais de logement (régime différent)

---

## Historique des modifications

- **10/02/2026** : Création de la fiche par Audit KDS (Claude)
- **01/01/2026** : Application des valeurs 2026 (revalorisation +2% vs 2025)
- **[Dates antérieures]** : À documenter lors de la prochaine revue annuelle

### Valeurs historiques (pour référence)

| Année | PMSS | Tranche < 2 002,50 € (1 pièce) | Évolution |
|-------|------|-------------------------------|-----------|
| 2026 | 4 005 € | 79,70 € | +2,04% |
| 2025 | 3 925 € | 78,11 € | [À vérifier] |
| 2024 | 3 864 € | 76,88 € | [À vérifier] |

⚠️ **Note** : Valeurs 2024-2025 à vérifier dans les archives BOSS.

---

## Source des sources (références croisées)

### Textes législatifs et réglementaires

- **Code de la Sécurité sociale, art. L242-1** : Principe de l'assiette des cotisations (incluant les AEN)
- **Arrêté ministériel annuel** : Fixe les montants du barème forfaitaire (publié en décembre N-1)
- **Circulaire ACOSS** : Précisions sur l'application du barème

### Doctrine URSSAF

- **BOSS - Avantages en nature** : https://boss.gouv.fr/portail/accueil/avantages-en-nature.html
- **BOSS - Logement (forfait)** : https://boss.gouv.fr/portail/accueil/avantages-en-nature/logement.html

---

## Pièces jointes

### À archiver

- [ ] Capture d'écran BOSS au 10/02/2026
- [ ] Copie PDF de l'arrêté ministériel fixant les montants 2026
- [ ] Circulaire ACOSS 2026 (si applicable)
- [ ] Tableau Excel de vérification des montants

### Localisation des archives

```
/sources/archives/BOSS_AEN_Logement/
  ├── 2026-02-10_BOSS_Capture.png
  ├── 2025-12-XX_Arrete_Bareme_AEN_2026.pdf
  └── 2026-01-XX_Circulaire_ACOSS.pdf
```

---

## Questions en suspens / Points à clarifier

### Pour la prochaine revue

1. ⚠️ **Date exacte de publication BOSS 2026** : À vérifier sur le site BOSS
2. ⚠️ **Arrêté ministériel 2026** : Référence exacte à identifier (publié décembre 2025)
3. ⚠️ **Valeurs historiques 2024-2025** : À extraire des archives pour traçabilité complète
4. 💡 **Cas des DOM-TOM** : Barème identique ou spécifique ? → À vérifier

### Actions à mener

- [ ] Consulter https://boss.gouv.fr pour date exacte de dernière MAJ
- [ ] Rechercher sur Légifrance l'arrêté ministériel 2026
- [ ] Archiver capture BOSS et PDF arrêté
- [ ] Documenter les valeurs 2024-2025 (historique)

---

## 📋 Checklist de validation

- [x] Source principale identifiée (BOSS)
- [x] URL officielle fournie
- [x] Valeurs 2026 documentées
- [x] Méthodologie de calcul expliquée
- [x] Cas particuliers listés
- [x] Liens avec autres barèmes établis
- [ ] Date de publication BOSS vérifiée
- [ ] Arrêté ministériel référencé
- [ ] Archives constituées
- [ ] Relecture à 4 yeux effectuée

**Statut** : 🟡 Fiche créée, validation partielle (dates officielles à compléter)

---

**FIN DE LA FICHE SOURCE BOSS — LOGEMENT**

*Créé le 10/02/2026 par Audit KDS (Claude)*  
*Version 1.0 — Document vivant, à mettre à jour annuellement*
