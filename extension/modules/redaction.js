/**
 * @file PII redaction module
 * Handles redaction of personally identifiable information from payloads
 */

/**
 * Built-in redaction patterns for common PII
 */
const BUILTIN_PATTERNS = [
    // Email addresses
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    // Credit card numbers (simple pattern)
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    // Social security numbers
    /\b\d{3}-\d{2}-\d{4}\b/g,
    // Phone numbers
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    // API keys/tokens (common patterns)
    /\b[A-Za-z0-9]{32,}\b/g,
];

/**
 * Redact PII from an object using built-in and custom rules
 * @param {any} obj - Object to redact
 * @param {string[]} customRules - Custom redaction rules (regex strings)
 * @returns {any} Redacted object
 */
export function redactPII(obj, customRules = []) {
    // Compile custom rules
    const customPatterns = customRules.map((rule) => {
        try {
            return new RegExp(rule, 'g');
        } catch {
            return null;
        }
    }).filter(Boolean);

    const allPatterns = [...BUILTIN_PATTERNS, ...customPatterns];

    return redactValue(obj, allPatterns);
}

/**
 * Recursively redact a value
 * @param {any} val - Value to redact
 * @param {RegExp[]} patterns - Redaction patterns
 * @returns {any} Redacted value
 */
function redactValue(val, patterns) {
    if (val === null || val === undefined) return val;

    if (typeof val === 'string') {
        let result = val;
        for (const pattern of patterns) {
            result = result.replace(pattern, '[REDACTED]');
        }
        return result;
    }

    if (Array.isArray(val)) {
        return val.map((item) => redactValue(item, patterns));
    }

    if (typeof val === 'object') {
        const redacted = {};
        for (const [key, value] of Object.entries(val)) {
            redacted[key] = redactValue(value, patterns);
        }
        return redacted;
    }

    return val;
}
