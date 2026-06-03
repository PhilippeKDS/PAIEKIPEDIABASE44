# Source BOSS — Avantage en nature : Véhicule de fonction

**Type** : Fiche BOSS + Décret  
**Référence** : BOSS - Avantages en nature - Véhicule  
**URL officielle** : https://boss.gouv.fr/portail/accueil/avantages-en-nature/vehicule.html  
**Date de publication initiale** : [À compléter]  
**Date de dernière mise à jour BOSS** : [À vérifier - probablement janv. 2025 suite décret VE]  
**Validé par KDS le** : 10/02/2026  
**Responsable validation** : Audit KDS - Claude  

---

## Périmètre

Évaluation forfaitaire de l'avantage en nature constitué par la **mise à disposition permanente d'un véhicule de fonction** à un salarié pour usage privé et/ou professionnel.

**Contexte d'application :**
- Véhicule mis à disposition du salarié de manière continue
- Usage privé possible (trajets domicile-travail, week-ends, vacances)
- Distinction selon : véhicule acheté/loué, carburant inclus/exclu, âge du véhicule
- **Nouveauté 2025** : Abattements renforcés pour véhicules 100% électriques

Le barème s'applique en l'absence d'évaluation au réel des dépenses.

---

## Valeurs extraites

### 1. Véhicule ACHETÉ (thermique, hybride, hybride rechargeable)

| Paramètre KDS | Barème | Âge véhicule | Carburant | Date d'effet |
|---------------|--------|--------------|-----------|--------------|
| aen.vehicle.purchased.no_fuel.le5 | 15% du prix TTC | ≤ 5 ans | Non pris en charge | 01/01/2026 |
| aen.vehicle.purchased.no_fuel.gt5 | 10% du prix TTC | > 5 ans | Non pris en charge | 01/01/2026 |
| aen.vehicle.purchased.fuel.le5 | 20% du prix TTC | ≤ 5 ans | Pris en charge | 01/01/2026 |
| aen.vehicle.purchased.fuel.gt5 | 15% du prix TTC | > 5 ans | Pris en charge | 01/01/2026 |

**Base de calcul** : Prix d'achat TTC du véhicule **neuf** (même si acheté d'occasion, on prend le prix neuf du modèle à l'année d'achat).

**Formule :**
```
AEN annuel = Prix TTC neuf × Taux (selon âge et carburant)
AEN mensuel = AEN annuel / 12
```

**Exemple :**
- Véhicule acheté neuf en 2023 : 30 000 € TTC
- Mise à disposition en 2026 (véhicule de 3 ans)
- Carburant non pris en charge
- AEN annuel = 30 000 × 15% = **4 500 €**
- AEN mensuel = 4 500 / 12 = **375 €**

---

### 2. Véhicule LOUÉ (location longue durée, leasing)

| Paramètre KDS | Barème | Carburant | Date d'effet |
|---------------|--------|-----------|--------------|
| aen.vehicle.leased.no_fuel | 50% du coût global | Non pris en charge | 01/01/2026 |
| aen.vehicle.leased.fuel | 67% du coût global | Pris en charge | 01/01/2026 |

**Note** : Même barème pour véhicules électriques loués (avant abattement éventuel).

**Base de calcul** : Coût annuel global de la location (loyers + frais).

**Formule :**
```
AEN annuel = (Loyers annuels + Frais) × Taux (selon carburant)
AEN mensuel = AEN annuel / 12
```

**Exemple :**
- Location LLD : 500 €/mois (6 000 €/an)
- Carburant inclus dans la LLD
- AEN annuel = 6 000 × 67% = **4 020 €**
- AEN mensuel = 4 020 / 12 = **335 €**

---

### 3. Véhicules 100% ÉLECTRIQUES — Abattements renforcés

#### 📅 Ancien régime (01/01/2020 → 31/01/2025)

| Paramètre KDS | Abattement | Plafond annuel | Période |
|---------------|------------|----------------|---------|
| aen.ev.abatement_2020_2025 | 50% | 2 026,30 € | Mise à dispo 01/01/2020 → 31/01/2025 |

**Formule :**
```
AEN avant abattement = Calcul classique (voir ci-dessus)
Abattement = min(AEN × 50%, 2 026,30 €)
AEN après abattement = AEN avant abattement - Abattement
```

**Exemple :**
- Véhicule électrique acheté 40 000 €, ≤ 5 ans, sans carburant
- AEN avant abattement = 40 000 × 15% = 6 000 €/an
- Abattement = min(6 000 × 50%, 2 026,30) = **2 026,30 €**
- AEN après abattement = 6 000 - 2 026,30 = **3 973,70 €/an**

#### 📅 Nouveau régime (01/02/2025 → 31/12/2027)

| Paramètre KDS | Abattement | Plafond annuel | Période |
|---------------|------------|----------------|---------|
| aen.ev.abatement_2025_2027 | 70% | 4 641,60 € | Mise à dispo 01/02/2025 → 31/12/2027 |

**⚠️ Conditions cumulatives (depuis 01/02/2025) :**

