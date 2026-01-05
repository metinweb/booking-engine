import crypto from 'crypto'
import logger from '../core/logger.js'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

/**
 * Get encryption key from environment
 * Key must be 32 bytes (64 hex characters)
 */
const getKey = () => {
  const keyHex = process.env.ENCRYPTION_KEY

  if (!keyHex) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }

  if (keyHex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
  }

  return Buffer.from(keyHex, 'hex')
}

/**
 * Encrypt sensitive text using AES-256-GCM
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted string in format: iv:authTag:encryptedData (all hex)
 */
export const encrypt = text => {
  if (!text) return null

  try {
    const key = getKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    // Format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  } catch (error) {
    logger.error('Encryption failed:', error.message)
    throw new Error('Encryption failed')
  }
}

/**
 * Decrypt encrypted text
 * @param {string} encryptedText - Encrypted string in format: iv:authTag:encryptedData
 * @returns {string} Decrypted plain text
 */
export const decrypt = encryptedText => {
  if (!encryptedText) return null

  try {
    const key = getKey()
    const parts = encryptedText.split(':')

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format')
    }

    const [ivHex, authTagHex, encrypted] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    logger.error('Decryption failed:', error.message)
    throw new Error('Decryption failed')
  }
}

/**
 * Check if a string is already encrypted (has the expected format)
 * @param {string} text - Text to check
 * @returns {boolean} True if text appears to be encrypted
 */
export const isEncrypted = text => {
  if (!text || typeof text !== 'string') return false

  const parts = text.split(':')
  if (parts.length !== 3) return false

  const [iv, authTag, data] = parts

  // Check if all parts are valid hex strings with correct lengths
  return (
    iv.length === IV_LENGTH * 2 &&
    authTag.length === AUTH_TAG_LENGTH * 2 &&
    /^[a-f0-9]+$/i.test(iv) &&
    /^[a-f0-9]+$/i.test(authTag) &&
    /^[a-f0-9]+$/i.test(data)
  )
}

/**
 * Generate a new encryption key
 * Use this to generate ENCRYPTION_KEY for .env file
 * @returns {string} 64 character hex string (32 bytes)
 */
export const generateEncryptionKey = () => {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Hash text using SHA-256 (for non-reversible hashing)
 * @param {string} text - Text to hash
 * @returns {string} Hex hash
 */
export const hash = text => {
  return crypto.createHash('sha256').update(text).digest('hex')
}

/**
 * Mask sensitive data for logging/display
 * @param {string} text - Sensitive text to mask
 * @param {number} visibleChars - Number of characters to show at start and end
 * @returns {string} Masked string (e.g., "AK****XY")
 */
export const mask = (text, visibleChars = 2) => {
  if (!text) return '****'
  if (text.length <= visibleChars * 2) return '****'

  const start = text.slice(0, visibleChars)
  const end = text.slice(-visibleChars)
  return `${start}****${end}`
}

export default {
  encrypt,
  decrypt,
  isEncrypted,
  generateEncryptionKey,
  hash,
  mask
}
