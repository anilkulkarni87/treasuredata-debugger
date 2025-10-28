// parsers.js — generic, no hard-coded field names
// Controlled via Settings (chrome.storage.sync → customFields)
//
// Supported options per extractor (example for "td-events"):
// {
//   "td-events": {
//     "keys": ["td_client_id","td_global_id","td_title","td_url"], // always include (if present)
//     "exclude": ["td_description"],   // never include (when includeAll=true)
//     "includeAll": true,              // include everything else (except exclude), with caps below
//     "sampleCount": 3,                // how many events/records to show
//     "maxString": 500,                // truncate long strings
//     "maxArrayItems": 5,              // list sample cap (adds __more__)
//     "maxObjectKeys": 50              // object keys cap (adds __more__)
//   }
// }

function makeSummarizer(cfg = {}) {
  const maxString = Number.isFinite(cfg.maxString) ? cfg.maxString : 500;
  const maxArrayItems = Number.isFinite(cfg.maxArrayItems) ? cfg.maxArrayItems : 3;
  const maxObjectKeys = Number.isFinite(cfg.maxObjectKeys) ? cfg.maxObjectKeys : 20;

  function summarizeValue(v) {
    if (v == null) return v;
    const t = typeof v;

    if (t === 'string') {
      return v.length > maxString ? v.slice(0, maxString) + ' …' : v;
    }
    if (t === 'number' || t === 'boolean') return v;

    if (Array.isArray(v)) {
      const out = v.slice(0, maxArrayItems).map(summarizeValue);
      if (v.length > maxArrayItems) out.push({ __more__: v.length - maxArrayItems });
      return out;
    }

    if (t === 'object') {
      const keys = Object.keys(v);
      const out = {};
      for (let i = 0; i < keys.length && i < maxObjectKeys; i++) {
        const k = keys[i];
        out[k] = summarizeValue(v[k]);
      }
      if (keys.length > maxObjectKeys) {
        out.__more__ = `+${keys.length - maxObjectKeys} keys`;
      }
      return out;
    }

    return v;
  }

  return { summarizeValue };
}

function buildObject(ev, cfg = {}) {
  const keys = Array.isArray(cfg.keys) ? cfg.keys : [];
  const exclude = new Set(Array.isArray(cfg.exclude) ? cfg.exclude : []);
  const includeAll = !!cfg.includeAll;

  const { summarizeValue } = makeSummarizer(cfg);
  const out = {};

  // 1) Always include requested keys (if present)
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(ev, k)) out[k] = summarizeValue(ev[k]);
  }

  // 2) Optionally include all other keys (minus exclude + already added)
  if (includeAll) {
    for (const k of Object.keys(ev)) {
      if (k in out || exclude.has(k)) continue;
      out[k] = summarizeValue(ev[k]);
    }
  }

  return out;
}

export const defaultExtractors = [
  // TD JS SDK-style payloads: { "events": [ ... ] }
  {
    name: 'td-events',
    match: ({ bodyObj }) => bodyObj && Array.isArray(bodyObj.events),
    summarize: ({ bodyObj, customFields }) => {
      const cfg = (customFields && customFields['td-events']) || {};
      const sampleCount = Number.isFinite(cfg.sampleCount) ? cfg.sampleCount : 3;
      const events = bodyObj.events;
      const sample = [];

      for (let i = 0; i < events.length && i < sampleCount; i++) {
        sample.push(buildObject(events[i] || {}, cfg));
      }

      return { event_count: events.length, sample };
    }
  },

  // { "records": [ ... ] }
  {
    name: 'td-records',
    match: ({ bodyObj }) => bodyObj && Array.isArray(bodyObj.records),
    summarize: ({ bodyObj, customFields }) => {
      const cfg = (customFields && customFields['td-records']) || {};
      const sampleCount = Number.isFinite(cfg.sampleCount) ? cfg.sampleCount : 3;
      const { summarizeValue } = makeSummarizer(cfg);

      const sample = bodyObj.records.slice(0, sampleCount).map((r) => {
        // Keep consistent behavior with td-events: keys/includeAll/exclude apply if provided
        if (cfg.keys || cfg.includeAll) return buildObject(r || {}, cfg);
        // Otherwise just summarize values (no structural filtering)
        return summarizeValue(r);
      });

      return { record_count: bodyObj.records.length, sample };
    }
  },

  // { "record": { ... } }
  {
    name: 'td-record',
    match: ({ bodyObj }) => bodyObj && typeof bodyObj.record === 'object' && bodyObj.record !== null,
    summarize: ({ bodyObj, customFields }) => {
      const cfg = (customFields && customFields['td-record']) || {};
      const rec = bodyObj.record || {};
      const { summarizeValue } = makeSummarizer(cfg);

      const sample = [
        (cfg.keys || cfg.includeAll) ? buildObject(rec, cfg) : summarizeValue(rec)
      ];

      return { record_count: 1, sample };
    }
  },

  // Fallback: return the object with safe summarization caps if configured as "generic"
  {
    name: 'generic',
    match: () => true,
    summarize: ({ bodyObj, customFields }) => {
      const cfg = (customFields && customFields['generic']) || {};
      const { summarizeValue } = makeSummarizer(cfg);
      return summarizeValue(bodyObj);
    }
  }
];