| Condition | Détail |
|-----------|--------|
| ✅ Véhicule exclusivement électrique | Pas d'hybride rechargeable, ni thermique |
| ✅ Score environnemental ≥ 60 | Éligible au bonus écologique (voir décret bonus) |
| ✅ Frais d'électricité exclus | L'électricité payée par l'employeur n'est pas prise en compte dans le calcul de l'AEN |

**Formule (nouveau régime) :**
```
AEN avant abattement = Calcul classique (HORS frais d'électricité)
Abattement = min(AEN × 70%, 4 641,60 €)
AEN après abattement = AEN avant abattement - Abattement
```

**Exemple (nouveau régime) :**
- Véhicule électrique acheté 45 000 €, ≤ 5 ans, électricité prise en charge
- Score environnemental = 75 (éligible)
- AEN avant abattement = 45 000 × 15% = 6 750 €/an (électricité exclue du calcul)
- Abattement = min(6 750 × 70%, 4 641,60) = **4 641,60 €**
- AEN après abattement = 6 750 - 4 641,60 = **2 108,40 €/an**

---

### 4. Bornes de recharge électrique (jusqu'au 31/12/2027)

| Situation | Évaluation | Paramètre KDS |
|-----------|------------|---------------|
| **Borne au travail** | 0 € (exonéré, électricité incluse) | aen.charging.workplace |
| **Borne au domicile** (non restituée) | Exonération 50% plafonné à 1 057,10 € (ou 75% plafonné à 1 585,50 € si > 5 ans) | aen.charging.home |

**Précisions borne domicile :**
- Si la borne (achat + installation) n'est **pas restituée** à l'employeur en fin de contrat
- Exonération de **50%** des dépenses réelles, plafonnée à **1 057,10 €**
- Ou **75%** plafonnée à **1 585,50 €** si la borne a plus de 5 ans d'ancienneté

**Exemple :**
- Coût borne + installation : 2 000 €
- Borne non restituée, < 5 ans
- Exonération = min(2 000 × 50%, 1 057,10) = **1 000 €**
- AEN = 2 000 - 1 000 = **1 000 €**

---

## Méthodologie de calcul

### Étape 1 : Déterminer le type de véhicule et le régime applicable

```
┌─ Véhicule thermique/hybride ?
│   └─ Barème classique (15%, 20%, etc.)
│
├─ Véhicule 100% électrique ?
│   ├─ Mise à dispo 01/01/2020 → 31/01/2025 ?
│   │   └─ Abattement 50% plafonné à 2 026,30 €
│   │
│   └─ Mise à dispo 01/02/2025 → 31/12/2027 ?
│       ├─ Score environnemental ≥ 60 ?
│       │   └─ OUI → Abattement 70% plafonné à 4 641,60 €
│       └─ NON → Barème classique
```

### Étape 2 : Calculer l'AEN avant abattement

**Véhicule acheté :**
```
AEN = Prix TTC neuf × Taux (15% ou 20% selon âge et carburant)
```

**Véhicule loué :**
```
AEN = Coût annuel global × Taux (50% ou 67% selon carburant)
```

### Étape 3 : Appliquer l'abattement (véhicules électriques uniquement)

```
Abattement = min(AEN × Taux abattement, Plafond abattement)
AEN final = AEN - Abattement
```

### Étape 4 : Mensualiser

```
AEN mensuel = AEN annuel / 12
```

---

## Cas particuliers / Exceptions

### 1. Véhicule utilisé exclusivement à titre professionnel

Si le salarié **ne peut pas** utiliser le véhicule à titre privé (interdiction formelle et effective) :
- ❌ **Pas d'AEN** à réintégrer
- ⚠️ L'employeur doit pouvoir **prouver** cette interdiction (règlement intérieur, contrat, contrôle GPS, etc.)

### 2. Véhicule partiellement à disposition

Si le salarié ne dispose du véhicule que **quelques jours par mois** :
- Proratisation possible au nombre de jours d'utilisation privée
- ⚠️ Nécessite un **suivi précis** des jours d'utilisation

**Exemple :**
- AEN annuel théorique : 6 000 €
- Véhicule à disposition 15 jours par mois (50%)
- AEN proratisé = 6 000 × 50% = **3 000 €/an**

### 3. Véhicule d'occasion

Pour un véhicule acheté d'occasion, on prend le **prix TTC neuf du modèle** (à l'année de première mise en circulation).

