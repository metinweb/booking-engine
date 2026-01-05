import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'

/**
 * Composable for handling async actions with loading state, error handling, and toast notifications
 * Standardizes the try/catch/finally pattern across the application
 *
 * @param {Object} options - Configuration options
 * @returns {Object} Async action utilities
 *
 * @example
 * const { execute, isLoading } = useAsyncAction({
 *   successMessage: 'Hotel created successfully',
 *   errorMessage: 'Failed to create hotel'
 * })
 *
 * const handleCreate = () => execute(
 *   () => hotelService.createHotel(formData),
 *   {
 *     onSuccess: (result) => router.push(`/hotels/${result.data._id}`),
 *     onError: (error) => console.error(error)
 *   }
 * )
 */
export function useAsyncAction(globalOptions = {}) {
  const toast = useToast()
  const { t } = useI18n()

  const {
    successMessage: globalSuccessMessage = null,
    errorMessage: globalErrorMessage = 'common.operationFailed',
    showSuccessToast: globalShowSuccessToast = true,
    showErrorToast: globalShowErrorToast = true
  } = globalOptions

  const isLoading = ref(false)
  const error = ref(null)
  const result = ref(null)

  /**
   * Execute an async action with standardized error handling
   * @param {Function} actionFn - Async function to execute
   * @param {Object} options - Action-specific options
   * @returns {Promise<{success: boolean, data: any, error: Error|null}>}
   */
  const execute = async (actionFn, options = {}) => {
    const {
      successMessage = globalSuccessMessage,
      errorMessage = globalErrorMessage,
      showSuccessToast = globalShowSuccessToast,
      showErrorToast = globalShowErrorToast,
      onSuccess = null,
      onError = null,
      onFinally = null,
      transform = null // Transform result before returning
    } = options

    isLoading.value = true
    error.value = null
    result.value = null

    try {
      const response = await actionFn()

      // Handle API response format { success, data, message }
      if (response && typeof response === 'object') {
        if (response.success === false) {
          throw new Error(response.message || 'Operation failed')
        }

        result.value = transform ? transform(response) : response

        if (showSuccessToast && successMessage) {
          const message = typeof successMessage === 'function'
            ? successMessage(response)
            : t(successMessage)
          toast.success(message)
        }

        onSuccess?.(response)

        return { success: true, data: response, error: null }
      }

      // Non-object response (rare)
      result.value = response
      onSuccess?.(response)
      return { success: true, data: response, error: null }

    } catch (err) {
      error.value = err

      if (showErrorToast) {
        const message = err.response?.data?.message
          || err.message
          || t(errorMessage)
        toast.error(message)
      }

      onError?.(err)

      return { success: false, data: null, error: err }

    } finally {
      isLoading.value = false
      onFinally?.()
    }
  }

  /**
   * Execute with confirmation dialog
   * @param {Function} actionFn - Async function to execute
   * @param {string} confirmMessage - Confirmation message
   * @param {Object} options - Action options
   */
  const executeWithConfirm = async (actionFn, confirmMessage, options = {}) => {
    const confirmed = window.confirm(t(confirmMessage))
    if (!confirmed) {
      return { success: false, data: null, error: null, cancelled: true }
    }
    return execute(actionFn, options)
  }

  /**
   * Create a bound action function
   * Useful for creating specific action handlers
   *
   * @example
   * const deleteHotel = createAction(
   *   (id) => hotelService.deleteHotel(id),
   *   { successMessage: 'Hotel deleted' }
   * )
   * // Later: await deleteHotel(hotelId)
   */
  const createAction = (actionFn, defaultOptions = {}) => {
    return async (...args) => {
      return execute(() => actionFn(...args), defaultOptions)
    }
  }

  /**
   * Reset state
   */
  const reset = () => {
    isLoading.value = false
    error.value = null
    result.value = null
  }

  return {
    // State
    isLoading,
    error,
    result,

    // Methods
    execute,
    executeWithConfirm,
    createAction,
    reset
  }
}

/**
 * Simple wrapper for one-off async actions
 * @param {Function} actionFn - Async function
 * @param {Object} options - Options
 */
export async function executeAsync(actionFn, options = {}) {
  const { execute } = useAsyncAction(options)
  return execute(actionFn, options)
}

export default useAsyncAction
