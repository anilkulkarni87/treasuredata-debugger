// panel.js — clean, single-definition, MV3-safe

import { defaultExtractors } from './parsers.js';
const $ = (id) => document.getElementById(id);

// ---------- helpers ----------
function isJsonLike(ct) {
  if (!ct) return false;
  const v = ct.toLowerCase();
  return v.includes('application/json') || v.includes('text/json') || /\+json\b/.test(v);
}
function maskAuthorization(v) {
  if (!v || typeof v !== 'string') return v;
  const parts = v.split(/\s+/);
  if (parts.length < 2) return '****';
  const scheme = parts[0];
  const token = parts.slice(1).join(' ');
  const vis = token.slice(0, 8);
  return `${scheme} ${vis}… (masked)`;
}

// define-once guard to avoid “already declared” if file ever gets injected twice
if (!window.__td_isPreflight) {
  window.__td_isPreflight = function (req) {
    const method = req.request && req.request.method;
    if (method !== 'OPTIONS') return false;
    const hdrs = (req.request && req.request.headers) || [];
    return hdrs.some((h) => ((h.name || '').toLowerCase() === 'access-control-request-method'));
  };
}
const isPreflight = window.__td_isPreflight;

// ---------- state ----------
const state = {
  hosts: ['in.treasuredata.com'],
  showNonTD: false,
  showPreflight: false,
  counter: 0,
  entries: []
};

let extractors = [...defaultExtractors];

async function loadCustomExtractors() {
  try {
    const mod = await import(chrome.runtime.getURL('custom-extractors.js'));
    const extra = (mod && (mod.default || mod.extractors)) || [];
    if (Array.isArray(extra) && extra.length) extractors = [...extra, ...extractors];
  } catch {}
}

function isTDRequest(url) {
  try {
    const u = new URL(url);
    return state.hosts.some((h) => u.host.endsWith(h));
  } catch {
    return false;
  }
}
function extractTDInfo(url, headersList) {
  const out = {};
  try {
    const u = new URL(url);
    out.host = u.host;
    out.pathname = u.pathname || '';
    out.query = Object.fromEntries(u.searchParams.entries());
    const parts = out.pathname.replace(/^\/+/, '').split('/');
    if (parts.length >= 2) {
      out.database = parts[0];
      out.table = parts[1];
    }
    const hp = out.host.split('.');
    if (hp.length >= 4) {
      out.region = hp[0];
      out.edge = hp[1];
    }
    if (Array.isArray(headersList)) {
      const headers = {};
      for (const h of headersList) {
        const name = (h.name || '').toLowerCase();
        if (name === 'content-type' || name === 'accept' || name === 'origin' || name.startsWith('sec-ch-ua')) {
          headers[name] = h.value;
        }
        if (name === 'authorization') headers[name] = maskAuthorization(h.value);
      }
      if (Object.keys(headers).length) out.headers = headers;
    }
  } catch {}
  return out;
}
function mergeParsed(a, b) {
  if (!a) return b;
  if (!b) return a;
  if (typeof a === 'object' && typeof b === 'object') return { ...a, ...b };
  return a;
}

// ---------- prefs / redaction ----------
function loadPrefs() {
  chrome.storage.sync.get(['tdHosts', 'showNonTD', 'tdFilter', 'tdRedact', 'showPreflight'], (res) => {
    if (Array.isArray(res.tdHosts) && res.tdHosts.length) state.hosts = res.tdHosts;
    if (typeof res.showNonTD === 'boolean') state.showNonTD = res.showNonTD;
    state.showPreflight = !!res.showPreflight;

    const hostsInput = $('hosts'); if (hostsInput) hostsInput.value = state.hosts.join(', ');
    const nonTD = $('showNonTD'); if (nonTD) nonTD.checked = state.showNonTD;
    const pre = $('showPreflight'); if (pre) pre.checked = state.showPreflight;
    const filt = $('filter'); if (filt) filt.value = (res.tdFilter || '');
    const red = $('redact'); if (red) red.checked = !!res.tdRedact;
  });
}
function savePrefs() {
  const hostsInput = $('hosts');
  const nonTD = $('showNonTD');
  const pre = $('showPreflight');
  const filt = $('filter');
  const red = $('redact');

  const hosts = hostsInput ? hostsInput.value.split(',').map((h) => h.trim()).filter(Boolean) : [];
  state.hosts = hosts.length ? hosts : ['in.treasuredata.com'];
  state.showNonTD = !!(nonTD && nonTD.checked);
  state.showPreflight = !!(pre && pre.checked);

  chrome.storage.sync.set({
    tdHosts: state.hosts,
    showNonTD: state.showNonTD,
    showPreflight: state.showPreflight,
    tdFilter: (filt ? filt.value : ''),
    tdRedact: !!(red && red.checked)
  });
}

