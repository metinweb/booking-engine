import axios from 'axios'
import ISMSProvider from '../ISMSProvider.js'
import logger from '../../../core/logger.js'

/**
 * NetGSM SMS Provider
 * Documentation: https://www.netgsm.com.tr/dokuman/
 */
class NetGSMProvider extends ISMSProvider {
  static get providerName() {
    return 'netgsm'
  }

  static get displayName() {
    return 'NetGSM'
  }

  static get requiredFields() {
    return [
      { key: 'usercode', label: 'Kullanıcı Kodu', type: 'password', required: true },
      { key: 'password', label: 'Şifre', type: 'password', required: true },
      { key: 'msgheader', label: 'Mesaj Başlığı', type: 'text', required: true, maxLength: 11 }
    ]
  }

  static get supportsBalance() {
    return true
  }

  constructor(config) {
    super(config)
    this.apiUrl = 'https://api.netgsm.com.tr/sms/send/xml'
    this.balanceUrl = 'https://api.netgsm.com.tr/balance/check/get'
  }

  /**
   * Format phone to NetGSM format: 05XXXXXXXXX
   */
  formatPhone(phone) {
    if (!phone) return null

    // Remove all non-numeric characters
    const cleaned = phone.replace(/[^0-9]/g, '')

    // Handle different formats
    if (cleaned.startsWith('90') && cleaned.length === 12) {
      // 905XXXXXXXXX -> 05XXXXXXXXX
      return '0' + cleaned.substring(2)
    } else if (cleaned.startsWith('0') && cleaned.length === 11) {
      // Already in format: 05XXXXXXXXX
      return cleaned
    } else if (cleaned.length === 10 && cleaned.startsWith('5')) {
      // 5XXXXXXXXX -> 05XXXXXXXXX
      return '0' + cleaned
    } else if (cleaned.startsWith('00905') && cleaned.length === 15) {
      // 00905XXXXXXXXX -> 05XXXXXXXXX
      return '0' + cleaned.substring(4)
    }

    // Return as is if format is unknown
    return cleaned
  }

  /**
   * Parse NetGSM response
   */
  parseResponse(response) {
    const data = response.toString().trim()
    const parts = data.split(' ')
    const code = parts[0]
    const messageId = parts.slice(1).join(' ')

    const errorMessages = {
      '00': 'Success',
      20: 'Mesaj metni boş',
      30: 'Geçersiz kullanıcı bilgileri',
      40: 'Mesaj başlığı sistemde tanımlı değil',
      50: 'Hesap aktif değil',
      51: 'Hesap bloke',
      70: 'Geçersiz parametreler',
      80: 'Sorgulama limiti aşıldı',
      85: 'Aynı içerik filtresi - tekrar mesaj engellendi'
    }

    const success = code === '00'

    return {
      success,
      code,
      messageId: success ? messageId : null,
      error: success ? null : errorMessages[code] || 'NetGSM hatası: ' + code
    }
  }

  /**
   * Send SMS via NetGSM XML API
   */
  async send({ phone, message, language = 'TR' }) {
    const formattedPhone = this.formatPhone(phone)

    if (!formattedPhone || formattedPhone.length !== 11) {
      return { success: false, error: 'Geçersiz telefon numarası' }
    }

    if (!this.config.usercode || !this.config.password || !this.config.msgheader) {
      return { success: false, error: 'NetGSM yapılandırması eksik' }
    }

    try {
      const xmlBody =
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<mainbody>\n' +
        '    <header>\n' +
        '        <company dil="' +
        language +
        '">Netgsm</company>\n' +
        '        <usercode>' +
        this.config.usercode +
        '</usercode>\n' +
        '        <password>' +
        this.config.password +
        '</password>\n' +
        '        <type>1:n</type>\n' +
        '        <msgheader>' +
        this.config.msgheader +
        '</msgheader>\n' +
        '    </header>\n' +
        '    <body>\n' +
        '        <msg><![CDATA[' +
        message +
        ']]></msg>\n' +
        '        <no>' +
        formattedPhone +
        '</no>\n' +
        '    </body>\n' +
        '</mainbody>'

      const response = await axios.post(this.apiUrl, xmlBody, {
        headers: { 'Content-Type': 'text/xml' },
        timeout: 30000
      })

      const result = this.parseResponse(response.data)

      if (result.success) {
        logger.info('[NetGSM] SMS sent to ' + formattedPhone + '. MessageId: ' + result.messageId)
      } else {
        logger.warn('[NetGSM] SMS failed to ' + formattedPhone + ': ' + result.error)
      }

      return result
    } catch (error) {
      logger.error('[NetGSM] Send error to ' + formattedPhone + ':', error.message)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get SMS credit balance
   */
  async getBalance() {
    if (!this.config.usercode || !this.config.password) {
      return { success: false, error: 'NetGSM yapılandırması eksik' }
    }

    try {
      const params = new URLSearchParams({
        usercode: this.config.usercode,
        password: this.config.password,
        stession: 1
      })

      const url = this.balanceUrl + '?' + params.toString()
      const response = await axios.get(url, { timeout: 30000 })

      const data = response.data.toString().trim()

      if (data.startsWith('0')) {
        return { success: false, error: 'Bakiye sorgulanamadı' }
      }

      return {
        success: true,
        credits: parseFloat(data)
      }
    } catch (error) {
      logger.error('[NetGSM] Balance check error:', error.message)
      return { success: false, error: error.message }
    }
  }

  /**
   * Validate credentials by checking balance
   */
  async validateCredentials() {
    try {
      const result = await this.getBalance()
      return {
        valid: result.success,
        error: result.error
      }
    } catch (error) {
      return { valid: false, error: error.message }
    }
  }
}

export default NetGSMProvider
