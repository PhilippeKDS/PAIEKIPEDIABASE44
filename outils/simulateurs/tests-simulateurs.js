#!/usr/bin/env node
/**
 * Tests de non-régression — Simulateurs Paie KDS
 * ================================================
 * Usage : node tests-simulateurs.js
 *
 * Vérifie les calculs de chaque simulateur contre des cas de référence.
 * À exécuter après toute modification des paramètres ou de la logique de calcul.
 */

// =============================================
// PARAMÈTRES (miroir du DATA embarqué)
// =============================================
const DATA = {
  tr_exempt_cap: 7.32,
  tr_employer_min: 50,
  tr_employer_max: 60,

  // PAS taux neutre 2025 (mai 2025) — mensuel
  pas_brackets: [
    {max:1620,rate:0},{min:1620,max:1683,rate:0.5},{min:1683,max:1791,rate:1.3},
    {min:1791,max:1911,rate:2.1},{min:1911,max:2042,rate:2.9},{min:2042,max:2151,rate:3.5},
    {min:2151,max:2294,rate:4.1},{min:2294,max:2714,rate:5.3},{min:2714,max:3107,rate:7.5},
    {min:3107,max:3539,rate:9.9},{min:3539,max:3983,rate:11.9},{min:3983,max:4648,rate:13.8},
    {min:4648,max:5574,rate:15.8},{min:5574,max:6974,rate:17.9},{min:6974,max:8711,rate:20.0},
    {min:8711,max:12091,rate:24.0},{min:12091,max:16376,rate:28.0},{min:16376,max:25706,rate:33.0},
    {min:25706,max:55062,rate:38.0},{min:55062,rate:43.0}
  ],

  // DOM (Guadeloupe / Martinique / La Réunion) — mensuel
  pas_brackets_dom: [
    {max:1858,rate:0},{min:1858,max:1971,rate:0.5},{min:1971,max:2171,rate:1.3},
    {min:2171,max:2371,rate:2.1},{min:2371,max:2618,rate:2.9},{min:2618,max:2761,rate:3.5},
    {min:2761,max:2855,rate:4.1},{min:2855,max:3142,rate:5.3},{min:3142,max:3885,rate:7.5},
    {min:3885,max:4971,rate:9.9},{min:4971,max:5646,rate:11.9},{min:5646,max:6540,rate:13.8},
    {min:6540,max:7836,rate:15.8},{min:7836,max:8711,rate:17.9},{min:8711,max:9900,rate:20.0},
    {min:9900,max:13615,rate:24.0},{min:13615,max:18090,rate:28.0},{min:18090,max:27610,rate:33.0},
    {min:27610,max:60350,rate:38.0},{min:60350,rate:43.0}
  ],

  // Guyane / Mayotte — mensuel
  pas_brackets_gm: [
    {max:1990,rate:0},{min:1990,max:2151,rate:0.5},{min:2151,max:2398,rate:1.3},
    {min:2398,max:2704,rate:2.1},{min:2704,max:2808,rate:2.9},{min:2808,max:2904,rate:3.5},
    {min:2904,max:2999,rate:4.1},{min:2999,max:3332,rate:5.3},{min:3332,max:4598,rate:7.5},
    {min:4598,max:5951,rate:9.9},{min:5951,max:6712,rate:11.9},{min:6712,max:7788,rate:13.8},
    {min:7788,max:8567,rate:15.8},{min:8567,max:9492,rate:17.9},{min:9492,max:11016,rate:20.0},
    {min:11016,max:14820,rate:24.0},{min:14820,max:18850,rate:28.0},{min:18850,max:30210,rate:33.0},
    {min:30210,max:63767,rate:38.0},{min:63767,rate:43.0}
  ],

  hs_taux_max: 11.31,
  hs_exo_cap_net: 7500,
  hs_brut_to_net: 0.93319,
  hs_ded_h_lt20: 1.5,
  hs_ded_h_gt20: 0.5,
  hs_ded_j_lt20: 10.5,
  hs_ded_j_gt20: 3.5,

  garnish_thresholds: [4480, 8730, 13000, 17230, 21470, 25810],
  garnish_fractions: [0.05, 0.1, 0.2, 0.25, 1/3, 2/3, 1],
  garnish_allowance: 1740,
  garnish_rsa_metro: 646.52,
  garnish_rsa_mayotte: 323.26,

  pss_hourly: 30,
  stage_rate: 0.15,

  ik_t1: 5000, ik_t2: 20000,
  ik_bands: [
    {label:"≤ 3 CV",key:"le3",t1:{k:0.529,b:0},t2:{k:0.316,b:1065},t3:{k:0.37,b:0}},
    {label:"4 CV",  key:"4",  t1:{k:0.606,b:0},t2:{k:0.34, b:1330},t3:{k:0.407,b:0}},
    {label:"5 CV",  key:"5",  t1:{k:0.636,b:0},t2:{k:0.357,b:1395},t3:{k:0.427,b:0}},
    {label:"6 CV",  key:"6",  t1:{k:0.665,b:0},t2:{k:0.374,b:1457},t3:{k:0.447,b:0}},
    {label:"≥ 7 CV",key:"ge7",t1:{k:0.697,b:0},t2:{k:0.394,b:1515},t3:{k:0.47, b:0}}
  ],

  logement_brackets: [
    {range:"< 2 002,50 €",    one_room:79.7, multi_room:42.6, _min:0,       _max:2002.50},
    {range:"2 002,50 – 2 402,99 €",one_room:93.0, multi_room:59.7, _min:2002.50,_max:2403},
    {range:"2 403,00 – 2 803,49 €",one_room:106.2,multi_room:79.7, _min:2403,   _max:2803.50},
    {range:"2 803,50 – 3 604,49 €",one_room:119.4,multi_room:99.5, _min:2803.50,_max:3604.50},
    {range:"3 604,50 – 4 405,49 €",one_room:146.4,multi_room:126.1,_min:3604.50,_max:4405.50},
    {range:"4 405,50 – 5 206,49 €",one_room:172.6,multi_room:152.4,_min:4405.50,_max:5206.50},
    {range:"5 206,50 – 6 007,49 €",one_room:199.4,multi_room:185.7,_min:5206.50,_max:6007.50},
    {range:"≥ 6 007,50 €",    one_room:225.6,multi_room:212.3,_min:6007.50, _max:Infinity}
  ]
};

