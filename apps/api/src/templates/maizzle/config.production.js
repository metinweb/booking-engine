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

  // Use different delimiters for Maizzle processing (build-time)
  // Runtime variables use %% VARIABLE %% syntax
  expressions: {
    delimiters: ['{{', '}}'],
    unescapeDelimiters: ['{{{', '}}}']
  },

  inlineCSS: true,
  removeUnusedCSS: true,
  shorthandCSS: true,

  prettify: false,
  minify: {
    collapseWhitespace: true,
    minifyCSS: true
  }
}
