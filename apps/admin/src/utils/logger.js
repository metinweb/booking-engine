/**
 * Frontend Logger Utility
 * Provides consistent logging with module prefixes and production control
 */

const isDev = import.meta.env.DEV
const isDebugEnabled = import.meta.env.VITE_DEBUG === 'true'

// Log levels
const LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  SILENT: 4
}

// Current log level based on environment
const currentLevel = isDev ? LEVELS.DEBUG : LEVELS.WARN

/**
 * Create a logger instance with optional module prefix
 * @param {string} module - Module name for prefixing logs
 * @returns {Object} Logger instance with debug, info, warn, error methods
 */
export function createLogger(module = '') {
  const prefix = module ? `[${module}]` : ''

  return {
    debug: (...args) => {
      if (currentLevel <= LEVELS.DEBUG && (isDev || isDebugEnabled)) {
        // eslint-disable-next-line no-console
        console.log(prefix, ...args)
      }
    },

    info: (...args) => {
      if (currentLevel <= LEVELS.INFO) {
        // eslint-disable-next-line no-console
        console.info(prefix, ...args)
      }
    },

    warn: (...args) => {
      if (currentLevel <= LEVELS.WARN) {
        // eslint-disable-next-line no-console
        console.warn(prefix, ...args)
      }
    },

    error: (...args) => {
      if (currentLevel <= LEVELS.ERROR) {
        // eslint-disable-next-line no-console
        console.error(prefix, ...args)
      }
    },

    // Group logging for complex debugging
    group: (label, fn) => {
      if (currentLevel <= LEVELS.DEBUG && isDev) {
        // eslint-disable-next-line no-console
        console.group(`${prefix} ${label}`)
        fn()
        // eslint-disable-next-line no-console
        console.groupEnd()
      }
    },

    // Table logging for arrays/objects
    table: (data, columns) => {
      if (currentLevel <= LEVELS.DEBUG && isDev) {
        // eslint-disable-next-line no-console
        console.table(data, columns)
      }
    },

    // Time tracking
    time: label => {
      if (currentLevel <= LEVELS.DEBUG && isDev) {
        // eslint-disable-next-line no-console
        console.time(`${prefix} ${label}`)
      }
    },

    timeEnd: label => {
      if (currentLevel <= LEVELS.DEBUG && isDev) {
        // eslint-disable-next-line no-console
        console.timeEnd(`${prefix} ${label}`)
      }
    }
  }
}

// Default logger instance (no prefix)
const logger = createLogger()

// Pre-configured loggers for common modules
export const authLogger = createLogger('Auth')
export const apiLogger = createLogger('API')
export const socketLogger = createLogger('Socket')
export const routerLogger = createLogger('Router')
export const storeLogger = createLogger('Store')
export const pmsLogger = createLogger('PMS')

export default logger