// =============================================
// FONCTIONS DE CALCUL (miroir de la logique page)
// =============================================

function pickPASBracket(brackets, monthly) {
  for (const b of brackets) {
    const minOk = (b.min == null) || (monthly >= b.min);
    const maxOk = (b.max == null) || (monthly < b.max);
    if (minOk && maxOk) return b;
  }
  return brackets[brackets.length - 1];
}


function calcPAS(monthly) {
  const b = pickPASBracket(DATA.pas_brackets, monthly);
  return monthly * b.rate / 100;
}

function calcPASByZone(year, zone, monthly) {
  if (String(year) === "2026") return null; // barèmes non disponibles
  const brackets = (zone === "metro") ? DATA.pas_brackets : (zone === "dom") ? DATA.pas_brackets_dom : DATA.pas_brackets_gm;
  const b = pickPASBracket(brackets, monthly);
  return { rate: b.rate, amount: monthly * b.rate / 100, bracket: b };
}


function calcHSReduc(grossV, rateV) {
  return grossV * rateV / 100;
}

function calcHSExoIR(grossV, alreadyNet, coefBN) {
  const netEq = grossV * coefBN;
  const capRemain = Math.max(0, DATA.hs_exo_cap_net - alreadyNet);
  const exemptNet = Math.min(netEq, capRemain);
  const taxableNet = Math.max(0, netEq - exemptNet);
  return { netEq, exemptNet, taxableNet };
}

function calcHSDedPat(kind, employer, qty) {
  if (kind === "hc") return 0;
  if (kind === "forfaitj") {
    return qty * (employer === "lt20" ? DATA.hs_ded_j_lt20 : DATA.hs_ded_j_gt20);
  }
  return qty * (employer === "lt20" ? DATA.hs_ded_h_lt20 : DATA.hs_ded_h_gt20);
}

function calcTR(faceV, employerAmount) {
  const employerPct = (employerAmount / faceV) * 100;
  if (employerPct < DATA.tr_employer_min) return { exempt: 0, reintegrated: employerAmount };
  const allowedByPct = Math.min(employerAmount, faceV * DATA.tr_employer_max / 100);
  const exempt = Math.min(allowedByPct, DATA.tr_exempt_cap);
  const reintegrated = Math.max(0, employerAmount - exempt);
  return { exempt, reintegrated };
}

