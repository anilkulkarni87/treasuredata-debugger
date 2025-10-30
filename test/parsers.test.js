import { describe, it, expect } from 'vitest';
import { defaultExtractors } from '../extension/parsers.js';

describe('parsers defaultExtractors', () => {
  it('has td-events extractor that recognizes events array and summarizes sample', () => {
    const ex = defaultExtractors.find(e => e.name === 'td-events');
    expect(ex).toBeTruthy();

    const bodyObj = { events: [ { td_client_id: 'c1', val: 1 }, { td_client_id: 'c2', val: 2 }, { td_client_id: 'c3', val: 3 }, { td_client_id: 'c4', val: 4 } ] };
    const ctx = { bodyObj, customFields: { 'td-events': { keys: ['td_client_id'], sampleCount: 2 } } };
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
    const bodyObj = { long: longString, arr: Array.from({ length: 20 }, (_, i) => i), obj: Object.fromEntries(Array.from({ length: 50 }, (_, i) => [`k${i}`, i])) };
    const ctx = { bodyObj, customFields: { 'generic': { maxString: 100, maxArrayItems: 5, maxObjectKeys: 10 } } };

    // Call generic summarizer directly via its summarize
    const summary = makeSumm.summarize(ctx);

    // long string should be truncated
    expect(summary.long.length).toBeLessThan(2000);
    expect(summary.arr.length).toBeLessThanOrEqual(6); // 5 items + __more__
    // object should have <= 11 (10 keys + __more__)
    const objKeys = Object.keys(summary.obj);
    expect(objKeys.length).toBeLessThanOrEqual(11);
  });
});
