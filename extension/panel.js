// panel.js — clean, single-definition, MV3-safe

/**
 * @typedef {import('./types.js').Entry} Entry
 * @typedef {import('./types.js').TDInfo} TDInfo
 * @typedef {import('./types.js').Extractor} Extractor
 * @typedef {import('./types.js').ExtractorContext} ExtractorContext
 */

import { defaultExtractors } from './parsers.js';
import { entryMatchesFilter } from './modules/filtering.js';

// Import modules
import {
  loadPrefs,
  savePrefs,
  loadRedactionRules,
  saveRedactionRules,
  loadFilterPresets,
  saveFilterPresets,
} from './modules/storage.js';
import { redactPII } from './modules/redaction.js';
import {
  extractTDInfo,
  isJsonLike,
  isTDRequest,
  isPreflight,
  maskAuthorization,
  mergeParsed,
} from './modules/parsing.js';
import {
  renderTable as renderTableModule,
  updateDatabaseFilter,
  updatePaginationInfo,
  updatePaginationButtons,
  clearTable,
} from './modules/rendering.js';
import { attachNetworkListener } from './modules/network.js';
import { FlowVisualization } from './modules/flow-viz.js';

/**
 * Get element by ID
 * @param {string} id - Element ID
 * @returns {HTMLElement|null} Element or null
 */
const $ = (id) => document.getElementById(id);

// ---------- state ----------
const state = {
  entries: [],
  counter: 0,
  hosts: [],
  showNonTD: false,
  showPreflight: false,
  maxVisible: 100, // Performance: limit visible entries
  currentPage: 0, // Performance: current page for pagination
  tdRedact: false,
  redactionRules: [],
};

let extractors = [...defaultExtractors];

async function loadCustomExtractors() {
  try {
    const mod = await import(chrome.runtime.getURL('custom-extractors.js'));
    const extra = (mod && (mod.default || mod.extractors)) || [];
    if (Array.isArray(extra) && extra.length) extractors = [...extra, ...extractors];
  } catch {}
}

// ---------- prefs ----------
async function loadPrefsUI() {
  const prefs = await loadPrefs();

  if (Array.isArray(prefs.tdHosts) && prefs.tdHosts.length) state.hosts = prefs.tdHosts;
  if (typeof prefs.showNonTD === 'boolean') state.showNonTD = prefs.showNonTD;
  state.showPreflight = !!prefs.showPreflight;

  const hostsInput = $('hosts');
  if (hostsInput) hostsInput.value = state.hosts.join(', ');
  const nonTD = $('showNonTD');
  if (nonTD) nonTD.checked = state.showNonTD;
  const pre = $('showPreflight');
  if (pre) pre.checked = state.showPreflight;
  const filt = $('filter');
  if (filt) filt.value = prefs.tdFilter || '';
  const red = $('redact');
  if (red) red.checked = !!prefs.tdRedact;
  state.tdRedact = !!prefs.tdRedact;

  const rules = await loadRedactionRules();
  state.redactionRules = rules || [];
}

async function savePrefsUI() {
  const hostsInput = $('hosts');
  const nonTD = $('showNonTD');
  const pre = $('showPreflight');
  const filt = $('filter');
  const red = $('redact');

  const hosts = hostsInput
    ? hostsInput.value
        .split(',')
        .map((h) => h.trim())
        .filter(Boolean)
    : [];
  state.hosts = hosts.length ? hosts : ['in.treasuredata.com'];
  state.showNonTD = !!(nonTD && nonTD.checked);
  state.showPreflight = !!(pre && pre.checked);
  state.tdRedact = !!(red && red.checked);

  await savePrefs({
    tdHosts: state.hosts,
    showNonTD: state.showNonTD,
    showPreflight: state.showPreflight,
    tdFilter: filt ? filt.value : '',
    tdRedact: !!(red && red.checked),
  });
}

/**
 * Load custom fields configuration from storage
 * @returns {Promise<Record<string, import('./types.js').ExtractorConfig>>} Custom fields config
 */
function loadCustomFields() {
  return new Promise((resolve) =>
    chrome.storage.sync.get(['customFields'], (r) => resolve(r.customFields || {}))
  );
}

