/** @type {import('@maizzle/framework').Config} */
module.exports = {
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
    name: '%% COMPANY_NAME %%',
    address: '%% COMPANY_ADDRESS %%',
    logo: '%% COMPANY_LOGO %%'
  },

  // Production-specific settings
  inlineCSS: true,
  removeUnusedCSS: true,

  // Use different delimiters for Maizzle processing (build-time)
  // Runtime variables use %% VARIABLE %% syntax
  expressions: {
    delimiters: ['{{', '}}'],
    unescapeDelimiters: ['{{{', '}}}']
  }
}
