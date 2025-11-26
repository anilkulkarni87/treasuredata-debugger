---
layout: default
title: Home
---

# Treasure Data Debugger

**Modern Chrome DevTools Extension for Treasure Data Request Debugging**

A powerful, privacy-first Chrome/Edge DevTools panel for inspecting and debugging Treasure Data browser SDK network calls. Built with Manifest V3, featuring advanced filtering, request comparison, and a modern UI.

---

## ✨ Key Features

![Main Interface](assets/screenshots/main-interface.png)

### 🔍 **Advanced Request Capture**

- Automatic detection of Treasure Data requests
- Support for multiple TD regions and shards
- CORS preflight handling
- Non-TD request filtering

### 🎯 **Smart Filtering**

- Text and regex search
- Status code filtering (2xx, 3xx, 4xx, 5xx)
- Database-specific filtering
- Saveable filter presets with sync

### 🔄 **Request Comparison**

- Side-by-side request comparison
- Automatic difference detection
- Headers and payload comparison
- Visual diff indicators

### 📊 **Data Export**

- CSV export for analysis
- JSON export for processing
- Filtered export support
- Batch operations

### 🔒 **Privacy & Security**

- 100% local processing
- No telemetry or tracking
- Authorization header masking
- PII redaction (built-in + custom rules)

### ⚡ **Performance**

- Pagination for large datasets
- Optimized rendering
- Efficient filtering
- Minimal memory footprint

---

## 🚀 Quick Start

### Installation

1. Download or clone this repository
2. Open Chrome/Edge and navigate to `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** and select the `extension/` folder
5. Open DevTools on your site → switch to **TD Debugger** tab

### First Capture

1. Configure **TD Hosts** (e.g., `treasuredata.com`)
2. Reload your page with DevTools open
3. Watch requests appear in the table
4. Use filters to find specific requests
5. Click **Headers** or **Compare** for detailed analysis

[**→ Full Getting Started Guide**](getting-started.md)

---

## 📚 Documentation

- [**Getting Started**](getting-started.md) - Complete installation and setup guide
- [**Features**](features.md) - Comprehensive feature documentation
- [**Configuration**](configuration.md) - Settings and customization
- [**Development**](development.md) - Contributing and development guide
- [**API Reference**](api.md) - Custom extractor API
- [**Troubleshooting**](troubleshooting.md) - Common issues and solutions

---

## 🎨 Modern UI

The extension features a contemporary design with:

- Dark theme support (auto-detect system preference)
- Gradient headers and glassmorphic effects
- Smooth animations and transitions
- Color-coded status badges
- Responsive layout

---

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](../CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/anilkulkarni87/treasuredata-debugger.git

# Install dependencies
npm install

# Run tests
npm test

# Run linter
npm run lint
```

---

## 📄 License

MIT © 2025

---

## 🔗 Links

- [GitHub Repository](https://github.com/anilkulkarni87/treasuredata-debugger)
- [Issue Tracker](https://github.com/anilkulkarni87/treasuredata-debugger/issues)
- [Changelog](../CHANGELOG.md)
- [Security Policy](../SECURITY.md)
