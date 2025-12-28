import AuditLog from '../modules/audit/audit.model.js'

// Hassas alanlar - loglanmayacak
const SENSITIVE_FIELDS = [
  'password', 'passwordHash', 'token', 'secret', 'apiKey',
  'twoFactorSecret', 'refreshToken', 'accessToken'
]

// Büyük alanlar - kısaltılacak
const LARGE_FIELDS = ['images', 'roomTemplates', 'content', 'description']
const MAX_ARRAY_LENGTH = 5
const MAX_STRING_LENGTH = 500

/**
 * Hassas ve büyük alanları temizle
 */
const sanitizeObject = (obj, depth = 0) => {
  if (!obj || typeof obj !== 'object' || depth > 3) return obj

  const sanitized = Array.isArray(obj) ? [] : {}

  for (const key of Object.keys(obj)) {
    // Hassas alanları atla
    if (SENSITIVE_FIELDS.includes(key)) {
      sanitized[key] = '[REDACTED]'
      continue
    }

    const value = obj[key]

    // Büyük array'leri kısalt
    if (Array.isArray(value) && LARGE_FIELDS.includes(key)) {
      sanitized[key] = value.length > MAX_ARRAY_LENGTH
        ? [...value.slice(0, MAX_ARRAY_LENGTH), `... +${value.length - MAX_ARRAY_LENGTH} more`]
        : value
      continue
    }

    // Uzun string'leri kısalt
    if (typeof value === 'string' && value.length > MAX_STRING_LENGTH) {
      sanitized[key] = value.substring(0, MAX_STRING_LENGTH) + '...'
      continue
    }

    // Nested object'ler için recursive
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value, depth + 1)
      continue
    }

    sanitized[key] = value
  }

  return sanitized
}

/**
 * Alan değişikliklerini bul
 */
const getDiff = (before, after) => {
  const diff = []
  if (!before && !after) return diff

  const allKeys = new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after || {})
  ])

  for (const key of allKeys) {
    // Hassas ve meta alanları atla
    if (SENSITIVE_FIELDS.includes(key)) continue
    if (key.startsWith('_') || key === 'updatedAt' || key === '__v') continue

    const oldVal = before?.[key]
    const newVal = after?.[key]

    // Değişiklik var mı kontrol et
    const oldStr = JSON.stringify(oldVal)
    const newStr = JSON.stringify(newVal)

    if (oldStr !== newStr) {
      diff.push({
        field: key,
        from: sanitizeValue(oldVal),
        to: sanitizeValue(newVal)
      })
    }
  }

  return diff
}

/**
 * Tek bir değeri sanitize et
 */
const sanitizeValue = (value) => {
  if (value === undefined) return undefined
  if (value === null) return null

  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_LENGTH) {
      return `Array(${value.length} items)`
    }
    return value
  }

  if (typeof value === 'string' && value.length > MAX_STRING_LENGTH) {
    return value.substring(0, MAX_STRING_LENGTH) + '...'
  }

  if (typeof value === 'object') {
    return sanitizeObject(value)
  }

  return value
}

/**
 * Mongoose Audit Plugin
 * Document seviyesinde değişiklikleri otomatik loglar
 */