function calcGarnish(annual, deps) {
  const thresholds = DATA.garnish_thresholds.map(t => t + (DATA.garnish_allowance * deps));
  let prev = 0, totalSeize = 0;
  for (let i = 0; i < thresholds.length; i++) {
    const upper = thresholds[i], frac = DATA.garnish_fractions[i] || 0;
    const base = Math.max(0, Math.min(annual, upper) - prev);
    totalSeize += base * frac;
    prev = upper;
  }
  const lastFrac = DATA.garnish_fractions[thresholds.length] || 1;
  const lastBase = Math.max(0, annual - prev);
  totalSeize += lastBase * lastFrac;
  return totalSeize;
}

function calcStage(hours) {
  return hours * DATA.pss_hourly * DATA.stage_rate;
}

function round2(x){ return Math.round((x+Number.EPSILON)*100)/100; }
function round1(x){ return Math.round((x+Number.EPSILON)*10)/10; }

// Gratification de stage — cotisations salariales sur surplus (inspiré de l'exemple Stage.pdf)
function calcStageSurplus(hours, paid) {
  const hourlyMin = DATA.pss_hourly * DATA.stage_rate;
  const franchise = hours * hourlyMin;
  const surplus = Math.max(0, paid - franchise);

  // taux (part salariale) utilisés dans la page Simulateurs
  const R_VIEIL_PLAF = 0.069;
  const R_VIEIL_DEPL = 0.004;
  const R_CSG_DED    = 0.068;
  const R_CSG_NDED   = 0.029;
  const CSG_ABATT    = 0.9825;

  if (surplus <= 0) {
    return {
      hourlyMin, franchise, surplus: 0,
      cot_vieill_plaf: 0, cot_vieill_depl: 0, cot_csg_ded: 0, cot_csg_nded: 0,
      total_cot: 0,
      net_to_pay: round2(paid)
    };
  }

  const base = surplus;
  const baseCsg = round2(base * CSG_ABATT);

  const cot1 = round2(base * R_VIEIL_PLAF);
  const cot2 = round2(base * R_VIEIL_DEPL);
  const cot3 = round2(baseCsg * R_CSG_DED);
  const cot4 = round2(baseCsg * R_CSG_NDED);

  const total = round2(cot1 + cot2 + cot3 + cot4);
  const netToPay = round2(paid - total);

  return {
    hourlyMin, franchise, surplus,
    cot_vieill_plaf: cot1, cot_vieill_depl: cot2, cot_csg_ded: cot3, cot_csg_nded: cot4,
    total_cot: total,
    net_to_pay: netToPay
  };
}

// Avantage en nature logement — modèle avancé (nb pièces, semaines, loyer, négligence)
function calcLogementAdv(salary, rooms, weeks, rent, neglect=true) {
  const brackets = DATA.logement_brackets;
  const s = salary;
  const n = Math.max(1, Math.floor(rooms || 1));
  const w = Math.max(1, Math.min(4, Math.floor(weeks || 4)));
  const l = rent || 0;

  const row = brackets.find(b => s >= (b._min || 0) && s < (b._max || Infinity)) || brackets[brackets.length - 1];

  const isOne = (n === 1);
  const perPiece = isOne ? row.one_room : row.multi_room;
  const monthlyRaw = perPiece * (isOne ? 1 : n);

  const weekly = round1(monthlyRaw * 0.25);
  const monthly = (w >= 4) ? round1(monthlyRaw) : round1(weekly * w);

  const minNeglect = brackets[0]?.one_room ?? 79.7;
  let monthlyUsed = monthly;
  if (neglect && monthlyUsed < minNeglect) monthlyUsed = 0;

  const advantage = Math.max(0, round1(monthlyUsed - l));
  return { row, perPiece, monthlyRaw: round1(monthlyRaw), weekly, monthly, monthlyUsed, advantage, minNeglect };
}