function getBuiltInPatterns() {
  return [
    { re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, sub: '***@***' },
    { re: /\b([A-F0-9]{32,}|[A-Za-z0-9_\-]{24,})\b/g, sub: '****' }
  ];
}
function loadRedactionRules() {
  return new Promise((resolve) =>
    chrome.storage.sync.get(['redactionRules'], (res) => {
      const lines = Array.isArray(res.redactionRules) ? res.redactionRules : [];
      const compiled = [];
      for (const line of lines) {
        const s = String(line || '').trim();
        if (!s) continue;
        try { compiled.push({ re: new RegExp(s, 'g'), sub: '****' }); } catch {}
      }
      resolve(compiled);
    })
  );
}
async function redactPII(obj) {
  const custom = await loadRedactionRules();
  const patterns = [...getBuiltInPatterns(), ...custom];
  function rec(x) {
    if (Array.isArray(x)) return x.map(rec);
    if (x && typeof x === 'object') {
      const o = {};
      for (const k of Object.keys(x)) o[k] = rec(x[k]);
      return o;
    }
    if (typeof x === 'string') {
      let s = x;
      for (const p of patterns) s = s.replace(p.re, p.sub);
      return s;
    }
    return x;
  }
  return rec(obj);
}
function loadCustomFields() {
  return new Promise((resolve) => chrome.storage.sync.get(['customFields'], (r) => resolve(r.customFields || {})));
}

// ---------- parsing ----------
async function parsePayload(contentType, rawText) {
  if (!rawText) return null;

  // JSON
  if (isJsonLike(contentType)) {
    try {
      const bodyObj = JSON.parse(rawText);
      const customFields = await loadCustomFields();
      const ctx = { bodyObj, customFields };
      const ext = extractors.find((e) => { try { return e.match(ctx); } catch { return false; } }) || extractors[extractors.length - 1];
      try { return ext.summarize(ctx); } catch { return bodyObj; }
    } catch {}
  }

  // x-www-form-urlencoded
  if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(rawText);
    const obj = {};
    for (const [k, v] of params.entries()) {
      try { obj[k] = JSON.parse(v); } catch { obj[k] = v; }
    }
    const customFields = await loadCustomFields();
    const ctx = { bodyObj: obj, customFields };
    const ext = extractors.find((e) => { try { return e.match(ctx); } catch { return false; } }) || extractors[extractors.length - 1];
    try { return ext.summarize(ctx); } catch { return obj; }
  }

  // NDJSON / first-line JSON guess
  if (rawText.includes('\n')) {
    const first = rawText.split('\n').find((l) => l.trim().length) || '';
    try {
      const bodyObj = JSON.parse(first);
      const customFields = await loadCustomFields();
      const ctx = { bodyObj, customFields };
      const ext = extractors.find((e) => { try { return e.match(ctx); } catch { return false; } }) || extractors[extractors.length - 1];
      try { return ext.summarize(ctx); } catch { return bodyObj; }
    } catch {}
  }

  // fallback: trimmed string
  return rawText.length > 500 ? rawText.slice(0, 500) + ' …' : rawText;
}

