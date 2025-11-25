/**
 * @file Table rendering and UI update module
 * Handles all table rendering, row creation, and UI updates
 */

/**
 * @typedef {import('../types.js').Entry} Entry
 */

/**
 * Get element by ID
 * @param {string} id - Element ID
 * @returns {HTMLElement|null} Element or null
 */
const $ = (id) => document.getElementById(id);

/**
 * Clear table body
 */
export function clearTable() {
    const body = $('reqBody');
    if (body) body.innerHTML = '';
}

/**
 * Update database filter dropdown with unique databases
 * @param {Entry[]} entries - All entries
 */
export function updateDatabaseFilter(entries) {
    const databases = new Set();
    entries.forEach((e) => {
        if (e.parsed?.database) databases.add(e.parsed.database);
    });

    const dbFilter = $('dbFilter');
    if (dbFilter) {
        const currentValue = dbFilter.value;
        dbFilter.innerHTML = '<option value="">All Databases</option>';
        Array.from(databases)
            .sort()
            .forEach((db) => {
                const opt = document.createElement('option');
                opt.value = db;
                opt.textContent = db;
                dbFilter.appendChild(opt);
            });
        // Restore previous selection if still valid
        if (currentValue && databases.has(currentValue)) {
            dbFilter.value = currentValue;
        }
    }
}

/**
 * Update pagination info display
 * @param {number} totalFiltered - Total filtered entries
 * @param {number} visibleCount - Visible entries count
 * @param {number} maxVisible - Max visible per page
 */
export function updatePaginationInfo(totalFiltered, visibleCount, maxVisible) {
    const paginationInfo = $('paginationInfo');
    if (paginationInfo) {
        if (totalFiltered > maxVisible) {
            const showing = Math.min(visibleCount, totalFiltered);
            paginationInfo.textContent = `Showing ${showing} of ${totalFiltered} entries`;
            paginationInfo.style.display = 'inline';
        } else {
            paginationInfo.style.display = 'none';
        }
    }
}

/**
 * Update pagination button states
 * @param {number} currentPage - Current page number
 * @param {number} totalFiltered - Total filtered entries
 * @param {number} maxVisible - Max visible per page
 */
export function updatePaginationButtons(currentPage, totalFiltered, maxVisible) {
    const prevBtn = $('prevPage');
    const nextBtn = $('nextPage');
    const end = (currentPage + 1) * maxVisible;

    if (prevBtn) prevBtn.disabled = currentPage === 0;
    if (nextBtn) nextBtn.disabled = end >= totalFiltered;
}

/**
 * Render table with entries
 * @param {Entry[]} entries - All entries
 * @param {object} state - Current state
 * @param {Function} matchesFilter - Filter function
 * @param {Function} appendRow - Row append function
 */
export async function renderTable(entries, state, matchesFilter, appendRow) {
    clearTable();

    const filterInput = $('filter');
    const q = filterInput ? filterInput.value.trim() : '';
    const filtered = entries.filter((e) => matchesFilter(e, q));

    // Performance: Pagination
    const start = state.currentPage * state.maxVisible;
    const end = start + state.maxVisible;
    const visible = filtered.slice(start, end);

    // Update pagination UI
    updatePaginationInfo(filtered.length, visible.length, state.maxVisible);
    updatePaginationButtons(state.currentPage, filtered.length, state.maxVisible);

    // Render rows (most recent first)
    for (const e of visible.slice().reverse()) {
        await appendRow(e);
    }
}
