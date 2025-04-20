import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from "path";
import multer from 'multer';
import dotenv from 'dotenv'
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, ".env"),
});

// Configure your cloudinary credentials
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

// File filter function
function fileFilter(req, file, cb) {
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;
  
  if (['.jpeg', '.jpg', '.png', '.webp'].includes(extname) && 
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(mimetype)) {
    cb(null, true);
  } else {
    req.fileValidationError = "Only JPG, JPEG, PNG & WEBP files are allowed!";
    cb(null, false);
  }
}

// Error handler for file size
function fileSizeErrorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum 1MB allowed.'
      });
    }
  }
  next(err);
}

// Create storage configuration
function createStorage(folderName) {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: folderName,
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      transformation: [{ width: 500, height: 500, crop: 'limit' }]
    }
  });
}

// Create upload middleware with common configuration
function createUploadMiddleware(storage) {
  return multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { 
      fileSize: 1 * 1024 * 1024 // 1MB
    }
  });
}

const uploadProvider = createUploadMiddleware(createStorage('providers'));
const uploadUser = createUploadMiddleware(createStorage('users'));

export { uploadProvider, uploadUser, fileSizeErrorHandler };
