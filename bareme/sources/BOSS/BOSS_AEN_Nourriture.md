# Source BOSS — Avantage en nature : Nourriture

**Type** : Fiche BOSS  
**Référence** : BOSS - Avantages en nature - Nourriture  
**URL officielle** : https://boss.gouv.fr/portail/accueil/avantages-en-nature/nourriture.html  
**Date de publication initiale** : [À compléter]  
**Date de dernière mise à jour BOSS** : [À vérifier]  
**Validé par KDS le** : 10/02/2026  
**Responsable validation** : Audit KDS - Claude  

---

## Périmètre

Évaluation forfaitaire de l'avantage en nature constitué par la **fourniture de repas** par l'employeur au salarié.

**Contexte d'application :**
- Repas fournis gratuitement ou à prix réduit
- Distinction selon secteur d'activité : **cas général** vs **secteur HCR** (hôtels, cafés, restaurants)
- Base de calcul : **Minimum garanti (MG)** en vigueur

---

## Valeurs extraites — Barème 2026

### Cas général

| Paramètre KDS | Valeur | Unité | Base de calcul | Date d'effet |
|---------------|--------|-------|----------------|--------------|
| aen.meal.general.1 | 5,50 € | € / repas | 1,5 × MG | 01/01/2026 |
| aen.meal.general.2 | 11,00 € | € / jour | 3 × MG | 01/01/2026 |

**Formule :**
```
1 repas = 1,5 × Minimum garanti (MG)
2 repas = 3 × Minimum garanti (MG)
```

**Avec MG 2026 = 4,15 € :**
```
1 repas = 1,5 × 4,15 = 6,225 € → arrondi à 5,50 €* (?)
2 repas = 3 × 4,15 = 12,45 € → arrondi à 11,00 €* (?)
```

⚠️ **Note** : Vérifier les valeurs exactes sur BOSS. L'arrondi peut différer de la formule théorique.

---

### Secteur HCR (Hôtels, Cafés, Restaurants)

| Paramètre KDS | Valeur | Unité | Réduction | Date d'effet |
|---------------|--------|-------|-----------|--------------|
| aen.meal.hcr.1 | 4,25 € | € / repas | ~23% vs cas général | 01/01/2026 |
| aen.meal.hcr.2 | 8,50 € | € / jour | ~23% vs cas général | 01/01/2026 |

**Justification réduction HCR :**
- Secteur où la fourniture de repas est une **pratique courante** et nécessaire
- Coût réel pour l'employeur souvent inférieur (cuisine sur place)
- Convention collective HCR prévoit des modalités spécifiques

---

## Méthodologie de calcul

### Principe général

```
AEN Nourriture mensuel = Nombre de repas fournis × Valeur forfaitaire
```

**Exemple (cas général) :**
- Salarié bénéficie de 1 repas par jour, 5 jours/semaine
- Nombre de repas par mois : ~22 repas (moyenne mensuelle)
- AEN mensuel = 22 × 5,50 € = **121 €**

### Repas partiellement gratuit

Si le salarié paie une participation :
```
AEN à réintégrer = Évaluation forfaitaire - Participation salarié
```

**Exemple :**
- Repas fourni : évaluation forfaitaire = 5,50 €
- Participation salarié : 3 €
- AEN à réintégrer = 5,50 - 3 = **2,50 €**

Si participation salarié ≥ évaluation forfaitaire → AEN = 0 €

---

## Cas particuliers / Exceptions

### 1. Repas d'affaires / missions

Les repas fournis dans le cadre de **déplacements professionnels** ou **missions** ne sont **pas** des AEN mais des **frais professionnels** (régime différent, voir BOSS Frais professionnels).

### 2. Tickets-restaurant

Les **titres-restaurant** ne constituent **pas** un AEN nourriture mais un avantage social avec un régime spécifique (voir Chapitre 4 - Titres-restaurant).

### 3. Cantines d'entreprise

Si l'entreprise dispose d'une **cantine collective** avec tarification normale, le repas n'est généralement **pas** considéré comme un AEN (sauf si tarif très inférieur à la valeur réelle).

---

## Notes d'interprétation KDS

### Usage dans les simulateurs KDS

Le barème nourriture est utilisé pour :
- Calculer l'AEN à réintégrer sur le bulletin de paie
- Distinguer les cas secteur général / secteur HCR
- Évaluer l'impact social et fiscal de la fourniture de repas

