import express from "express";
import authLimiter from "../middlewares/authLimited.js";
import { uploadUser, fileSizeErrorHandler } from '../config/cloudinary.js';
import { register ,registerUser, verifyOtp, resendOtp, login, userLogin, profile, forgotPasswordPage, forgotPassword, resetPasswordPage, resetPassword, createCallLog, recentProviders, updateUserProfile, updatedUserPassword, userLogout } from "../controllers/user.js";
import isLoggedIn from "../middlewares/auth.js";

const router = express.Router();

// const upload = multer({storage});

// User registration route
router.get("/register", register);

router.post("/register",
  authLimiter,
uploadUser.single("picture"),
(req, res, next) => {
    // Handle file upload validation and errors
    if (req.fileValidationError) {
      return res.status(400).json({
        success: false,
        message: req.fileValidationError
      });
    }
    
    // if (!req.file) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Please select an image to upload"
    //   });
    // }
    
    next();
  },
  fileSizeErrorHandler,
  registerUser);


// OTP verification route
router.post("/verify-otp", verifyOtp);
router.post('/resend-otp', resendOtp);
router.get("/login", login).post("/login", authLimiter ,userLogin);
router.get('/profile', isLoggedIn ,profile);

router.get("/forgot-password", forgotPasswordPage);
router.post("/forgot-password", forgotPassword);
router.get("/reset-password/:token", resetPasswordPage);
router.post("/reset-password/:token", resetPassword);

router.post('/call-log', isLoggedIn, createCallLog);
router.get('/profile/recent-providers', isLoggedIn, recentProviders);
  
router.post('/profile/update', isLoggedIn ,uploadUser.single("picture"),
(req, res, next) => {
    // Handle file upload validation and errors
    if (req.fileValidationError) {
      return res.status(400).json({
        success: false,
        message: req.fileValidationError
      });
    }

    
    next();
  },
  fileSizeErrorHandler,updateUserProfile);
router.post('/update-password', isLoggedIn ,updatedUserPassword)
router.get("/logout", isLoggedIn ,userLogout)


export default router;
