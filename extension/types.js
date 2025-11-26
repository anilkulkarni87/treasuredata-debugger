/**
 * @file Type definitions for Treasure Data Debugger
 * Central location for JSDoc typedefs used across the extension.
 */

/**
 * Context object passed to extractor functions
 * @typedef {object} ExtractorContext
 * @property {any} bodyObj - Parsed request/response body (JSON object, array, or primitive)
 * @property {Record<string, ExtractorConfig>} customFields - User configuration per extractor name
 */

/**
 * Configuration for a specific extractor
 * @typedef {object} ExtractorConfig
 * @property {string[]} [keys] - Always include these keys if present
 * @property {string[]} [exclude] - Never include these keys (when includeAll=true)
 * @property {boolean} [includeAll] - Include all keys except excluded ones
 * @property {number} [sampleCount] - Number of events/records to show in sample
 * @property {number} [maxString] - Maximum string length before truncation
 * @property {number} [maxArrayItems] - Maximum array items to show
 * @property {number} [maxObjectKeys] - Maximum object keys to show
 */

/**
 * Extractor interface - matches and summarizes request payloads
 * @typedef {object} Extractor
 * @property {string} name - Unique identifier for this extractor
 * @property {(ctx: ExtractorContext) => boolean} match - Returns true if this extractor should process the payload
 * @property {(ctx: ExtractorContext) => any} summarize - Extracts and summarizes data from the payload
 */

/**
 * Captured network request entry
 * @typedef {object} Entry
 * @property {number} idx - Sequential capture index
 * @property {number} time - Timestamp (epoch milliseconds) when captured
 * @property {string} method - HTTP method (GET, POST, etc.)
 * @property {string} url - Full request URL
 * @property {number|string} status - HTTP status code or string
 * @property {string} contentType - Content-Type header value
 * @property {any} parsed - Summarized payload from extractor
 * @property {boolean} preflight - True if this is a CORS preflight (OPTIONS) request
 * @property {Record<string, string>} [tdInfo] - Extracted TD metadata (database, table, region, etc.)
 * @property {Array<{name: string, value: string}>} [requestHeaders] - Request headers
 * @property {Array<{name: string, value: string}>} [responseHeaders] - Response headers
 */

/**
 * Extracted Treasure Data metadata from URL
 * @typedef {object} TDInfo
 * @property {string|null} database - Database name from path
 * @property {string|null} table - Table name from path
 * @property {string|null} region - Region identifier (e.g., 'us01', 'eu01')
 * @property {string|null} edge - Edge/records endpoint type
 * @property {string} path - URL pathname
 * @property {string} query - URL query string
 */

/**
 * Redaction rule pattern
 * @typedef {object} RedactionRule
 * @property {RegExp} pattern - Regular expression to match
 * @property {string} replacement - Replacement string (default: '[REDACTED]')
 */

/**
 * Summarizer utility functions
 * @typedef {object} Summarizer
 * @property {(value: any) => any} summarizeValue - Recursively summarize a value with caps
 */

export {};