function calcIK(key, distance) {
  const band = DATA.ik_bands.find(b => b.key === key);
  if (!band) return NaN;
  if (distance <= DATA.ik_t1) return distance * band.t1.k + band.t1.b;
  if (distance <= DATA.ik_t2) return distance * band.t2.k + band.t2.b;
  return distance * band.t3.k + band.t3.b;
}

function calcLogement(salary, roomsCount) {
  const row = DATA.logement_brackets.find(b => salary >= (b._min || 0) && salary < (b._max || Infinity))
    || DATA.logement_brackets[DATA.logement_brackets.length - 1];
  const n = Math.max(1, Math.floor(Number(roomsCount) || 1));
  const per = (n === 1) ? row.one_room : row.multi_room;
  return per * n;
}

// =============================================
// TEST RUNNER
// =============================================
let pass = 0, fail = 0;
function assertClose(label, actual, expected, tolerance = 0.01) {
  const ok = Math.abs(actual - expected) <= tolerance;
  if (ok) {
    pass++;
  } else {
    fail++;
    console.error(`  ❌ ${label}: attendu ${expected}, obtenu ${actual} (écart ${(actual - expected).toFixed(4)})`);
  }
}
function assertEqual(label, actual, expected) {
  if (actual === expected) {
    pass++;
  } else {
    fail++;
    console.error(`  ❌ ${label}: attendu ${expected}, obtenu ${actual}`);
  }
}

// =============================================
// CAS DE TESTS
// =============================================

console.log("\n=== 1. PAS (taux neutre, barèmes mai 2025) ===");

// Métropole
assertClose("PAS métro 0 €", calcPASByZone(2025,"metro",0).amount, 0);
assertClose("PAS métro 1 500 €", calcPASByZone(2025,"metro",1500).amount, 0);
assertClose("PAS métro 1 650 €", calcPASByZone(2025,"metro",1650).amount, 1650 * 0.5 / 100);
assertClose("PAS métro 2 500 €", calcPASByZone(2025,"metro",2500).amount, 2500 * 5.3 / 100);
assertClose("PAS métro 60 000 €", calcPASByZone(2025,"metro",60000).amount, 60000 * 43 / 100);
assertClose("PAS métro 1 620 € (frontière)", calcPASByZone(2025,"metro",1620).amount, 1620 * 0.5 / 100);

// DOM (GMR)
assertClose("PAS DOM 1 850 €", calcPASByZone(2025,"dom",1850).amount, 0);
assertClose("PAS DOM 1 900 €", calcPASByZone(2025,"dom",1900).amount, 1900 * 0.5 / 100);
assertClose("PAS DOM 3 000 €", calcPASByZone(2025,"dom",3000).amount, 3000 * 5.3 / 100);
assertClose("PAS DOM 70 000 €", calcPASByZone(2025,"dom",70000).amount, 70000 * 43 / 100);

// Guyane / Mayotte
assertClose("PAS GM 1 980 €", calcPASByZone(2025,"gm",1980).amount, 0);
assertClose("PAS GM 2 000 €", calcPASByZone(2025,"gm",2000).amount, 2000 * 0.5 / 100);
assertClose("PAS GM 3 100 €", calcPASByZone(2025,"gm",3100).amount, 3100 * 5.3 / 100);
assertClose("PAS GM 80 000 €", calcPASByZone(2025,"gm",80000).amount, 80000 * 43 / 100);

// 2026 placeholder
assertEqual("PAS 2026 placeholder", calcPASByZone(2026,"metro",2500), null);


console.log("\n=== 2. Heures supplémentaires ===");
// Cas 1 : 10h, brut 250 €, taux max → réduction salariale
assertClose("HS réduc 250€×11.31%", calcHSReduc(250, 11.31), 28.275);
// Cas 2 : exo IR, pas de cumul antérieur
{
  const r = calcHSExoIR(250, 0, 0.93319);
  assertClose("HS exo net (250€)", r.exemptNet, 250 * 0.93319);
  assertClose("HS taxable (250€)", r.taxableNet, 0);
}
// Cas 3 : exo IR, déjà 7400 € exonérés → reste 100 € net
{
  const r = calcHSExoIR(250, 7400, 0.93319);
  assertClose("HS exo net (déjà 7400)", r.exemptNet, 100);
  assertClose("HS taxable (déjà 7400)", r.taxableNet, 250 * 0.93319 - 100);
}
// Cas 4 : exo IR, déjà 7500 € → tout imposable
{
  const r = calcHSExoIR(250, 7500, 0.93319);
  assertClose("HS exo net (plafond atteint)", r.exemptNet, 0);
}
// Cas 5 : déduction patronale
assertClose("HS ded pat lt20 10h", calcHSDedPat("hs", "lt20", 10), 15);
assertClose("HS ded pat ge20 10h", calcHSDedPat("hs", "ge20", 10), 5);
assertClose("HS ded pat forfait lt20 2j", calcHSDedPat("forfaitj", "lt20", 2), 21);
assertClose("HS ded pat forfait ge20 2j", calcHSDedPat("forfaitj", "ge20", 2), 7);
assertClose("HS ded pat HC (= 0)", calcHSDedPat("hc", "lt20", 10), 0);

