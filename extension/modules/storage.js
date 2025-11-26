/**
 * @file Chrome storage operations module
 * Handles all interactions with Chrome's sync storage API
 */

/**
 * Load all preferences from Chrome storage
 * @returns {Promise<Object>} Preferences object with all settings
 */
export async function loadPrefs() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      [
        'tdHosts',
        'showNonTD',
        'showPreflight',
        'customFields',
        'redactionRules',
        'filterPresets',
        'tdFilter',
        'tdRedact',
      ],
      (res) => resolve(res)
    );
  });
}

/**
 * Save preferences to Chrome storage
 * @param {Object} prefs - Preferences object to save
 * @returns {Promise<void>}
 */
export async function savePrefs(prefs) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(prefs, resolve);
  });
}

/**
 * Load custom extractor fields from storage
 * @returns {Promise<Object>} Custom fields configuration
 */
export async function loadCustomExtractors() {
  const { customFields } = await loadPrefs();
  return customFields || {};
}

/**
 * Load redaction rules from storage
 * @returns {Promise<string[]>} Array of redaction rule strings
 */
export async function loadRedactionRules() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['redactionRules'], (res) => {
      resolve(res.redactionRules || []);
    });
  });
}

/**
 * Save redaction rules to storage
 * @param {string[]} rules - Array of redaction rule strings
 * @returns {Promise<void>}
 */
export async function saveRedactionRules(rules) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ redactionRules: rules }, resolve);
  });
}

/**
 * Load filter presets from storage
 * @returns {Promise<Object>} Filter presets object
 */
export async function loadFilterPresets() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['filterPresets'], (res) => {
      resolve(res.filterPresets || {});
    });
  });
}

/**
 * Save filter presets to storage
 * @param {Object} presets - Filter presets object
 * @returns {Promise<void>}
 */
export async function saveFilterPresets(presets) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ filterPresets: presets }, resolve);
  });
}
