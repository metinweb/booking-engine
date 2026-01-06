import express from 'express'
import sessionService from './session.service.js'
import { protect } from '#middleware/auth.js'

const router = express.Router()

// All routes require authentication
router.use(protect)

/**
 * @route   GET /sessions/my-sessions
 * @desc    Get current user's active sessions
 * @access  Private
 */
router.get('/my-sessions', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    const sessions = await sessionService.getMySessions(req.user._id, token)

    res.json({
      success: true,
      data: sessions
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @route   DELETE /sessions/my-sessions/:sessionId
 * @desc    Terminate one of current user's sessions
 * @access  Private
 */
router.delete('/my-sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params

    await sessionService.terminateSession(sessionId, req.user._id, 'logout')

    res.json({
      success: true,
      message: 'SESSION_TERMINATED'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @route   POST /sessions/my-sessions/terminate-others
 * @desc    Terminate all sessions except current
 * @access  Private
 */
router.post('/my-sessions/terminate-others', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    await sessionService.terminateOtherSessions(req.user._id, token, req.user._id)

    res.json({
      success: true,
      message: 'OTHER_SESSIONS_TERMINATED'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @route   GET /sessions
 * @desc    Get all active sessions (admin only)
 * @access  Private (Admin)
 */
router.get('/', async (req, res) => {
  try {
    // Only admins can view all sessions
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'UNAUTHORIZED'
      })
    }

    const { page, limit } = req.query

    const result = await sessionService.getAllActiveSessions(
      req.user.accountType,
      req.user.accountId,
      {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50
      }
    )

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

export default router
