export default [
  {
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:prettier/recommended',
    ],
    env: {
      node: true,
      es6: true,
    },
    parserOptions: {
      ecmaVersion: 2021,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
];
