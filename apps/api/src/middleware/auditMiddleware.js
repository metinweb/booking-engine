import AuditLog from '../modules/audit/audit.model.js'

/**
 * Audit edilecek endpoint'ler ve konfigürasyonları
 * Pattern: 'METHOD PATH' => { module, action, subModule?, collection? }
 */
const AUDITABLE_ROUTES = {
  // Auth
  'POST /api/auth/login': { module: 'auth', action: 'login' },
  'POST /api/auth/logout': { module: 'auth', action: 'logout' },
  'POST /api/auth/register': { module: 'auth', action: 'create' },

  // Users
  'POST /api/users': { module: 'user', action: 'create', collection: 'users' },
  'PUT /api/users/:id': { module: 'user', action: 'update', collection: 'users' },
  'DELETE /api/users/:id': { module: 'user', action: 'delete', collection: 'users' },

  // Partners
  'POST /api/partners': { module: 'partner', action: 'create', collection: 'partners' },
  'PUT /api/partners/:id': { module: 'partner', action: 'update', collection: 'partners' },
  'DELETE /api/partners/:id': { module: 'partner', action: 'delete', collection: 'partners' },
  'POST /api/partners/:id/approve': { module: 'partner', action: 'approve', collection: 'partners' },
  'POST /api/partners/:id/upload': { module: 'partner', action: 'upload', subModule: 'document', collection: 'partners' },

  // Hotels (Base)
  'POST /api/hotels/base': { module: 'hotel', action: 'create', subModule: 'base', collection: 'hotels' },
  'PUT /api/hotels/base/:id': { module: 'hotel', action: 'update', subModule: 'base', collection: 'hotels' },
  'DELETE /api/hotels/base/:id': { module: 'hotel', action: 'delete', subModule: 'base', collection: 'hotels' },
  'POST /api/hotels/base/:id/room-templates': { module: 'hotel', action: 'create', subModule: 'room_template', collection: 'hotels' },
  'PUT /api/hotels/base/:id/room-templates/:code': { module: 'hotel', action: 'update', subModule: 'room_template', collection: 'hotels' },
  'DELETE /api/hotels/base/:id/room-templates/:code': { module: 'hotel', action: 'delete', subModule: 'room_template', collection: 'hotels' },

  // Hotels (Partner)
  'POST /api/hotels': { module: 'hotel', action: 'create', collection: 'hotels' },
  'PUT /api/hotels/:id': { module: 'hotel', action: 'update', collection: 'hotels' },
  'DELETE /api/hotels/:id': { module: 'hotel', action: 'delete', collection: 'hotels' },
  'POST /api/hotels/:id/link-base': { module: 'hotel', action: 'link', subModule: 'base', collection: 'hotels' },
  'POST /api/hotels/:id/images': { module: 'hotel', action: 'upload', subModule: 'image', collection: 'hotels' },

  // Planning - Room Types
  'POST /api/planning/room-types': { module: 'planning', action: 'create', subModule: 'room_type', collection: 'roomtypes' },
  'PUT /api/planning/room-types/:id': { module: 'planning', action: 'update', subModule: 'room_type', collection: 'roomtypes' },
  'DELETE /api/planning/room-types/:id': { module: 'planning', action: 'delete', subModule: 'room_type', collection: 'roomtypes' },

  // Planning - Rate Plans
  'POST /api/planning/rate-plans': { module: 'planning', action: 'create', subModule: 'rate_plan', collection: 'rateplans' },
  'PUT /api/planning/rate-plans/:id': { module: 'planning', action: 'update', subModule: 'rate_plan', collection: 'rateplans' },
  'DELETE /api/planning/rate-plans/:id': { module: 'planning', action: 'delete', subModule: 'rate_plan', collection: 'rateplans' },

  // Planning - Contracts
  'POST /api/planning/contracts': { module: 'planning', action: 'create', subModule: 'contract', collection: 'contracts' },
  'PUT /api/planning/contracts/:id': { module: 'planning', action: 'update', subModule: 'contract', collection: 'contracts' },
  'DELETE /api/planning/contracts/:id': { module: 'planning', action: 'delete', subModule: 'contract', collection: 'contracts' },

  // Agencies
  'POST /api/agencies': { module: 'agency', action: 'create', collection: 'agencies' },
  'PUT /api/agencies/:id': { module: 'agency', action: 'update', collection: 'agencies' },
  'DELETE /api/agencies/:id': { module: 'agency', action: 'delete', collection: 'agencies' },

  // Site Settings
  'PUT /api/site-settings': { module: 'settings', action: 'update', subModule: 'site' },
  'PUT /api/site-settings/:id': { module: 'settings', action: 'update', subModule: 'site' },

  // Locations
  'POST /api/locations': { module: 'location', action: 'create', collection: 'locations' },
  'PUT /api/locations/:id': { module: 'location', action: 'update', collection: 'locations' },
  'DELETE /api/locations/:id': { module: 'location', action: 'delete', collection: 'locations' },

  // Tags
  'POST /api/tags': { module: 'tag', action: 'create', collection: 'tags' },
  'PUT /api/tags/:id': { module: 'tag', action: 'update', collection: 'tags' },
  'DELETE /api/tags/:id': { module: 'tag', action: 'delete', collection: 'tags' },

  // AI Import
  'POST /api/hotels/base/ai-extract': { module: 'hotel', action: 'import', subModule: 'ai' }
}

