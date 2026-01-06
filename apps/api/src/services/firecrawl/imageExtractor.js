/**
 * Extract image URLs from markdown content
 * Markdown images: ![alt](url)
 */
export const extractImagesFromMarkdown = markdown => {
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
export const extractImagesFromHtml = html => {
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
export const filterImageUrls = (urls, baseUrl) => {
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

/**
 * Extract and filter images from Firecrawl result
 * Combines extraction from markdown, HTML, and links
 */
export const extractAllImages = (result, pageUrl) => {
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
  return filterImageUrls(allImages, pageUrl)
}

export default {
  extractImagesFromMarkdown,
  extractImagesFromHtml,
  filterImageUrls,
  extractAllImages
}
