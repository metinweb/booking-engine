import Partner from '#modules/partner/partner.model.js'
import SubscriptionInvoice from '#modules/subscriptionInvoice/subscriptionInvoice.model.js'
import { asyncHandler } from '#helpers'
import { NotFoundError, ForbiddenError } from '#core/errors.js'
import { SUBSCRIPTION_PLANS } from '#constants/subscriptionPlans.js'
import PDFDocument from 'pdfkit'

// Get my subscription info (for partner users)
export const getMySubscription = asyncHandler(async (req, res) => {
  // Only partner users can access this
  if (req.user.accountType !== 'partner') {
    throw new ForbiddenError('PARTNER_ONLY')
  }

  const partnerId = req.user.accountId
  const partner = await Partner.findById(partnerId)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const subscriptionStatus = partner.getSubscriptionStatus()
  const plan = SUBSCRIPTION_PLANS[subscriptionStatus.plan] || SUBSCRIPTION_PLANS.business

  // Get PMS usage
  const Hotel = (await import('#modules/hotel/hotel.model.js')).default
  const pmsHotelsCount = await Hotel.countDocuments({
    partner: partnerId,
    'pms.enabled': true
  })

  res.json({
    success: true,
    data: {
      plan: subscriptionStatus.plan,
      planName: plan.name,
      status: subscriptionStatus.status,
      startDate: subscriptionStatus.startDate,
      endDate: subscriptionStatus.endDate,
      renewalDate: subscriptionStatus.renewalDate,
      gracePeriodEndDate: subscriptionStatus.gracePeriodEndDate,
      remainingDays: subscriptionStatus.remainingDays,
      gracePeriodRemainingDays: subscriptionStatus.gracePeriodRemainingDays,
      paymentHistory: subscriptionStatus.paymentHistory,
      lastPayment: subscriptionStatus.lastPayment,
      // PMS info
      pmsEnabled: plan.pmsEnabled,
      pmsLimit: subscriptionStatus.customLimits?.pmsMaxHotels ?? plan.pmsMaxHotels,
      pmsUsed: pmsHotelsCount,
      // Plan features
      features: plan.features || []
    }
  })
})