// ---------- parsing ----------
/**
 * Parse request/response payload using extractors
 * @param {string} contentType - Content-Type header
 * @param {string} rawText - Raw body text
 * @returns {Promise<any>} Parsed and summarized payload
 */
async function parsePayload(contentType, rawText) {
  if (!rawText) return null;

  if (isJsonLike(contentType)) {
    try {
      const bodyObj = JSON.parse(rawText);
      const customFields = await loadCustomFields();
      const ctx = { bodyObj, customFields };
      const ext =
        extractors.find((e) => {
          try {
            return e.match(ctx);
          } catch {
            return false;
          }
        }) || extractors[extractors.length - 1];
      try {
        return ext.summarize(ctx);
      } catch {
        return bodyObj;
      }
    } catch {}
  }

  if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(rawText);
    const obj = {};
    for (const [k, v] of params.entries()) {
      try {
        obj[k] = JSON.parse(v);
      } catch {
        obj[k] = v;
      }
    }
    const customFields = await loadCustomFields();
    const ctx = { bodyObj: obj, customFields };
    const ext =
      extractors.find((e) => {
        try {
          return e.match(ctx);
        } catch {
          return false;
        }
      }) || extractors[extractors.length - 1];
    try {
      return ext.summarize(ctx);
    } catch {
      return obj;
    }
  }

  if (rawText.includes('\n')) {
    const first = rawText.split('\n').find((l) => l.trim().length) || '';
    try {
      const bodyObj = JSON.parse(first);
      const customFields = await loadCustomFields();
      const ctx = { bodyObj, customFields };
      const ext =
        extractors.find((e) => {
          try {
            return e.match(ctx);
          } catch {
            return false;
          }
        }) || extractors[extractors.length - 1];
      try {
        return ext.summarize(ctx);
      } catch {
        return bodyObj;
      }
    } catch {}
  }

  return rawText.length > 500 ? rawText.slice(0, 500) + ' …' : rawText;
}

// ---------- table render ----------
/**
 * Check if entry matches filter query
 * @param {Entry} entry - Entry to check
 * @param {string} q - Filter query
 * @returns {boolean} True if matches
 */
function matchesFilter(entry, q) {
  const statusFilter = $('statusFilter')?.value || '';
  const dbFilter = $('dbFilter')?.value || '';
  const methodFilter = $('methodFilter')?.value || '';

  return entryMatchesFilter(entry, q, { statusFilter, dbFilter, methodFilter });
}

/**
 * Append a row to the table for an entry
 * @param {Entry} entry - Entry to render
 * @returns {Promise<void>}
 */