console.log("\n=== 3. Titres-restaurant ===");
// Cas 1 : face 12 €, employeur 55% = 6,60 €. 6,60 < cap 7,32 et ≤ 60% → exempt 6,60
{
  const r = calcTR(12, 6.60);
  assertClose("TR 12€ @55%: exempt", r.exempt, 6.60);
  assertClose("TR 12€ @55%: réintégré", r.reintegrated, 0);
}
// Cas 2 : face 12 €, employeur 60% = 7,20 €. 7,20 < cap 7,32 → exempt 7,20
{
  const r = calcTR(12, 7.20);
  assertClose("TR 12€ @60%: exempt", r.exempt, 7.20);
}
// Cas 3 : face 14 €, employeur 60% = 8,40 €. Max par pct: 14×60%=8,40. Cap 7,32 → exempt 7,32
{
  const r = calcTR(14, 8.40);
  assertClose("TR 14€ @60%: exempt (cap)", r.exempt, 7.32);
  assertClose("TR 14€ @60%: réintégré", r.reintegrated, 8.40 - 7.32);
}
// Cas 4 : face 10 €, employeur 70% = 7 €. > 60% → allowedByPct = 10×60% = 6. exempt = min(6, 7.32) = 6
{
  const r = calcTR(10, 7.00);
  assertClose("TR 10€ @70%: exempt (>60%)", r.exempt, 6.00);
  assertClose("TR 10€ @70%: réintégré", r.reintegrated, 1.00);
}
// Cas 5 : face 12 €, employeur 40% = 4,80 €. < 50% → exempt 0
{
  const r = calcTR(12, 4.80);
  assertClose("TR 12€ @40%: exempt (< 50%)", r.exempt, 0);
  assertClose("TR 12€ @40%: réintégré", r.reintegrated, 4.80);
}

console.log("\n=== 4. Saisies sur rémunérations ===");
// Cas 1 : annuel 30 000 €, 0 personne à charge
{
  // Tranches : [0–4480]×5% + [4480–8730]×10% + [8730–13000]×20% + [13000–17230]×25%
  //          + [17230–21470]×33.33% + [21470–25810]×66.67% + [25810–30000]×100%
  const s = calcGarnish(30000, 0);
  const expected = 4480*0.05 + 4250*0.1 + 4270*0.2 + 4230*0.25 + 4240*(1/3) + 4340*(2/3) + 4190*1;
  assertClose("Saisie 30k 0dep", s, expected, 0.1);
}
// Cas 2 : annuel 30 000 €, 2 personnes à charge (seuils +3480)
{
  const s = calcGarnish(30000, 2);
  const th = DATA.garnish_thresholds.map(t => t + 1740 * 2);
  // th = [7960, 12210, 16480, 20710, 24950, 29290]
  const expected = 7960*0.05 + 4250*0.1 + 4270*0.2 + 4230*0.25 + 4240*(1/3) + 4340*(2/3) + 710*1;
  assertClose("Saisie 30k 2dep", s, expected, 0.1);
}
// Cas 3 : annuel 3000 € → tout dans première tranche (5%)
assertClose("Saisie 3k 0dep", calcGarnish(3000, 0), 3000 * 0.05, 0.01);

console.log("\n=== 5. Gratification de stage ===");
// 154h × 30 € × 15% = 693 €
assertClose("Stage 154h", calcStage(154), 693);
// 0h → 0
assertClose("Stage 0h", calcStage(0), 0);
// 309h (seuil obligation) → 309 × 4.50 = 1390.50
assertClose("Stage 309h", calcStage(309), 1390.50);