const auditPlugin = function(schema, options = {}) {
  const {
    module = 'unknown',
    subModule = null,
    nameField = 'name'  // Okunabilir isim için alan
  } = options

  /**
   * Document adını al (multilingual desteği ile)
   */
  const getDocumentName = (doc) => {
    if (!doc) return null

    const nameValue = doc[nameField]
    if (!nameValue) return null

    // Multilingual name
    if (typeof nameValue === 'object') {
      return nameValue.tr || nameValue.en || Object.values(nameValue)[0]
    }

    return nameValue
  }

  /**
   * CREATE - Yeni kayıt oluşturulduğunda
   */
  schema.post('save', async function(doc, next) {
    // Sadece yeni kayıtlar (isNew pre-save'de true, post-save'de false)
    // Bu yüzden _wasNew flag kullanıyoruz
    if (!this._wasNew) return next ? next() : undefined

    try {
      const context = doc._auditContext || this._auditContext || {}

      await AuditLog.log({
        actor: context.actor || { role: 'system' },
        module,
        subModule,
        action: 'create',
        target: {
          collection: doc.constructor.collection.name,
          documentId: doc._id,
          documentName: getDocumentName(doc)
        },
        changes: {
          after: sanitizeObject(doc.toObject ? doc.toObject() : doc)
        },
        request: context.request,
        status: 'success'
      })
    } catch (error) {
      console.error('Audit plugin error (create):', error.message)
    }

    return next ? next() : undefined
  })

  // isNew flag'ini kaydet (post-save'de erişebilmek için)
  schema.pre('save', function(next) {
    this._wasNew = this.isNew
    next()
  })

  /**
   * UPDATE - findOneAndUpdate kullanıldığında
   */
  schema.pre('findOneAndUpdate', async function() {
    try {
      this._auditBefore = await this.model.findOne(this.getQuery()).lean()
    } catch (error) {
      console.error('Audit plugin error (pre-update):', error.message)
    }
  })

  schema.post('findOneAndUpdate', async function(doc, next) {
    if (!doc || !this._auditBefore) return next ? next() : undefined

    try {
      const context = this.options?._auditContext || {}
      const before = this._auditBefore
      const after = doc.toObject ? doc.toObject() : doc

      const diff = getDiff(before, after)

      // Sadece gerçek değişiklik varsa logla
      if (diff.length === 0) return next ? next() : undefined

      await AuditLog.log({
        actor: context.actor || { role: 'system' },
        module,
        subModule,
        action: 'update',
        target: {
          collection: doc.constructor?.collection?.name || this.model.collection.name,
          documentId: doc._id,
          documentName: getDocumentName(doc)
        },
        changes: {
          before: sanitizeObject(before),
          after: sanitizeObject(after),
          diff
        },
        request: context.request,
        status: 'success'
      })
    } catch (error) {
      console.error('Audit plugin error (update):', error.message)
    }

    return next ? next() : undefined
  })

  /**
   * DELETE - findOneAndDelete kullanıldığında
   */
  schema.pre('findOneAndDelete', async function() {
    try {
      this._auditBefore = await this.model.findOne(this.getQuery()).lean()
    } catch (error) {
      console.error('Audit plugin error (pre-delete):', error.message)
    }
  })

  schema.post('findOneAndDelete', async function(doc, next) {
    if (!this._auditBefore) return next ? next() : undefined

    try {
      const context = this.options?._auditContext || {}

      await AuditLog.log({
        actor: context.actor || { role: 'system' },
        module,
        subModule,
        action: 'delete',
        target: {
          collection: this.model.collection.name,
          documentId: this._auditBefore._id,
          documentName: getDocumentName(this._auditBefore)
        },
        changes: {
          before: sanitizeObject(this._auditBefore)
        },
        request: context.request,
        status: 'success'
      })
    } catch (error) {
      console.error('Audit plugin error (delete):', error.message)
    }

    return next ? next() : undefined
  })

  /**
   * DELETE - deleteOne kullanıldığında
   */
  schema.pre('deleteOne', { document: false, query: true }, async function() {
    try {
      this._auditBefore = await this.model.findOne(this.getQuery()).lean()
    } catch (error) {
      console.error('Audit plugin error (pre-deleteOne):', error.message)
    }
  })

  schema.post('deleteOne', { document: false, query: true }, async function(result, next) {
    if (!this._auditBefore || result.deletedCount === 0) return next ? next() : undefined

    try {
      const context = this.options?._auditContext || {}

      await AuditLog.log({
        actor: context.actor || { role: 'system' },
        module,
        subModule,
        action: 'delete',
        target: {
          collection: this.model.collection.name,
          documentId: this._auditBefore._id,
          documentName: getDocumentName(this._auditBefore)
        },
        changes: {
          before: sanitizeObject(this._auditBefore)
        },
        request: context.request,
        status: 'success'
      })
    } catch (error) {
      console.error('Audit plugin error (deleteOne):', error.message)
    }

    return next ? next() : undefined
  })
}

export default auditPlugin