async function appendRow(entry) {
  const tpl = $('rowTemplate');
  if (!tpl) return;

  const redactCheckbox = $('redact');
  const doRedact = !!(redactCheckbox && redactCheckbox.checked);

  let parsed = entry.parsed;
  if (doRedact && parsed && typeof parsed === 'object') {
    try {
      parsed = await redactPII(parsed);
    } catch {}
  }

  const frag = tpl.content.cloneNode(true);

  const checkbox = frag.querySelector('.compare-checkbox');
  if (checkbox) {
    checkbox.dataset.idx = entry.idx;
  }

  frag.querySelector('.idx').textContent = entry.idx;
  frag.querySelector('.time').textContent = new Date(entry.time).toLocaleTimeString();
  frag.querySelector('.method').textContent = entry.method || '';
  frag.querySelector('.url').textContent = entry.url || '';
  frag.querySelector('.status').textContent = entry.status || '';
  frag.querySelector('.ct').textContent = entry.contentType || '';

  const row = frag.querySelector('tr');
  if (entry.preflight) row.classList.add('preflight');
  if (entry.status >= 200 && entry.status < 300) row.classList.add('status-2xx');
  else if (entry.status >= 400) row.classList.add('status-4xx');

  const cell = frag.querySelector('.parsed');
  if (typeof parsed === 'object') {
    const pre = document.createElement('pre');
    pre.textContent = JSON.stringify(parsed, null, 2);
    cell.appendChild(pre);
  } else if (typeof parsed === 'string') {
    const pre = document.createElement('pre');
    pre.textContent = parsed;
    cell.appendChild(pre);
  }

  const headersCell = frag.querySelector('.headers-cell');
  if (headersCell && (entry.requestHeaders || entry.responseHeaders)) {
    const headersBtn = document.createElement('button');
    headersBtn.className = 'btn btn-outline';
    headersBtn.textContent = '📋 Headers';
    headersBtn.style.fontSize = '11px';
    headersBtn.addEventListener('click', () => showHeadersModal(entry));
    headersCell.appendChild(headersBtn);
  }

  const body = $('reqBody');
  if (body) body.prepend(frag);
}
async function renderTable() {
  clearTable();
  const filterInput = $('filter');
  const q = filterInput ? filterInput.value.trim() : '';
  const filtered = state.entries.filter((e) => matchesFilter(e, q));

  const start = state.currentPage * state.maxVisible;
  const end = start + state.maxVisible;
  const visible = filtered.slice(start, end);

  const paginationInfo = $('paginationInfo');
  if (paginationInfo) {
    if (filtered.length > state.maxVisible) {
      const showing = Math.min(visible.length, filtered.length);
      paginationInfo.textContent = `Showing ${showing} of ${filtered.length} entries`;
      paginationInfo.style.display = 'inline';
    } else {
      paginationInfo.style.display = 'none';
    }
  }

  const prevBtn = $('prevPage');
  const nextBtn = $('nextPage');
  if (prevBtn) prevBtn.disabled = state.currentPage === 0;
  if (nextBtn) nextBtn.disabled = end >= filtered.length;

  for (const e of visible.slice().reverse()) {
    await appendRow(e);
  }
}

// ---------- network capture ----------
function setupNetworkCapture() {
  attachNetworkListener(
    state,
    extractors,
    async (entry) => {
      state.entries.push(entry);

      if (flowViz) {
        flowViz.addRequest(entry);
      }

      await renderTable();
      updateDatabaseFilter(state.entries);
    },
    parsePayload
  );
}