console.log("\n=== 5b. Stage — dépassement : cotisations salariales (surplus) ===");
// Cas 1 : 154h, gratification 850€ (surplus 157€)
{
  const r = calcStageSurplus(154, 850);
  assertClose("Stage surplus franchise", r.franchise, 693, 0.01);
  assertClose("Stage surplus montant", r.surplus, 157, 0.01);
  assertClose("Stage cot vieillesse plaf", r.cot_vieill_plaf, 10.83, 0.01);
  assertClose("Stage cot vieillesse déplaf", r.cot_vieill_depl, 0.63, 0.01);
  assertClose("Stage cot CSG déductible", r.cot_csg_ded, 10.49, 0.01);
  assertClose("Stage cot CSG/CRDS non déd", r.cot_csg_nded, 4.47, 0.01);
  assertClose("Stage total cotisations", r.total_cot, 26.42, 0.01);
  assertClose("Stage net à payer", r.net_to_pay, 823.58, 0.01);
}
// Cas 2 : pas de surplus (gratification < franchise) → cotisations 0
{
  const r = calcStageSurplus(154, 600);
  assertClose("Stage no surplus total cot", r.total_cot, 0, 0.01);
  assertClose("Stage no surplus net", r.net_to_pay, 600, 0.01);
}
// Cas 3 : gratification = franchise → cotisations 0
{
  const r = calcStageSurplus(154, 693);
  assertClose("Stage exact franchise total cot", r.total_cot, 0, 0.01);
  assertClose("Stage exact franchise net", r.net_to_pay, 693, 0.01);
}

console.log("\n=== 6. Indemnités kilométriques ===");
// 5 CV, 3500 km → 3500 × 0.636 = 2226
assertClose("IK 5CV 3500km", calcIK("5", 3500), 3500 * 0.636);
// 5 CV, 10000 km → 10000 × 0.357 + 1395 = 4965
assertClose("IK 5CV 10000km", calcIK("5", 10000), 10000 * 0.357 + 1395);
// 5 CV, 25000 km → 25000 × 0.427 = 10675
assertClose("IK 5CV 25000km", calcIK("5", 25000), 25000 * 0.427);
// ≤ 3 CV, 5000 km (frontière t1) → 5000 × 0.529 = 2645
assertClose("IK 3CV 5000km", calcIK("le3", 5000), 5000 * 0.529);
// ≥ 7 CV, 20000 km (frontière t2) → 20000 × 0.394 + 1515 = 9395
assertClose("IK 7CV 20000km", calcIK("ge7", 20000), 20000 * 0.394 + 1515);
// 0 km → 0
assertClose("IK 5CV 0km", calcIK("5", 0), 0);

console.log("\n=== 6b. IK Moto ===");
// Barème moto
const motoBands = {
  m12: {t1:{k:0.395,b:0},t2:{k:0.099,b:891},t3:{k:0.248,b:0}},
  m35: {t1:{k:0.468,b:0},t2:{k:0.082,b:1158},t3:{k:0.275,b:0}},
  m6:  {t1:{k:0.606,b:0},t2:{k:0.079,b:1583},t3:{k:0.343,b:0}}
};
function calcIKMoto(key, distance) {
  const band = motoBands[key]; if(!band) return NaN;
  const T1 = 3000, T2 = 6000;
  if(distance <= T1) return distance * band.t1.k + band.t1.b;
  if(distance <= T2) return distance * band.t2.k + band.t2.b;
  return distance * band.t3.k + band.t3.b;
}
// 3-5 CV, 4000 km → 4000 × 0.468 = 1872
assertClose("IK moto 3-5CV 4000km", calcIKMoto("m35", 4000), 4000 * 0.082 + 1158);
// 3-5 CV, 10000 km → 10000 × 0.082 + 1158 = 1978
assertClose("IK moto 3-5CV 10000km", calcIKMoto("m35", 10000), 10000 * 0.275);
// ≥6 CV, 25000 km → 25000 × 0.343 = 8575
assertClose("IK moto >=6CV 25000km", calcIKMoto("m6", 25000), 25000 * 0.343);

