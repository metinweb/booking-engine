/**
 * SMS Provider Interface
 * Base class for all SMS providers implementing Strategy Pattern
 */
class ISMSProvider {
  constructor(config) {
    this.config = config
  }

  /**
   * Provider name identifier
   * @returns {string}
   */
  static get providerName() {
    return 'base'
  }

  /**
   * Display name for UI
   * @returns {string}
   */
  static get displayName() {
    return 'Base Provider'
  }

  /**
   * Required configuration fields
   * @returns {Array<{key: string, label: string, type: string, required: boolean}>}
   */
  static get requiredFields() {
    return []
  }

  /**
   * Whether this provider supports balance checking
   * @returns {boolean}
   */
  static get supportsBalance() {
    return false
  }

  /**
   * Send single SMS
   * @param {Object} options
   * @param {string} options.phone - Recipient phone number
   * @param {string} options.message - SMS content
   * @param {string} [options.language] - Language code
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async send({ phone, message, language = 'TR' }) {
    throw new Error('Method not implemented: send()')
  }

  /**
   * Send bulk SMS (same message to multiple recipients)
   * @param {Object} options
   * @param {string[]} options.phones - Array of phone numbers
   * @param {string} options.message - SMS content
   * @param {string} [options.language] - Language code
   * @returns {Promise<Array<{phone: string, success: boolean, messageId?: string, error?: string}>>}
   */
  async sendBulk({ phones, message, language = 'TR' }) {
    const results = []
    for (const phone of phones) {
      try {
        const result = await this.send({ phone, message, language })
        results.push({ phone, ...result })
      } catch (error) {
        results.push({ phone, success: false, error: error.message })
      }
    }
    return results
  }

  /**
   * Get SMS credit balance (if supported)
   * @returns {Promise<{success: boolean, credits?: number, error?: string}>}
   */
  async getBalance() {
    return { success: false, error: 'Balance check not supported by this provider' }
  }

  /**
   * Validate credentials
   * @returns {Promise<{valid: boolean, error?: string}>}
   */
  async validateCredentials() {
    throw new Error('Method not implemented: validateCredentials()')
  }

  /**
   * Format phone number to provider-specific format
   * @param {string} phone - Phone number in any format
   * @returns {string} Formatted phone number
   */
  formatPhone(phone) {
    if (!phone) return null
    // Default: remove non-numeric characters
    return phone.replace(/[^0-9+]/g, '')
  }

  /**
   * Parse provider-specific response
   * @param {any} response - Raw response from provider
   * @returns {Object} Parsed result
   */
  parseResponse(response) {
    throw new Error('Method not implemented: parseResponse()')
  }
}

export default ISMSProvider
