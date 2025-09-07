// @ts-check

import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      '**/node_modules/**',
      'dist/**',
      'resources/**'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
      }
    },
    rules: {
      '@typescript-eslint/array-type': 'error'
    }
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest'
    }
  }
];
