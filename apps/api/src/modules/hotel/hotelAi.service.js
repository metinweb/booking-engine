/**
 * Hotel AI Service
 * AI-powered hotel data extraction operations
 */

import crypto from 'crypto'
import { BadRequestError, NotFoundError } from '#core/errors.js'
import { asyncHandler } from '#helpers'
import { extractHotelData, extractHotelDataFromUrl } from '#services/geminiService.js'
import { ProgressEmitter } from '#core/socket.js'
import logger from '#core/logger.js'

// Store for ongoing extractions (in production, use Redis)
const ongoingExtractions = new Map()

/**
 * Start AI extraction with real-time progress
 * Returns an operation ID for socket progress tracking
 */
export const startAiExtraction = asyncHandler(async (req, res) => {
  const { url, contentType } = req.body

  if (contentType !== 'url' || !url) {
    throw new BadRequestError('URL_REQUIRED')
  }

  // Generate unique operation ID
  const operationId = crypto.randomUUID()

  // Create progress emitter
  const progress = new ProgressEmitter(operationId, 'hotel-extract')

  // Store the operation
  ongoingExtractions.set(operationId, {
    status: 'pending',
    url,
    startTime: Date.now(),
    progress
  })

  // Return operation ID immediately so client can join socket room
  res.json({
    success: true,
    operationId,
    message: 'Extraction started. Join socket room to receive progress updates.'
  })

  // Start extraction in background (don't await)
  extractHotelDataFromUrl(url, { progress })
    .then(result => {
      // Store result
      ongoingExtractions.set(operationId, {
        status: 'completed',
        url,
        result,
        completedAt: Date.now()
      })

      // Clean up after 5 minutes
      setTimeout(
        () => {
          ongoingExtractions.delete(operationId)
        },
        5 * 60 * 1000
      )
    })
    .catch(error => {
      logger.error(`AI extraction failed for ${operationId}: ${error.message}`)
      progress.fail(error.message)

      ongoingExtractions.set(operationId, {
        status: 'failed',
        url,
        error: error.message,
        completedAt: Date.now()
      })

      // Clean up after 5 minutes
      setTimeout(
        () => {
          ongoingExtractions.delete(operationId)
        },
        5 * 60 * 1000
      )
    })
})

/**
 * Get extraction result by operation ID
 */
export const getExtractionResult = asyncHandler(async (req, res) => {
  const { operationId } = req.params

  const extraction = ongoingExtractions.get(operationId)
  if (!extraction) {
    throw new NotFoundError('EXTRACTION_NOT_FOUND')
  }

  res.json({
    success: true,
    status: extraction.status,
    data: extraction.result?.data || null,
    error: extraction.error || null
  })
})

/**
 * Extract hotel data from text, URL, or file content using AI
 * Synchronous version (waits for completion)
 * Returns structured hotel data for preview before creating
 */
export const aiExtractHotelData = asyncHandler(async (req, res) => {
  const { content, contentType, url, withProgress } = req.body

  // URL extraction - use Gemini's direct URL fetching
  if (contentType === 'url' && url) {
    logger.info(`AI extracting hotel data from URL: ${url}`)

    let progress = null

    // If client wants progress updates, create a progress emitter
    if (withProgress) {
      const operationId = crypto.randomUUID()
      progress = new ProgressEmitter(operationId, 'hotel-extract')

      // Return operation ID first for socket connection
      // Note: This changes the response flow - client must handle both patterns
    }

    const result = await extractHotelDataFromUrl(url, { progress })

    if (!result.success) {
      throw new BadRequestError(result.error || 'AI_EXTRACTION_FAILED')
    }

    return res.json({
      success: true,
      data: result.data,
      sourceUrl: url,
      crawledPages: result.crawledPages || []
    })
  }

  // Text or PDF content extraction
  if (!content || content.trim() === '') {
    throw new BadRequestError('CONTENT_REQUIRED')
  }

  logger.info(`AI extracting hotel data from ${contentType || 'text'} content`)
  const result = await extractHotelData(content, contentType || 'text')

  if (!result.success) {
    throw new BadRequestError(result.error || 'AI_EXTRACTION_FAILED')
  }

  res.json({
    success: true,
    data: result.data
  })
})
