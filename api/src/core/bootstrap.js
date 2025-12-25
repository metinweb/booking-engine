import mongoose from 'mongoose'
import Partner from '../modules/partner/partner.model.js'
import Agency from '../modules/agency/agency.model.js'
import User from '../modules/user/user.model.js'
import logger from './logger.js'

export async function bootstrap() {
  try {
    logger.info('🔧 Running bootstrap...')

    // Platform admin user kontrolü
    const platformAdmin = await User.findOne({
      accountType: 'platform',
      email: 'admin@platform.com'
    })

    if (!platformAdmin) {
      logger.info('Creating platform admin user...')

      await User.create({
        accountType: 'platform',
        accountId: new mongoose.Types.ObjectId(),
        name: 'Platform Admin',
        email: 'admin@platform.com',
        password: 'admin123',
        role: 'admin',
        status: 'active'
      })

      logger.info('✓ Platform admin created: admin@platform.com / admin123')
    }

    logger.info('✓ Bootstrap completed')
  } catch (error) {
    logger.error(`Bootstrap error: ${error.message}`)
  }
}

export default bootstrap
