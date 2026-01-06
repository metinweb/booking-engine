/**
 * DNS Service
 *
 * DNS verification functions for SSL certificate provisioning.
 * Handles DNS A record validation to ensure domain points to server.
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import dns from 'dns'
import logger from '../../core/logger.js'

const execAsync = promisify(exec)
const dnsResolve4 = promisify(dns.resolve4)

/**
 * Sunucu IP adresini al
 * @returns {Promise<string>} Sunucu public IP
 */
export const getServerIP = async () => {
  try {
    // Önce environment variable'dan kontrol et
    if (process.env.SERVER_PUBLIC_IP) {
      return process.env.SERVER_PUBLIC_IP
    }

    // curl ile public IP al
    const { stdout } = await execAsync('curl -s ifconfig.me || curl -s icanhazip.com')
    return stdout.trim()
  } catch (error) {
    logger.error('[SSL] Failed to get server IP:', error.message)
    throw new Error('SERVER_IP_FETCH_FAILED')
  }
}

/**
 * DNS A kaydini dogrula
 * @param {string} domain - Dogrulanacak domain
 * @returns {Promise<{success: boolean, serverIP: string, domainIP: string|null, message: string}>}
 */
export const verifyDNS = async domain => {
  try {
    // Sunucu IP'sini al
    const serverIP = await getServerIP()

    // Domain'in A kaydini sorgula
    let domainIPs
    try {
      domainIPs = await dnsResolve4(domain)
    } catch (dnsError) {
      logger.warn(`[SSL] DNS lookup failed for ${domain}:`, dnsError.message)
      return {
        success: false,
        serverIP,
        domainIP: null,
        message: 'DNS_RECORD_NOT_FOUND'
      }
    }

    // A kaydi sunucu IP'sine yonlendirilmis mi?
    const isPointingToServer = domainIPs.includes(serverIP)

    if (isPointingToServer) {
      logger.info(`[SSL] DNS verification successful for ${domain} -> ${serverIP}`)
      return {
        success: true,
        serverIP,
        domainIP: domainIPs[0],
        message: 'DNS_VERIFIED'
      }
    } else {
      logger.warn(
        `[SSL] DNS mismatch for ${domain}: expected ${serverIP}, got ${domainIPs.join(', ')}`
      )
      return {
        success: false,
        serverIP,
        domainIP: domainIPs[0],
        message: 'DNS_NOT_POINTING_TO_SERVER'
      }
    }
  } catch (error) {
    logger.error('[SSL] DNS verification error:', error.message)
    throw error
  }
}

export default {
  getServerIP,
  verifyDNS
}
