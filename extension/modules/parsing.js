/**
 * @file Payload parsing and TD info extraction module
 * Handles parsing of network payloads and extraction of Treasure Data metadata
 */

/**
 * Check if content type is JSON-like
 * @param {string} ct - Content-Type header value
 * @returns {boolean} True if JSON-like
 */
export function isJsonLike(ct) {
  if (!ct) return false;
  const v = ct.toLowerCase();
  return v.includes('application/json') || v.includes('text/json') || /\+json\b/.test(v);
}

/**
 * Mask authorization header value for privacy
 * @param {string} v - Authorization header value
 * @returns {string} Masked value
 */
export function maskAuthorization(v) {
  if (!v || typeof v !== 'string') return v;
  const parts = v.split(/\s+/);
  if (parts.length < 2) return '****';
  const scheme = parts[0];
  const token = parts.slice(1).join(' ');
  const vis = token.slice(0, 8);
  return `${scheme} ${vis}… (masked)`;
}

/**
 * Extract Treasure Data metadata from URL and headers
 * @param {string} url - Request URL
 * @param {Array<{name: string, value: string}>} headersList - Request headers
 * @returns {object} Extracted metadata
 */
export function extractTDInfo(url, headersList) {
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
        if (
          name === 'content-type' ||
          name === 'accept' ||
          name === 'origin' ||
          name.startsWith('x-td-')
        ) {
          headers[name] = h.value;
        }
      }
      if (Object.keys(headers).length) out.headers = headers;
    }
  } catch {
    // Invalid URL
  }
  return out;
}

/**
 * Check if URL matches configured TD hosts
 * @param {string} url - Request URL
 * @param {string[]} hosts - Configured TD hosts
 * @returns {boolean} True if matches TD hosts
 */
export function isTDRequest(url, hosts) {
  try {
    const u = new URL(url);
    return hosts.some((h) => u.host.endsWith(h));
  } catch {
    return false;
  }
}

/**
 * Check if request is a CORS preflight
 * @param {object} req - Network request object
 * @returns {boolean} True if preflight
 */
export function isPreflight(req) {
  const method = req.request && req.request.method;
  if (method !== 'OPTIONS') return false;
  const hdrs = (req.request && req.request.headers) || [];
  return hdrs.some((h) => (h.name || '').toLowerCase() === 'access-control-request-method');
}

/**
 * Merge parsed payloads
 * @param {object} a - First object
 * @param {object} b - Second object
 * @returns {object} Merged object
 */
export function mergeParsed(a, b) {
  if (!a || typeof a !== 'object') return b || {};
  if (!b || typeof b !== 'object') return a;
  return { ...a, ...b };
}
