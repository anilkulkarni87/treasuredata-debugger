# Privacy Policy — Treasure Data Debugger (MV3)

**Last updated:** 2025-11-04

Treasure Data Debugger (“the Extension”) is a Chrome/Edge DevTools panel that helps developers inspect their own network traffic for Treasure Data integrations. The Extension is **local-only** and does **not** send any data to external servers controlled by the developer.

## What data we collect

- **We do not collect, transmit, sell, or share any personal data.**
- All parsing and display of request/response data happen **inside your browser’s DevTools** while you have the panel open.

## How the Extension works

- The Extension listens to network activity in the active DevTools session and renders request/response details locally.
- Optional features such as redaction rules and field configuration are stored via `chrome.storage` in your browser profile and are **not** transmitted to us.

## Data use & retention

- **No data leaves your machine.**
- The Extension does not retain logs or payloads beyond the current DevTools session. Configuration settings (e.g., hosts list, checkboxes, custom field settings) persist locally until you clear them or uninstall the Extension.

## Sharing of data

- **No data is shared** with any third parties.
- The Extension uses no analytics, no trackers, no third-party SDKs.

## Permissions

- **DevTools**: required to create a custom DevTools panel and read network requests while DevTools is open.
- **Storage**: used only to save your local settings (hosts, filters, redaction rules, toggles).
- **Host permissions**: listed so that the panel can recognize Treasure Data endpoints in your local DevTools view. These do not cause outbound transmissions from the Extension.

## Security

- The Extension masks sensitive authorization headers in the UI by default.
- You can add your own redaction regexes for extra masking during display.

## Children’s privacy

- The Extension is a developer tool and is **not intended for children**.

## Your choices

- You can clear settings in the panel or remove the Extension at any time via `chrome://extensions`.
- If you export settings, the file is generated locally and downloaded to your machine only.

## Contact

For privacy questions or requests, contact: **anil77k@gmail.com**.

---
