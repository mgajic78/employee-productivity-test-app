module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/indent': ['error', 2],
    'max-len': ['error', {
      code: 120, ignoreComments: true, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true
    }],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-inferrable-types': 'error',
    '@typescript-eslint/no-empty-function': 'error',
    '@typescript-eslint/explicit-function-return-type': 'error',
    'no-multi-spaces': 'error',
    'no-trailing-spaces': 'error',
  },
};