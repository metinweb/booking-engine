/**
 * Firecrawl Service - Modular Architecture
 *
 * This module provides web scraping and crawling capabilities using Firecrawl API.
 * It's organized into the following sub-modules:
 *
 * - cache.js: API key caching logic
 * - client.js: Firecrawl API client management
 * - imageExtractor.js: Image URL extraction from HTML/Markdown
 * - crawler.js: Main scraping and crawling functions
 */

// Cache exports
export { getFirecrawlApiKey, clearApiKeyCache, API_KEY_CACHE_TTL } from './cache.js'

// Client exports
export { getFirecrawl, isConfigured, resetClient } from './client.js'

// Image extractor exports
export {
  extractImagesFromMarkdown,
  extractImagesFromHtml,
  filterImageUrls,
  extractAllImages
} from './imageExtractor.js'

// Crawler exports
export {
  DOMAIN_CONFIGS,
  getDomainConfig,
  buildHotelUrls,
  buildScrapeActions,
  scrapePage,
  crawlWebsite,
  smartFetch
} from './crawler.js'

// Default export with main public API
export default {
  isConfigured,
  scrapePage,
  crawlWebsite,
  smartFetch
}
