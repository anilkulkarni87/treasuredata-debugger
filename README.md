# Treasure Data Debugger (MV3) — Preflight-Aware

A lightweight Chrome/Edge **DevTools panel** to inspect **Treasure Data** browser SDK network calls.  
Generic, privacy-first, and ready for teams to share configs.

> Based on concepts from the legacy MV2 project, rebuilt for **Manifest V3** with a pluggable design.

## Highlights
- **Generic parsing** with extractors for:
  - `{"events":[...]}` (TD JS SDK style)
  - `{"records":[...]}` and `{"record":{...}}`
  - **Fallback**: returns parsed object as-is
- **Settings UI** (zero-code) to pick **keys of interest** and optional `"includeAll": true`
- **Import/Export Settings** as JSON (easy to share across teams)
- **Redaction Rules** editor (adds to built-in email/token masking)
- **CORS Preflight toggle** — hide `OPTIONS` by default, show when debugging CORS
- URL intelligence: `(database, table, region, edge, path, query)`
- Filter box, status colors, CSV export
- **Authorization masked**, **local-only**, **no telemetry**

## Privacy

This tool runs **entirely locally** inside the DevTools window:
- No analytics, no remote logging, no outbound calls from the panel.
- `Authorization` header is masked in the UI.
- Redaction masks common PII (emails, token-like strings) and your custom regex rules.

## Install (Developer Mode)
1. Go to `chrome://extensions` (Edge: `edge://extensions`) and enable **Developer mode**.
2. Click **Load unpacked** and select the `extension/` folder.
3. Open DevTools on your site → switch to **TD Debugger** → reload the page.

## Usage Tips
- Set **TD Hosts** to a broad suffix like `treasuredata.com` to catch all shards (`eu01.records.in.treasuredata.com`, etc.).
- Open the panel **before** reloading the page (DevTools streams events only while open).
- Use **Settings → includeAll** when exploring new schemas; then narrow down keys of interest.
- Toggle **Show preflights** on when debugging CORS headers, off for a clean timeline.

## Configuration (Settings JSON)
Example:
```json
{
  "td-events": {
    "keys": ["td_client_id","td_global_id","td_title","td_url"],
    "includeAll": true
  }
}
```

## Import/Export
Use the header buttons:
- **Export** → downloads `td-debugger-settings.json`
- **Import** → loads the same JSON (supports `customFields`, `redactionRules`, `tdHosts`, `showNonTD`, `showPreflight`, `tdFilter`, `tdRedact`).

## Development
- Edit files in `extension/`, then **Reload** at `chrome://extensions` after changes.
- Add site- or team-specific logic in `extension/custom-extractors.js` (ignored by default) to avoid forks.

## Release via GitHub Actions
Tagging a commit zips `extension/` and attaches to a GitHub Release.

```bash
# bump version in extension/manifest.json
git add . && git commit -m "v1.0.0" && git tag v1.0.0
git push origin main --tags
```

## Chrome Web Store (optional)
Use the provided workflow to upload/publish via `chrome-webstore-upload-cli`.

**Secrets required:**
- `CWS_EXTENSION_ID`, `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`

## License
MIT © 2025
