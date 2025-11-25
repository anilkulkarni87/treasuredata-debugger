import { describe, it, expect } from 'vitest';

describe('redaction logic', () => {
    // Helper function to simulate redaction
    function applyRedaction(obj, patterns) {
        function rec(x) {
            if (Array.isArray(x)) return x.map(rec);
            if (x && typeof x === 'object') {
                const o = {};
                for (const k of Object.keys(x)) o[k] = rec(x[k]);
                return o;
            }
            if (typeof x === 'string') {
                let s = x;
                for (const p of patterns) s = s.replace(p.re, p.sub);
                return s;
            }
            return x;
        }
        return rec(obj);
    }

    describe('built-in patterns', () => {
        const builtInPatterns = [
            { re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, sub: '***@***' },
            { re: /\b([A-F0-9]{32,}|[A-Za-z0-9_\-]{24,})\b/g, sub: '****' },
        ];

        it('should redact email addresses', () => {
            const obj = {
                email: 'user@example.com',
                message: 'Contact me at john.doe@company.org',
            };

            const redacted = applyRedaction(obj, builtInPatterns);

            expect(redacted.email).toBe('***@***');
            expect(redacted.message).toBe('Contact me at ***@***');
        });

        it('should redact token-like strings (32+ hex chars)', () => {
            const obj = {
                token: 'A1B2C3D4E5F6789012345678901234567890',
            };

            const redacted = applyRedaction(obj, builtInPatterns);

            expect(redacted.token).toBe('****');
        });

        it('should redact long alphanumeric strings (24+ chars)', () => {
            const obj = {
                apiKey: 'sk_live_1234567890abcdefghij',
            };

            const redacted = applyRedaction(obj, builtInPatterns);

            expect(redacted.apiKey).toBe('****');
        });

        it('should handle nested objects', () => {
            const obj = {
                user: {
                    email: 'nested@example.com',
                    profile: {
                        contact: 'deep@nested.com',
                    },
                },
            };

            const redacted = applyRedaction(obj, builtInPatterns);

            expect(redacted.user.email).toBe('***@***');
            expect(redacted.user.profile.contact).toBe('***@***');
        });

        it('should handle arrays', () => {
            const obj = {
                emails: ['first@example.com', 'second@example.com'],
            };

            const redacted = applyRedaction(obj, builtInPatterns);

            expect(redacted.emails[0]).toBe('***@***');
            expect(redacted.emails[1]).toBe('***@***');
        });

        it('should preserve non-PII data', () => {
            const obj = {
                name: 'John Doe',
                age: 30,
                active: true,
                email: 'john@example.com',
            };

            const redacted = applyRedaction(obj, builtInPatterns);

            expect(redacted.name).toBe('John Doe');
            expect(redacted.age).toBe(30);
            expect(redacted.active).toBe(true);
            expect(redacted.email).toBe('***@***');
        });
    });

    describe('custom regex rules', () => {
        it('should apply custom regex patterns', () => {
            const patterns = [
                { re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, sub: '***@***' },
                { re: /\b\d{3}-\d{2}-\d{4}\b/g, sub: 'XXX-XX-XXXX' }, // SSN pattern
            ];

            const obj = {
                ssn: '123-45-6789',
                email: 'user@example.com',
            };

            const redacted = applyRedaction(obj, patterns);

            expect(redacted.ssn).toBe('XXX-XX-XXXX');
            expect(redacted.email).toBe('***@***');
        });

        it('should apply multiple custom patterns', () => {
            const patterns = [
                { re: /\b\d{16}\b/g, sub: '****-****-****-****' }, // Credit card
                { re: /\b\d{3}-\d{3}-\d{4}\b/g, sub: 'XXX-XXX-XXXX' }, // Phone
            ];

            const obj = {
                card: '1234567890123456',
                phone: '555-123-4567',
            };

            const redacted = applyRedaction(obj, patterns);

            expect(redacted.card).toBe('****-****-****-****');
            expect(redacted.phone).toBe('XXX-XXX-XXXX');
        });
    });

    describe('edge cases', () => {
        it('should handle null values', () => {
            const patterns = [
                { re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, sub: '***@***' },
            ];

            const obj = {
                email: null,
                name: 'John',
            };

            const redacted = applyRedaction(obj, patterns);

            expect(redacted.email).toBeNull();
            expect(redacted.name).toBe('John');
        });

        it('should handle undefined values', () => {
            const patterns = [
                { re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, sub: '***@***' },
            ];

            const obj = {
                email: undefined,
                name: 'John',
            };

            const redacted = applyRedaction(obj, patterns);

            expect(redacted.email).toBeUndefined();
            expect(redacted.name).toBe('John');
        });

        it('should handle empty objects', () => {
            const patterns = [
                { re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, sub: '***@***' },
            ];

            const obj = {};

            const redacted = applyRedaction(obj, patterns);

            expect(redacted).toEqual({});
        });

        it('should handle empty arrays', () => {
            const patterns = [
                { re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, sub: '***@***' },
            ];

            const obj = { items: [] };

            const redacted = applyRedaction(obj, patterns);

            expect(redacted.items).toEqual([]);
        });
    });
});
