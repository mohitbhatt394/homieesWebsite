import express from 'express';
import authLimiter from "../middlewares/authLimited.js";
import { uploadProvider, fileSizeErrorHandler } from '../config/cloudinary.js';
import { registration, providerRegistration, services, searchProviders, getProviderReviews, getProviderCity } from '../controllers/provider.js';
import { providerReview } from '../controllers/review.js';
import isLoggedIn from '../middlewares/auth.js';
// import { messaging } from 'firebase-admin';

const router = express.Router();

// const upload = multer({storage: storage2});




router.get('/register', isLoggedIn ,registration);



router.post(
  '/register', 
  authLimiter,
  isLoggedIn,
  
  uploadProvider.single('picture'),
  (req, res, next) => {
    // Handle file upload validation and errors
    if (req.fileValidationError) {
      return res.status(400).json({
        success: false,
        message: req.fileValidationError
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image to upload"
      });
    }
    
    next();
  },
  fileSizeErrorHandler, // Add this error handler
  providerRegistration
);
  
  


router.get('/service/:category', isLoggedIn ,services);
router.get('/service/:category/address/search', isLoggedIn ,searchProviders);


router.get("/get-districts", getProviderCity)

router.post("/:providerId/reviews", isLoggedIn ,providerReview);
router.get("/:providerId/reviews", isLoggedIn ,getProviderReviews);

export default router;
