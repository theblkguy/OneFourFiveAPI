/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/openapi/**'],
  coverageDirectory: 'coverage',
  verbose: true,
};
