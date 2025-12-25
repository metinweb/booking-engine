import app from './app.js'
import config from './config/index.js'
import logger from './core/logger.js'
import { connectDB } from './core/mongoose.js'
import bootstrap from './core/bootstrap.js'

// Connect to database
await connectDB()

// Run bootstrap (initial setup)
await bootstrap()

// Start server
const server = app.listen(config.port, () => {
  logger.info(`🚀 Server running in ${config.env} mode`)
  logger.info(`📡 Listening on port ${config.port}`)
  logger.info(`🌍 CORS enabled for: ${config.cors.origin.join(', ')}`)
})

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, shutting down gracefully...`)
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
