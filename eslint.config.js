import jsdoc from 'eslint-plugin-jsdoc';

export default [
    {
        files: ['extension/**/*.js', 'test/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                chrome: 'readonly',
                window: 'readonly',
                document: 'readonly',
                URL: 'readonly',
                URLSearchParams: 'readonly',
                Blob: 'readonly',
                RegExp: 'readonly',
                Date: 'readonly',
                JSON: 'readonly',
                Object: 'readonly',
                Array: 'readonly',
                String: 'readonly',
                Number: 'readonly',
                Promise: 'readonly',
                console: 'readonly',
            },
        },
        plugins: {
            jsdoc,
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-console': 'off',
            'jsdoc/check-param-names': 'warn',
            'jsdoc/check-tag-names': 'warn',
            'jsdoc/check-types': 'warn',
            'jsdoc/require-param': 'warn',
            'jsdoc/require-param-description': 'off',
            'jsdoc/require-param-type': 'warn',
            'jsdoc/require-returns': 'warn',
            'jsdoc/require-returns-type': 'warn',
            'jsdoc/require-returns-description': 'off',
        },
    },
];
