import axios from 'axios'
import ISMSProvider from '../ISMSProvider.js'

/**
 * İleti Merkezi SMS Provider
 * Documentation: https://www.iletimerkezi.com/api-dokumantasyonu
 */
export default class IletiMerkeziProvider extends ISMSProvider {
  static get providerName() {
    return 'iletimerkezi'
  }

  static get displayName() {
    return 'İleti Merkezi'
  }

  static get requiredFields() {
    return [
      { key: 'apiKey', label: 'API Key', type: 'text', required: true },
      { key: 'apiHash', label: 'API Hash', type: 'password', required: true },
      { key: 'sender', label: 'Gönderici Adı', type: 'text', required: true }
    ]
  }

  static get supportsBalance() {
    return true
  }

  /**
   * Send SMS via İleti Merkezi API
   */
  async send({ phone, message }) {
    const formattedPhone = this.formatPhone(phone)

    try {
      const response = await axios.post(
        'https://api.iletimerkezi.com/v1/send-sms/json',
        {
          request: {
            authentication: {
              key: this.config.apiKey,
              hash: this.config.apiHash
            },
            order: {
              sender: this.config.sender,
              message: {
                text: message,
                receipents: {
                  number: [formattedPhone]
                }
              }
            }
          }
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
        error: error.response?.data?.response?.status?.message || error.message
      }
    }
  }

  /**
   * Get SMS credit balance
   */
  async getBalance() {
    try {
      const response = await axios.post(
        'https://api.iletimerkezi.com/v1/get-balance/json',
        {
          request: {
            authentication: {
              key: this.config.apiKey,
              hash: this.config.apiHash
            }
          }
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        }
      )

      const data = response.data
      if (data?.response?.status?.code === '200') {
        return {
          success: true,
          balance: parseFloat(data.response.balance?.sms || 0),
          currency: 'SMS'
        }
      }

      return {
        success: false,
        error: data?.response?.status?.message || 'Bakiye sorgulanamadı'
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
   * Format phone number to İleti Merkezi format
   * Input: Any format (+90 5xx, 05xx, 5xx)
   * Output: 905xxxxxxxxx (12 digits)
   */
  formatPhone(phone) {
    if (!phone) return null

    // Remove all non-numeric characters
    let cleaned = phone.replace(/[^0-9]/g, '')

    // Handle different formats
    if (cleaned.startsWith('90') && cleaned.length === 12) {
      // Already in format: 905xxxxxxxxx
      return cleaned
    } else if (cleaned.startsWith('0') && cleaned.length === 11) {
      // 05xxxxxxxxx -> 905xxxxxxxxx
      return '9' + cleaned
    } else if (cleaned.length === 10 && cleaned.startsWith('5')) {
      // 5xxxxxxxxx -> 905xxxxxxxxx
      return '90' + cleaned
    } else if (cleaned.startsWith('00905') && cleaned.length === 15) {
      // 00905xxxxxxxxx -> 905xxxxxxxxx
      return cleaned.substring(2)
    }

    // Default: prepend 90 to last 10 digits
    return '90' + cleaned.substr(-10)
  }

  /**
   * Parse İleti Merkezi response
   */
  parseResponse(data) {
    const status = data?.response?.status

    if (status?.code === '200') {
      return {
        success: true,
        messageId: data?.response?.order?.id || 'sent'
      }
    }

    return {
      success: false,
      code: status?.code,
      error: this.getErrorMessage(status?.code) || status?.message
    }
  }

  /**
   * Get error message for İleti Merkezi error code
   */
  getErrorMessage(code) {
    const errorMessages = {
      '400': 'İstek formatı hatalı',
      '401': 'Kimlik doğrulama hatası',
      '402': 'Bakiye yetersiz',
      '403': 'Erişim engellendi',
      '404': 'Kaynak bulunamadı',
      '450': 'Gönderici adı onaylı değil',
      '451': 'Tekrarlanan gönderi',
      '452': 'Alıcı sayısı sınırı aşıldı',
      '453': 'Mesaj boş veya çok uzun',
      '454': 'Geçersiz telefon numarası',
      '500': 'Sunucu hatası'
    }

    return errorMessages[code]
  }
}
