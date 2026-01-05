import axios from 'axios'
import ISMSProvider from '../ISMSProvider.js'

/**
 * Vonage (Nexmo) SMS Provider
 * Documentation: https://developer.vonage.com/messaging/sms/overview
 */
export default class VonageProvider extends ISMSProvider {
  static get providerName() {
    return 'vonage'
  }

  static get displayName() {
    return 'Vonage (Nexmo)'
  }

  static get requiredFields() {
    return [
      { key: 'apiKey', label: 'API Key', type: 'text', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', required: true },
      { key: 'fromNumber', label: 'Gönderici Numara/Adı', type: 'text', required: true }
    ]
  }

  static get supportsBalance() {
    return true
  }

  /**
   * Send SMS via Vonage API
   */
  async send({ phone, message }) {
    const formattedPhone = this.formatPhone(phone)
    const { apiKey, apiSecret, fromNumber } = this.config

    try {
      const response = await axios.post(
        'https://rest.nexmo.com/sms/json',
        {
          api_key: apiKey,
          api_secret: apiSecret,
          to: formattedPhone,
          from: fromNumber,
          text: message,
          type: 'unicode'
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        }
      )

      return this.parseResponse(response.data)
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.messages?.[0]?.['error-text'] || error.message
      }
    }
  }

  /**
   * Get account balance
   */
  async getBalance() {
    const { apiKey, apiSecret } = this.config

    try {
      const response = await axios.get(
        `https://rest.nexmo.com/account/get-balance?api_key=${apiKey}&api_secret=${apiSecret}`,
        { timeout: 30000 }
      )

      return {
        success: true,
        balance: parseFloat(response.data.value),
        currency: 'EUR'
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Validate credentials
   */
  async validateCredentials() {
    try {
      const result = await this.getBalance()
      return {
        success: result.success,
        error: result.error
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Format phone number to international format
   * Input: Any format
   * Output: 905xxxxxxxxx (without +)
   */
  formatPhone(phone) {
    if (!phone) return null

    // Remove all non-numeric characters
    const cleaned = phone.replace(/[^0-9]/g, '')

    // Handle Turkish numbers
    if (cleaned.startsWith('90') && cleaned.length === 12) {
      return cleaned
    } else if (cleaned.startsWith('0') && cleaned.length === 11) {
      return '9' + cleaned
    } else if (cleaned.length === 10 && cleaned.startsWith('5')) {
      return '90' + cleaned
    }

    // Default: assume Turkish number
    return '90' + cleaned.substr(-10)
  }

  /**
   * Parse Vonage response
   */
  parseResponse(data) {
    const message = data.messages?.[0]

    if (message?.status === '0') {
      return {
        success: true,
        messageId: message['message-id']
      }
    }

    return {
      success: false,
      code: message?.status,
      error: this.getErrorMessage(message?.status) || message?.['error-text']
    }
  }

  /**
   * Get error message for Vonage error code
   */
  getErrorMessage(code) {
    const errorMessages = {
      1: 'Akış sınırlandırıldı',
      2: 'Parametre eksik',
      3: 'Geçersiz parametre',
      4: 'Geçersiz kimlik bilgileri',
      5: 'İç hata',
      6: 'Geçersiz mesaj',
      7: 'Numara yasaklı',
      8: 'Hesap yasaklı',
      9: 'Partner kotası aşıldı',
      10: 'Çok fazla bağlı istek',
      11: 'REST ile kullanılamaz',
      12: 'Mesaj çok uzun',
      15: 'Geçersiz gönderici adresi',
      22: 'Geçersiz ağ kodu',
      23: 'Geçersiz callback URL',
      29: 'Tekrarlanan numara'
    }

    return errorMessages[code]
  }
}