// ---------- UI wiring ----------
(function wireHandlers() {
  const clearBtn = $('clearBtn');
  if (clearBtn)
    clearBtn.addEventListener('click', () => {
      state.entries = [];
      clearTable();
    });

  const hostsInput = $('hosts');
  if (hostsInput) hostsInput.addEventListener('change', savePrefsUI);
  const nonTD = $('showNonTD');
  if (nonTD) nonTD.addEventListener('change', savePrefsUI);
  const pre = $('showPreflight');
  if (pre) pre.addEventListener('change', savePrefsUI);

  const filterInput = $('filter');
  if (filterInput)
    filterInput.addEventListener('input', () => {
      chrome.storage.sync.set({ tdFilter: filterInput.value });
      renderTable();
    });

  const red = $('redact');
  if (red)
    red.addEventListener('change', () => {
      state.tdRedact = red.checked;
      chrome.storage.sync.set({ tdRedact: red.checked });
      renderTable();
    });

  const statusFilter = $('statusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      state.currentPage = 0;
      renderTable();
    });
  }

  const methodFilter = $('methodFilter');
  if (methodFilter) {
    methodFilter.addEventListener('change', () => {
      state.currentPage = 0;
      renderTable();
    });
  }

  const dbFilter = $('dbFilter');
  if (dbFilter) {
    dbFilter.addEventListener('change', () => {
      state.currentPage = 0;
      renderTable();
    });
  }

  const regexFilter = $('regexFilter');
  if (regexFilter) {
    regexFilter.addEventListener('change', () => {
      renderTable();
    });
  }

  const clearFilters = $('clearFilters');
  if (clearFilters) {
    clearFilters.addEventListener('click', () => {
      const filterInput = $('filter');
      if (filterInput) filterInput.value = '';
      if (statusFilter) statusFilter.value = '';
      if (methodFilter) methodFilter.value = '';
      if (dbFilter) dbFilter.value = '';
      if (regexFilter) regexFilter.checked = false;
      state.currentPage = 0;
      renderTable();
      showToast('Filters cleared', 'success');
    });
  }

  const saveFilterPreset = $('saveFilterPreset');
  const filterPresets = $('filterPresets');

  function updateFilterPresets() {
    chrome.storage.sync.get(['filterPresets'], (res) => {
      const presets = res.filterPresets || {};
      if (filterPresets) {
        filterPresets.innerHTML = '<option value="">Load Preset...</option>';
        Object.keys(presets)
          .sort()
          .forEach((name) => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            filterPresets.appendChild(opt);
          });
      }
    });
  }

  if (saveFilterPreset) {
    saveFilterPreset.addEventListener('click', () => {
      const name = prompt('Enter preset name:');
      if (!name || !name.trim()) return;

      const preset = {
        text: $('filter')?.value || '',
        status: statusFilter?.value || '',
        method: methodFilter?.value || '',
        database: dbFilter?.value || '',
        regex: $('regexFilter')?.checked || false,
      };

      chrome.storage.sync.get(['filterPresets'], (res) => {
        const presets = res.filterPresets || {};
        presets[name.trim()] = preset;
        chrome.storage.sync.set({ filterPresets: presets }, () => {
          updateFilterPresets();
          showToast(`Saved filter preset: ${name}`, 'success');
        });
      });
    });
  }

  if (filterPresets) {
    filterPresets.addEventListener('change', (e) => {
      const name = e.target.value;
      if (!name) return;

      chrome.storage.sync.get(['filterPresets'], (res) => {
        const preset = res.filterPresets?.[name];
        if (preset) {
          const filterInput = $('filter');
          if (filterInput) filterInput.value = preset.text || '';
          if (statusFilter) statusFilter.value = preset.status || '';
          if (methodFilter) methodFilter.value = preset.method || '';
          if (dbFilter) dbFilter.value = preset.database || '';
          const regexCheckbox = $('regexFilter');
          if (regexCheckbox) regexCheckbox.checked = preset.regex || false;

          state.currentPage = 0;
          renderTable();
          showToast(`Loaded filter preset: ${name}`, 'success');

          filterPresets.value = '';
        }
      });
    });

    filterPresets.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const name = filterPresets.value;
      if (!name) {
        showToast('Select a preset to delete', 'warning');
        return;
      }

      if (confirm(`Delete preset "${name}"?`)) {
        chrome.storage.sync.get(['filterPresets'], (res) => {
          const presets = res.filterPresets || {};
          delete presets[name];
          chrome.storage.sync.set({ filterPresets: presets }, () => {
            updateFilterPresets();
            showToast(`Deleted preset: ${name}`, 'success');
          });
        });
      }
    });

    updateFilterPresets();
  }

  const exportCsvBtn = $('exportCsv');
  if (exportCsvBtn)
    exportCsvBtn.addEventListener('click', () => {
      const rows = [
        [
          'idx',
          'time',
          'method',
          'status',
          'url',
          'database',
          'table',
          'td_client_id',
          'td_global_id',
          'td_ecomm_event_type',
        ],
      ];
      const qInput = $('filter');
      const q = qInput ? qInput.value.trim() : '';
      const filtered = state.entries.filter((e) => matchesFilter(e, q));
      for (const e of filtered) {
        const p = e.parsed && typeof e.parsed === 'object' ? e.parsed : {};
        const s = Array.isArray(p.sample) && p.sample.length ? p.sample[0] : {};
        rows.push([
          e.idx,
          new Date(e.time).toISOString(),
          e.method || '',
          e.status || '',
          e.url || '',
          p.database || '',
          p.table || '',
          s.td_client_id || '',
          s.td_global_id || '',
          s.td_ecomm_event_type || '',
        ]);
      }
      const csv = rows
        .map((r) =>
          r
            .map((x) => String(x).replace(/"/g, '""'))
            .map((x) => `"${x}"`)
            .join(',')
        )
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'td-debugger.csv';
      a.click();
      URL.revokeObjectURL(a.href);
    });

  const exportJsonBtn = $('exportJson');
  if (exportJsonBtn) {
    exportJsonBtn.addEventListener('click', () => {
      const filterInput = $('filter');
      const q = filterInput ? filterInput.value.trim() : '';
      const filtered = state.entries.filter((e) => matchesFilter(e, q));

      const json = JSON.stringify(filtered, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'td-debugger.json';
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  const prevPage = $('prevPage');
  if (prevPage) {
    prevPage.addEventListener('click', () => {
      if (state.currentPage > 0) {
        state.currentPage--;
        renderTable();
      }
    });
  }

  const nextPage = $('nextPage');
  if (nextPage) {
    nextPage.addEventListener('click', () => {
      const filterInput = $('filter');
      const q = filterInput ? filterInput.value.trim() : '';
      const filtered = state.entries.filter((e) => matchesFilter(e, q));
      const maxPage = Math.ceil(filtered.length / state.maxVisible) - 1;
      if (state.currentPage < maxPage) {
        state.currentPage++;
        renderTable();
      }
    });
  }

  const pageSize = $('pageSize');
  if (pageSize) {
    pageSize.addEventListener('change', () => {
      state.maxVisible = parseInt(pageSize.value, 10);
      state.currentPage = 0;
      renderTable();
    });
  }
})();

const settingsBtn = $('settingsBtn');
const settingsModal = $('settingsModal');
const settingsJson = $('settingsJson');
const settingsCancel = $('settingsCancel');
const settingsSave = $('settingsSave');
const settingsCloseBtn = $('settingsCloseBtn');

if (settingsBtn && settingsModal && settingsJson && settingsCancel && settingsSave) {
  settingsBtn.addEventListener('click', () => {
    chrome.storage.sync.get(['customFields'], (res) => {
      settingsJson.value = JSON.stringify(res.customFields || {}, null, 2);
      settingsModal.classList.add('show');
      settingsModal.style.display = 'flex';
    });
  });

  const closeSettings = () => {
    settingsModal.classList.remove('show');
    settingsModal.style.display = 'none';
  };

  settingsCancel.addEventListener('click', closeSettings);
  if (settingsCloseBtn) {
    settingsCloseBtn.addEventListener('click', closeSettings);
  }

  settingsSave.addEventListener('click', () => {
    try {
      const text = settingsJson.value.trim();

      if (!text) {
        showToast('Settings cannot be empty', 'error');
        return;
      }

      const obj = JSON.parse(text);

      if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        showToast('Settings must be a valid object', 'error');
        return;
      }

      chrome.storage.sync.set({ customFields: obj }, () => {
        closeSettings();
        showToast('Settings saved successfully', 'success');
        renderTable();
      });
    } catch (e) {
      showToast(`Invalid JSON: ${e.message}`, 'error');
    }
  });
}

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
      if (obj.redactionRules)
        allowed.redactionRules = Array.isArray(obj.redactionRules) ? obj.redactionRules : [];
      if (obj.tdHosts) allowed.tdHosts = obj.tdHosts;
      if (typeof obj.showNonTD === 'boolean') allowed.showNonTD = obj.showNonTD;
      if (typeof obj.showPreflight === 'boolean') allowed.showPreflight = obj.showPreflight;
      if (typeof obj.tdFilter === 'string') allowed.tdFilter = obj.tdFilter;
      if (typeof obj.tdRedact === 'boolean') allowed.tdRedact = obj.tdRedact;
      chrome.storage.sync.set(allowed, () => {
        renderTable();
        showToast('Settings imported successfully', 'success');
      });
      importFileInput.value = '';
    } catch (err) {
      showToast(`Import failed: ${err.message}`, 'error');
    }
  });
}

