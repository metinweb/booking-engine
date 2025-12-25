import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import config from '../config/index.js'
import logger from '../core/logger.js'
import { renderEmailTemplate, htmlToText } from './emailTemplates.js'

// Initialize SES client
let sesClient = null

const initSESClient = () => {
  if (!sesClient && config.aws.ses.accessKeyId && config.aws.ses.secretAccessKey) {
    sesClient = new SESClient({
      region: config.aws.ses.region,
      credentials: {
        accessKeyId: config.aws.ses.accessKeyId,
        secretAccessKey: config.aws.ses.secretAccessKey
      }
    })
  }
  return sesClient
}

/**
 * Send email using AWS SES
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 * @param {string} options.from - From email (optional, uses config default)
 */
export const sendEmail = async ({ to, subject, html, text, from }) => {
  try {
    const client = initSESClient()

    // If SES is not configured, log to console in development
    if (!client) {
      if (config.isDev) {
        logger.warn('AWS SES not configured, logging email to console:')
        logger.info({
          to,
          subject,
          from: from || `${config.aws.ses.fromName} <${config.aws.ses.fromEmail}>`,
          html,
          text
        })
        return { success: true, messageId: 'dev-mode-no-email-sent' }
      } else {
        throw new Error('AWS SES is not configured')
      }
    }

    const params = {
      Source: from || `${config.aws.ses.fromName} <${config.aws.ses.fromEmail}>`,
      Destination: {
        ToAddresses: Array.isArray(to) ? to : [to]
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: html,
            Charset: 'UTF-8'
          }
        }
      }
    }

    // Add plain text if provided
    if (text) {
      params.Message.Body.Text = {
        Data: text,
        Charset: 'UTF-8'
      }
    }

    const command = new SendEmailCommand(params)
    const response = await client.send(command)

    logger.info(`Email sent successfully to ${to}. MessageId: ${response.MessageId}`)

    return {
      success: true,
      messageId: response.MessageId
    }
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error)
    throw error
  }
}

/**
 * Send welcome email with credentials
 */
export const sendWelcomeEmail = async ({ to, name, email, password, accountType, loginUrl }) => {
  const subject = 'Welcome to Booking Engine'

  const html = await renderEmailTemplate('welcome', {
    NAME: name,
    EMAIL: email,
    PASSWORD: password,
    ACCOUNT_TYPE: accountType,
    LOGIN_URL: loginUrl
  })

  const text = htmlToText(html)

  return sendEmail({ to, subject, html, text })
}

/**
 * Send 2FA setup email with QR code
 */
export const send2FASetupEmail = async ({ to, name, qrCodeUrl, secretCode }) => {
  const subject = 'Two-Factor Authentication Setup'

  const html = await renderEmailTemplate('2fa-setup', {
    NAME: name,
    QR_CODE_URL: qrCodeUrl,
    SECRET_CODE: secretCode
  })

  const text = htmlToText(html)

  return sendEmail({ to, subject, html, text })
}

export default {
  sendEmail,
  sendWelcomeEmail,
  send2FASetupEmail
}
