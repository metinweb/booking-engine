import FirecrawlApp from '@mendable/firecrawl-js'
import logger from '../core/logger.js'

// Cache for API key
let cachedApiKey = null
let cachedApiKeyExpiry = 0
const API_KEY_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get Firecrawl API key from database or environment
 * Database takes priority, with fallback to environment variable
 */
const getFirecrawlApiKey = async () => {
  // Check cache first
  if (cachedApiKey && Date.now() < cachedApiKeyExpiry) {
    return cachedApiKey
  }

  try {
    // Try to load from database
    const { default: PlatformSettings } =
      await import('../modules/platform-settings/platformSettings.model.js')
    const settings = await PlatformSettings.getSettings()
    const credentials = settings.getFirecrawlCredentials()

    if (credentials?.apiKey) {
      cachedApiKey = credentials.apiKey
      cachedApiKeyExpiry = Date.now() + API_KEY_CACHE_TTL
      return cachedApiKey
    }
  } catch (error) {
    logger.warn('Failed to load Firecrawl API key from database:', error.message)
  }

  // Fall back to environment variable
  if (process.env.FIRECRAWL_API_KEY) {
    cachedApiKey = process.env.FIRECRAWL_API_KEY
    cachedApiKeyExpiry = Date.now() + API_KEY_CACHE_TTL
    return cachedApiKey
  }

  return null
}

/**
 * Extract image URLs from markdown content
 * Markdown images: ![alt](url)
 */
const extractImagesFromMarkdown = markdown => {
  if (!markdown) return []
  const images = []

  // Match markdown images: ![alt](url)
  const mdImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
  let match
  while ((match = mdImageRegex.exec(markdown)) !== null) {
    const url = match[2]
    if (url && url.startsWith('http')) {
      images.push(url)
    }
  }

  return images
}

/**
 * Extract image URLs from HTML content
 * Looks for img src, background-image, data-src, srcset, and raw URL patterns
 */
const extractImagesFromHtml = html => {
  if (!html) return []
  const images = []
  let match

  // Match img src attributes
  const imgSrcRegex = /<img[^>]+src=["']([^"']+)["']/gi
  while ((match = imgSrcRegex.exec(html)) !== null) {
    const url = match[1]
    if (url && (url.startsWith('http') || url.startsWith('//'))) {
      images.push(url.startsWith('//') ? 'https:' + url : url)
    }
  }

  // Match data-src (lazy loaded images)
  const dataSrcRegex = /data-src=["']([^"']+)["']/gi
  while ((match = dataSrcRegex.exec(html)) !== null) {
    const url = match[1]
    if (url && (url.startsWith('http') || url.startsWith('//'))) {
      images.push(url.startsWith('//') ? 'https:' + url : url)
    }
  }

  // Match data-lazy-src
  const lazyRegex = /data-lazy-src=["']([^"']+)["']/gi
  while ((match = lazyRegex.exec(html)) !== null) {
    const url = match[1]
    if (url && (url.startsWith('http') || url.startsWith('//'))) {
      images.push(url.startsWith('//') ? 'https:' + url : url)
    }
  }

  // Match srcset (responsive images)
  const srcsetRegex = /srcset=["']([^"']+)["']/gi
  while ((match = srcsetRegex.exec(html)) !== null) {
    const srcset = match[1]
    // srcset format: "url1 1x, url2 2x" or "url1 100w, url2 200w"
    const urls = srcset.split(',').map(s => s.trim().split(/\s+/)[0])
    urls.forEach(url => {
      if (url && (url.startsWith('http') || url.startsWith('//'))) {
        images.push(url.startsWith('//') ? 'https:' + url : url)
      }
    })
  }

  // Match background-image in style
  const bgRegex = /background(?:-image)?:\s*url\(["']?([^"')]+)["']?\)/gi
  while ((match = bgRegex.exec(html)) !== null) {
    const url = match[1]
    if (url && (url.startsWith('http') || url.startsWith('//'))) {
      images.push(url.startsWith('//') ? 'https:' + url : url)
    }
  }

  // IMPORTANT: Also extract raw image URLs from anywhere in the HTML
  // This catches images in JSON data, JavaScript, or other embedded content
  const rawUrlRegex = /https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|webp|gif|avif)/gi
  while ((match = rawUrlRegex.exec(html)) !== null) {
    const url = match[0]
    // Clean up any trailing characters
    const cleanUrl = url.replace(/[\\,;)\]}>]+$/, '')
    if (cleanUrl) {
      images.push(cleanUrl)
    }
  }

  return images
}