assertClose("IK moto 3-5CV 3000km (frontière T1)", calcIKMoto("m35", 3000), 3000 * 0.468);
assertClose("IK moto 3-5CV 3001km (T2)", calcIKMoto("m35", 3001), 3001 * 0.082 + 1158);
assertClose("IK moto 3-5CV 6000km (frontière T2)", calcIKMoto("m35", 6000), 6000 * 0.082 + 1158);
assertClose("IK moto 3-5CV 6001km (T3)", calcIKMoto("m35", 6001), 6001 * 0.275);

console.log("\n=== 6c. IK Cyclomoteur ===");
const cycloBand = {t1:{k:0.315,b:0},t2:{k:0.079,b:711},t3:{k:0.198,b:0}};
function calcIKCyclo(distance) {
  if(distance <= 3000) return distance * cycloBand.t1.k + cycloBand.t1.b;
  if(distance <= 6000) return distance * cycloBand.t2.k + cycloBand.t2.b;
  return distance * cycloBand.t3.k + cycloBand.t3.b;
}
// 2000 km → 2000 × 0.315 = 630
assertClose("IK cyclo 2000km", calcIKCyclo(2000), 630);
// 4000 km → 4000 × 0.079 + 711 = 1027
assertClose("IK cyclo 4000km", calcIKCyclo(4000), 4000 * 0.079 + 711);
// 8000 km → 8000 × 0.198 = 1584
assertClose("IK cyclo 8000km", calcIKCyclo(8000), 8000 * 0.198);

console.log("\n=== 7. Avantage en nature logement ===");
// Brut 1500 € → tranche < 2002.50, 1 pièce = 79.7
assertClose("Logement 1500€ 1p (1 pièce)", calcLogement(1500, 1), 79.7);
assertClose("Logement 1500€ (3 pièces)", calcLogement(1500, 3), 42.6*3);
// Brut 2500 € → tranche [2403, 2803.50[, 1 pièce = 106.2
assertClose("Logement 2500€ 1p (1 pièce)", calcLogement(2500, 1), 106.2);
// Brut 7000 € → tranche ≥ 6007.50, multi = 212.3
assertClose("Logement 7000€ (4 pièces)", calcLogement(7000, 4), 212.3*4);
// Frontière exacte 2002.50 → tranche [2002.50, 2403[
assertClose("Logement 2002.50€ 1p (frontière)", calcLogement(2002.50, 1), 93.0);

console.log("\n=== 7b. Logement — modèle avancé (pièces, semaines, loyer, négligence) ===");
// Cas 1 : tranche 1, 1 pièce, 4 semaines, sans loyer → 79,7
{
  const r = calcLogementAdv(1500, 1, 4, 0, true);
  assertClose("Log adv 1500€ 1p 4sem", r.advantage, 79.7, 0.01);
}
// Cas 2 : tranche 1, 2 pièces, 4 semaines, sans loyer → 2×42,6 = 85,2
{
  const r = calcLogementAdv(1500, 2, 4, 0, true);
  assertClose("Log adv 1500€ 2p 4sem", r.advantage, 85.2, 0.01);
}
// Cas 3 : tranche 1, 2 pièces, 2 semaines → weekly arrondi puis ×2 → 42,6
{
  const r = calcLogementAdv(1500, 2, 2, 0, false);
  assertClose("Log adv 1500€ 2p 2sem", r.advantage, 42.6, 0.01);
}
// Cas 4 : avec loyer 10€ → avantage = 42,6 - 10 = 32,6 (borné à 0)
{
  const r = calcLogementAdv(1500, 2, 2, 10, false);
  assertClose("Log adv 1500€ 2p 2sem loyer10", r.advantage, 32.6, 0.01);
}
// Cas 5 : négligence (mois incomplet 1 semaine, 1 pièce) → avantage négligé
{
  const r = calcLogementAdv(1500, 1, 1, 0, true);
  assertEqual("Log adv négligence active", r.advantage, 0);
}

// =============================================
// BILAN
// =============================================
console.log(`\n${"=".repeat(50)}`);
console.log(`BILAN : ${pass} passés, ${fail} échoués sur ${pass + fail} tests`);
console.log(`${"=".repeat(50)}\n`);
process.exit(fail > 0 ? 1 : 0);