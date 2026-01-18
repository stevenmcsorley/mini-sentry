    // --- Utilities ---
    const el = (id) => document.getElementById(id);
    const log = (msg) => { const d = new Date().toISOString().split('T')[1].replace('Z',''); el('log').insertAdjacentHTML('afterbegin', `<div>[${d}] ${msg}</div>`); };
    const byQuery = new URLSearchParams(location.search);
    const defaultBase = byQuery.get('api') || 'http://localhost:8000';
    el('baseUrl').value = defaultBase;

    let ms = null; // Mini Sentry client
    let dripTimer = null;
    let rapidTimer = null;
    let sent = 0;

    function setStatus(txt) { el('status').textContent = txt; }
    function updateCounts() { el('counts').textContent = `Errors triggered: ${sent}`; }

    // --- Initialise Mini Sentry ---
    el('initBtn').addEventListener('click', () => {
      const baseUrl = el('baseUrl').value.trim() || defaultBase;
      const token = el('token').value.trim();
      const app = el('appName').value.trim() || 'error-storm';
      const environment = el('env').value;
      const release = el('release').value.trim() || 'demo-1.0.0';

      ms = window.MiniSentry.init({ token, baseUrl, app, environment, release });
      setStatus(`initialised → ${baseUrl}`);
      log(`MiniSentry.init → baseUrl=${baseUrl}, env=${environment}, app=${app}`);

      // Label this page-load with a message
      try { ms.captureMessage('Error Storm demo loaded', { level: 'info', app, environment }); } catch {}
    });

    // --- Manual signals ---
    el('msgBtn').addEventListener('click', () => {
      if (!ms) return alert('Init Mini Sentry first');
      ms.captureMessage('Hello from captureMessage()', { level: 'info', foo: 'bar', ts: Date.now() });
      log('captureMessage sent');
    });

    el('handledBtn').addEventListener('click', () => {
      if (!ms) return alert('Init Mini Sentry first');
      try { throw new Error('Handled error via captureException()'); } catch (e) { ms.captureException(e, { handled: true }); }
      log('captureException sent (handled)');
      sent++; updateCounts();
    });

    el('okBtn').addEventListener('click', () => { if (ms) { ms.sendSession('ok'); log("sendSession('ok')"); } });
    el('crashBtn').addEventListener('click', () => { if (ms) { ms.sendSession('crashed'); log("sendSession('crashed')"); } });

    el('rejectBtn').addEventListener('click', () => {
      // Deliberate unhandled rejection (captured by client)
      Promise.reject(new Error('Deliberate unhandled promise rejection'));
      log('Triggered unhandled rejection');
      sent++; updateCounts();
    });

    // --- A library of intentional error triggers ---
    const circular = {}; circular.me = circular; // for JSON.stringify circular

    const errorMakers = [
      () => nonExistentVariable++,
      () => null.f(),
      () => { throw new Error('Manual thrown Error'); },
      () => { throw new TypeError('Manual TypeError'); },
      () => { throw new RangeError('Manual RangeError'); },
      () => JSON.parse('not-json'),
      () => decodeURI('%'),
      () => decodeURIComponent('%'),
      () => atob('%%%'),
      () => eval('function(){'), // SyntaxError
      () => { new Array(-1); }, // RangeError
      () => { (1).toFixed(1000); }, // RangeError
      () => { new URL('ht!tp:bad'); }, // TypeError
      () => { structuredClone(window); }, // DataCloneError DOMException
      () => { JSON.stringify(circular); }, // TypeError (circular)
      () => { const o = {}; Object.defineProperty(o, 'x', { get: 'not-a-fn' }); },
      () => { new Proxy({}, { get: 'not-a-fn' }); },
      () => { Reflect.defineProperty({}, 'x', 'not-a-desc'); },
      () => { [].reduce(() => {}); }, // TypeError on empty reduce
      () => { Array.prototype.sort.call(null); },
      () => { document.body.appendChild(null); },
      () => { Intl.DateTimeFormat('xx-YY'); }, // RangeError
      () => { Intl.NumberFormat('nope-LOCALE'); }, // RangeError
      () => { performance.measure('bad', 'mark-does-not-exist'); },
      () => { throw new SyntaxError('Manual SyntaxError'); },
      () => { throw new URIError('Manual URIError'); },
      () => { throw new EvalError('Manual EvalError'); },
      () => { setTimeout(() => { throw new Error('Async setTimeout throw'); }); },
      () => { Promise.any([Promise.reject(new Error('a')), Promise.reject(new Error('b'))]); }, // AggregateError (async)
      () => { Promise.resolve().then(() => { throw new Error('Async microtask throw'); }); },
      () => { new RegExp('('); }, // RegExp SyntaxError
      () => { const f = function recurse(){ return recurse(); }; f(); }, // Max call stack
      () => { const a = new ArrayBuffer(-1); },
      () => { const x = window['nopeFunction'](); },
      () => { const u = new URLSearchParams(new Proxy({}, { get(){ throw new Error('proxy get boom'); } })); },
      () => { decodeURI('%E0%A4%A'); },
      () => { throw new DOMException('Manual DOMException', 'OperationError'); },
      () => { crypto.subtle.digest('MD5', new Uint8Array([1,2,3])); }, // will reject async
      () => { fetch('https://invalid.invalid/does-not-exist'); }, // network error (async)
      () => { const c = document.createElement('canvas'); c.getContext('webgl2').getExtension('nope'); }, // likely null then error
      () => { history.pushState(window, '', '?bad=1'); }, // DataCloneError in many browsers
      () => { new Intl.Collator('bad-locale'); },
      () => { const d = new Date('not a date'); d.toISOString(); },
      () => { const m = new Map(); m.set({}, 'a'); m.get(123).toString(); }, // undefined.toString
      () => { const s = new Set(); s.add(1); s.forEach((v) => { throw new Error('Set foreach throw'); }); },
      () => { const a = new Int8Array(2); a.set([1,2,3]); }, // RangeError
      () => { const f = new FileReader(); f.readAsText(undefined); }, // TypeError
      () => { const a = document.querySelector('#does-not-exist').remove(); }, // cannot read prop of null
      () => { const b = new Blob(new Array(2**31)); }, // RangeError in most engines (size too large)
    ];

    // Ensure we have at least ~50 by repeating the list if necessary
    function makePlan(n = 50) {
      const seq = [];
      while (seq.length < n) seq.push(...errorMakers);
      return seq.slice(0, n);
    }

    // Fire a burst of 50 errors spaced slightly to avoid hard lock-ups
    el('burstBtn').addEventListener('click', () => {
      const plan = makePlan(50);
      let i = 0;
      const tick = () => {
        if (i >= plan.length) { log('🔥 Burst complete'); return; }
        // Create a numbered error to track which ones come through
        const errorNum = i + 1;
        const originalError = plan[i++];
        try { 
          
          // For async errors, we'll just send a captureMessage with the number
          if (ms) {
            ms.captureMessage(`Burst Error #${errorNum}: Triggered async error`, { 
              level: 'error', 
              extra: { burstNumber: errorNum, errorType: 'burst' } 
            });
          }
          
          // Still trigger the original error for browser console
          originalError();
          sent++; 
          updateCounts(); 
        }
        catch (e) { 
          // For sync errors, modify the message and send via captureException
          if (ms) {
            e.message = `Burst Error #${errorNum}: ${e.message}`;
            ms.captureException(e, { extra: { burstNumber: errorNum, errorType: 'burst' } });
          }
          sent++; 
          updateCounts(); 
          log(`Caught sync error #${errorNum}: ` + (e && e.message)); 
        }
        setTimeout(tick, 120); // gentle pacing
      };
      log('Starting 50-error burst…');
      tick();
    });

    function stopRapidFire() {
      if (rapidTimer) {
        clearInterval(rapidTimer);
        rapidTimer = null;
      }
      const btn = el('rapidBtn');
      if (btn) btn.disabled = false;
      log('Rapid fire stopped');
    }

    // Rapid fire: configurable errors as fast as possible without freezing the page
    el('rapidBtn').addEventListener('click', () => {
      if (!ms) return alert('Init Mini Sentry first');
      if (rapidTimer) return;
      const btn = el('rapidBtn');
      btn.disabled = true;
      const count = Math.max(10, Math.min(2000, parseInt(el('rapidCount').value, 10) || 200));
      const intervalMs = Math.max(1, Math.min(200, parseInt(el('rapidInterval').value, 10) || 10));
      const plan = makePlan(count);
      let i = 0;
      log(`Rapid fire started (${count} @ ${intervalMs}ms)…`);
      rapidTimer = setInterval(() => {
        if (i >= plan.length) {
          clearInterval(rapidTimer);
          rapidTimer = null;
          btn.disabled = false;
          log('⚡ Rapid fire complete');
          return;
        }
        const errorNum = i + 1;
        const originalError = plan[i++];
        try {
          if (ms) {
            ms.captureMessage(`Rapid Error #${errorNum}: Triggered async error`, {
              level: 'error',
              extra: { burstNumber: errorNum, errorType: 'rapid' }
            });
          }
          originalError();
          sent++;
          updateCounts();
        } catch (e) {
          if (ms) {
            e.message = `Rapid Error #${errorNum}: ${e.message}`;
            ms.captureException(e, { extra: { burstNumber: errorNum, errorType: 'rapid' } });
          }
          sent++;
          updateCounts();
          log(`Caught sync error #${errorNum}: ` + (e && e.message));
        }
      }, intervalMs);
    });

    el('rapidStopBtn').addEventListener('click', () => {
      stopRapidFire();
    });

    // Slow-drip (1 per second)
    el('dripBtn').addEventListener('click', () => {
      if (dripTimer) return; // already running
      const plan = makePlan(9999);
      let i = 0;
      dripTimer = setInterval(() => {
        try { plan[i++ % plan.length](); sent++; updateCounts(); }
        catch (e) { sent++; updateCounts(); log('Caught sync error: ' + (e && e.message)); }
      }, 1000);
      log('Slow-drip started');
    });

    el('stopBtn').addEventListener('click', () => {
      clearInterval(dripTimer); dripTimer = null; log('Slow-drip stopped');
    });

    // Immediate throw (sync)
    el('throwBtn').addEventListener('click', () => {
      throw new Error('Immediate throw from button');
    });

    updateCounts();
