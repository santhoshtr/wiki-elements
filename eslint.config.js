import globals from 'globals'
import pluginJs from '@eslint/js'
import importPlugin from 'eslint-plugin-import'
import prettier from 'eslint-config-prettier'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        ignores: ['.git/*', 'src/libs/*', '.vscode/*', 'coverage/*', 'dist/*', 'node_modules/*'],
    },
    importPlugin.flatConfigs.recommended,
    pluginJs.configs.recommended,
    prettier,
    {
        files: ['src/**/*.{js,mjs,cjs,ts,cts,mts}'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.es2021,
            },
            parserOptions: {
                ecmaVersion: 2020,
            },
        },
        plugins: { 'simple-import-sort': simpleImportSort },
        rules: {
            'no-warning-comments': ['warn', { terms: ['todo', 'fixme', '@@@'] }],
            'simple-import-sort/imports': 'warn',
            'simple-import-sort/exports': 'warn',
            'import/first': 'warn',
            'import/newline-after-import': 'warn',
            'import/no-duplicates': ['error', { 'prefer-inline': true }],
            'import/order': 'off',
        },
    },
]
