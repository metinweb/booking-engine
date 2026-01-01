import { ref, watch } from 'vue'

/**
 * Debounced değer için composable
 * @param {any} initialValue - Başlangıç değeri
 * @param {number} delay - Gecikme süresi (ms)
 * @returns {object} - { value, debouncedValue, isPending }
 */
export function useDebouncedRef(initialValue = '', delay = 300) {
  const value = ref(initialValue)
  const debouncedValue = ref(initialValue)
  const isPending = ref(false)
  let timeout = null

  watch(value, (newValue) => {
    isPending.value = true

    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      debouncedValue.value = newValue
      isPending.value = false
    }, delay)
  })

  return {
    value,
    debouncedValue,
    isPending
  }
}

/**
 * Debounced fonksiyon için composable
 * @param {Function} fn - Çağrılacak fonksiyon
 * @param {number} delay - Gecikme süresi (ms)
 * @returns {Function} - Debounced fonksiyon
 */
export function useDebounce(fn, delay = 300) {
  let timeout = null

  const debouncedFn = (...args) => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      fn(...args)
    }, delay)
  }

  debouncedFn.cancel = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
  }

  debouncedFn.flush = (...args) => {
    debouncedFn.cancel()
    fn(...args)
  }

  return debouncedFn
}

/**
 * Throttled fonksiyon için composable
 * @param {Function} fn - Çağrılacak fonksiyon
 * @param {number} limit - Minimum bekleme süresi (ms)
 * @returns {Function} - Throttled fonksiyon
 */
export function useThrottle(fn, limit = 300) {
  let lastCall = 0
  let timeout = null

  return (...args) => {
    const now = Date.now()
    const remaining = limit - (now - lastCall)

    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      lastCall = now
      fn(...args)
    } else if (!timeout) {
      timeout = setTimeout(() => {
        lastCall = Date.now()
        timeout = null
        fn(...args)
      }, remaining)
    }
  }
}

export default {
  useDebouncedRef,
  useDebounce,
  useThrottle
}
