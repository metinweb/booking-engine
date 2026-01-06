/**
 * Firecrawl Service - Re-export for backward compatibility
 *
 * This file re-exports the modular Firecrawl service from ./firecrawl/
 * All functionality has been split into smaller modules:
 *
 * - firecrawl/cache.js: API key caching logic
 * - firecrawl/client.js: Firecrawl API client management
 * - firecrawl/imageExtractor.js: Image URL extraction from HTML/Markdown
 * - firecrawl/crawler.js: Main scraping and crawling functions
 * - firecrawl/index.js: Barrel export
 */

// Re-export everything from the modular structure
export {
  // Cache exports
  getFirecrawlApiKey,
  clearApiKeyCache,
  API_KEY_CACHE_TTL,
  // Client exports
  getFirecrawl,
  isConfigured,
  resetClient,
  // Image extractor exports
  extractImagesFromMarkdown,
  extractImagesFromHtml,
  filterImageUrls,
  extractAllImages,
  // Crawler exports
  DOMAIN_CONFIGS,
  getDomainConfig,
  buildHotelUrls,
  buildScrapeActions,
  scrapePage,
  crawlWebsite,
  smartFetch
} from './firecrawl/index.js'

// Default export for backward compatibility
export { default } from './firecrawl/index.js'