if (openRedactLink && redactModal && redactArea && redactCancelBtn && redactSaveBtn) {
  const redactBtn = openRedactLink;
  const redactCloseBtn = $('redactCloseBtn');

  redactBtn.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.storage.sync.get('redactionRules', (res) => {
      const rules = res.redactionRules || [];
      redactArea.value = rules.join('\n');
      redactModal.classList.add('show');
      redactModal.style.display = 'flex';
    });
  });

  const closeRedact = () => {
    redactModal.classList.remove('show');
    redactModal.style.display = 'none';
  };

  redactCancelBtn.addEventListener('click', closeRedact);
  if (redactCloseBtn) redactCloseBtn.addEventListener('click', closeRedact);

  redactModal.addEventListener('click', (e) => {
    if (e.target === redactModal) closeRedact();
  });
  redactSaveBtn.addEventListener('click', () => {
    const text = redactArea.value;
    const { valid, errors, lines } = validateRedactionRules(text);

    if (!valid) {
      const errorMsg = `Invalid regex patterns:\n${errors.slice(0, 3).join('\n')}`;
      showToast(errorMsg, 'error', 5000);
      return;
    }

    chrome.storage.sync.set({ redactionRules: lines }, () => {
      redactModal.style.display = 'none';
      const count = lines.length;
      showToast(`Saved ${count} redaction rule${count !== 1 ? 's' : ''}`, 'success');
    });
  });
}

