/**
 * AWS SES Identity Service
 * Platform AWS credentials kullanarak domain identity yönetimi
 */

import {
  SESv2Client,
  CreateEmailIdentityCommand,
  GetEmailIdentityCommand,
  DeleteEmailIdentityCommand
} from '@aws-sdk/client-sesv2'
import PlatformSettings from '../modules/platform-settings/platformSettings.model.js'
import logger from '../core/logger.js'

// SES client cache
let cachedClient = null
let cacheExpiry = null
const CACHE_TTL = 5 * 60 * 1000 // 5 dakika

/**
 * Platform AWS credentials ile SES client oluştur
 */
async function getClient() {
  // Cache kontrolü
  if (cachedClient && cacheExpiry && Date.now() < cacheExpiry) {
    return cachedClient
  }

  const settings = await PlatformSettings.getSettings()
  const creds = settings.getAWSCredentials()

  if (!creds || !creds.accessKeyId || !creds.secretAccessKey) {
    throw new Error('Platform AWS SES yapılandırılmamış')
  }

  cachedClient = new SESv2Client({
    region: creds.region || 'eu-west-1',
    credentials: {
      accessKeyId: creds.accessKeyId,
      secretAccessKey: creds.secretAccessKey
    }
  })
  cacheExpiry = Date.now() + CACHE_TTL

  return cachedClient
}

/**
 * DNS kayıtlarını formatla
 */
function formatDNSRecords(domain, dkimTokens) {
  const records = []

  // DKIM CNAME kayıtları (genellikle 3 adet)
  if (dkimTokens && dkimTokens.length > 0) {
    dkimTokens.forEach((token, i) => {
      records.push({
        type: 'CNAME',
        name: `${token}._domainkey.${domain}`,
        value: `${token}.dkim.amazonses.com`,
        purpose: `DKIM Key ${i + 1}`
      })
    })
  }

  // SPF kaydı (önerilen)
  records.push({
    type: 'TXT',
    name: domain,
    value: 'v=spf1 include:amazonses.com ~all',
    purpose: 'SPF Record'
  })

  return records
}

/**
 * DKIM durumunu Türkçe'ye çevir
 */
function translateDkimStatus(status) {
  const statusMap = {
    'PENDING': 'pending',
    'SUCCESS': 'verified',
    'FAILED': 'failed',
    'TEMPORARY_FAILURE': 'pending',
    'NOT_STARTED': 'none'
  }
  return statusMap[status] || 'none'
}

export const sesIdentityService = {
  /**
   * Domain identity oluştur (Platform AWS hesabında)
   * @param {string} domain - Domain adı (örn: sirket.com)
   * @returns {Object} - Domain bilgileri ve DKIM tokenları
   */
  async createDomainIdentity(domain) {
    try {
      const client = await getClient()

      const command = new CreateEmailIdentityCommand({
        EmailIdentity: domain,
        DkimSigningAttributes: {
          NextSigningKeyLength: 'RSA_2048_BIT'
        }
      })

      const response = await client.send(command)

      logger.info(`SES domain identity created: ${domain}`)

      return {
        domain,
        dkimTokens: response.DkimAttributes?.Tokens || [],
        dkimStatus: translateDkimStatus(response.DkimAttributes?.Status),
        verified: response.VerifiedForSendingStatus || false,
        dnsRecords: formatDNSRecords(domain, response.DkimAttributes?.Tokens)
      }
    } catch (error) {
      logger.error(`SES domain identity creation failed for ${domain}:`, error.message)

      // Zaten varsa, mevcut durumu getir
      if (error.name === 'AlreadyExistsException') {
        return await this.getIdentityStatus(domain)
      }

      throw error
    }
  },

  /**
   * Domain doğrulama durumunu kontrol et
   * @param {string} domain - Domain adı
   * @returns {Object} - Doğrulama durumu ve DNS kayıtları
   */
  async getIdentityStatus(domain) {
    try {
      const client = await getClient()

      const command = new GetEmailIdentityCommand({
        EmailIdentity: domain
      })

      const response = await client.send(command)

      return {
        domain,
        verified: response.VerifiedForSendingStatus || false,
        dkimStatus: translateDkimStatus(response.DkimAttributes?.Status),
        dkimTokens: response.DkimAttributes?.Tokens || [],
        dnsRecords: formatDNSRecords(domain, response.DkimAttributes?.Tokens),
        identityType: response.IdentityType // DOMAIN veya EMAIL_ADDRESS
      }
    } catch (error) {
      logger.error(`SES identity status check failed for ${domain}:`, error.message)

      // Domain bulunamadıysa
      if (error.name === 'NotFoundException') {
        return {
          domain,
          verified: false,
          dkimStatus: 'none',
          dkimTokens: [],
          dnsRecords: [],
          exists: false
        }
      }

      throw error
    }
  },

  /**
   * Domain identity sil
   * @param {string} domain - Domain adı
   */
  async deleteIdentity(domain) {
    try {
      const client = await getClient()

      const command = new DeleteEmailIdentityCommand({
        EmailIdentity: domain
      })

      await client.send(command)

      logger.info(`SES domain identity deleted: ${domain}`)

      return { success: true, domain }
    } catch (error) {
      logger.error(`SES identity deletion failed for ${domain}:`, error.message)

      // Zaten silinmişse hata verme
      if (error.name === 'NotFoundException') {
        return { success: true, domain, alreadyDeleted: true }
      }

      throw error
    }
  },

  /**
   * Client cache'i temizle
   */
  clearCache() {
    cachedClient = null
    cacheExpiry = null
  }
}

export default sesIdentityService
