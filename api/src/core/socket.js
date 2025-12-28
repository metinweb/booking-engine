import { Server } from 'socket.io'
import logger from './logger.js'
import config from '../config/index.js'

let io = null

/**
 * Initialize Socket.IO server
 * @param {http.Server} httpServer - The HTTP server instance
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST'],
      credentials: true
    },
    // Namespace for different features
    path: '/socket.io'
  })

  // Connection handler
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`)

    // Join a specific room (for user-specific events)
    socket.on('join', (room) => {
      socket.join(room)
      logger.info(`Socket ${socket.id} joined room: ${room}`)
    })

    // Leave a room
    socket.on('leave', (room) => {
      socket.leave(room)
      logger.info(`Socket ${socket.id} left room: ${room}`)
    })

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id}, reason: ${reason}`)
    })
  })

  logger.info('Socket.IO initialized')
  return io
}

/**
 * Get Socket.IO instance
 */
export const getIO = () => {
  if (!io) {
    logger.warn('Socket.IO not initialized')
  }
  return io
}

/**
 * Emit event to a specific room
 * @param {string} room - Room name (usually a task/operation ID)
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
export const emitToRoom = (room, event, data) => {
  if (io) {
    io.to(room).emit(event, data)
  }
}

/**
 * Emit event to all connected clients
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
export const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data)
  }
}

/**
 * Progress emitter helper for long-running operations
 * Creates a progress tracker that emits events to a specific room
 */
export class ProgressEmitter {
  constructor(operationId, operationType = 'generic') {
    this.operationId = operationId
    this.operationType = operationType
    this.steps = []
    this.currentStep = 0
    this.startTime = Date.now()
  }

  /**
   * Define the steps for this operation
   * @param {Array<{id: string, label: object}>} steps - Array of step definitions
   */
  setSteps(steps) {
    this.steps = steps.map((step, index) => ({
      ...step,
      index,
      status: 'pending',
      data: null
    }))
    this.emit('init', {
      steps: this.steps,
      totalSteps: steps.length
    })
  }

  /**
   * Start a specific step
   * @param {string} stepId - Step ID
   * @param {object} data - Additional data
   */
  startStep(stepId, data = {}) {
    const step = this.steps.find(s => s.id === stepId)
    if (step) {
      step.status = 'in_progress'
      step.startTime = Date.now()
      this.currentStep = step.index
      this.emit('step:start', {
        stepId,
        stepIndex: step.index,
        label: step.label,
        data
      })
    }
  }

  /**
   * Update current step with progress data
   * @param {string} stepId - Step ID
   * @param {object} data - Progress data
   */
  updateStep(stepId, data = {}) {
    const step = this.steps.find(s => s.id === stepId)
    if (step) {
      step.data = { ...step.data, ...data }
      this.emit('step:update', {
        stepId,
        stepIndex: step.index,
        data
      })
    }
  }

  /**
   * Complete a step
   * @param {string} stepId - Step ID
   * @param {object} data - Result data
   */
  completeStep(stepId, data = {}) {
    const step = this.steps.find(s => s.id === stepId)
    if (step) {
      step.status = 'completed'
      step.endTime = Date.now()
      step.duration = step.endTime - (step.startTime || this.startTime)
      step.data = { ...step.data, ...data }
      this.emit('step:complete', {
        stepId,
        stepIndex: step.index,
        duration: step.duration,
        data
      })
    }
  }

  /**
   * Mark a step as failed
   * @param {string} stepId - Step ID
   * @param {string} error - Error message
   */
  failStep(stepId, error) {
    const step = this.steps.find(s => s.id === stepId)
    if (step) {
      step.status = 'failed'
      step.error = error
      this.emit('step:fail', {
        stepId,
        stepIndex: step.index,
        error
      })
    }
  }

  /**
   * Complete the entire operation
   * @param {object} result - Final result
   */
  complete(result = {}) {
    const duration = Date.now() - this.startTime
    this.emit('complete', {
      duration,
      result
    })
  }

  /**
   * Fail the entire operation
   * @param {string} error - Error message
   */
  fail(error) {
    const duration = Date.now() - this.startTime
    this.emit('fail', {
      duration,
      error
    })
  }

  /**
   * Emit an event for this operation
   * @param {string} event - Event name (will be prefixed with operation type)
   * @param {object} data - Event data
   */
  emit(event, data = {}) {
    const fullEvent = `${this.operationType}:${event}`
    emitToRoom(this.operationId, fullEvent, {
      operationId: this.operationId,
      timestamp: Date.now(),
      ...data
    })
    // Also log for debugging
    if (config.isDev) {
      logger.info(`[Socket] ${fullEvent}: ${JSON.stringify(data).substring(0, 200)}`)
    }
  }
}

export default {
  initSocket,
  getIO,
  emitToRoom,
  emitToAll,
  ProgressEmitter
}