/**
 * Route pattern'ini eşleştir
 * /api/hotels/123 -> /api/hotels/:id
 */
const matchRoute = (method, path) => {
  const routeKey = `${method} ${path}`

  // Direkt eşleşme
  if (AUDITABLE_ROUTES[routeKey]) {
    return AUDITABLE_ROUTES[routeKey]
  }

  // Pattern eşleştirme
  for (const pattern of Object.keys(AUDITABLE_ROUTES)) {
    const [patternMethod, patternPath] = pattern.split(' ')
    if (patternMethod !== method) continue

    // Pattern'i regex'e çevir
    const regexPattern = patternPath
      .replace(/:[^/]+/g, '[^/]+')  // :id -> [^/]+
      .replace(/\//g, '\\/')         // / -> \/

    const regex = new RegExp(`^${regexPattern}$`)
    if (regex.test(path)) {
      return AUDITABLE_ROUTES[pattern]
    }
  }

  return null
}

/**
 * IP adresini al
 */
const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip ||
         'unknown'
}

/**
 * User Agent'ı kısalt
 */
const shortenUserAgent = (ua) => {
  if (!ua) return 'unknown'
  if (ua.length <= 200) return ua
  return ua.substring(0, 200) + '...'
}

/**
 * Audit Middleware
 * HTTP request seviyesinde loglama yapar
 */
export const auditMiddleware = (req, res, next) => {
  const startTime = Date.now()

  // Original send fonksiyonunu sakla
  const originalSend = res.send.bind(res)
  let responseBody = null

  // Response'u yakala
  res.send = function(body) {
    responseBody = body
    return originalSend(body)
  }

  // Response bittiğinde log oluştur
  res.on('finish', async () => {
    try {
      // Route pattern'ini kontrol et
      const routePath = req.route?.path || req.path
      const auditConfig = matchRoute(req.method, routePath)

      // Bu route audit edilmiyor
      if (!auditConfig) return

      const duration = Date.now() - startTime
      const isSuccess = res.statusCode < 400

      // Actor bilgilerini oluştur
      const actor = {
        ip: getClientIp(req),
        userAgent: shortenUserAgent(req.headers['user-agent'])
      }

      // Kullanıcı giriş yapmışsa bilgilerini ekle
      if (req.user) {
        actor.userId = req.user._id
        actor.email = req.user.email
        actor.name = req.user.name
        actor.role = req.user.accountType === 'platform' ? 'superadmin' : req.user.role

        if (req.user.accountType === 'partner') {
          actor.partnerId = req.user.accountId
        }
      }

      // Target bilgilerini oluştur
      const target = {
        collection: auditConfig.collection,
        documentId: req.params?.id
      }

      // Response'dan document name almaya çalış
      if (isSuccess && responseBody) {
        try {
          const data = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody
          if (data?.data?.name) {
            target.documentName = data.data.name.tr || data.data.name.en || data.data.name
          } else if (data?.data?.companyName) {
            target.documentName = data.data.companyName
          } else if (data?.data?.email) {
            target.documentName = data.data.email
          }
        } catch (e) {
          // JSON parse hatası, devam et
        }
      }

      // Log oluştur
      await AuditLog.log({
        actor,
        module: auditConfig.module,
        subModule: auditConfig.subModule,
        action: auditConfig.action,
        target,
        request: {
          method: req.method,
          path: req.originalUrl,
          query: Object.keys(req.query).length > 0 ? req.query : undefined,
          statusCode: res.statusCode,
          duration
        },
        status: isSuccess ? 'success' : 'failure',
        errorMessage: !isSuccess ? `HTTP ${res.statusCode}` : undefined
      })
    } catch (error) {
      console.error('Audit middleware error:', error.message)
    }
  })

  next()
}

/**
 * Audit context oluşturucu
 * Service fonksiyonlarında kullanmak için
 */
export const createAuditContext = (req) => {
  if (!req || !req.user) return {}

  return {
    actor: {
      userId: req.user._id,
      partnerId: req.user.accountType === 'partner' ? req.user.accountId : undefined,
      email: req.user.email,
      name: req.user.name,
      role: req.user.accountType === 'platform' ? 'superadmin' : req.user.role,
      ip: getClientIp(req),
      userAgent: shortenUserAgent(req.headers['user-agent'])
    },
    request: {
      method: req.method,
      path: req.originalUrl
    }
  }
}

export default auditMiddleware
