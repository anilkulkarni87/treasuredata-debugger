---
layout: default
title: API Reference
---

# API Reference

This reference documents the API for creating custom extractors in `custom-extractors.js`.

## Extractor Interface

An extractor is a JavaScript object that must implement two methods: `match` and `extract`.

```javascript
interface Extractor {
  /**
   * Determines if this extractor should handle the request.
   * @param {Object} request - The network request object
   * @returns {boolean} True if this extractor handles the request
   */
  match(request: Request): boolean;

  /**
   * Parses the request into a standardized format.
   * @param {Object} request - The network request object
   * @returns {Object} The parsed payload
   */
  extract(request: Request): Object;
}
```

## Request Object

The `request` object passed to both methods contains:

| Property | Type | Description |
|----------|------|-------------|
| `url` | `string` | The full URL of the request |
| `method` | `string` | HTTP method (GET, POST, etc.) |
| `postData` | `string` | The raw request body (for POST/PUT) |
| `requestHeaders` | `Array` | List of request headers |

## Standard Output Format

The `extract` method should return an object with these recommended properties (though any JSON object is valid):

```javascript
{
  database: "string",   // Target database name
  table: "string",      // Target table name
  events: [             // Array of event objects
    {
      key1: "value1",
      ...
    }
  ]
}
```

## Examples

### Basic JSON Extractor

```javascript
export const jsonExtractor = {
  match: (req) => req.url.includes('/api/v1/track'),
  extract: (req) => {
    try {
      return JSON.parse(req.postData);
    } catch (e) {
      return { error: 'Invalid JSON' };
    }
  }
};
```

### Query Parameter Extractor

```javascript
export const queryExtractor = {
  match: (req) => req.method === 'GET' && req.url.includes('/pixel'),
  extract: (req) => {
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams);
    return {
      event: 'pageview',
      ...params
    };
  }
};
```
