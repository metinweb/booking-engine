import axios from 'axios'
import ISMSProvider from '../ISMSProvider.js'

/**
 * Twilio SMS Provider
 * Documentation: https://www.twilio.com/docs/sms
 */
export default class TwilioProvider extends ISMSProvider {
  static get providerName() {
    return 'twilio'
  }

  static get displayName() {
    return 'Twilio'
  }

  static get requiredFields() {
    return [
      { key: 'accountSid', label: 'Account SID', type: 'text', required: true },
      { key: 'authToken', label: 'Auth Token', type: 'password', required: true },
      { key: 'fromNumber', label: 'Gönderici Numara', type: 'tel', required: true, placeholder: '+1234567890' }
    ]
  }

  static get supportsBalance() {
    return true
  }

  /**
   * Send SMS via Twilio API
   */
  async send({ phone, message }) {
    const formattedPhone = this.formatPhone(phone)
    const { accountSid, authToken, fromNumber } = this.config

    try {
      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        new URLSearchParams({
          To: formattedPhone,
          From: fromNumber,
          Body: message
        }).toString(),
        {
          auth: {
            username: accountSid,
            password: authToken
          },
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 30000
        }
      )

      return this.parseResponse(response.data)
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      }
    }
  }

  /**
   * Get account balance
   */
  async getBalance() {
    const { accountSid, authToken } = this.config

    try {
      const response = await axios.get(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Balance.json`,
        {
          auth: {
            username: accountSid,
            password: authToken
          },
          timeout: 30000
        }
      )

      return {
        success: true,
        balance: parseFloat(response.data.balance),
        currency: response.data.currency
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Validate credentials
   */
  async validateCredentials() {
    const { accountSid, authToken } = this.config

    try {
      const response = await axios.get(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
        {
          auth: {
            username: accountSid,
            password: authToken
          },
          timeout: 30000
        }
      )

      if (response.data.status === 'active') {
        return { success: true }
      }

      return { success: false, error: `Hesap durumu: ${response.data.status}` }
    } catch (error) {
      if (error.response?.status === 401) {
        return { success: false, error: 'Geçersiz kimlik bilgileri' }
      }
      return { success: false, error: error.message }
    }
  }

  /**
   * Format phone number to E.164 format
   * Input: Any format
   * Output: +905xxxxxxxxx
   */
  formatPhone(phone) {
    if (!phone) return null

    // Remove all non-numeric characters except leading +
    let cleaned = phone.replace(/[^0-9+]/g, '')

    // If already starts with +, return as is
    if (cleaned.startsWith('+')) {
      return cleaned
    }

    // Handle Turkish numbers
    if (cleaned.startsWith('90') && cleaned.length === 12) {
      return '+' + cleaned
    } else if (cleaned.startsWith('0') && cleaned.length === 11) {
      return '+9' + cleaned
    } else if (cleaned.length === 10 && cleaned.startsWith('5')) {
      return '+90' + cleaned
    }

    // Default: assume Turkish number
    return '+90' + cleaned.substr(-10)
  }

  /**
   * Parse Twilio response
   */
  parseResponse(data) {
    if (data.sid) {
      return {
        success: true,
        messageId: data.sid
      }
    }

    return {
      success: false,
      error: data.message || 'Mesaj gönderilemedi'
    }
  }

  /**
   * Get error message for Twilio error code
   */
  getErrorMessage(code) {
    const errorMessages = {
      '21211': 'Geçersiz telefon numarası',
      '21608': 'Bölge desteklenmiyor',
      '21610': 'Numara kara listede',
      '21614': 'Numara SMS desteklemiyor',
      '30001': 'Mesaj kuyruğa alınamadı',
      '30002': 'Hesap askıya alınmış',
      '30003': 'Numara erişilemez',
      '30004': 'Mesaj engellendi',
      '30005': 'Bilinmeyen hedef',
      '30006': 'Operatör hatası',
      '30007': 'Mesaj filtre tarafından engellendi',
      '30008': 'Bilinmeyen hata'
    }

    return errorMessages[code]
  }
}
