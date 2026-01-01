/** @type {import('@maizzle/framework').Config} */
export default {
  build: {
    templates: {
      destination: {
        path: '../emails'
      }
    }
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
