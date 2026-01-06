import logger from '../../core/logger.js'
import { getFirecrawl } from './client.js'
import { extractAllImages } from './imageExtractor.js'

/**
 * Domain configurations for different website types
 * OTA sites have all hotel info on a single page
 * Hotel websites have info spread across multiple pages
 */
export const DOMAIN_CONFIGS = {
  // OTA (Online Travel Agency) sites - single page, no sub-pages
  ota: {
    domains: [
      'etstur.com',
      'www.etstur.com',
      'tatilbudur.com',
      'www.tatilbudur.com',
      'jollytur.com',
      'www.jollytur.com',
      'setur.com.tr',
      'www.setur.com.tr',
      'tatilsepeti.com',
      'www.tatilsepeti.com',
      'odamax.com',
      'www.odamax.com',
      'obilet.com',
      'www.obilet.com',
      'enuygun.com',
      'www.enuygun.com',
      'otelz.com',
      'www.otelz.com',
      'touristica.com.tr',
      'www.touristica.com.tr',
      'booking.com',
      'www.booking.com',
      'hotels.com',
      'www.hotels.com',
      'expedia.com',
      'www.expedia.com',
      'agoda.com',
      'www.agoda.com',
      'tripadvisor.com',
      'www.tripadvisor.com',
      'trivago.com',
      'www.trivago.com'
    ],
    maxPages: 1,
    subPages: [] // No sub-pages for OTA sites
  },
  // Hotel chain websites - may have some sub-pages
  chain: {
    domains: [
      'hilton.com',
      'www.hilton.com',
      'marriott.com',
      'www.marriott.com',
      'ihg.com',
      'www.ihg.com',
      'accor.com',
      'www.accor.com',
      'wyndham.com',
      'www.wyndham.com',
      'hyatt.com',
      'www.hyatt.com'
    ],
    maxPages: 3,
    subPages: ['/rooms', '/dining', '/amenities']
  }
}

/**
 * Get domain configuration for a URL
 * @param {string} url - URL to check
 * @returns {object|null} - Domain config or null for default behavior
 */
export const getDomainConfig = url => {
  try {
    const hostname = new URL(url).hostname.toLowerCase()

    // Check OTA sites
    if (DOMAIN_CONFIGS.ota.domains.some(d => hostname === d || hostname.endsWith('.' + d))) {
      return { type: 'ota', ...DOMAIN_CONFIGS.ota }
    }

    // Check chain sites
    if (DOMAIN_CONFIGS.chain.domains.some(d => hostname === d || hostname.endsWith('.' + d))) {
      return { type: 'chain', ...DOMAIN_CONFIGS.chain }
    }

    return null // Default hotel website
  } catch (e) {
    return null
  }
}

/**
 * Build URLs to scrape based on website type
 * @param {string} baseUrl - Base URL of the hotel website
 * @returns {object} - { urls: string[], maxPages: number, siteType: string }
 */
export const buildHotelUrls = baseUrl => {
  const urlObj = new URL(baseUrl)
  const base = `${urlObj.protocol}//${urlObj.host}`
  const lang = urlObj.pathname.includes('/tr')
    ? '/tr'
    : urlObj.pathname.includes('/en')
      ? '/en'
      : ''

  // Check for domain-specific configuration
  const domainConfig = getDomainConfig(baseUrl)

  if (domainConfig) {
    logger.info(
      `Detected ${domainConfig.type.toUpperCase()} site: ${urlObj.hostname} - limiting to ${domainConfig.maxPages} page(s)`
    )

    const urls = [baseUrl] // Always include the original URL

    // Add any configured sub-pages
    domainConfig.subPages.forEach(path => {
      urls.push(`${base}${lang}${path}`)
    })

    return {
      urls,
      maxPages: domainConfig.maxPages,
      siteType: domainConfig.type
    }
  }

  // Default: Hotel's own website - try multiple pages
  const paths = [
    '', // Homepage
    // Room pages (PRIORITY - for room images)
    '/rooms',
    '/odalar',
    '/accommodation',
    '/konaklama',
    '/rooms-suites',
    '/odalar-ve-suitler',
    '/room-types',
    '/oda-tipleri',
    '/our-rooms',
    '/odalarimiz',
    // About & Facilities
    '/about',
    '/hakkimizda',
    '/kurumsal',
    '/about-us',
    '/facilities',
    '/olanaklar',
    '/amenities',
    '/tesisler',
    // Spa & Wellness
    '/spa',
    '/spa-wellness',
    '/wellness',
    // Dining
    '/restaurant',
    '/restoran',
    '/dining',
    '/restaurants',
    '/food-beverage',
    // Pool & Beach
    '/pool',
    '/havuz',
    '/beach',
    '/plaj',
    '/pools',
    // Gallery (for images)
    '/gallery',
    '/galeri',
    '/photos',
    '/fotograflar',
    '/media',
    // Contact & Location
    '/contact',
    '/iletisim',
    '/location',
    '/konum'
  ]

  // Build unique URLs
  const urls = new Set()
  urls.add(baseUrl) // Always include the original URL

  paths.forEach(path => {
    if (path) {
      urls.add(`${base}${lang}${path}`)
      urls.add(`${base}${path}`)
    }
  })

  return {
    urls: Array.from(urls),
    maxPages: 12, // Default max pages for hotel websites
    siteType: 'hotel'
  }
}