/**
 * Filter and dedupe image URLs, keeping only valid hotel images
 */
const filterImageUrls = (urls, baseUrl) => {
  if (!urls || !urls.length) return []

  const seen = new Set()
  const filtered = []

  // Get base domain for relative URL resolution
  let baseDomain = ''
  try {
    baseDomain = new URL(baseUrl).origin
  } catch {
    // Invalid URL - baseDomain stays empty
  }

  for (const url of urls) {
    // Skip if already seen
    if (seen.has(url)) continue

    // Skip tiny images (icons, logos usually)
    if (url.includes('favicon') || url.includes('icon') || url.includes('logo')) continue

    // Skip social media / tracking images
    if (
      url.includes('facebook') ||
      url.includes('twitter') ||
      url.includes('instagram') ||
      url.includes('linkedin') ||
      url.includes('youtube') ||
      url.includes('pinterest') ||
      url.includes('google') ||
      url.includes('analytics') ||
      url.includes('pixel')
    )
      continue

    // Skip base64 data URLs
    if (url.startsWith('data:')) continue

    // Skip very small dimension indicators
    if (/[-_](\d{1,2}x\d{1,2}|16|24|32|48|64)[-_.]/.test(url)) continue

    // Must be an image or image-like URL
    const isImage =
      /\.(jpg|jpeg|png|gif|webp|avif|bmp)/i.test(url) ||
      url.includes('/image') ||
      url.includes('/photo') ||
      url.includes('/gallery') ||
      url.includes('/media') ||
      url.includes('/upload') ||
      url.includes('/room') ||
      url.includes('/oda') ||
      url.includes('cdn') ||
      url.includes('cloudinary') ||
      url.includes('imgix') ||
      url.includes('unsplash') ||
      url.includes('wp-content')

    if (!isImage) continue

    seen.add(url)
    filtered.push(url)
  }

  return filtered
}

// Initialize Firecrawl client
let firecrawl = null
let firecrawlApiKeyUsed = null

/**
 * Get or create Firecrawl client (async)
 */
const getFirecrawl = async () => {
  const apiKey = await getFirecrawlApiKey()

  if (!apiKey) {
    return null
  }

  // Re-create client if API key changed
  if (firecrawl && firecrawlApiKeyUsed === apiKey) {
    return firecrawl
  }

  firecrawl = new FirecrawlApp({ apiKey })
  firecrawlApiKeyUsed = apiKey
  return firecrawl
}

/**
 * Check if Firecrawl is configured (async)
 */
export const isConfigured = async () => {
  const apiKey = await getFirecrawlApiKey()
  return !!apiKey
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

    // Collect images from all sources
    const allImages = []

    // 1. Extract from markdown (![alt](url))
    const mdImages = extractImagesFromMarkdown(result.markdown)
    allImages.push(...mdImages)

    // 2. Extract from HTML (img src, data-src, srcset, background-image)
    const htmlImages = extractImagesFromHtml(result.html)
    allImages.push(...htmlImages)

    // 3. Extract from links array
    if (result.links && result.links.length > 0) {
      const linkImages = result.links.filter(link => /\.(jpg|jpeg|png|gif|webp|avif)/i.test(link))
      allImages.push(...linkImages)
    }

    // Filter and dedupe
    const filteredImages = filterImageUrls(allImages, url)

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
 * Domain configurations for different website types
 * OTA sites have all hotel info on a single page
 * Hotel websites have info spread across multiple pages
 */
const DOMAIN_CONFIGS = {
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
const getDomainConfig = url => {
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
const buildHotelUrls = baseUrl => {
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
const buildScrapeActions = (pageUrl, isMainHotelPage) => {
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

          // Collect images from all sources
          const pageImages = []

          // 1. Extract from markdown
          const mdImages = extractImagesFromMarkdown(result.markdown)
          pageImages.push(...mdImages)

          // 2. Extract from HTML
          const htmlImages = extractImagesFromHtml(result.html)
          pageImages.push(...htmlImages)

          // 3. Extract from links array
          if (result.links && result.links.length > 0) {
            const linkImages = result.links.filter(link =>
              /\.(jpg|jpeg|png|gif|webp|avif)/i.test(link)
            )
            pageImages.push(...linkImages)
          }

          // Filter and dedupe page images
          const filteredPageImages = filterImageUrls(pageImages, pageUrl)
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
  isConfigured,
  scrapePage,
  crawlWebsite,
  smartFetch
}
