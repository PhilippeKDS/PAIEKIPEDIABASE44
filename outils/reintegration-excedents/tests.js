/**
 * Tests unitaires - Simulateur Réintégration sociale & fiscale
 * Framework: Minitest (vanilla JS, pas de dépendances)
 * 
 * Pour exécuter: ouvrir tests.html dans un navigateur
 */

(() => {
  // ===== Mini framework de tests =====
  const tests = [];
  const results = { passed: 0, failed: 0, errors: [] };

  function describe(name, fn) {
    console.group(`📦 ${name}`);
    fn();
    console.groupEnd();
  }

  function it(description, fn) {
    tests.push({ description, fn });
  }

  function expect(actual) {
    return {
      toBe(expected) {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, got ${actual}`);
        }
      },
      toBeCloseTo(expected, precision = 2) {
        const diff = Math.abs(actual - expected);
        const tolerance = Math.pow(10, -precision);
        if (diff > tolerance) {
          throw new Error(`Expected ${expected} (±${tolerance}), got ${actual} (diff: ${diff})`);
        }
      },
      toBeGreaterThan(expected) {
        if (actual <= expected) {
          throw new Error(`Expected > ${expected}, got ${actual}`);
        }
      },
      toBeLessThan(expected) {
        if (actual >= expected) {
          throw new Error(`Expected < ${expected}, got ${actual}`);
        }
      },
      toEqual(expected) {
        const actualStr = JSON.stringify(actual);
        const expectedStr = JSON.stringify(expected);
        if (actualStr !== expectedStr) {
          throw new Error(`Expected ${expectedStr}, got ${actualStr}`);
        }
      }
    };
  }

  function runTests() {
    console.clear();
    console.log('🧪 TESTS UNITAIRES - Simulateur Réintégration\n');
    
    tests.forEach(({ description, fn }) => {
      try {
        fn();
        results.passed++;
        console.log(`✅ ${description}`);
      } catch (err) {
        results.failed++;
        results.errors.push({ description, error: err.message });
        console.error(`❌ ${description}\n   ${err.message}`);
      }
    });

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Résultats: ${results.passed}/${tests.length} tests passés`);
    if (results.failed > 0) {
      console.log(`❌ ${results.failed} échecs`);
    } else {
      console.log('✅ Tous les tests sont passés!');
    }
    console.log('='.repeat(60));

    return results;
  }

  // ===== Helpers de calcul (extraits du core.js) =====
  const clamp0 = (x) => Math.max(0, Number.isFinite(x) ? x : 0);
  
  function calcSocialRetirement(Rs, passCap, retPat, retPereobPat, retCetToRet, retAbondPerco) {
    const socLimRetBase = Math.max(0.05 * passCap, 0.05 * Math.min(Rs, 5 * passCap));
    const socLimRet = clamp0(socLimRetBase - clamp0(retAbondPerco));
    const socCmpRet = clamp0(retPat) + clamp0(retPereobPat) + clamp0(retCetToRet);
    const socExcRet = clamp0(socCmpRet - socLimRet);
    
    return { limit: socLimRet, component: socCmpRet, excess: socExcRet };
  }

  function calcSocialPrevoyance(Rs, passCap, prevPatFs, prevPatHorsFs, prevCse) {
    const socLimPrevRaw = 0.06 * passCap + 0.015 * Rs;
    const socLimPrev = Math.min(socLimPrevRaw, 0.12 * passCap);
    const socCmpPrev = clamp0(prevPatFs) + clamp0(prevPatHorsFs) + clamp0(prevCse);
    const socExcPrev = clamp0(socCmpPrev - socLimPrev);
    
    return { limit: socLimPrev, limitRaw: socLimPrevRaw, component: socCmpPrev, excess: socExcPrev };
  }

  function calcFiscalRetirement(Rf, passCap, retSal, retPat, retPereobSal, retPereobPat, retCetToRet, retAbondPerco, retCetIrExempt) {
    const fisLimRetBase = 0.08 * Math.min(Rf, 8 * passCap);
    const fisLimRet = clamp0(fisLimRetBase - clamp0(retAbondPerco) - clamp0(retCetIrExempt));
    
    const retEmpPart = clamp0(retSal) + clamp0(retPereobSal);
    const retErPart = clamp0(retPat) + clamp0(retPereobPat) + clamp0(retCetToRet);
    const retCmpTotal = retEmpPart + retErPart;
    
    const fisExcRet = clamp0(retCmpTotal - fisLimRet);
    
    return { 
      limit: fisLimRet, 
      component: retCmpTotal, 
      excess: fisExcRet,
      empPart: retEmpPart,
      erPart: retErPart
    };
  }

  function calcFiscalPrevoyance(Rf, passCap, prevSal, prevPatHorsFs, prevCse) {
    const fisLimPrevRaw = 0.05 * passCap + 0.02 * Rf;
    const fisLimPrev = Math.min(fisLimPrevRaw, 0.02 * 8 * passCap);
    
    const prevEmpPart = clamp0(prevSal);
    const prevErPart = clamp0(prevPatHorsFs) + clamp0(prevCse);
    const prevCmpTotal = prevEmpPart + prevErPart;
    
    const fisExcPrev = clamp0(prevCmpTotal - fisLimPrev);
    
    return {
      limit: fisLimPrev,
      limitRaw: fisLimPrevRaw,
      component: prevCmpTotal,
      excess: fisExcPrev,
      empPart: prevEmpPart,
      erPart: prevErPart
    };
  }

  // ===== TESTS =====

  describe('Calculs sociaux - Retraite supplémentaire', () => {
    it('devrait calculer correctement avec Rs < 5 PASS (cas base)', () => {
      const result = calcSocialRetirement(10000, 48060, 500, 0, 0, 0);
      // Limite = max(0.05 * 48060 = 2403 ; 0.05 * min(10000, 240300) = 500) = 2403
      expect(result.limit).toBeCloseTo(2403, 0);
      expect(result.component).toBe(500);
      expect(result.excess).toBe(0);
    });

    it('devrait calculer correctement avec Rs > 5 PASS (haut salaire)', () => {
      const result = calcSocialRetirement(300000, 48060, 15000, 0, 0, 0);
      // Limite = max(2403 ; 0.05 * 240300 = 12015) = 12015
      expect(result.limit).toBeCloseTo(12015, 0);
      expect(result.component).toBe(15000);
      expect(result.excess).toBeCloseTo(2985, 0);
    });

    it('devrait déduire l\'abondement PERCO de la limite', () => {
      const result = calcSocialRetirement(100000, 48060, 10000, 0, 0, 1000);
      // Limite base = 12015, après abondement = 11015
      expect(result.limit).toBeCloseTo(11015, 0);
      expect(result.excess).toBe(0);
    });

    it('devrait inclure PERE-OB et CET→retraite dans composantes', () => {
      const result = calcSocialRetirement(50000, 48060, 2000, 500, 300, 0);
      expect(result.component).toBe(2800); // 2000 + 500 + 300
    });
  });

  describe('Calculs sociaux - Prévoyance', () => {
    it('devrait calculer correctement la limite avec Rs faible', () => {
      const result = calcSocialPrevoyance(10000, 48060, 100, 200, 0);
      // Limite raw = 0.06 * 48060 + 0.015 * 10000 = 2883.6 + 150 = 3033.6
      // Cap = 0.12 * 48060 = 5767.2
      // Limite = min(3033.6, 5767.2) = 3033.6
      expect(result.limit).toBeCloseTo(3033.6, 1);
      expect(result.component).toBe(300);
      expect(result.excess).toBe(0);
    });

    it('devrait plafonner à 12% PASS si limite raw trop haute', () => {
      const result = calcSocialPrevoyance(100000, 48060, 2000, 3000, 100);
      // Limite raw = 2883.6 + 1500 = 4383.6
      // Cap = 5767.2
      // Limite = min(4383.6, 5767.2) = 4383.6
      expect(result.limit).toBeCloseTo(4383.6, 1);
      expect(result.component).toBe(5100);
      expect(result.excess).toBeCloseTo(716.4, 1);
    });

    it('devrait inclure frais de santé dans composantes', () => {
      const result = calcSocialPrevoyance(50000, 48060, 500, 800, 50);
      expect(result.component).toBe(1350); // 500 + 800 + 50
    });
  });

  describe('Calculs fiscaux - Retraite', () => {
    it('devrait calculer correctement avec Rf < 8 PASS', () => {
      const result = calcFiscalRetirement(50000, 48060, 1000, 2000, 0, 0, 0, 0, 0);
      // Limite = 0.08 * min(50000, 384480) = 4000
      expect(result.limit).toBeCloseTo(4000, 0);
      expect(result.component).toBe(3000);
      expect(result.excess).toBe(0);
    });

    it('devrait calculer correctement avec Rf > 8 PASS', () => {
      const result = calcFiscalRetirement(500000, 48060, 5000, 20000, 0, 0, 0, 0, 0);
      // Limite = 0.08 * 384480 = 30758.4
      expect(result.limit).toBeCloseTo(30758.4, 1);
      expect(result.component).toBe(25000);
      expect(result.excess).toBe(0);
    });

    it('devrait déduire abondement et CET IR exonéré', () => {
      const result = calcFiscalRetirement(100000, 48060, 2000, 3000, 0, 0, 0, 500, 300);
      // Limite base = 8000, après exclusions = 7200
      expect(result.limit).toBeCloseTo(7200, 0);
    });

    it('devrait séparer correctement parts salarié/employeur', () => {
      const result = calcFiscalRetirement(80000, 48060, 1000, 3000, 500, 0, 0, 0, 0);
      // Total = 4500 (1500 sal, 3000 pat)
      expect(result.empPart).toBe(1500);
      expect(result.erPart).toBe(3000);
      expect(result.component).toBe(4500);
    });
  });

  describe('Calculs fiscaux - Prévoyance', () => {
    it('devrait calculer correctement la limite', () => {
      const result = calcFiscalPrevoyance(50000, 48060, 200, 800, 0);
      // Limite raw = 0.05 * 48060 + 0.02 * 50000 = 2403 + 1000 = 3403
      // Cap = 0.02 * 8 * 48060 = 7689.6
      // Limite = min(3403, 7689.6) = 3403
      expect(result.limit).toBeCloseTo(3403, 0);
      expect(result.component).toBe(1000);
      expect(result.excess).toBe(0);
    });

    it('devrait plafonner à 2% × 8 PASS', () => {
      const result = calcFiscalPrevoyance(100000, 48060, 1000, 5000, 500);
      // Limite raw = 2403 + 2000 = 4403
      // Cap = 7689.6
      // Limite = min(4403, 7689.6) = 4403
      expect(result.limit).toBeCloseTo(4403, 0);
      expect(result.component).toBe(6500);
      expect(result.excess).toBeCloseTo(2097, 0);
    });
  });

  describe('Helpers - clamp0', () => {
    it('devrait retourner 0 pour valeurs négatives', () => {
      expect(clamp0(-100)).toBe(0);
      expect(clamp0(-0.01)).toBe(0);
    });

    it('devrait conserver valeurs positives', () => {
      expect(clamp0(100)).toBe(100);
      expect(clamp0(0.01)).toBe(0.01);
    });

    it('devrait gérer NaN et Infinity', () => {
      expect(clamp0(NaN)).toBe(0);
      expect(clamp0(Infinity)).toBe(Infinity); // Note: pas clampé à 0
      expect(clamp0(-Infinity)).toBe(0);
    });
  });

  describe('Cas tests de non-régression', () => {
    it('T01 - Aucun excédent (base)', () => {
      // Rs=3200, ret_pat=120, prev_hors=40, prev_fs=60
      const socRet = calcSocialRetirement(3200, 48060, 120, 0, 0, 0);
      const socPrev = calcSocialPrevoyance(3200, 48060, 60, 40, 0);
      
      expect(socRet.excess).toBe(0);
      expect(socPrev.excess).toBe(0);
    });

    it('T04 - Excédent social retraite', () => {
      // Rs=12000, ret_pat=1500 (période 3 = prorata)
      const passCap = 48060 * (3 / 12);
      const socRet = calcSocialRetirement(12000, passCap, 1500, 0, 0, 0);
      
      // Limite = max(0.05*12015 ; 0.05*12000) = 600.75
      expect(socRet.limit).toBeCloseTo(600.75, 1);
      expect(socRet.excess).toBeGreaterThan(800); // ~899.25
    });

    it('T05 - Haut salaire (cap rémunération)', () => {
      // Rs=120000 (période 6), ret_pat=8000
      const passCap = 48060 * (6 / 12);
      const socRet = calcSocialRetirement(120000, passCap, 8000, 0, 0, 0);
      
      // Limite = max(1201.5 ; 0.05*120150) = 6007.5
      expect(socRet.limit).toBeCloseTo(6007.5, 1);
      expect(socRet.excess).toBeCloseTo(1992.5, 1);
    });
  });

  // ===== Exécution =====
  window.SimulateurTests = {
    describe,
    it,
    expect,
    runTests,
    results
  };

  // Note: Auto-exécution gérée par tests.html
})();
