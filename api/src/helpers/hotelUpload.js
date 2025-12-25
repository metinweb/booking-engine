import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadsDir)) {
	fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure storage for hotel images
const hotelStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		// Partner ID from request
		const partnerId = req.partnerId || req.user?.accountId
		const hotelId = req.params?.id

		if (!partnerId || !hotelId) {
			return cb(new Error('Partner ID and Hotel ID are required'))
		}

		const hotelDir = path.join(uploadsDir, 'hotels', partnerId.toString(), hotelId.toString())

		if (!fs.existsSync(hotelDir)) {
			fs.mkdirSync(hotelDir, { recursive: true })
		}
		cb(null, hotelDir)
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
		const ext = path.extname(file.originalname)
		cb(null, `hotel-${uniqueSuffix}${ext}`)
	}
})

// File filter - only images
const imageFilter = (req, file, cb) => {
	const allowedTypes = /jpeg|jpg|png|gif|webp/
	const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
	const mimetype = /image\/(jpeg|jpg|png|gif|webp)/.test(file.mimetype)

	if (extname || mimetype) {
		return cb(null, true)
	} else {
		cb(new Error('Invalid file type. Only image files (JPEG, PNG, GIF, WEBP) are allowed.'))
	}
}

// Configure multer for hotel images
export const hotelUpload = multer({
	storage: hotelStorage,
	fileFilter: imageFilter,
	limits: {
		fileSize: 10 * 1024 * 1024 // 10MB limit for hotel images
	}
})

// Helper to get file URL
export const getHotelFileUrl = (partnerId, hotelId, filename) => {
	return `/uploads/hotels/${partnerId}/${hotelId}/${filename}`
}

// Helper to delete file
export const deleteHotelFile = (partnerId, hotelId, filename) => {
	const filePath = path.join(uploadsDir, 'hotels', partnerId.toString(), hotelId.toString(), filename)
	if (fs.existsSync(filePath)) {
		fs.unlinkSync(filePath)
		return true
	}
	return false
}

// Helper to delete all files for a hotel
export const deleteHotelFolder = (partnerId, hotelId) => {
	const hotelDir = path.join(uploadsDir, 'hotels', partnerId.toString(), hotelId.toString())
	if (fs.existsSync(hotelDir)) {
		fs.rmSync(hotelDir, { recursive: true, force: true })
		return true
	}
	return false
}
