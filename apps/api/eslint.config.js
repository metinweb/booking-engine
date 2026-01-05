import js from '@eslint/js'
import globals from 'globals'

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021
      }
    },
    rules: {
      // Error prevention
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off', // Allow console in backend
      'no-debugger': 'error',

      // Best practices
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': 'warn',
      'no-multiple-empty-lines': ['warn', { max: 2 }],

      // Async/Await
      'no-async-promise-executor': 'error',
      'no-await-in-loop': 'warn',
      'require-await': 'off', // Sometimes empty async is intentional

      // Code style (minimal - let Prettier handle most)
      semi: ['warn', 'never'],
      quotes: ['warn', 'single', { avoidEscape: true }],
      'comma-dangle': ['warn', 'never'],

      // Node.js specific
      'no-process-exit': 'off', // Sometimes needed in Node
      'no-path-concat': 'error'
    }
  },
  {
    ignores: ['node_modules/**', 'dist/**', 'uploads/**', '*.min.js']
  }
]