if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    chrome.storage.sync.get(
      [
        'customFields',
        'redactionRules',
        'tdHosts',
        'showNonTD',
        'showPreflight',
        'tdFilter',
        'tdRedact',
      ],
      (res) => {
        const json = JSON.stringify(res, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'td-debugger-settings.json';
        a.click();
        URL.revokeObjectURL(a.href);
      }
    );
  });
}

function showHeadersModal(entry) {
  const modal = $('headersModal');
  if (!modal) return;

  const reqHeaders = $('requestHeadersList');
  const respHeaders = $('responseHeadersList');

  if (reqHeaders) {
    reqHeaders.innerHTML = '';
    const headers = entry.requestHeaders || [];
    if (headers.length === 0) {
      reqHeaders.innerHTML = '<div style="color: #999;">No request headers</div>';
    } else {
      headers.forEach((h) => {
        const item = document.createElement('div');
        item.className = 'header-item';
        if (isImportantHeader(h.name)) {
          item.classList.add('important');
        }
        let value = h.value;

        if (state.tdRedact) {
          if (h.name.toLowerCase() === 'authorization') {
            value = maskAuthorization(value);
          }
          if (state.redactionRules && state.redactionRules.length > 0) {
            value = redactPII(value, state.redactionRules);
          }
        }

        item.innerHTML = `<strong>${h.name}:</strong> ${value}`;
        reqHeaders.appendChild(item);
      });
    }
  }

  if (respHeaders) {
    respHeaders.innerHTML = '';
    const headers = entry.responseHeaders || [];
    if (headers.length === 0) {
      respHeaders.innerHTML = '<div style="color: #999;">No response headers</div>';
    } else {
      headers.forEach((h) => {
        const item = document.createElement('div');
        item.className = 'header-item';
        if (isImportantHeader(h.name)) {
          item.classList.add('important');
        }
        let value = h.value;

        if (state.tdRedact) {
          if (h.name.toLowerCase() === 'authorization') {
            value = maskAuthorization(value);
          }
          if (state.redactionRules && state.redactionRules.length > 0) {
            value = redactPII(value, state.redactionRules);
          }
        }

        item.innerHTML = `<strong>${h.name}:</strong> ${value}`;
        respHeaders.appendChild(item);
      });
    }
  }

  modal.classList.add('show');
  modal.style.display = 'flex';

  const closeBtnFooter = $('headersClose');
  if (closeBtnFooter) {
    closeBtnFooter.onclick = () => {
      modal.classList.remove('show');
      modal.style.display = 'none';
    };
  }

  const closeBtnHeader = $('headersCloseBtn');
  if (closeBtnHeader) {
    closeBtnHeader.onclick = () => {
      modal.classList.remove('show');
      modal.style.display = 'none';
    };
  }

  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  };
}

function isImportantHeader(name) {
  const important = [
    'authorization',
    'access-control-allow-origin',
    'access-control-allow-credentials',
    'access-control-allow-methods',
    'access-control-allow-headers',
    'cache-control',
    'content-type',
    'set-cookie',
    'cookie',
  ];
  return important.includes(name.toLowerCase());
}

function updateCompareButton() {
  const checkboxes = document.querySelectorAll('.compare-checkbox:checked');
  const compareBtn = $('compareBtn');
  if (compareBtn) {
    compareBtn.textContent = `🔍 Compare Selected (${checkboxes.length})`;
    compareBtn.disabled = checkboxes.length !== 2;
  }
}

