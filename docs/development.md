---
layout: default
title: Development
---

# Development Guide

This guide is for developers who want to contribute to the Treasure Data Debugger or understand its internal architecture.

## Project Structure

The project follows a modular architecture for maintainability and testability.

```
extension/
├── manifest.json        # Extension manifest (MV3)
├── panel.html          # Main UI entry point
├── panel.js            # Main controller
├── styles.css          # Modern CSS styles
├── modules/            # Core logic modules
│   ├── network.js      # Network capture & processing
│   ├── parsing.js      # Payload parsing & extraction
│   ├── redaction.js    # PII redaction logic
│   ├── rendering.js    # UI rendering & DOM manipulation
│   └── storage.js      # Chrome storage wrapper
└── custom-extractors.js # User-defined logic
```

## Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/anilkulkarni87/treasuredata-debugger.git
   cd treasuredata-debugger
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Run tests**:
   ```bash
   npm test
   ```

## Architecture

### Module Responsibilities

- **Network Module**: Listens to `chrome.devtools.network` events. It handles the initial capture, identifies TD requests, and reads the request body (POST data).
- **Parsing Module**: Takes the raw request data and applies "Extractors" to convert it into a standardized format. It handles JSON, form-data, and NDJSON.
- **Redaction Module**: Applies regex rules to the parsed data to mask sensitive information before rendering.
- **Rendering Module**: Manages the DOM updates for the main table. It handles pagination, row creation, and status badge application.
- **Storage Module**: Wraps `chrome.storage.sync` to provide a clean API for saving/loading preferences and presets.

### Data Flow

1. **Capture**: `network.js` captures a request.
2. **Parse**: `parsing.js` extracts the payload.
3. **Redact**: `redaction.js` masks PII in the payload.
4. **Filter**: `panel.js` checks if the request matches current filters.
5. **Render**: `rendering.js` updates the table if the request matches.

## Testing

We use **Vitest** for unit testing.

- **Run all tests**: `npm test`
- **Watch mode**: `npm run test:watch`
- **Coverage**: `npm run coverage`

Tests are located in the `test/` directory and mirror the structure of the `extension/` directory.

## Code Style

- **Linting**: ESLint is configured to enforce code quality. Run `npm run lint`.
- **Formatting**: Prettier is used for code formatting. Run `npm run format`.

## Release Process

1. Bump version in `extension/manifest.json` and `package.json`.
2. Update `CHANGELOG.md`.
3. Tag the commit: `git tag v1.x.x`.
4. Push tags: `git push origin --tags`.
5. GitHub Actions will automatically build the zip and create a release.