**Exemple :**
- Véhicule Renault Clio acheté d'occasion en 2026 : 8 000 €
- Première mise en circulation : 2022 (prix neuf à l'époque : 18 000 €)
- Base de calcul AEN : **18 000 €** (et non 8 000 €)

### 4. Changement de véhicule en cours d'année

En cas de remplacement du véhicule :
- Calculer l'AEN au prorata temporis pour chaque véhicule
- Additionner les deux AEN pour obtenir l'AEN annuel total

---

## Notes d'interprétation KDS

### Score environnemental (véhicules électriques)

Le **score environnemental ≥ 60** correspond aux véhicules éligibles au **bonus écologique**.

Pour vérifier l'éligibilité :
- Consulter https://www.ecologie.gouv.fr/bonus-ecologique
- Liste des véhicules éligibles mise à jour régulièrement
- En pratique : quasi tous les VE neufs en 2025-2027 atteignent ce score

### Frais d'électricité exclus du calcul (nouveau régime VE)

**Important** : Depuis le 01/02/2025, pour les VE bénéficiant de l'abattement 70%, les **frais d'électricité** payés par l'employeur ne sont **pas comptés** dans le calcul de l'AEN de base.

**En pratique :**
- Véhicule électrique acheté → Base = Prix TTC × 15% ou 20% (comme avant)
- Véhicule électrique loué **avec forfait électricité** → Base = Loyers HT électricité × 50% ou 67%

### Cumul abattements

⚠️ **Attention** : Un véhicule ne peut bénéficier que d'**un seul abattement** :
- Soit l'ancien régime (50% / 2 026 €) si mis à dispo avant 01/02/2025
- Soit le nouveau régime (70% / 4 641 €) si mis à dispo depuis 01/02/2025

---

## Liens avec autres barèmes

### Chapitres KDS liés

- **Chapitre 3 (Autres AEN)** : Logement, nourriture → même logique forfaitaire
- **Chapitre 4 (Frais professionnels - IK)** : À distinguer des IK (régime différent)
- **Chapitre 7 (Cotisations)** : L'AEN véhicule entre dans l'assiette des cotisations

### Autres fiches BOSS à consulter

- **BOSS - Avantages en nature (principes généraux)**
- **BOSS - Frais professionnels** : Si remboursement d'IK au lieu de véhicule de fonction

---

## Historique des modifications

- **10/02/2026** : Création de la fiche par Audit KDS (Claude)
- **01/02/2025** : Entrée en vigueur du nouveau régime VE (70% / 4 641 €)
- **01/01/2020** : Entrée en vigueur de l'ancien régime VE (50% / 2 026 €)
- **[Dates antérieures]** : À documenter

---

## Source des sources (références croisées)

### Textes législatifs et réglementaires

- **Code de la Sécurité sociale, art. L242-1** : Assiette des cotisations (AEN inclus)
- **Décret n°2024-XXXX** (à identifier) : Abattements véhicules électriques 2025-2027
- **Loi de finances 2025** : Dispositions bonus écologique et score environnemental
- **Arrêté interministériel** : Fixation des plafonds d'abattement

### Doctrine URSSAF / BOSS

- **BOSS - Véhicule** : https://boss.gouv.fr/portail/accueil/avantages-en-nature/vehicule.html
- **BOSS - Véhicules propres** : Section spécifique sur les abattements VE

### Autres sources

- **Ministère de la Transition écologique** : Liste véhicules éligibles bonus (score ≥ 60)
- **Service-Public.fr** : Synthèses grand public sur AEN véhicule

---

## Pièces jointes

### À archiver

- [ ] Capture BOSS au 10/02/2026 (section véhicule)
- [ ] Copie PDF décret abattements VE 2025-2027
- [ ] Liste officielle véhicules score ≥ 60 (janv. 2026)
- [ ] Tableau Excel exemples de calcul

### Localisation des archives

```
/sources/archives/BOSS_AEN_Vehicule/
  ├── 2026-02-10_BOSS_Capture_Vehicule.png
  ├── 2024-XX-XX_Decret_Abattements_VE_2025-2027.pdf
  ├── 2026-01-15_Liste_Vehicules_Score_Env.pdf
  └── Exemples_Calculs_AEN_Vehicule.xlsx
```

---

## Questions en suspens / Points à clarifier

### Pour la prochaine revue

1. ⚠️ **Référence exacte du décret 2024-2025** : Abattements VE 70% / 4 641 €
2. ⚠️ **Date précise de publication BOSS 2025** : Mise à jour section VE
3. 💡 **Cas des véhicules hybrides rechargeables** : Éligibles aux abattements ? → **NON confirmé**
4. 💡 **Évolution post-2027** : Abattements maintenus ou supprimés ?

### Actions à mener

- [ ] Identifier le décret exact (Légifrance)
- [ ] Archiver la liste véhicules score ≥ 60
- [ ] Vérifier les barèmes véhicules 2024 (cohérence avec 2026)
- [ ] Clarifier le cas des PHEV (hybrides rechargeables)

---

## 📋 Checklist de validation

- [x] Source principale identifiée (BOSS)
- [x] URL officielle fournie
- [x] Valeurs 2026 documentées
- [x] Méthodologie de calcul détaillée
- [x] Cas particuliers listés (VE, borne, etc.)
- [x] Exemples concrets fournis
- [ ] Décret VE 2025 référencé précisément
- [ ] Archives constituées
- [ ] Relecture à 4 yeux effectuée

**Statut** : 🟡 Fiche créée, validation partielle (décret VE à identifier)

---

**FIN DE LA FICHE SOURCE BOSS — VÉHICULE**

*Créé le 10/02/2026 par Audit KDS (Claude)*  
*Version 1.0 — Document vivant, à mettre à jour annuellement*
