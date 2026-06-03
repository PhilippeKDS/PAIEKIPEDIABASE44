(() => {
  const nf = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmt = (x) => nf.format(x);
  const frame = document.getElementById('sim-frame');
  const tbody = document.getElementById('tests-body');
  const summaryEl = document.getElementById('tests-summary');
  const toastEl = document.getElementById('toast');

  const showToast = (msg) => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toastEl.classList.remove('show'), 2200);
  };

  const toNum = (v) => {
    if (v === '' || v === null || v === undefined) return 0;
    const x = Number(String(v).replace(',', '.'));
    return Number.isFinite(x) ? x : 0;
  };
  const round2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;

  // IMPORTANT: when opened from local files (file://), some browsers treat each file as a distinct
  // origin. Accessing frame.contentDocument can then throw a SecurityError and block test execution.
  // We rely only on the iframe load event (and a small fallback) to detect readiness.
  const waitFrame = () => new Promise((resolve) => {
    if (!frame) return resolve();

    // If we already observed a load event, resolve immediately.
    if (frame.dataset.loaded === '1') return resolve();

    const onLoad = () => {
      frame.dataset.loaded = '1';
      resolve();
    };

    frame.addEventListener('load', onLoad, { once: true });

    // Fallback: if the iframe finished loading before we attached the listener.
    setTimeout(() => {
      try {
        if (frame.contentWindow && frame.contentWindow.document && frame.contentWindow.document.readyState === 'complete') {
          frame.dataset.loaded = '1';
          resolve();
        }
      } catch {
        // Cross-origin (file://) access: ignore and rely on the load event.
      }
    }, 50);

    // Hard timeout: if the iframe is blocked (common in file:// contexts), we don't hang forever.
    setTimeout(() => resolve(), 2000);
  });

  const send = (type, payload = {}) => {
    const requestId = Math.random().toString(36).slice(2);
    return new Promise((resolve, reject) => {
      if (!frame || !frame.contentWindow) {
        return reject(new Error("Iframe simulateur indisponible"));
      }
      const onMsg = (ev) => {
        const d = ev.data;
        if (!d || d.requestId !== requestId) return;
        window.removeEventListener('message', onMsg);
        if (d.type === 'MNS_ERROR') reject(new Error(d.message || 'Erreur'));
        else resolve(d);
      };
      window.addEventListener('message', onMsg);
      try {
        frame.contentWindow.postMessage({ type, requestId, ...payload }, '*');
      } catch (e) {
        window.removeEventListener('message', onMsg);
        return reject(e);
      }
      setTimeout(() => {
        window.removeEventListener('message', onMsg);
        reject(new Error('Timeout'));
      }, 8000);
    });
  };

  const calcExpected = (state) => {
    const taux = 2.9 / 100;
    const caseMode = state['case-toggle'] || 'standard';
    const rnfB = toNum(state.netimpo) + toNum(state['rnf-regul']);
    const pasB = toNum(state['pas-98960']) + toNum(state['pas-98970']);
    const pniB = toNum(state['pni-98941']) - toNum(state['pni-98911']);
    const induB = toNum(state.indu);
    const hsB = toNum(state['hs-exo']);
    const mutB = toNum(state['mutuelles-pp']);
    const abB = toNum(state['abondements-epargne']);
    const assCsgB = toNum(state['assiette-csg']);
    const ppvB = toNum(state['ppv-placee']);
    const ijss = Math.max(0, toNum(state['ijss-net']));

    const primes = state.primes || {};
    const primesB = Object.values(primes).reduce((s, v) => s + toNum(v), 0);

    const inter = assCsgB - ppvB - abB;
    const dedCsg = Math.max(0, inter) * taux;
    const socle = (caseMode === 'exception') ? (rnfB + induB) : (pasB + pniB);
    const ajouts = primesB + hsB;

    return round2(socle + ajouts + ijss - mutB - dedCsg);
  };

  const buildTests = () => {
    const tests = [
      {
        name: 'Cas général — socle seul',
        state: {
          'case-toggle': 'standard',
          'pas-98960': '1000',
          'pas-98970': '0',
          'pni-98941': '100',
          'pni-98911': '0',
          primes: {},
          'hs-exo': '0',
          'mutuelles-pp': '0',
          'abondements-epargne': '0',
          'assiette-csg': '0',
          'ppv-placee': '0',
          'ijss-net': '0'
        }
      },
      {
        name: 'Cas général — primes + HS + mutuelle',
        state: {
          'case-toggle': 'standard',
          'pas-98960': '1200',
          'pas-98970': '0',
          'pni-98941': '0',
          'pni-98911': '0',
          primes: { '002': '200' },
          'hs-exo': '50',
          'mutuelles-pp': '30',
          'abondements-epargne': '0',
          'assiette-csg': '0',
          'ppv-placee': '0',
          'ijss-net': '0'
        }
      },
      {
        name: 'Cas général — CSG non déductible (assiette)',
        state: {
          'case-toggle': 'standard',
          'pas-98960': '1500',
          'pas-98970': '0',
          'pni-98941': '0',
          'pni-98911': '0',
          primes: {},
          'hs-exo': '0',
          'mutuelles-pp': '0',
          'abondements-epargne': '0',
          'assiette-csg': '1000',
          'ppv-placee': '0',
          'ijss-net': '0'
        }
      },
      {
        name: 'Cas particulier — RNF + Indu (socle)',
        state: {
          'case-toggle': 'exception',
          netimpo: '900',
          'rnf-regul': '100',
          indu: '20',
          primes: {},
          'hs-exo': '0',
          'mutuelles-pp': '0',
          'abondements-epargne': '0',
          'assiette-csg': '0',
          'ppv-placee': '0',
          'ijss-net': '0'
        }
      },
      {
        name: 'Cas particulier — RNF + primes + IJSS',
        state: {
          'case-toggle': 'exception',
          netimpo: '500',
          'rnf-regul': '0',
          indu: '0',
          primes: { '002': '120' },
          'hs-exo': '0',
          'mutuelles-pp': '10',
          'abondements-epargne': '0',
          'assiette-csg': '0',
          'ppv-placee': '0',
          'ijss-net': '80'
        }
      },
      {
        name: 'Alerte — écart volontairement > 20%',
        state: {
          'case-toggle': 'standard',
          'mns-bulletin': '500',
          'pas-98960': '1000',
          'pas-98970': '0',
          'pni-98941': '0',
          'pni-98911': '0',
          primes: {},
          'hs-exo': '0',
          'mutuelles-pp': '0',
          'abondements-epargne': '0',
          'assiette-csg': '0',
          'ppv-placee': '0',
          'ijss-net': '0'
        },
        expectStatusContains: 'Alerte'
      }
    ];

    const defaults = {
      'case-toggle': 'standard',
      'mns-bulletin': '',
      netimpo: '',
      'rnf-regul': '',
      'pas-98960': '',
      'pas-98970': '',
      'pni-98941': '',
      'pni-98911': '',
      indu: '',
      primes: {},
      'hs-exo': '0',
      'mutuelles-pp': '0',
      'abondements-epargne': '0',
      'assiette-csg': '0',
      'ppv-placee': '0',
      'ijss-net': '0'
    };

    return tests.map(t => ({
      ...t,
      state: { ...defaults, ...t.state, primes: t.state.primes || {} }
    }));
  };

  const renderRow = (ok, name, expected, obtained, delta, status) => {
    const icon = ok ? '✅' : '❌';
    return `
      <tr>
        <td>${icon}</td>
        <td>${name}</td>
        <td class="right mono">${expected}</td>
        <td class="right mono">${obtained}</td>
        <td class="right mono">${delta}</td>
        <td>Statut: <b>${status || '—'}</b></td>
      </tr>
    `;
  };

  const runAll = async () => {
    try {
      tbody.innerHTML = '';
      summaryEl.textContent = '';
      showToast('Exécution des tests…');

      await waitFrame();

      if (!frame || frame.dataset.loaded !== '1') {
        throw new Error("Le simulateur n’a pas pu être chargé dans l’iframe (blocage navigateur en local)." );
      }

      // Petit ping/retard pour laisser le simulateur initialiser ses handlers de message.
      await new Promise(r => setTimeout(r, 50));

      await send('MNS_SET_PARAMS', { params: { threshold: 20, tauxCsg: 2.9 } });

      const tests = buildTests();
      let pass = 0;

    const report = [];
    report.push(`Rapport de tests — MNS (KDS)`);
    report.push(`Date: ${new Date().toLocaleString('fr-FR')}`);
    report.push(`Paramètres forcés: seuil=20% ; taux CSG=2,9%`);
    report.push('');

      for (const t of tests) {
        const expectedValue = calcExpected(t.state);
        if (!t.state['mns-bulletin'] && !t.expectStatusContains) t.state['mns-bulletin'] = String(expectedValue);

        await send('MNS_APPLY_STATE', { state: t.state });
        const res = await send('MNS_GET_RESULTS');
        const results = res.results || {};

      const obtainedValue = Number.isFinite(results.mns_calcule) ? results.mns_calcule : NaN;
      const delta = Number.isFinite(obtainedValue) ? round2(obtainedValue - expectedValue) : NaN;

      const okValue = Number.isFinite(obtainedValue) && Math.abs(delta) <= 0.01;
      const status = String(results.status || '');
      const okStatus = t.expectStatusContains ? status.includes(t.expectStatusContains) : status.includes('OK');

      const ok = okValue && okStatus;
      if (ok) pass += 1;

      tbody.insertAdjacentHTML('beforeend', renderRow(
        ok,
        t.name,
        fmt(expectedValue),
        Number.isFinite(obtainedValue) ? fmt(obtainedValue) : '—',
        Number.isFinite(delta) ? fmt(delta) : '—',
        status
      ));

      report.push(`${ok ? 'OK' : 'KO'} — ${t.name}`);
      report.push(`  attendu: ${fmt(expectedValue)} ; obtenu: ${Number.isFinite(obtainedValue) ? fmt(obtainedValue) : '—'} ; delta: ${Number.isFinite(delta) ? fmt(delta) : '—'}`);
      report.push(`  statut: ${status || '—'}`);
        report.push('');
      }

      const total = tests.length;
      summaryEl.innerHTML = `<b>${pass}/${total}</b> tests réussis.`;
      showToast(`Tests terminés : ${pass}/${total}`);

      window.__lastTestReport = report.join('\n');
    } catch (e) {
      console.error(e);
      const msg = String(e?.message || e);
      showToast('Erreur tests');
      if (summaryEl) {
        summaryEl.innerHTML = `❌ <b>Impossible d’exécuter les tests</b> — ${msg}.<br>
        Conseil : lancez le simulateur via une URL (http/https). En local (file://), certains navigateurs restreignent les iframes.`;
      }
    }
  };

  const copyReport = async () => {
    const txt = window.__lastTestReport;
    if (!txt) return showToast('Exécutez les tests avant de copier le rapport.');
    try {
      await navigator.clipboard.writeText(txt);
      showToast('Rapport copié');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = txt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      showToast('Rapport copié');
    }
  };

  const bind = () => {
    const btnRun = document.getElementById('btn-run-tests');
    if (btnRun) btnRun.addEventListener('click', runAll);
    const btnCopy = document.getElementById('btn-copy-report');
    if (btnCopy) btnCopy.addEventListener('click', copyReport);
  };

  bind();
})();
