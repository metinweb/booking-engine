/**
 * Commission Routes
 * Endpoints for commission rate queries and calculations
 */

import { Router } from 'express';
import { VirtualPos, PartnerPosCommission } from '../models/index.js';

const router = Router();

/**
 * GET /api/commission/default-rates
 * Get default installment rates for a partner
 * Returns: bank commission + platform margin for each installment
 *
 * Kaynak önceliği:
 * 1. PartnerPosCommission (partner'a özel oranlar varsa)
 * 2. VirtualPos.commissionRates (POS'un varsayılan oranları)
 */
router.get('/default-rates', async (req, res) => {
  try {
    const { partnerId, currency = 'try' } = req.query;
    const currencyLower = currency.toLowerCase();

    console.log('[Commission] Getting default rates for:', { partnerId, currency: currencyLower });

    // 1. Find platform POS for this currency (partnerId = null)
    const platformPos = await VirtualPos.findOne({
      $or: [{ partnerId: null }, { partnerId: { $exists: false } }],
      currencies: currencyLower,
      status: true
    }).sort({ priority: -1 });

    console.log('[Commission] Platform POS:', platformPos ? platformPos.name : 'NOT FOUND');

    if (!platformPos) {
      return res.json({
        success: true,
        data: {
          defaultRates: {},
          breakdown: {},
          message: 'Platform POS bulunamadı'
        }
      });
    }

    // 2. Get bank commission rates from POS (current period)
    const now = new Date();
    let currentPeriod = null;

    if (platformPos.commissionRates && platformPos.commissionRates.length > 0) {
      // Find the most recent period that has started
      currentPeriod = platformPos.commissionRates
        .filter(p => p.startDate <= now)
        .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0];
    }

    console.log('[Commission] Current period:', currentPeriod ? {
      startDate: currentPeriod.startDate,
      ratesCount: currentPeriod.rates?.length || 0
    } : 'NOT FOUND');

    // 3. Get partner-specific commission from PartnerPosCommission
    let partnerCommission = null;
    if (partnerId) {
      partnerCommission = await PartnerPosCommission.findForPartner(
        partnerId,
        currencyLower,
        null // General commission, not POS-specific
      );
      console.log('[Commission] Partner commission:', partnerCommission ? {
        defaultRate: partnerCommission.defaultRate,
        ratesCount: partnerCommission.rates?.length || 0,
        rates: partnerCommission.rates
      } : 'NOT FOUND');
    }

    // 4. Build rates object
    const defaultRates = {};
    const breakdown = {};

    // Standard installment counts
    const installmentCounts = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    for (const count of installmentCounts) {
      // Get bank rate and platform margin from POS commission period
      let bankRate = 0;
      let posPlatformMargin = 0;

      if (currentPeriod && currentPeriod.rates) {
        const rateConfig = currentPeriod.rates.find(r => r.count === count);
        if (rateConfig) {
          bankRate = rateConfig.rate || 0;
          posPlatformMargin = rateConfig.platformMargin || 0;
        }
      }

      // Get partner-specific margin from PartnerPosCommission (overrides POS margin if exists)
      let partnerMargin = 0;
      if (partnerCommission) {
        // Try to find specific rate for this installment
        const matchedRate = partnerCommission.rates?.find(r =>
          r.installment === count
        );
        if (matchedRate) {
          partnerMargin = matchedRate.rate || 0;
        } else {
          // Use default rate
          partnerMargin = partnerCommission.defaultRate || 0;
        }
      }

      // Total platform margin: Use partner-specific if exists, otherwise use POS default
      const effectivePlatformMargin = partnerCommission ? partnerMargin : posPlatformMargin;

      // Total rate = bank rate + platform margin
      const totalRate = bankRate + effectivePlatformMargin;

      defaultRates[count] = Math.round(totalRate * 100) / 100;
      breakdown[count] = {
        bankRate: Math.round(bankRate * 100) / 100,
        platformMargin: Math.round(effectivePlatformMargin * 100) / 100,
        posPlatformMargin: Math.round(posPlatformMargin * 100) / 100,
        partnerMargin: Math.round(partnerMargin * 100) / 100
      };
    }

    console.log('[Commission] Final rates:', defaultRates);

    res.json({
      success: true,
      data: {
        defaultRates,
        breakdown,
        posId: platformPos._id,
        posName: platformPos.name,
        posBank: platformPos.bankCode,
        hasPartnerCommission: !!partnerCommission,
        hasCommissionPeriod: !!currentPeriod
      }
    });
  } catch (error) {
    console.error('[Commission] Error getting default rates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/commission/calculate
 * Calculate commission for a transaction
 */
router.post('/calculate', async (req, res) => {
  try {
    const { amount, posId, partnerId, installment = 1, cardType = 'credit', cardFamily = 'all', currency = 'try' } = req.body;

    if (!amount || !posId) {
      return res.status(400).json({
        success: false,
        error: 'amount ve posId gerekli'
      });
    }

    // Get POS
    const pos = await VirtualPos.findById(posId);
    if (!pos) {
      return res.status(404).json({
        success: false,
        error: 'POS bulunamadı'
      });
    }

    // Calculate bank commission
    const bankCommission = calculateBankCommission(pos, installment, cardType);

    // Calculate platform commission if using platform POS
    let platformCommission = { rate: 0, amount: 0 };
    const isUsingPlatformPos = !pos.partnerId;

    if (isUsingPlatformPos && partnerId) {
      const commissionConfig = await PartnerPosCommission.findForPartner(
        partnerId,
        currency.toLowerCase(),
        posId
      );

      if (commissionConfig) {
        platformCommission = commissionConfig.calculateCommission(amount, {
          cardType,
          cardFamily,
          installment
        });
      }
    }

    // Calculate totals
    const bankAmount = Math.round(amount * bankCommission.rate / 100 * 100) / 100;
    const totalRate = bankCommission.rate + platformCommission.rate;
    const totalAmount = bankAmount + platformCommission.amount;
    const netAmount = Math.round((amount - totalAmount) * 100) / 100;

    res.json({
      success: true,
      data: {
        bankRate: bankCommission.rate,
        bankAmount,
        platformRate: platformCommission.rate,
        platformAmount: platformCommission.amount,
        totalRate: Math.round(totalRate * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        netAmount
      }
    });
  } catch (error) {
    console.error('Error calculating commission:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Calculate bank commission from POS commission rates
 */
function calculateBankCommission(pos, installment, cardType = 'credit') {
  const now = new Date();

  // Find current commission period
  let currentPeriod = null;
  if (pos.commissionRates && pos.commissionRates.length > 0) {
    currentPeriod = pos.commissionRates
      .filter(p => p.startDate <= now)
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0];
  }

  if (!currentPeriod) {
    return { rate: 0 };
  }

  // Find rate for this installment count
  const rateConfig = currentPeriod.rates?.find(r => r.count === installment);
  if (rateConfig) {
    return { rate: rateConfig.rate || 0 };
  }

  // Fallback: use single payment rate (count = 1)
  const singleRate = currentPeriod.rates?.find(r => r.count === 1);
  return { rate: singleRate?.rate || 0 };
}

export default router;
