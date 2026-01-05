export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.js', '**/__tests__/**/*.spec.js'],
  forceExit: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/__tests__/**',
    '!src/scripts/**',
    '!src/migrations/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 5,
      functions: 5,
      lines: 5,
      statements: 5
    }
  },
  modulePathIgnorePatterns: ['<rootDir>/node_modules/'],
  transform: {},
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
  testTimeout: 10000,
  verbose: true
}
