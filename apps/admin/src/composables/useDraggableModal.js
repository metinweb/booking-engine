/**
 * Draggable Modal Composable
 * Provides drag functionality for modal dialogs
 */

import { ref, computed, onUnmounted } from 'vue'

export function useDraggableModal() {
  const modalRef = ref(null)
  const isDragging = ref(false)
  const dragOffset = ref({ x: 0, y: 0 })
  const modalPosition = ref({ x: 0, y: 0 })
  const isPositioned = ref(false)

  /**
   * Computed style for modal positioning
   */
  const modalStyle = computed(() => {
    if (!isPositioned.value) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }
    }
    return {
      top: `${modalPosition.value.y}px`,
      left: `${modalPosition.value.x}px`,
      transform: 'none'
    }
  })

  /**
   * Start dragging the modal
   */
  function startDrag(e) {
    if (!modalRef.value) return
    isDragging.value = true

    const rect = modalRef.value.getBoundingClientRect()

    // If first drag, set initial position
    if (!isPositioned.value) {
      modalPosition.value = {
        x: rect.left,
        y: rect.top
      }
      isPositioned.value = true
    }

    dragOffset.value = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }

    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', stopDrag)
  }

  /**
   * Handle drag movement
   */
  function onDrag(e) {
    if (!isDragging.value) return

    const newX = e.clientX - dragOffset.value.x
    const newY = e.clientY - dragOffset.value.y

    // Keep modal within viewport
    const maxX = window.innerWidth - (modalRef.value?.offsetWidth || 0)
    const maxY = window.innerHeight - (modalRef.value?.offsetHeight || 0)

    modalPosition.value = {
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    }
  }

  /**
   * Stop dragging
   */
  function stopDrag() {
    isDragging.value = false
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
  }

  /**
   * Reset modal position to center
   */
  function resetPosition() {
    isPositioned.value = false
    modalPosition.value = { x: 0, y: 0 }
  }

  // Clean up on unmount
  onUnmounted(() => {
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
  })

  return {
    modalRef,
    modalStyle,
    isDragging,
    isPositioned,
    startDrag,
    resetPosition
  }
}
