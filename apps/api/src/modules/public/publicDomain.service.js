/**
 * Public Domain Service
 * Domain resolution for PMS systems
 */

import { asyncHandler } from '#helpers'
import Hotel from '../hotel/hotel.model.js'
import Partner from '../partner/partner.model.js'
import { BadRequestError, NotFoundError } from '#core/errors.js'

/**
 * Resolve PMS domain to hotel or partner
 * GET /public/resolve-domain?domain=pms.susesi.com
 * Returns hotel or partner info based on domain match
 */
export const resolveDomain = asyncHandler(async (req, res) => {
  const { domain } = req.query

  if (!domain) {
    throw new BadRequestError('Domain parameter is required')
  }

  const normalizedDomain = domain.toLowerCase().trim()

  // Find partner by pmsDomain
  const partner = await Partner.findByPmsDomain(normalizedDomain)

  if (partner && partner.status === 'active') {
    // Get all active hotels for this partner
    const hotels = await Hotel.find({
      partner: partner._id,
      status: 'active'
    })
      .select('_id name slug logo stars')
      .limit(50)

    return res.json({
      success: true,
      data: {
        partnerId: partner._id,
        partnerName: partner.companyName,
        code: partner.code,
        logo: partner.branding?.logo,
        hotels: hotels.map(h => ({
          id: h._id,
          name: h.name,
          slug: h.slug,
          logo: h.logo,
          stars: h.stars
        }))
      }
    })
  }

  // No match found
  throw new NotFoundError('No partner found for this domain')
})
