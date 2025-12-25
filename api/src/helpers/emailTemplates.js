import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TEMPLATES_DIR = path.join(__dirname, '../templates/emails')

/**
 * Render email template with variables
 * @param {string} templateName - Name of the template file (without .html)
 * @param {Object} variables - Variables to replace in template
 * @returns {Promise<string>} Rendered HTML
 */
export const renderEmailTemplate = async (templateName, variables = {}) => {
  try {
    // Read base template
    const basePath = path.join(TEMPLATES_DIR, 'base.html')
    let baseTemplate = await fs.readFile(basePath, 'utf-8')

    // Read content template
    const contentPath = path.join(TEMPLATES_DIR, `${templateName}.html`)
    let contentTemplate = await fs.readFile(contentPath, 'utf-8')

    // Replace variables in content
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      contentTemplate = contentTemplate.replace(regex, variables[key] || '')
    })

    // Default variables for base template
    const baseVariables = {
      COMPANY_NAME: variables.COMPANY_NAME || 'Booking Engine',
      YEAR: new Date().getFullYear(),
      WEBSITE_URL: variables.WEBSITE_URL || 'https://booking-engine.com',
      SUPPORT_URL: variables.SUPPORT_URL || 'https://booking-engine.com/support',
      PRIVACY_URL: variables.PRIVACY_URL || 'https://booking-engine.com/privacy',
      CONTENT: contentTemplate
    }

    // Replace variables in base template
    Object.keys(baseVariables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      baseTemplate = baseTemplate.replace(regex, baseVariables[key] || '')
    })

    return baseTemplate
  } catch (error) {
    throw new Error(`Failed to render email template: ${error.message}`)
  }
}

/**
 * Generate plain text from HTML
 * @param {string} html - HTML content
 * @returns {string} Plain text
 */
export const htmlToText = (html) => {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gs, '')
    .replace(/<script[^>]*>.*?<\/script>/gs, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export default {
  renderEmailTemplate,
  htmlToText
}