const selectAll = $('selectAll');
if (selectAll) {
  selectAll.addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.compare-checkbox');
    checkboxes.forEach((cb) => {
      cb.checked = e.target.checked;
    });
    updateCompareButton();
  });
}

document.addEventListener('change', (e) => {
  if (e.target.classList.contains('compare-checkbox')) {
    updateCompareButton();

    const allCheckboxes = document.querySelectorAll('.compare-checkbox');
    const checkedCheckboxes = document.querySelectorAll('.compare-checkbox:checked');
    const selectAllCheckbox = $('selectAll');
    if (selectAllCheckbox) {
      selectAllCheckbox.checked =
        allCheckboxes.length > 0 && allCheckboxes.length === checkedCheckboxes.length;
      selectAllCheckbox.indeterminate =
        checkedCheckboxes.length > 0 && checkedCheckboxes.length < allCheckboxes.length;
    }
  }
});

const compareBtn = $('compareBtn');
if (compareBtn) {
  compareBtn.addEventListener('click', () => {
    const selected = Array.from(document.querySelectorAll('.compare-checkbox:checked')).map((cb) =>
      parseInt(cb.dataset.idx)
    );

    if (selected.length !== 2) {
      showToast('Please select exactly 2 requests to compare', 'warning');
      return;
    }

    const [idx1, idx2] = selected;
    const entry1 = state.entries.find((e) => e.idx === idx1);
    const entry2 = state.entries.find((e) => e.idx === idx2);

    if (!entry1 || !entry2) {
      showToast('Could not find selected entries', 'error');
      return;
    }

    showComparisonModal(entry1, entry2);
  });
}

function showComparisonModal(entry1, entry2) {
  const modal = $('comparisonModal');
  if (!modal) return;

  const comp1Idx = $('comp1Idx');
  const comp1Method = $('comp1Method');
  const comp1Status = $('comp1Status');
  const comp1Time = $('comp1Time');
  const comp1Url = $('comp1Url');
  const comp1Headers = $('comp1Headers');
  const comp1Payload = $('comp1Payload');

  if (comp1Idx) comp1Idx.textContent = entry1.idx;
  if (comp1Method) comp1Method.textContent = entry1.method || '';
  if (comp1Time) comp1Time.textContent = new Date(entry1.time).toLocaleString();
  if (comp1Status) {
    comp1Status.textContent = entry1.status || '';
  }
  if (comp1Url) comp1Url.textContent = entry1.url || '';
  if (comp1Headers) {
    const headers = (entry1.requestHeaders || [])
      .filter((h) => isImportantHeader(h.name))
      .map((h) => {
        let val = h.value;
        if (state.tdRedact) {
          if (h.name.toLowerCase() === 'authorization') val = maskAuthorization(val);
          if (state.redactionRules && state.redactionRules.length > 0)
            val = redactPII(val, state.redactionRules);
        }
        return `${h.name}: ${val}`;
      })
      .join('\n');
    comp1Headers.textContent = headers;
  }
  if (comp1Payload) {
    let payload = entry1.parsed || {};
    if (state.tdRedact) {
      payload = redactPII(payload, state.redactionRules);
    }
    comp1Payload.textContent = JSON.stringify(payload, null, 2);
  }

  const comp2Idx = $('comp2Idx');
  const comp2Method = $('comp2Method');
  const comp2Status = $('comp2Status');
  const comp2Time = $('comp2Time');
  const comp2Url = $('comp2Url');
  const comp2Headers = $('comp2Headers');
  const comp2Payload = $('comp2Payload');

  if (comp2Idx) comp2Idx.textContent = entry2.idx;
  if (comp2Method) comp2Method.textContent = entry2.method || '';
  if (comp2Time) comp2Time.textContent = new Date(entry2.time).toLocaleString();
  if (comp2Status) {
    comp2Status.textContent = entry2.status || '';
  }
  if (comp2Url) comp2Url.textContent = entry2.url || '';
  if (comp2Headers) {
    const headers = (entry2.requestHeaders || [])
      .filter((h) => isImportantHeader(h.name))
      .map((h) => {
        let val = h.value;
        if (state.tdRedact) {
          if (h.name.toLowerCase() === 'authorization') val = maskAuthorization(val);
          if (state.redactionRules && state.redactionRules.length > 0)
            val = redactPII(val, state.redactionRules);
        }
        return `${h.name}: ${val}`;
      })
      .join('\n');
    comp2Headers.textContent = headers;
  }
  if (comp2Payload) {
    let payload = entry2.parsed || {};
    if (state.tdRedact) {
      payload = redactPII(payload, state.redactionRules);
    }
    comp2Payload.textContent = JSON.stringify(payload, null, 2);
  }

  highlightDiff(comp1Payload, comp2Payload);
  const differences = [];
  if (entry1.method !== entry2.method) differences.push('Method differs');
  if (entry1.status !== entry2.status) differences.push('Status code differs');
  if (entry1.url !== entry2.url) differences.push('URL differs');

  const payload1Str = JSON.stringify(entry1.parsed);
  const payload2Str = JSON.stringify(entry2.parsed);
  if (payload1Str !== payload2Str) differences.push('Payload differs');

  const diffIndicator = $('compDiffIndicator');
  const diffList = $('compDiffList');
  if (diffIndicator && diffList) {
    if (differences.length > 0) {
      diffIndicator.style.display = 'block';
      diffIndicator.style.background = 'rgba(237, 137, 54, 0.1)';
      diffIndicator.style.borderLeft = '3px solid #ed8936';
      diffList.innerHTML = differences.map((d) => `<li>${d}</li>`).join('');
    } else {
      diffIndicator.style.display = 'block';
      diffIndicator.style.background = 'rgba(72, 187, 120, 0.1)';
      diffIndicator.style.borderLeft = '3px solid #48bb78';
      diffList.innerHTML = '<li>✓ Requests are identical</li>';
    }
  }

  modal.classList.add('show');
  modal.style.display = 'flex';

  const closeBtn = modal.querySelector('.modal-close');
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.classList.remove('show');
      modal.style.display = 'none';
    };
  }

  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  };
}

