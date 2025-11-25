---
layout: default
title: Features
---

# Features Guide

Explore the powerful features of the Treasure Data Debugger designed to make your debugging workflow efficient and effective.

<div class="features-grid">
  <div class="feature-card">
    <span class="feature-icon">🔍</span>
    <h3>Smart Filtering</h3>
    <p>Filter by status, database, or use regex to find exactly what you need.</p>
  </div>
  <div class="feature-card">
    <span class="feature-icon">🔄</span>
    <h3>Comparison</h3>
    <p>Compare two requests side-by-side to spot differences instantly.</p>
  </div>
  <div class="feature-card">
    <span class="feature-icon">💾</span>
    <h3>Presets</h3>
    <p>Save your favorite filter configurations for quick access.</p>
  </div>
  <div class="feature-card">
    <span class="feature-icon">🔒</span>
    <h3>Privacy</h3>
    <p>Automatic PII redaction and local-only processing.</p>
  </div>
</div>

---

## Advanced Filtering

The filter bar allows you to narrow down requests quickly.

### Status Filter
Filter requests by their HTTP status code category:
- **All**: Show everything
- **2xx**: Success (e.g., 200 OK)
- **4xx**: Client Errors (e.g., 400 Bad Request)
- **5xx**: Server Errors (e.g., 500 Internal Server Error)

### Database Filter
The extension automatically detects the target database from the request URL or payload. Use the dropdown to show requests for a specific database only.

### Text & Regex Search
Type in the search box to filter by URL or payload content.
- **Simple Text**: Matches any part of the string (case-insensitive).
- **Regex Mode**: Check the `.*` box to use Regular Expressions.
  - Example: `user_id:\s*\d+` to find requests with numeric user IDs.

---

## Request Comparison

Debug intermittent issues or compare environments by comparing two requests.

1. **Select Requests**: Check the boxes next to any two requests in the table.
2. **Click Compare**: The "Compare Selected" button will activate.
3. **Analyze Differences**: The modal shows a side-by-side view highlighting:
   - **Method & Status**: Differences in outcome.
   - **URL**: Path or query parameter changes.
   - **Headers**: Header discrepancies.
   - **Payload**: Deep comparison of the JSON body.

> **Tip**: Differences are automatically highlighted with color-coded indicators.

---

## Filter Presets

Don't waste time re-configuring filters. Save them!

### Creating a Preset
1. Set up your filters (Status, Database, Regex).
2. Click the **Save** (💾) button next to the presets dropdown.
3. Enter a name (e.g., "Failed Payments").

### Using Presets
- Select a preset from the dropdown to instantly apply all saved filters.
- Use the **Delete** (🗑️) button to remove unused presets.
- Presets are synced across your Chrome instances if sync is enabled.

---

## Headers Viewer

Inspect the raw HTTP headers for any request.

- Click the **View** button in the Headers column.
- **Important Headers** (like `Authorization`, `CORS`, `Cookies`) are highlighted.
- **Copy All**: One-click button to copy all headers to your clipboard for sharing.

---

## Data Export

Need to analyze data in Excel or share it with the team?

- **Export CSV**: Downloads the currently filtered table view as a CSV file.
- **Export JSON**: Downloads the full raw data as a JSON file.

> **Note**: Exports respect your current filters. If you've filtered to show only "4xx" errors, the export will only contain those errors.

---

### 4. PII Redaction
Protect sensitive data during debugging.
- **Toggle**: Enable "Redact PII" to automatically mask sensitive patterns.
- **Built-in Rules**: Automatically detects and masks emails, credit cards, and common tokens.
- **Authorization Headers**: When enabled, the `Authorization` header (e.g., `TD1 ...`) is automatically masked in the Headers view.
- **Custom Rules**: Add your own Regex patterns via the "Redaction Rules" link.
Example: `ssn:\d{3}-\d{2}-\d{4}`