// ---------- table render ----------
function matchesFilter(entry, q) {
  if (!q) return true;
  const hay = (entry.url + ' ' + JSON.stringify(entry.parsed)).toLowerCase();
  return hay.includes(q.toLowerCase());
}
function clearTable() {
  const body = $('reqBody');
  if (body) body.innerHTML = '';
}
async function appendRow(entry) {
  const tpl = $('rowTemplate'); if (!tpl) return;

  const redactCheckbox = $('redact');
  const doRedact = !!(redactCheckbox && redactCheckbox.checked);

  let parsed = entry.parsed;
  if (doRedact && parsed && typeof parsed === 'object') {
    try { parsed = await redactPII(parsed); } catch {}
  }

  const frag = tpl.content.cloneNode(true);
  frag.querySelector('.idx').textContent = entry.idx;
  frag.querySelector('.time').textContent = new Date(entry.time).toLocaleTimeString();
  frag.querySelector('.method').textContent = entry.method || '';
  frag.querySelector('.url').textContent = entry.url || '';
  frag.querySelector('.status').textContent = entry.status || '';
  frag.querySelector('.ctype').textContent = entry.contentType || '';

  const row = frag.querySelector('tr');
  if (entry.preflight) row.classList.add('preflight');
  if (entry.status >= 200 && entry.status < 300) row.classList.add('status-2xx');
  else if (entry.status >= 400) row.classList.add('status-4xx');

  const cell = frag.querySelector('.payload');
  if (typeof parsed === 'object') {
    const pre = document.createElement('pre');
    pre.textContent = JSON.stringify(parsed, null, 2);
    cell.appendChild(pre);
  } else if (typeof parsed === 'string') {
    const pre = document.createElement('pre');
    pre.textContent = parsed;
    cell.appendChild(pre);
  }

  const body = $('reqBody');
  if (body) body.prepend(frag);
}
async function renderTable() {
  clearTable();
  const filterInput = $('filter');
  const q = filterInput ? filterInput.value.trim() : '';
  const filtered = state.entries.filter((e) => matchesFilter(e, q));
  // recent-first
  for (const e of filtered.slice().reverse()) {
    await appendRow(e);
  }
}

// ---------- network capture ----------
function attachNetworkListener() {
  chrome.devtools.network.onRequestFinished.addListener(async (req) => {
    if (!state.showPreflight && isPreflight(req)) return;

    const url = req.request && req.request.url;
    const method = req.request && req.request.method;
    const isTD = isTDRequest(url);
    if (!isTD && !state.showNonTD) return;

    const postData = (req.request && req.request.postData && req.request.postData.text) || '';
    const requestHeaders = (req.request && req.request.headers) || [];
    const ctHdr = requestHeaders.find((h) => (h.name || '').toLowerCase() === 'content-type');
    const requestCT = ctHdr && ctHdr.value;

    const status = (req.response && req.response.status) || '';
    const respCT = ((req.response && req.response.headers) || []).find((h) => (h.name || '').toLowerCase() === 'content-type');
    const contentType = requestCT || (respCT && respCT.value) || '';

    const idx = ++state.counter;
    const time = Date.now();

    const urlInfo = extractTDInfo(url, requestHeaders);

    const finalize = async (bodyTextFromResp) => {
      const raw = postData || bodyTextFromResp || '';
      const bodyParsed = await parsePayload(contentType, raw);

      const tdSummary = {
        ...(urlInfo.database && { database: urlInfo.database }),
        ...(urlInfo.table && { table: urlInfo.table }),
        ...(urlInfo.region && { region: urlInfo.region }),
        ...(urlInfo.edge && { edge: urlInfo.edge }),
        ...(urlInfo.query && Object.keys(urlInfo.query).length ? { query: urlInfo.query } : {}),
        ...(urlInfo.pathname && { path: urlInfo.pathname }),
        ...(urlInfo.headers && { headers: urlInfo.headers })
      };

      const combined = mergeParsed(tdSummary, bodyParsed);

      state.entries.push({
        idx, time, method, url, status, contentType, parsed: combined, preflight: (method === 'OPTIONS')
      });

      await renderTable();
    };

    if (!postData) {
      req.getContent((body) => finalize(body || ''));
    } else {
      finalize('');
    }
  });
}

