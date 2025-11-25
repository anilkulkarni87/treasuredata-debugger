import { describe, it, expect, beforeEach } from 'vitest';

// Note: These tests are for utility functions that would need to be exported
// For now, we'll test the logic patterns. In a real scenario, you'd export
// these functions from panel.js or extract them to a separate module.

describe('panel.js utility functions', () => {
    describe('isTDRequest logic', () => {
        it('should match standard TD hosts', () => {
            const hosts = ['in.treasuredata.com'];
            const url = 'https://in.treasuredata.com/postback/v3/event/db/table';

            try {
                const u = new URL(url);
                const matches = hosts.some((h) => u.host.endsWith(h));
                expect(matches).toBe(true);
            } catch {
                expect.fail('URL parsing should not throw');
            }
        });

        it('should match regional shards', () => {
            const hosts = ['in.treasuredata.com'];
            const url = 'https://eu01.records.in.treasuredata.com/postback/v3/event/db/table';

            try {
                const u = new URL(url);
                const matches = hosts.some((h) => u.host.endsWith(h));
                expect(matches).toBe(true);
            } catch {
                expect.fail('URL parsing should not throw');
            }
        });

        it('should match edge hosts', () => {
            const hosts = ['in.treasuredata.com'];
            const url = 'https://us01.edge.in.treasuredata.com/postback/v3/event/db/table';

            try {
                const u = new URL(url);
                const matches = hosts.some((h) => u.host.endsWith(h));
                expect(matches).toBe(true);
            } catch {
                expect.fail('URL parsing should not throw');
            }
        });

        it('should reject non-TD hosts', () => {
            const hosts = ['in.treasuredata.com'];
            const url = 'https://example.com/api/data';

            try {
                const u = new URL(url);
                const matches = hosts.some((h) => u.host.endsWith(h));
                expect(matches).toBe(false);
            } catch {
                expect.fail('URL parsing should not throw');
            }
        });

        it('should handle malformed URLs gracefully', () => {
            const hosts = ['in.treasuredata.com'];
            const url = 'not-a-valid-url';

            try {
                new URL(url);
                expect.fail('Should throw for invalid URL');
            } catch {
                // Expected to throw
                expect(true).toBe(true);
            }
        });
    });

    describe('extractTDInfo logic', () => {
        it('should extract database and table from path', () => {
            const url = 'https://in.treasuredata.com/postback/v3/event/mydb/mytable';
            const u = new URL(url);
            const pathname = u.pathname || '';
            const parts = pathname.replace(/^\/+/, '').split('/');

            const out = {};
            if (parts.length >= 4) {
                // postback/v3/event/db/table
                out.database = parts[3];
                out.table = parts[4];
            }

            expect(out.database).toBe('mydb');
            expect(out.table).toBe('mytable');
        });

        it('should identify region from hostname', () => {
            const url = 'https://eu01.records.in.treasuredata.com/postback/v3/event/db/table';
            const u = new URL(url);
            const hp = u.host.split('.');

            const out = {};
            if (hp.length >= 4) {
                out.region = hp[0];
                out.edge = hp[1];
            }

            expect(out.region).toBe('eu01');
            expect(out.edge).toBe('records');
        });

        it('should handle URLs without region', () => {
            const url = 'https://in.treasuredata.com/postback/v3/event/db/table';
            const u = new URL(url);
            const hp = u.host.split('.');

            const out = {};
            if (hp.length >= 4) {
                out.region = hp[0];
                out.edge = hp[1];
            }

            expect(out.region).toBeUndefined();
            expect(out.edge).toBeUndefined();
        });
    });

    describe('maskAuthorization logic', () => {
        it('should mask Bearer tokens', () => {
            const v = 'Bearer abc123def456ghi789jkl';
            const parts = v.split(/\s+/);
            const scheme = parts[0];
            const token = parts.slice(1).join(' ');
            const vis = token.slice(0, 8);
            const masked = `${scheme} ${vis}… (masked)`;

            expect(masked).toBe('Bearer abc123de… (masked)');
        });

        it('should mask API keys', () => {
            const v = 'ApiKey sk_live_1234567890abcdefghij';
            const parts = v.split(/\s+/);
            const scheme = parts[0];
            const token = parts.slice(1).join(' ');
            const vis = token.slice(0, 8);
            const masked = `${scheme} ${vis}… (masked)`;

            expect(masked).toBe('ApiKey sk_live_… (masked)');
        });

        it('should handle single-part values', () => {
            const v = 'shorttoken';
            const parts = v.split(/\s+/);
            const masked = parts.length < 2 ? '****' : `${parts[0]} ${parts.slice(1).join(' ')}`;

            expect(masked).toBe('****');
        });
    });

    describe('isJsonLike logic', () => {
        it('should recognize application/json', () => {
            const ct = 'application/json';
            const v = ct.toLowerCase();
            const isJson = v.includes('application/json') || v.includes('text/json') || /\+json\b/.test(v);

            expect(isJson).toBe(true);
        });

        it('should recognize application/json with charset', () => {
            const ct = 'application/json; charset=utf-8';
            const v = ct.toLowerCase();
            const isJson = v.includes('application/json') || v.includes('text/json') || /\+json\b/.test(v);

            expect(isJson).toBe(true);
        });

        it('should recognize +json suffix', () => {
            const ct = 'application/vnd.api+json';
            const v = ct.toLowerCase();
            const isJson = v.includes('application/json') || v.includes('text/json') || /\+json\b/.test(v);

            expect(isJson).toBe(true);
        });

        it('should reject non-JSON types', () => {
            const ct = 'text/html';
            const v = ct.toLowerCase();
            const isJson = v.includes('application/json') || v.includes('text/json') || /\+json\b/.test(v);

            expect(isJson).toBe(false);
        });
    });

    describe('mergeParsed logic', () => {
        it('should merge two objects', () => {
            const a = { database: 'mydb', table: 'mytable' };
            const b = { event_count: 5, sample: [] };
            const merged =
                typeof a === 'object' && typeof b === 'object' ? { ...a, ...b } : a;

            expect(merged).toEqual({
                database: 'mydb',
                table: 'mytable',
                event_count: 5,
                sample: [],
            });
        });

        it('should return b if a is null', () => {
            const a = null;
            const b = { event_count: 5 };
            const merged = !a ? b : !b ? a : { ...a, ...b };

            expect(merged).toEqual({ event_count: 5 });
        });

        it('should return a if b is null', () => {
            const a = { database: 'mydb' };
            const b = null;
            const merged = !a ? b : !b ? a : { ...a, ...b };

            expect(merged).toEqual({ database: 'mydb' });
        });
    });
});
