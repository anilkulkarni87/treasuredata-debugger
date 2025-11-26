# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Phase 2: Accessibility improvements with ARIA labels and keyboard navigation
- Phase 2: Visual feedback with loading indicators and toast notifications
- Phase 2: Comprehensive documentation (CONTRIBUTING.md, CHANGELOG.md, SECURITY.md)
- Phase 2: Security hardening with CSP and input validation

## [3.1.3] - 2025-01-25

### Added

- Phase 1: JSDoc type definitions for all core functions
- Phase 1: Comprehensive error handling with try-catch blocks and error state tracking
- Phase 1: ESLint and Prettier setup for code quality
- Phase 1: Expanded test coverage from 2 to 38 test cases
- Phase 1: EditorConfig for consistent formatting across editors
- Phase 1: npm scripts for linting, formatting, and testing
- Test coverage reporting with vitest/coverage-v8
- Detailed console logging for debugging parse errors

### Changed

- Formatted background.js from minified to readable format
- Updated .gitignore with coverage, logs, and environment files
- Improved error messages with context and stack traces

### Fixed

- HTML syntax error in panel.html (pre tag inside p tag)
- Network listener now handles parse errors gracefully
- Entries with parse errors now display error state in UI

## [3.1.2] - 2024-XX-XX

### Added

- Preflight request toggle (show/hide OPTIONS requests)
- Redaction rules editor for custom PII patterns
- Import/Export settings functionality
- URL intelligence (database, table, region, edge detection)

### Changed

- Improved settings UI with JSON editor
- Enhanced payload summarization with configurable caps

## [3.1.0] - 2024-XX-XX

### Added

- Manifest V3 support
- Generic parsing with multiple extractors
- Settings UI for keys of interest
- CSV export functionality
- Filter box for requests
- Status color coding (2xx green, 4xx/5xx red)

### Changed

- Migrated from MV2 to MV3 architecture
- Redesigned panel UI for better usability

## [3.0.0] - 2024-XX-XX

### Added

- Initial MV3 release
- DevTools panel for TD request inspection
- Support for events, records, and record payloads
- Authorization header masking
- Local-only processing (no telemetry)

### Changed

- Complete rewrite for Manifest V3
- New pluggable extractor system

### Removed

- MV2 compatibility

---

## Release Notes

### Version 3.1.3 - Foundation Improvements

This release focuses on code quality, type safety, and developer experience:

- **Type Safety**: All functions now have JSDoc annotations for better IDE support
- **Error Handling**: Comprehensive error handling prevents crashes and provides visibility
- **Testing**: 38 test cases covering core functionality and edge cases
- **Tooling**: Professional development setup with ESLint, Prettier, and automated scripts

### Version 3.1.2 - Enhanced Features

Added preflight toggle, redaction rules editor, and import/export functionality.

### Version 3.1.0 - Settings & Export

Introduced settings UI, CSV export, and improved filtering capabilities.

### Version 3.0.0 - MV3 Migration

Complete rewrite for Manifest V3 with pluggable architecture.

---

## Upgrade Guide

### From 3.1.2 to 3.1.3

No breaking changes. Simply update the extension:

1. Pull latest code
2. Run `npm install` to get new dev dependencies
3. Reload extension in browser

New npm scripts available:

- `npm run lint` - Check code quality
- `npm run format` - Format code
- `npm test` - Run tests

### From 3.1.0 to 3.1.2

No breaking changes. Settings format remains compatible.

### From 3.0.x to 3.1.0

Settings schema changed. Export your settings before upgrading, then re-import.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

MIT © 2025