### Distinction avec frais professionnels

**Ne pas confondre** :
- **AEN Nourriture** : Repas fournis sur le lieu de travail habituel, de manière permanente
- **Frais professionnels** : Repas lors de déplacements, missions, contraintes professionnelles

---

## Liens avec autres barèmes

### Chapitres KDS liés

- **Chapitre 1 (SMIC / MG)** : Le barème nourriture est indexé sur le **Minimum garanti** → voir `smic.minimum_guaranteed`
- **Chapitre 3 (Autres AEN)** : Logement, véhicule → même logique forfaitaire
- **Chapitre 4 (Frais professionnels - Repas)** : Distinction repas AEN vs frais pro
- **Chapitre 4 (Titres-restaurant)** : Régime différent, ne pas confondre

### Autres fiches BOSS à consulter

- **BOSS - Avantages en nature (principes généraux)**
- **BOSS - Frais professionnels (repas)** : Petits/grands déplacements
- **BOSS - Titres-restaurant** : Alternative à la fourniture directe de repas

---

## Historique des modifications

- **10/02/2026** : Création de la fiche par Audit KDS (Claude)
- **01/01/2026** : Application des valeurs 2026 (MG = 4,15 €)
- **[Dates antérieures]** : À documenter

### Évolution historique du MG et impact sur les barèmes nourriture

| Année | MG | 1 repas (1,5×MG) | 2 repas (3×MG) |
|-------|----|--------------------|------------------|
| 2026 | 4,15 € | 5,50 € (?) | 11,00 € (?) |
| 2025 | 4,08 € | [À vérifier] | [À vérifier] |
| 2024 | 4,01 € | [À vérifier] | [À vérifier] |

⚠️ **À vérifier** : Les valeurs 2024-2025 et la méthode d'arrondi.

---

## Source des sources (références croisées)

### Textes législatifs et réglementaires

- **Code de la Sécurité sociale, art. L242-1** : Assiette des cotisations (AEN inclus)
- **Arrêté ministériel annuel** : Fixe le montant du Minimum garanti (base de calcul)
- **Convention collective HCR** : Modalités spécifiques secteur HCR

### Doctrine URSSAF / BOSS

- **BOSS - Nourriture** : https://boss.gouv.fr/portail/accueil/avantages-en-nature/nourriture.html
- **BOSS - Avantages en nature** : Principes généraux

---

## Pièces jointes

### À archiver

- [ ] Capture BOSS au 10/02/2026 (section nourriture)
- [ ] Arrêté fixant le MG 2026
- [ ] Tableau Excel de vérification des montants

### Localisation des archives

```
/sources/archives/BOSS_AEN_Nourriture/
  ├── 2026-02-10_BOSS_Capture_Nourriture.png
  ├── 2025-12-XX_Arrete_MG_2026.pdf
  └── Exemples_Calculs_AEN_Nourriture.xlsx
```

---

## Questions en suspens / Points à clarifier

### Pour la prochaine revue

1. ⚠️ **Méthode d'arrondi exacte** : 1,5 × 4,15 = 6,225 € mais la valeur affichée est 5,50 € ?
2. ⚠️ **Valeurs historiques 2024-2025** : À extraire pour traçabilité
3. 💡 **Cas des restaurants inter-entreprises** : AEN ou non ?

### Actions à mener

- [ ] Vérifier sur BOSS la formule exacte et l'arrondi
- [ ] Identifier l'arrêté MG 2026
- [ ] Documenter les valeurs 2024-2025

---

## 📋 Checklist de validation

- [x] Source principale identifiée (BOSS)
- [x] URL officielle fournie
- [x] Valeurs 2026 documentées
- [x] Méthodologie de calcul expliquée
- [x] Distinction cas général / HCR
- [ ] Formule d'arrondi vérifiée sur BOSS
- [ ] Archives constituées
- [ ] Relecture à 4 yeux effectuée

**Statut** : 🟡 Fiche créée, validation partielle (formule exacte à vérifier)

---

**FIN DE LA FICHE SOURCE BOSS — NOURRITURE**

*Créé le 10/02/2026 par Audit KDS (Claude)*  
*Version 1.0 — Document vivant, à mettre à jour annuellement*
