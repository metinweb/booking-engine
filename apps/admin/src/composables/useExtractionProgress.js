/**
 * Extraction Progress Composable
 * Handles socket events and progress tracking for AI hotel extraction
 */

import { ref, reactive, onUnmounted } from 'vue'
import { useSocket } from '@/composables/useSocket'
import hotelService from '@/services/hotelService'

export function useExtractionProgress() {
  const { join, leave, on, off, isConnected } = useSocket()

  // Operation ID for current extraction
  const operationId = ref(null)

  // Progress state
  const progress = reactive({
    steps: [],
    currentStep: null,
    currentStepLabel: '',
    currentStepDetail: '',
    currentPage: ''
  })

  // Elapsed time tracking
  const elapsedTime = ref(0)
  const startTime = ref(null)
  let elapsedTimer = null

  /**
   * Start elapsed time timer
   */
  function startElapsedTimer() {
    startTime.value = Date.now()
    elapsedTime.value = 0
    elapsedTimer = setInterval(() => {
      elapsedTime.value = Math.floor((Date.now() - startTime.value) / 1000)
    }, 1000)
  }

  /**
   * Stop elapsed time timer
   */
  function stopElapsedTimer() {
    if (elapsedTimer) {
      clearInterval(elapsedTimer)
      elapsedTimer = null
    }
  }

  /**
   * Format elapsed time for display
   */
  function formatElapsedTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `${mins}dk ${secs}sn`
    }
    return `${secs}sn`
  }

  /**
   * Reset progress state
   */
  function resetProgress() {
    progress.steps = []
    progress.currentStep = null
    progress.currentStepLabel = ''
    progress.currentStepDetail = ''
    progress.currentPage = ''
  }

  /**
   * Setup socket event listeners for extraction progress
   */
  function setupSocketListeners(opId, callbacks = {}) {
    const eventPrefix = 'hotel-extract:'

    // Init - receive steps list
    on(`${eventPrefix}init`, data => {
      if (data.operationId !== opId) return
      progress.steps = data.steps.map(s => ({ ...s, status: 'pending', data: null }))
    })

    // Step started
    on(`${eventPrefix}step:start`, data => {
      if (data.operationId !== opId) return
      progress.currentStep = data.stepId
      progress.currentStepLabel = data.label?.tr || data.label?.en || data.stepId
      progress.currentStepDetail = ''
      if (progress.steps[data.stepIndex]) {
        progress.steps[data.stepIndex].status = 'in_progress'
      }
    })

    // Step progress update
    on(`${eventPrefix}step:update`, data => {
      if (data.operationId !== opId) return
      if (progress.steps[data.stepIndex]) {
        progress.steps[data.stepIndex].data = { ...progress.steps[data.stepIndex].data, ...data.data }
      }
      // Update current page for crawl step
      if (data.data?.currentPage) {
        progress.currentPage = data.data.currentPage
      }
      // Update detail text
      if (data.data?.pagesScraped) {
        progress.currentStepDetail = `${data.data.pagesScraped} sayfa tarandı...`
      }
    })

    // Step completed
    on(`${eventPrefix}step:complete`, data => {
      if (data.operationId !== opId) return
      if (progress.steps[data.stepIndex]) {
        progress.steps[data.stepIndex].status = 'completed'
        progress.steps[data.stepIndex].duration = data.duration
        progress.steps[data.stepIndex].data = { ...progress.steps[data.stepIndex].data, ...data.data }
      }
      progress.currentPage = ''
    })

    // Step failed
    on(`${eventPrefix}step:fail`, data => {
      if (data.operationId !== opId) return
      if (progress.steps[data.stepIndex]) {
        progress.steps[data.stepIndex].status = 'failed'
        progress.steps[data.stepIndex].error = data.error
      }
    })

    // Complete
    on(`${eventPrefix}complete`, async data => {
      if (data.operationId !== opId) return
      stopElapsedTimer()
      callbacks.onComplete?.(data)
      cleanupSocketListeners()
    })

    // Fail
    on(`${eventPrefix}fail`, data => {
      if (data.operationId !== opId) return
      stopElapsedTimer()
      callbacks.onFail?.(data)
      cleanupSocketListeners()
    })
  }

  /**
   * Cleanup socket event listeners
   */
  function cleanupSocketListeners() {
    const eventPrefix = 'hotel-extract:'
    const events = [
      'init',
      'step:start',
      'step:update',
      'step:complete',
      'step:fail',
      'complete',
      'fail'
    ]
    events.forEach(event => off(`${eventPrefix}${event}`))
    if (operationId.value) {
      leave(operationId.value)
    }
    operationId.value = null
  }

  /**
   * Start extraction with socket progress
   */
  async function startExtraction(url, callbacks = {}) {
    resetProgress()
    startElapsedTimer()

    try {
      const startResponse = await hotelService.startAiExtraction({
        contentType: 'url',
        url
      })

      if (startResponse.success && startResponse.operationId) {
        operationId.value = startResponse.operationId

        // Join socket room for this operation
        join(startResponse.operationId)

        // Setup socket listeners
        setupSocketListeners(startResponse.operationId, callbacks)

        return {
          operationId: startResponse.operationId,
          isSocketConnected: isConnected.value
        }
      }

      // Response came back but no operationId
      throw new Error(startResponse.message || 'Failed to start extraction')
    } catch (error) {
      stopElapsedTimer()
      // Re-throw with better error message
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Failed to start extraction'
      throw new Error(errorMessage)
    }
  }

  /**
   * Poll for result when socket is not available
   */
  async function pollForResult(opId, callbacks = {}) {
    const maxAttempts = 120 // 2 minutes with 1s intervals
    let attempts = 0

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      attempts++

      try {
        const result = await hotelService.getExtractionResult(opId)

        if (result.status === 'completed' && result.data) {
          stopElapsedTimer()
          callbacks.onComplete?.({ data: result.data })
          return result.data
        } else if (result.status === 'failed') {
          stopElapsedTimer()
          throw new Error(result.error || 'Extraction failed')
        }
        // Still pending, continue polling
      } catch (e) {
        if (e.response?.status === 404) {
          throw new Error('Operation expired')
        }
        // Continue polling on other errors
      }
    }

    throw new Error('Operation timeout')
  }

  // Cleanup on unmount
  onUnmounted(() => {
    cleanupSocketListeners()
    stopElapsedTimer()
  })

  return {
    // State
    operationId,
    progress,
    elapsedTime,
    isSocketConnected: isConnected,

    // Methods
    startElapsedTimer,
    stopElapsedTimer,
    formatElapsedTime,
    resetProgress,
    startExtraction,
    pollForResult,
    cleanupSocketListeners
  }
}