/**
 * Build actions array for Firecrawl to interact with page before scraping
 * Handles "load more" buttons for rooms, images, etc.
 */
export const buildScrapeActions = (pageUrl, isMainHotelPage) => {
  // Only add actions for main hotel page
  if (!isMainHotelPage) return undefined

  // For main hotel pages - simplified actions that won't fail
  // The key insight: after clicking "show all", button disappears, so only click once
  const actions = [
    // Wait for page to load
    { type: 'wait', milliseconds: 2000 },

    // Scroll to rooms section
    { type: 'scroll', direction: 'down', amount: 800 },
    { type: 'wait', milliseconds: 1000 },

    // Click "show all rooms" button ONCE (it disappears after clicking)
    { type: 'click', selector: '[data-test-id="rooms-show-all-button"]' },

    // Wait for rooms to load
    { type: 'wait', milliseconds: 3000 },

    // Scroll through the page to load lazy images
    { type: 'scroll', direction: 'down', amount: 2000 },
    { type: 'wait', milliseconds: 1500 },
    { type: 'scroll', direction: 'down', amount: 2000 },
    { type: 'wait', milliseconds: 1500 },
    { type: 'scroll', direction: 'down', amount: 2000 },
    { type: 'wait', milliseconds: 1000 }
  ]

  return actions
}

/**
 * Scrape a single page
 * @param {string} url - URL to scrape
 * @returns {Promise<{success: boolean, content: string, metadata: object, images: array}>}
 */
export const scrapePage = async url => {
  const client = await getFirecrawl()
  if (!client) {
    throw new Error('FIRECRAWL_API_KEY is not configured')
  }

  try {
    logger.info(`Firecrawl scraping: ${url}`)

    const result = await client.scrape(url, {
      formats: ['markdown', 'html', 'links'],
      onlyMainContent: false, // Get full page content including galleries
      waitFor: 3000, // Wait for dynamic content (sliders, galleries)
      timeout: 45000
    })

    // Firecrawl v4+ returns data directly, check for content
    if (!result.markdown && !result.html) {
      throw new Error(result.error || 'Scrape failed - no content returned')
    }

    // Combine markdown with extracted image links
    let content = result.markdown || ''

    // Extract all images using the image extractor
    const filteredImages = extractAllImages(result, url)

    // Append image URLs section for AI to process
    if (filteredImages.length > 0) {
      content += '\n\n=== EXTRACTED IMAGE URLS ===\n'
      content += filteredImages.join('\n')
    }

    logger.info(
      `Firecrawl scrape completed: ${content.length} chars, ${filteredImages.length} images extracted`
    )

    return {
      success: true,
      content: content,
      metadata: result.metadata || {},
      images: filteredImages,
      url: url
    }
  } catch (error) {
    logger.error(`Firecrawl scrape error: ${error.message}`)
    throw error
  }
}

/**
 * Crawl a website - visits multiple pages for comprehensive data
 * Uses multiple single-page scrapes for reliability
 * @param {string} url - Starting URL
 * @param {object} options - Crawl options
 * @param {number} options.maxPages - Maximum pages to scrape
 * @param {function} options.onPageScraped - Callback for each scraped page
 * @returns {Promise<{success: boolean, content: string, pages: array, allImages: array}>}
 */
