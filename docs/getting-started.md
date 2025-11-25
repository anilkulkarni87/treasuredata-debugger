---
layout: default
title: Getting Started
---

# Getting Started

Welcome to the Treasure Data Debugger! This guide will help you install, configure, and start using the extension to debug your Treasure Data implementation.

## 1. Installation

The extension is currently available for installation in Developer Mode.

### Prerequisites
- Google Chrome or Microsoft Edge
- The extension source code (downloaded or cloned)

### Steps
1. **Download the code**:
   ```bash
   git clone https://github.com/anilkulkarni87/treasuredata-debugger.git
   ```
   Or download the ZIP from the repository.

2. **Open Extensions Management**:
   - **Chrome**: Go to `chrome://extensions`
   - **Edge**: Go to `edge://extensions`

3. **Enable Developer Mode**:
   Toggle the "Developer mode" switch in the top right corner.

4. **Load the Extension**:
   - Click the **Load unpacked** button.
   - Select the `extension/` folder from the downloaded code.
   - The "Treasure Data Debugger" card should appear.

---

## 2. Initial Configuration

Before you start debugging, it's helpful to configure a few settings.

1. Open **Chrome DevTools** (`F12` or `Cmd+Option+I` on Mac).
2. Click the **TD Debugger** tab (you may need to click `>>` if it's hidden).
3. Click the **Settings** (⚙️) icon in the top right.

### Recommended Settings
- **TD Hosts**: The default is `treasuredata.com`. If you use a custom domain (CNAME) for tracking, add it here (e.g., `metrics.mysite.com`).
- **Show Preflight**: Turn this **ON** if you are debugging CORS issues. Turn it **OFF** to reduce noise.
- **Show Non-TD**: Keep this **OFF** to see only Treasure Data requests.

---

## 3. Your First Capture

Now you're ready to capture data!

1. Navigate to a page that sends data to Treasure Data.
2. Ensure the **TD Debugger** panel is open.
3. **Reload the page**. *Note: DevTools only captures network requests that happen while it is open.*

You should see rows appearing in the table:
- **Green rows (2xx)**: Successful requests.
- **Red rows (4xx/5xx)**: Failed requests.
- **Blue rows**: Preflight (OPTIONS) requests (if enabled).

### Understanding the Table
- **#**: Request sequence number.
- **Time**: When the request occurred.
- **Method**: HTTP method (POST, GET, etc.).
- **URL**: The endpoint URL.
- **Status**: HTTP status code.
- **Content-Type**: Type of data sent.
- **Parsed Payload**: The decoded data sent to TD.
- **Headers**: Click "View" to see request/response headers.

---

## 4. Next Steps

Now that you're up and running, explore the advanced features:

- [**Features Guide**](features.md): Learn about filtering, comparison, and presets.
- [**Configuration**](configuration.md): Customize extractors and redaction rules.
- [**Troubleshooting**](troubleshooting.md): Solve common issues.
