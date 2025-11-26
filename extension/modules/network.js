/**
 * @file Network request capture module
 * Handles Chrome DevTools network listener and request processing
 */

/**
 * @typedef {import('../types.js').Entry} Entry
 * @typedef {import('../types.js').Extractor} Extractor
 */

import { extractTDInfo, isJsonLike, isTDRequest, isPreflight, mergeParsed } from './parsing.js';

/**
 * Attach network listener to capture TD requests
 * @param {object} state - Application state
 * @param {Extractor[]} extractors - Payload extractors
 * @param {Function} onEntry - Callback when entry is captured
 * @param {Function} parsePayload - Payload parsing function
 */
export function attachNetworkListener(state, extractors, onEntry, parsePayload) {
  chrome.devtools.network.onRequestFinished.addListener(async (req) => {
    try {
      const url = req.request?.url || '';
      const method = req.request?.method || '';
      const status = req.response?.status || 0;

      // Filter logic
      const isTD = isTDRequest(url, state.hosts);
      if (!isTD && !state.showNonTD) return;
      if (isPreflight(req) && !state.showPreflight) return;

      // Get POST data (request body)
      const postData = req.request?.postData?.text || '';

      // Get request headers
      const requestHeaders = req.request?.headers || [];
      const ctHdr = requestHeaders.find((h) => (h.name || '').toLowerCase() === 'content-type');
      const requestCT = ctHdr?.value;

      // Get response content type
      const respCT = (req.response?.headers || []).find(
        (h) => (h.name || '').toLowerCase() === 'content-type'
      );
      const contentType = requestCT || respCT?.value || '';

      const idx = ++state.counter;
      const time = Date.now();

      // Extract TD info from URL
      const urlInfo = extractTDInfo(url, requestHeaders);

      // Function to finalize entry with body
      const finalize = async (bodyTextFromResp) => {
        try {
          // Use POST data if available, otherwise use response body
          const raw = postData || bodyTextFromResp || '';
          let bodyParsed = null;

          try {
            // Use the parsePayload function to handle extractors
            bodyParsed = await parsePayload(contentType, raw);
          } catch (parseErr) {
            console.error('[TD Debugger] Parse error:', {
              url,
              contentType,
              error: parseErr.message,
            });
            bodyParsed = {
              __error__: `Parse failed: ${parseErr.message}`,
              __raw_preview__: raw.slice(0, 200),
            };
          }

          // Build TD summary
          const tdSummary = {
            ...(urlInfo.database && { database: urlInfo.database }),
            ...(urlInfo.table && { table: urlInfo.table }),
            ...(urlInfo.region && { region: urlInfo.region }),
            ...(urlInfo.edge && { edge: urlInfo.edge }),
            ...(urlInfo.query && Object.keys(urlInfo.query).length ? { query: urlInfo.query } : {}),
            ...(urlInfo.pathname && { path: urlInfo.pathname }),
            ...(urlInfo.headers && { headers: urlInfo.headers }),
          };

          // Merge TD info with parsed body
          const combined = mergeParsed(tdSummary, bodyParsed);

          // Create entry
          const entry = {
            idx,
            time,
            method,
            url,
            status,
            contentType,
            parsed: combined,
            preflight: method === 'OPTIONS',
            requestHeaders: req.request?.headers || [],
            responseHeaders: req.response?.headers || [],
          };

          // Callback
          onEntry(entry);
        } catch (finalizeErr) {
          console.error('[TD Debugger] Finalize error:', {
            url,
            error: finalizeErr.message,
          });
          // Still add entry with error state
          const entry = {
            idx,
            time,
            method,
            url,
            status,
            contentType,
            parsed: { __error__: `Processing failed: ${finalizeErr.message}` },
            preflight: method === 'OPTIONS',
            requestHeaders: req.request?.headers || [],
            responseHeaders: req.response?.headers || [],
          };
          onEntry(entry);
        }
      };

      // If no POST data, get response body
      if (!postData) {
        req.getContent((body) => finalize(body || ''));
      } else {
        finalize('');
      }
    } catch (err) {
      console.error('[TD Debugger] Network listener error:', {
        error: err.message,
        stack: err.stack,
      });
    }
  });
}