// Get my invoices (for partner users)
export const getMyInvoices = asyncHandler(async (req, res) => {
  // Only partner users can access this
  if (req.user.accountType !== 'partner') {
    throw new ForbiddenError('PARTNER_ONLY')
  }

  const partnerId = req.user.accountId
  const { page = 1, limit = 20 } = req.query

  const invoices = await SubscriptionInvoice.find({ partner: partnerId })
    .sort({ invoiceDate: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))

  const total = await SubscriptionInvoice.countDocuments({ partner: partnerId })

  res.json({
    success: true,
    data: {
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })
})

// Download my invoice PDF (for partner users)
export const downloadMyInvoicePDF = asyncHandler(async (req, res) => {
  // Only partner users can access this
  if (req.user.accountType !== 'partner') {
    throw new ForbiddenError('PARTNER_ONLY')
  }

  const partnerId = req.user.accountId
  const invoice = await SubscriptionInvoice.findOne({
    _id: req.params.id,
    partner: partnerId // Ensure partner can only access their own invoices
  }).populate('partner')

  if (!invoice) {
    throw new NotFoundError('INVOICE_NOT_FOUND')
  }

  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    bufferPages: true
  })

  // Response headers
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`)

  doc.pipe(res)

  // === PDF CONTENT ===

  // Header
  doc.fontSize(24).font('Helvetica-Bold').text('FATURA / INVOICE', { align: 'center' })
  doc.moveDown(0.5)
  doc.fontSize(12).font('Helvetica').text(`Fatura No: ${invoice.invoiceNumber}`, { align: 'center' })
  doc.text(`Tarih: ${invoice.invoiceDate.toLocaleDateString('tr-TR')}`, { align: 'center' })
  doc.moveDown(2)

  // Seller and Buyer Info (side by side)
  const startY = doc.y

  // Seller (Left)
  doc.fontSize(10).font('Helvetica-Bold').text('SATICI / SELLER', 50, startY)
  doc.font('Helvetica').fontSize(9)
  doc.text(invoice.seller.companyName || '-', 50, startY + 15)
  if (invoice.seller.taxNumber) {
    doc.text(`Vergi No: ${invoice.seller.taxNumber}`, 50)
  }
  if (invoice.seller.taxOffice) {
    doc.text(`Vergi Dairesi: ${invoice.seller.taxOffice}`, 50)
  }
  if (invoice.seller.address?.street) {
    doc.text(invoice.seller.address.street, 50)
    doc.text(`${invoice.seller.address.city || ''} ${invoice.seller.address.country || ''}`, 50)
  }
  if (invoice.seller.email) {
    doc.text(`Email: ${invoice.seller.email}`, 50)
  }
  if (invoice.seller.phone) {
    doc.text(`Tel: ${invoice.seller.phone}`, 50)
  }

  // Buyer (Right)
  doc.fontSize(10).font('Helvetica-Bold').text('ALICI / BUYER', 320, startY)
  doc.font('Helvetica').fontSize(9)
  doc.text(invoice.buyer.companyName || '-', 320, startY + 15)
  if (invoice.buyer.tradeName) {
    doc.text(invoice.buyer.tradeName, 320)
  }
  if (invoice.buyer.taxNumber) {
    doc.text(`Vergi No: ${invoice.buyer.taxNumber}`, 320)
  }
  if (invoice.buyer.taxOffice) {
    doc.text(`Vergi Dairesi: ${invoice.buyer.taxOffice}`, 320)
  }
  if (invoice.buyer.address?.street) {
    doc.text(invoice.buyer.address.street, 320)
    doc.text(`${invoice.buyer.address.city || ''} ${invoice.buyer.address.country || ''}`, 320)
  }
  if (invoice.buyer.email) {
    doc.text(`Email: ${invoice.buyer.email}`, 320)
  }

  doc.moveDown(5)

  // Table Header
  const tableTop = doc.y + 20
  doc.fontSize(9).font('Helvetica-Bold')
  doc.text('Aciklama / Description', 50, tableTop)
  doc.text('Miktar', 300, tableTop)
  doc.text('Birim Fiyat', 360, tableTop)
  doc.text('KDV', 440, tableTop)
  doc.text('Toplam', 490, tableTop)

  // Line
  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke()

  // Items
  let y = tableTop + 25
  doc.font('Helvetica').fontSize(9)

  for (const item of invoice.lineItems) {
    doc.text(item.description, 50, y, { width: 240 })
    doc.text(item.quantity.toString(), 300, y)
    doc.text(`${item.unitPrice.toFixed(2)}`, 360, y)
    doc.text(`%${item.taxRate}`, 440, y)
    doc.text(`${item.total.toFixed(2)}`, 490, y)
    y += 20
  }

  // Bottom Line
  doc.moveTo(50, y + 5).lineTo(550, y + 5).stroke()

  // Totals (Bottom right)
  y += 20
  doc.font('Helvetica').fontSize(10)
  doc.text('Ara Toplam / Subtotal:', 380, y)
  doc.text(`${invoice.subtotal.toFixed(2)} ${invoice.currency}`, 490, y)

  if (invoice.taxAmount > 0) {
    y += 18
    doc.text(`KDV / VAT (%${invoice.taxRate}):`, 380, y)
    doc.text(`${invoice.taxAmount.toFixed(2)} ${invoice.currency}`, 490, y)
  }

  y += 25
  doc.font('Helvetica-Bold').fontSize(12)
  doc.text('GENEL TOPLAM / TOTAL:', 350, y)
  doc.text(`${invoice.total.toFixed(2)} ${invoice.currency}`, 490, y)

  // Payment Info
  if (invoice.status === 'paid') {
    y += 40
    doc.font('Helvetica').fontSize(10)
    doc.fillColor('green').text('ODENDI / PAID', 400, y)
    doc.fillColor('black')
    if (invoice.paidAt) {
      doc.fontSize(9).text(`Odeme Tarihi: ${invoice.paidAt.toLocaleDateString('tr-TR')}`, 400, y + 15)
    }
    if (invoice.paymentReference) {
      doc.text(`Referans: ${invoice.paymentReference}`, 400, y + 28)
    }
  }

  // Subscription Period
  if (invoice.subscriptionPeriod?.startDate && invoice.subscriptionPeriod?.endDate) {
    y += 60
    doc.fontSize(9).font('Helvetica')
    doc.text('Abonelik Donemi / Subscription Period:', 50, y)
    doc.text(
      `${invoice.subscriptionPeriod.startDate.toLocaleDateString('tr-TR')} - ${invoice.subscriptionPeriod.endDate.toLocaleDateString('tr-TR')}`,
      50,
      y + 12
    )
  }

  // Notes
  if (invoice.notes) {
    doc.moveDown(3)
    doc.fontSize(9).font('Helvetica-Bold').text('Notlar / Notes:', 50)
    doc.font('Helvetica').text(invoice.notes, 50, doc.y + 5, { width: 500 })
  }

  // Footer
  doc.fontSize(8).font('Helvetica')
    .text('Bu fatura elektronik ortamda olusturulmustur.', 50, 780, { align: 'center' })
  doc.text('This invoice was generated electronically.', 50, 792, { align: 'center' })

  doc.end()
})
