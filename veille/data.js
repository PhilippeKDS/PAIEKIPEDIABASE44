/* =============================================================
   PaieKipédia — Bibliothèque de veille légale
   FICHIER DE DONNÉES — NE PAS ÉCRASER lors des mises à jour

   Structure d'une entrée :
   {
     id          : string          — identifiant unique
     titre       : string          — titre de la publication
     datePublication : "YYYY-MM-DD"
     resume      : string          — résumé 2-3 phrases
     texteIntegral : string        — texte complet (pour recherche + impression)
     themes      : string[]        — tags thématiques
     logiciels   : string[]        — ["Sage Paie", "Silae", "Lucca"]
     source      : string | null   — référence réglementaire
     lienTeams   : string | null   — URL du post Teams original
     reformeId   : string | null   — id de la réforme liée dans data.js réformes
   }
   ============================================================= */

/* global VEILLE_DATA */
var VEILLE_DATA = [

  {
    id: "pub-spst-dsn-mars2026",
    titre: "SPST en DSN — la norme P27V01 faisait sa liste de courses, et ce n'est pas fini",
    datePublication: "2026-03-15",
    resume: "La déclaration du Service de Prévention et de Santé au Travail (SPST) devient obligatoire en DSN mensuelle à partir de la norme P27V01 (janvier 2027). L'objectif est de permettre aux organismes versant des IJ d'identifier les arrêts à risque de désinsertion professionnelle. Chaque client devra collecter la nature de son SPST et les informations associées avant tout paramétrage logiciel.",
    texteIntegral: `P27V01 : la DSN 2027 fait sa liste de courses, et ce n'est pas fini.

La charge de travail liée à la norme P27V01 commence déjà à se dessiner, et le moins qu'on puisse dire c'est que la liste de courses s'allonge. Après le prorata du plafond de la Sécurité sociale qui va déjà nous occuper, voici que le service de prévention et de santé au travail (SPST) s'invite en DSN mensuelle, avec le cas simple… et les autres.

LA NOUVEAUTÉ EN BREF
En application de la loi du 2 août 2021 pour renforcer la prévention en santé au travail, la déclaration du service de prévention et de santé au travail (SPST) sera obligatoire en DSN mensuelle à partir de la norme P27V01 (2027).
L'objectif : permettre aux organismes versant des indemnités journalières d'identifier certains arrêts de travail présentant un risque de désinsertion professionnelle, et de les transmettre au service de médecine du travail concerné.
⚠️ Fonction publique : non concernée par cette disposition.

CE QUE ÇA CHANGE CONCRÈTEMENT EN DSN — LES 4 CAS
Règle universelle : le SPST à déclarer est toujours celui en vigueur à la date de l'arrêt en paye.

IMPACTS POUR NOS CLIENTS
Chaque client doit collecter, avant tout paramétrage dans les logiciels, la nature du SPST et les informations associées.

Pour tous les clients :
- Quel(s) type(s) de SPST l'entreprise utilise-t-elle ? SPST interentreprises, SPST autonome, ou les deux selon les salariés ?
- Si SPST interentreprises : quel est le code MTXX correspondant ? (référentiel sst_dpae sur open.urssaf.fr)
- L'entreprise a-t-elle des salariés relevant d'un SPST différent du SPST principal (multi-sites, conditions spécifiques) ?
- L'entreprise a-t-elle des salariés en multi-contrats relevant de SPST différents selon le contrat ?

En cas de SPST autonome (MT01) — informations complémentaires obligatoires (bloc S20.G00.07 type 17) :
- Nom et prénom du contact au sein du service de médecine du travail interne
- Numéro de téléphone du service de médecine du travail interne
- Adresse mail d'un contact formellement habilité à recevoir des données médicales (à désigner en interne)

⚠️ Ces trois champs n'existent pas encore dans Sage Paie 100 ni dans Silae. Intégration attendue dans les mises à jour éditeur.

SAGE PAIE 100
L'onglet Service de Santé au Travail de la fiche établissement existe déjà, mais le champ code est actuellement libre. On peut anticiper qu'à partir de la version 8.10, Sage propose une liste déroulante alimentée par le référentiel sst_dpae de l'URSSAF.
La gestion des blocs S20.G00.07 et S21.G00.30.030 reste à confirmer en V8.10.
👉 Ne rien paramétrer avant la V8.10. Attendre la communication éditeur.

SILAE
L'architecture déclarative semble déjà outillée pour alimenter les blocs concernés, hormis les trois infos de contact. La question porte sur l'interface de saisie et le calendrier de mise à disposition.
👉 Surveiller les communications de Silae sur ce sujet.

SOURCES
- Fiche consigne n° 3370, net-entreprises.fr, créée le 11/03/2026
- Loi n° 2021-1018 du 2 août 2021, art. 19`,
    themes: ["SPST", "DSN", "Norme P27V01", "Santé au travail", "Arrêts de travail", "Désinsertion professionnelle"],
    logiciels: ["Sage Paie", "Silae"],
    source: "Fiche consigne n° 3370, net-entreprises.fr, créée le 11/03/2026 — Loi n° 2021-1018 du 2 août 2021, art. 19",
    lienTeams: null,
    reformeId: "spst-dsn-2027"
  },

  {
    id: "pub-prorata-plafond-mars2026",
    titre: "Nouvelle rubrique DSN en 2027 : la proratisation du plafond, encore et encore…",
    datePublication: "2026-03-12",
    resume: "La norme P27V01 introduit une nouvelle rubrique DSN S21.G00.40.084 pour déclarer explicitement si le plafond de Sécurité sociale est proratisé ou non. Elle concerne à la fois les salariés à temps partiel et les salariés en forfait jours réduit (déclarés à temps plein). Des exceptions à la proratisation existent pour les temps partiels, encadrées par la doctrine BOSS — pas de choix individuel libre.",
    texteIntegral: `Actualité paie - Nouvelle rubrique DSN en 2027 : la proratisation du plafond, encore et encore...

DE QUOI PARLE-T-ON ?
Le GIP-MDS vient de publier (10 mars 2026) une nouvelle fiche de consigne pour la norme DSN P27V01, applicable à partir de janvier 2027.
En clair : une nouvelle rubrique fait son apparition dans la DSN pour déclarer explicitement si le plafond de Sécurité sociale d'un salarié est proratisé ou non.
Jusqu'à présent, cette information était « silencieuse » — elle se lisait en creux dans les montants déclarés. Désormais, il faudra le dire clairement dans la rubrique :
S21.G00.40.084 – Application de la proratisation du plafond de Sécurité sociale à hauteur de la quotité de travail — en indiquant Oui ou Non.

LES CAS QUI POSENT QUESTION

TEMPS PARTIEL SANS PRORATA DE PLAFOND : DES EXCEPTIONS ADMISES
Le plafond de Sécurité sociale est en principe proratisé pour les salariés à temps partiel. Toutefois, la doctrine BOSS admet des exceptions encadrées :
- Décision générale de l'employeur : applicable à une catégorie objective de salariés, non discriminatoire. Pas un choix discrétionnaire salarié par salarié.
- Situations spécifiques admises par la doctrine sociale (maintien de droits, régularisations, etc.)

⚠️ La notion de « renonciation conjointe employeur/salarié » peut être trompeuse : il n'existe pas de droit général à la renonciation individuelle libre. Mieux vaut parler d'exceptions admises par la doctrine.
💡 Ces pratiques existent depuis longtemps mais étaient peu visibles. La nouvelle rubrique DSN va les rendre explicites et traçables.

LES SALARIÉS EN FORFAIT JOURS RÉDUIT
Un salarié en forfait jours réduit (< 218 j/an) n'est pas juridiquement un salarié à temps partiel. En DSN : déclaré avec la modalité 10 – Temps plein, quelle que soit la situation.
Ce qui change en 2027 :
- Sans prorata de plafond → rubrique à 02 – Non, modalité temps de travail à 10 – Temps plein
- Avec prorata de plafond (uniquement avec accord explicite du salarié) → rubrique à 01 – Oui, modalité toujours à 10 – Temps plein
💡 Pour les forfaits jours réduits, la proratisation nécessite un accord formalisé du salarié.

ET POUR NOUS, CONCRÈTEMENT ?
Pas d'action immédiate. L'intégration de la norme P27V01 est à la charge des éditeurs.
Sur Silae : probablement pas de changement majeur, sauf formalisation plus précise dans la fiche salarié.
Sur Sage : on n'est à l'abri de rien…
En revanche, c'est une actualité utile pour d'éventuelles discussions clients : la nouvelle rubrique va rendre visibles des pratiques jusqu'ici implicites.
Il sera utile d'informer les clients suffisamment tôt du contrôle indispensable de cette rubrique DSN dès la paie de janvier 2027.

À noter : pas de changement sur les bases assujetties. Les blocs S21.G00.78 restent en norme P26V01. Seule la nouvelle rubrique S21.G00.40.084 est à alimenter en sus.

SOURCE
GIP-MDS, Base de connaissances net-entreprises.fr, fiche 3369 créée le 10/03/2026`,
    themes: ["DSN", "Norme P27V01", "Plafond Sécurité sociale", "Proratisation", "Temps partiel", "Forfait jours réduit", "Rubrique S21.G00.40.084"],
    logiciels: ["Sage Paie", "Silae"],
    source: "GIP-MDS, fiche consigne n° 3369, net-entreprises.fr, créée le 10/03/2026",
    lienTeams: null,
    reformeId: "forfait-jours-reduit-p27v01"
  }

]; // fin VEILLE_DATA
