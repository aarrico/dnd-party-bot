// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  eslintConfigPrettierRecommended,
  {
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
    },
  }
);
