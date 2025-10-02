const path = require('path');

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/backend/tests/**/*.test.js'],
  setupFilesAfterEnv: [path.join(__dirname, 'tests', 'jest.setup.js')],
};
