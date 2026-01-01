/** @type {import('@maizzle/framework').Config} */
export default {
  build: {
    templates: {
      source: 'src/templates',
      destination: {
        path: '../emails'
      }
    }
  },

  // Default variables available in all templates
  company: {
    name: '{{ COMPANY_NAME }}',
    address: '{{ COMPANY_ADDRESS }}',
    logo: '{{ COMPANY_LOGO }}'
  },

  // Production-specific settings
  inlineCSS: true,
  removeUnusedCSS: true,

  // Prevent escaping template variables
  expressions: {
    delimiters: ['{{', '}}'],
    unescapeDelimiters: ['{{{', '}}}']
  }
}
