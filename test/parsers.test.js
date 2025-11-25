import { describe, it, expect } from 'vitest';
import { defaultExtractors } from '../extension/parsers.js';

describe('parsers defaultExtractors', () => {
  it('has td-events extractor that recognizes events array and summarizes sample', () => {
    const ex = defaultExtractors.find((e) => e.name === 'td-events');
    expect(ex).toBeTruthy();

    const bodyObj = {
      events: [
        { td_client_id: 'c1', val: 1 },
        { td_client_id: 'c2', val: 2 },
        { td_client_id: 'c3', val: 3 },
        { td_client_id: 'c4', val: 4 },
      ],
    };
    const ctx = {
      bodyObj,
      customFields: { 'td-events': { keys: ['td_client_id'], sampleCount: 2 } },
    };
    expect(ex.match(ctx)).toBe(true);
    const summary = ex.summarize(ctx);
    expect(summary).toHaveProperty('event_count', 4);
    expect(Array.isArray(summary.sample)).toBe(true);
    expect(summary.sample).toHaveLength(2);
    expect(summary.sample[0]).toHaveProperty('td_client_id', 'c1');
  });

  it('summarizer truncates long strings and caps arrays/objects', () => {
    const makeSumm = defaultExtractors.slice().pop(); // fallback generic uses summarizer
    const longString = 'x'.repeat(2000);
    const bodyObj = {
      long: longString,
      arr: Array.from({ length: 20 }, (_, i) => i),
      obj: Object.fromEntries(Array.from({ length: 50 }, (_, i) => [`k${i}`, i])),
    };
    const ctx = {
      bodyObj,
      customFields: { generic: { maxString: 100, maxArrayItems: 5, maxObjectKeys: 10 } },
    };

    // Call generic summarizer directly via its summarize
    const summary = makeSumm.summarize(ctx);

    // long string should be truncated
    expect(summary.long.length).toBeLessThan(2000);
    expect(summary.arr.length).toBeLessThanOrEqual(6); // 5 items + __more__
    // object should have <= 11 (10 keys + __more__)
    const objKeys = Object.keys(summary.obj);
    expect(objKeys.length).toBeLessThanOrEqual(11);
  });

  describe('edge cases', () => {
    it('handles empty events array', () => {
      const ex = defaultExtractors.find((e) => e.name === 'td-events');
      const bodyObj = { events: [] };
      const ctx = { bodyObj, customFields: {} };

      expect(ex.match(ctx)).toBe(true);
      const summary = ex.summarize(ctx);
      expect(summary.event_count).toBe(0);
      expect(summary.sample).toHaveLength(0);
    });

    it('handles null/undefined values in events', () => {
      const ex = defaultExtractors.find((e) => e.name === 'td-events');
      const bodyObj = { events: [null, undefined, { td_client_id: 'c1' }] };
      const ctx = { bodyObj, customFields: { 'td-events': { keys: ['td_client_id'] } } };

      const summary = ex.summarize(ctx);
      expect(summary.event_count).toBe(3);
      expect(summary.sample).toHaveLength(3);
    });

    it('handles very large payloads with truncation', () => {
      const ex = defaultExtractors.find((e) => e.name === 'td-events');
      const longString = 'x'.repeat(2000);
      const bodyObj = { events: [{ long_field: longString }] };
      const ctx = {
        bodyObj,
        customFields: { 'td-events': { keys: ['long_field'], maxString: 100 } },
      };

      const summary = ex.summarize(ctx);
      expect(summary.sample[0].long_field.length).toBeLessThan(2000);
      expect(summary.sample[0].long_field).toContain('…');
    });

    it('handles special characters in strings', () => {
      const ex = defaultExtractors.find((e) => e.name === 'td-events');
      const bodyObj = { events: [{ text: 'Hello \"World\" \n\t\r' }] };
      const ctx = { bodyObj, customFields: { 'td-events': { keys: ['text'] } } };

      const summary = ex.summarize(ctx);
      expect(summary.sample[0].text).toBe('Hello \"World\" \n\t\r');
    });

    it('handles deeply nested objects with maxObjectKeys', () => {
      const ex = defaultExtractors.find((e) => e.name === 'generic');
      const bodyObj = Object.fromEntries(Array.from({ length: 50 }, (_, i) => [`k${i}`, i]));
      const ctx = { bodyObj, customFields: { generic: { maxObjectKeys: 10 } } };

      const summary = ex.summarize(ctx);
      const keys = Object.keys(summary);
      expect(keys.length).toBeLessThanOrEqual(11); // 10 keys + __more__
      if (keys.length === 11) {
        expect(summary.__more__).toContain('keys');
      }
    });

    it('handles arrays with maxArrayItems', () => {
      const ex = defaultExtractors.find((e) => e.name === 'generic');
      const bodyObj = { items: Array.from({ length: 20 }, (_, i) => i) };
      const ctx = { bodyObj, customFields: { generic: { maxArrayItems: 5 } } };

      const summary = ex.summarize(ctx);
      expect(summary.items.length).toBeLessThanOrEqual(6); // 5 items + __more__
    });
  });
});
