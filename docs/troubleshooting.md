---
layout: default
title: Troubleshooting
---

# Troubleshooting

Common issues and solutions for the Treasure Data Debugger.

## Capture Issues

### "I don't see any requests"

1. **Is the panel open?**
   DevTools only captures network traffic while it is open. Open the panel first, then reload the page.

2. **Is the filter too strict?**
   Check if you have text in the filter box or a specific database selected. Clear all filters to see everything.

3. **Check TD Hosts setting**
   Go to Settings and ensure `TD Hosts` includes the domain you are tracking to (e.g., `treasuredata.com`).

4. **Is it a non-TD request?**
   If you are trying to debug a request that doesn't go to a standard TD endpoint, enable **Show Non-TD** in Settings.

### "Payload says [No Payload]"

- This usually happens for GET requests that don't have a body.
- If it's a POST request, ensure the Content-Type header is supported (JSON, Form Data, or Text).

## Display Issues

### "The table is empty but requests are happening"

- Try clicking the **Clear** (🚫) button and reloading.
- Ensure you haven't scrolled far down; check the pagination controls.

### "Comparison view looks broken"

- Ensure you have selected exactly two requests.
- If the modal doesn't appear, check if another modal (like Settings) is already open.

## Extension Issues

### "Settings aren't saving"

- The extension uses `chrome.storage.sync`. Ensure you are signed into Chrome and sync is enabled if you want settings to persist across devices.
- If local saving fails, check if your local storage is full.

### "Performance is slow"

- If you have thousands of requests, try reducing the **Page Size** to 50 or 100.
- Use the **Clear** button periodically to free up memory.

---

## Still stuck?

If you've tried these steps and still have issues, please [open an issue on GitHub](https://github.com/anilkulkarni87/treasuredata-debugger/issues) with:

1. Your browser version
2. Extension version
3. Steps to reproduce the problem