// ---------- UI wiring ----------
(function wireHandlers() {
  const clearBtn = $('clearBtn'); if (clearBtn) clearBtn.addEventListener('click', () => { state.entries = []; clearTable(); });

  const hostsInput = $('hosts'); if (hostsInput) hostsInput.addEventListener('change', savePrefs);
  const nonTD = $('showNonTD'); if (nonTD) nonTD.addEventListener('change', savePrefs);
  const pre = $('showPreflight'); if (pre) pre.addEventListener('change', savePrefs);

  const filterInput = $('filter');
  if (filterInput) filterInput.addEventListener('input', () => {
    chrome.storage.sync.set({ tdFilter: filterInput.value });
    renderTable();
  });

  const red = $('redact');
  if (red) red.addEventListener('change', () => {
    chrome.storage.sync.set({ tdRedact: red.checked });
    renderTable();
  });

  const exportCsvBtn = $('exportCsv');
  if (exportCsvBtn) exportCsvBtn.addEventListener('click', () => {
    const rows = [['idx', 'time', 'method', 'status', 'url', 'database', 'table', 'td_client_id', 'td_global_id', 'td_ecomm_event_type']];
    const qInput = $('filter');
    const q = qInput ? qInput.value.trim() : '';
    const filtered = state.entries.filter((e) => matchesFilter(e, q));
    for (const e of filtered) {
      const p = (e.parsed && typeof e.parsed === 'object') ? e.parsed : {};
      const s = Array.isArray(p.sample) && p.sample.length ? p.sample[0] : {};
      rows.push([
        e.idx, new Date(e.time).toISOString(), e.method || '', e.status || '', e.url || '',
        p.database || '', p.table || '', s.td_client_id || '', s.td_global_id || '', s.td_ecomm_event_type || ''
      ]);
    }
    const csv = rows.map(r => r.map(x => String(x).replace(/"/g, '""')).map(x => `"${x}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'td-debugger.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // Settings modal
  const settingsBtn = $('settingsBtn');
  const settingsModal = $('settingsModal');
  const settingsJson = $('settingsJson');
  const settingsCancel = $('settingsCancel');
  const settingsSave = $('settingsSave');
  if (settingsBtn && settingsModal && settingsJson && settingsCancel && settingsSave) {
    settingsBtn.addEventListener('click', () => {
      chrome.storage.sync.get(['customFields'], (res) => {
        settingsJson.value = JSON.stringify(res.customFields || {}, null, 2);
        settingsModal.style.display = 'block';
      });
    });
    settingsCancel.addEventListener('click', () => settingsModal.style.display = 'none');
    settingsSave.addEventListener('click', () => {
      try {
        const obj = JSON.parse(settingsJson.value || '{}');
        chrome.storage.sync.set({ customFields: obj }, () => {
          settingsModal.style.display = 'none';
          renderTable();
        });
      } catch (e) { alert('Invalid JSON: ' + e.message); }
    });
  }

  // Redaction modal
  const importBtn = $('importBtn');
  const importFileInput = $('importFile');
  const exportBtn = $('exportBtn');
  const openRedactLink = $('openRedact');
  const redactModal = $('redactModal');
  const redactArea = $('redactRules');
  const redactCancelBtn = $('redactCancel');
  const redactSaveBtn = $('redactSave');

  if (importBtn && importFileInput) {
    importBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const obj = JSON.parse(text);
        const allowed = {};
        if (obj.customFields) allowed.customFields = obj.customFields;
        if (obj.redactionRules) allowed.redactionRules = Array.isArray(obj.redactionRules) ? obj.redactionRules : [];
        if (obj.tdHosts) allowed.tdHosts = obj.tdHosts;
        if (typeof obj.showNonTD === 'boolean') allowed.showNonTD = obj.showNonTD;
        if (typeof obj.showPreflight === 'boolean') allowed.showPreflight = obj.showPreflight;
        if (typeof obj.tdFilter === 'string') allowed.tdFilter = obj.tdFilter;
        if (typeof obj.tdRedact === 'boolean') allowed.tdRedact = obj.tdRedact;
        chrome.storage.sync.set(allowed, () => renderTable());
        alert('Settings imported.');
        importFileInput.value = '';
      } catch (err) {
        alert('Import failed: ' + err.message);
      }
    });
  }
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      chrome.storage.sync.get(
        ['customFields', 'redactionRules', 'tdHosts', 'showNonTD', 'showPreflight', 'tdFilter', 'tdRedact'],
        (res) => {
          const json = JSON.stringify(res, null, 2);
          const blob = new Blob([json], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'td-debugger-settings.json';
          a.click();
          URL.revokeObjectURL(a.href);
        });
    });
  }
})();

// ---------- init ----------
loadPrefs();
loadCustomExtractors();
attachNetworkListener();
