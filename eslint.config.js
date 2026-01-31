/* eslint-env node */
module.exports = [
  {
    ignores: ['node_modules', 'coverage', 'public', '**/*.test.js'],
  },
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { console: 'readonly', process: 'readonly', module: 'readonly', require: 'readonly', __dirname: 'readonly', __filename: 'readonly' },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];