export const crawlWebsite = async (url, options = {}) => {
  const client = await getFirecrawl()
  if (!client) {
    throw new Error('FIRECRAWL_API_KEY is not configured')
  }

  const { onPageScraped = null } = options

  try {
    // Build list of URLs based on domain type
    const urlConfig = buildHotelUrls(url)
    const urlsToTry = urlConfig.urls
    const maxPages = options.maxPages || urlConfig.maxPages

    logger.info(`Firecrawl crawling: ${url} (${urlConfig.siteType} site, max ${maxPages} pages)`)
    const successfulPages = []
    const allExtractedImages = []
    let pagesScraped = 0

    // Scrape pages one by one until we hit maxPages
    for (const pageUrl of urlsToTry) {
      if (pagesScraped >= maxPages) break

      try {
        // Check if this is the main hotel page (first URL or matches original)
        const isMainHotelPage = pageUrl === url || pagesScraped === 0
        const actions = buildScrapeActions(pageUrl, isMainHotelPage)

        let result
        const baseOptions = {
          formats: ['markdown', 'html', 'links'],
          onlyMainContent: false, // Get full page including galleries/sliders
          waitFor: 3000, // Wait for dynamic content
          timeout: 90000 // Increased timeout for pages with many actions
        }

        // Try with actions first for main page, fallback to without actions if it fails
        if (actions && actions.length > 0) {
          try {
            const optionsWithActions = { ...baseOptions, actions }
            logger.info(`Scraping with ${actions.length} actions: ${pageUrl}`)
            result = await client.scrape(pageUrl, optionsWithActions)
          } catch (actionError) {
            // Actions failed (selector not found, etc.), retry without actions
            logger.warn(
              `Actions failed for ${pageUrl}: ${actionError.message}. Retrying without actions.`
            )
            result = await client.scrape(pageUrl, baseOptions)
          }
        } else {
          result = await client.scrape(pageUrl, baseOptions)
        }

        // Firecrawl v4+ returns data directly, check for content
        if (result.markdown && result.markdown.length > 200) {
          let pageContent = result.markdown

          // Extract all images using the image extractor
          const filteredPageImages = extractAllImages(result, pageUrl)
          allExtractedImages.push(...filteredPageImages)

          // Append image URLs to content
          if (filteredPageImages.length > 0) {
            pageContent += '\n\n=== PAGE IMAGE URLS ===\n'
            pageContent += filteredPageImages.join('\n')
          }

          successfulPages.push({
            url: pageUrl,
            title: result.metadata?.title || '',
            content: pageContent,
            imageCount: filteredPageImages.length
          })
          pagesScraped++
          logger.info(
            `Scraped: ${pageUrl} (${result.markdown.length} chars, ${filteredPageImages.length} images)`
          )

          // Call progress callback if provided
          if (onPageScraped) {
            try {
              onPageScraped({
                index: pagesScraped - 1,
                url: pageUrl,
                title: result.metadata?.title || '',
                chars: result.markdown.length,
                imagesFound: filteredPageImages.length,
                totalChars: successfulPages.reduce((sum, p) => sum + p.content.length, 0),
                totalImages: allExtractedImages.length
              })
            } catch {
              // Ignore callback errors
            }
          }
        }
      } catch {
        // Silently skip failed pages (404s, etc.)
        continue
      }
    }

    if (successfulPages.length === 0) {
      throw new Error('No pages could be scraped')
    }

    // Dedupe all images across pages
    const uniqueImages = [...new Set(allExtractedImages)]

    // Combine all page contents
    const combinedContent = successfulPages
      .map(page => {
        return `\n\n=== PAGE: ${page.title} (${page.url}) ===\n\n${page.content}`
      })
      .join('\n')

    // Add summary of all unique images at the end
    let finalContent = combinedContent
    if (uniqueImages.length > 0) {
      finalContent += '\n\n=== ALL EXTRACTED IMAGES (UNIQUE) ===\n'
      finalContent += uniqueImages.join('\n')
    }

    const totalImageCount = successfulPages.reduce((sum, p) => sum + (p.imageCount || 0), 0)
    logger.info(
      `Firecrawl crawl completed: ${successfulPages.length} pages, ${uniqueImages.length} unique images (${totalImageCount} total)`
    )

    return {
      success: true,
      content: finalContent,
      pages: successfulPages.map(p => ({
        url: p.url,
        title: p.title,
        contentLength: p.content.length,
        imageCount: p.imageCount || 0
      })),
      allImages: uniqueImages,
      totalPages: successfulPages.length,
      totalImages: uniqueImages.length
    }
  } catch (error) {
    logger.error(`Firecrawl crawl error: ${error.message}`)
    throw error
  }
}

/**
 * Smart fetch - tries crawl first, falls back to scrape
 * Best for hotel websites where info is spread across pages
 * @param {string} url - URL to fetch
 * @param {object} options - Options including maxPages and onPageScraped callback
 */
export const smartFetch = async (url, options = {}) => {
  const client = await getFirecrawl()
  if (!client) {
    // Return null to indicate Firecrawl is not available
    return null
  }

  try {
    // Try crawl first for comprehensive data
    const crawlResult = await crawlWebsite(url, {
      maxPages: options.maxPages || 10,
      onPageScraped: options.onPageScraped,
      ...options
    })

    if (crawlResult.success && crawlResult.content.length > 500) {
      return crawlResult
    }

    // Fallback to single page scrape
    logger.info('Crawl returned minimal content, falling back to scrape')
    return await scrapePage(url)
  } catch (error) {
    logger.warn(`Firecrawl smartFetch failed, will fallback: ${error.message}`)
    // Return null to signal fallback should be used
    return null
  }
}

export default {
  DOMAIN_CONFIGS,
  getDomainConfig,
  buildHotelUrls,
  buildScrapeActions,
  scrapePage,
  crawlWebsite,
  smartFetch
}