function highlightDiff(el1, el2) {
  // placeholder for future visual diff implementation
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const settingsModal = $('settingsModal');
    const redactModal = $('redactModal');
    const headersModal = $('headersModal');
    const comparisonModal = $('comparisonModal');

    if (settingsModal && settingsModal.classList.contains('show')) {
      settingsModal.classList.remove('show');
      settingsModal.style.display = 'none';
      const settingsBtn = $('settingsBtn');
      if (settingsBtn) settingsBtn.focus();
    } else if (redactModal && redactModal.classList.contains('show')) {
      redactModal.classList.remove('show');
      redactModal.style.display = 'none';
      const openRedactLink = $('openRedact');
      if (openRedactLink) openRedactLink.focus();
    } else if (headersModal && headersModal.classList.contains('show')) {
      headersModal.classList.remove('show');
      headersModal.style.display = 'none';
    } else if (comparisonModal && comparisonModal.classList.contains('show')) {
      comparisonModal.classList.remove('show');
      comparisonModal.style.display = 'none';
    }
  }
});

function showToast(message, type = 'info', duration = 3000) {
  let container = $('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');

  container.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (container.contains(toast)) {
        container.removeChild(toast);
      }
    }, 300);
  }, duration);
}

function validateRedactionRules(text) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const errors = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      new RegExp(lines[i]);
    } catch (e) {
      errors.push(`Line ${i + 1}: ${e.message} `);
    }
  }

  return { valid: errors.length === 0, errors, lines };
}

loadPrefs();
loadCustomExtractors();
loadPrefsUI();
setupNetworkCapture();

let flowViz = null;
try {
  flowViz = new FlowVisualization('flowCanvas');
  flowViz.start();
} catch (error) {
  console.error('Failed to initialize flow visualization:', error);
}

const toggleFlowVizBtn = $('toggleFlowViz');
const flowVizContainer = $('flowVizContainer');
if (toggleFlowVizBtn && flowVizContainer) {
  toggleFlowVizBtn.addEventListener('click', () => {
    const isHidden = flowVizContainer.classList.toggle('hidden');
    toggleFlowVizBtn.textContent = isHidden ? 'Show' : 'Hide';
  });
}
