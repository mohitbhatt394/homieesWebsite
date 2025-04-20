
import userModel from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cloudinary from 'cloudinary';
import crypto from "crypto";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../config", ".env"),
});

// Setup nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const register = (req, res) => {
    res.render("users/userRegister");
}

// Register user and send OTP
export const registerUser = async (req, res) => {
  try {
    const { fullname, email, password } = req.body;
    
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      // If file was uploaded but user exists, we should remove it
      if (req.file) {
        try {
          await cloudinary.uploader.destroy(req.file.filename); // Delete the uploaded file
        } catch (err) {
          console.error("Error deleting uploaded file:", err);
        }
      }
      return res.status(400).json({
        success: false,
        message: "User with this email already exists.",
      });
    }

    if (req.file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const fileSizeLimit = 1 * 1024 * 1024; // 1MB
    
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'Only JPG, JPEG, PNG, or WEBP files are allowed.',
        });
      }
    
      if (req.file.size > fileSizeLimit) {
        return res.status(400).json({
          success: false,
          message: 'File size must be less than or equal to 1MB.',
        });
      }
    }

    const picture = req.file ? req.file.path : "/images/default.png"; // Cloudinary gives the full URL
    

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

    // Store OTP and user details in session
    req.session.otp = otp;
    req.session.user = { fullname, email, password, picture };

    // console.log("OTP stored in session:", req.session.otp);

    // Send OTP via email
    await transporter.sendMail({
      from: `"Homiees" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP for Registration",
      text: `Your OTP for registration is: ${otp}. It is valid for 5 minutes.`,
    });

    res.status(200).json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    console.error("Registration Error:", error);
    // console.log(req.session);
    // console.log(req.body);
    
    
    res.status(500).json({ success: false, message: "Error sending OTP" });
  }
};



// Verify OTP and register user
export const verifyOtp = async (req, res) => {
  // console.log("Session data before OTP verification:", req.session); // Debugging

  if (!req.session.otp || !req.session.user) {
    return res.status(400).json({ success: false, message: "Session expired. Register again." });
  }

  const { otp } = req.body;
  if (parseInt(otp) !== req.session.otp) {
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }

  // Register user after successful OTP verification
  const { fullname, email, password, picture } = req.session.user;
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const userRole = (email === process.env.ADMIN_EMAIL) ? 'admin' : "user";

  const user = await userModel.create({ fullname, email, password: hashedPassword, picture, role: userRole });
  

  // Generate JWT token
  const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "15d"
  });
  

  res.cookie("userToken", token, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  // Clear session
  req.session.destroy(); // Use destroy() to remove session completely

  res.status(200).json({ success: true, message: "Registration successful" });
};

// Resend OTP to user's email
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists in session (already in registration process)
    if (!req.session.user || req.session.user.email !== email) {
      return res.status(400).json({
        success: false,
        message: "No registration in progress for this email",
      });
    }

    // Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000);
    req.session.otp = newOtp; // Update OTP in session

    // console.log("New OTP generated:", newOtp);

    // Send new OTP via email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your New OTP for Registration",
      text: `Your new OTP for registration is: ${newOtp}. It is valid for 5 minutes.`,
    });

    res.status(200).json({ 
      success: true, 
      message: "New OTP sent to your email" 
    });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error resending OTP" 
    });
  }
};

export const login = (req, res) => {
    res.render("users/userLogin");
  };

  export const userLogin = async (req, res) => {
    // const adminEmail = process.env.ADMIN_EMAIL;
    try {
      const { email, password } = req.body;
  
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }
  
      const user = await userModel.findOne({ email });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid credentials',
        });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Invalid credentials',
        });
      }


  
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "15d" }
      );
  
      res.cookie("userToken", token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      // console.log('User role being set:', userRole);
      // console.log('User being created:', { user });
  
      return res.status(200).json({
        success: true,
        message: 'Login successful!',
      });


  
    } catch (error) {
      console.error("Login Error:", error);
      return res.status(500).json({
        success: false,
        message: 'Something went wrong during login',
      });
    }
  };
  

export const profile = (req, res) =>{
  res.render("users/profile");
}

export const forgotPasswordPage = (req, res) => {
  res.render("users/forgot-password", {
    error_msg: req.flash("error_msg"),
    success_msg: req.flash("success_msg"),
  });
}

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      req.flash("error_msg", "No account with that email found.");
      return res.redirect("/user/forgot-password");
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = Date.now() + 15 * 60 * 1000;

user.resetToken = token;
user.resetTokenExpiry = expiry;
await user.save();

    const resetURL = `${req.protocol}://${req.get("host")}/user/reset-password/${token}`;

    // Send email with link (use nodemailer or your util)
    await transporter.sendMail({
      to: email,
      subject: "Password Reset",
      html: `<p>Click to reset password: <a href="${resetURL}">${resetURL}</a></p>`
    });

    req.flash("success_msg", "Reset link sent to your email.");
    res.redirect("/user/login");

  } catch (err) {
    console.error("Forgot password error:", err);
    req.flash("error_msg", "Something went wrong.");
    res.redirect("/user/forgot-password");
  }
}

export const resetPasswordPage = async(req, res) => {
  const { token } = req.params;
  const user = await userModel.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() },
  });
  
  if (!user) {
    req.flash("error_msg", "Reset link is invalid or expired.");
    return res.redirect("/user/forgot-password");
  }
  
  res.render("users/reset-password", { token });
  
}

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await userModel.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      req.flash("error_msg", "Reset link is invalid or expired.");
      return res.redirect("/user/forgot-password");
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;

    // Clear the token fields
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    req.flash("success_msg", "Password updated. Please login.");
    res.redirect("/user/login");

  } catch (err) {
    console.error("Reset password error:", err);
    req.flash("error_msg", "Something went wrong.");
    res.redirect("/user/forgot-password");
  }
};



export const createCallLog = async (req, res) => {
  const userId = req.user._id;
  const { providerId } = req.body;

  try {
    const user = await userModel.findById(userId);

    // Remove if already in list
    user.recentProviders = user.recentProviders.filter(id => id.toString() !== providerId);

    // Add to the front
    user.recentProviders.unshift(providerId);

    // Keep only the last 10
    if (user.recentProviders.length > 10) {
      user.recentProviders = user.recentProviders.slice(0, 10);
    }

    await user.save();
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving call log');
  }
}

export const recentProviders = async (req, res) => {
  const user = await userModel.findById(req.user._id)
                         .populate('recentProviders');

  res.render('users/recentProviders', {
    user,
    recentProviders: user.recentProviders
  });
}

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullname } = req.body;
    const picture = req.file ? req.file.path : null;

    if (!fullname) {
      // req.flash('error_msg', 'Fullname is required');
      // return res.redirect('/user/profile');

      return res.status(400).json({ success: false, message: 'Fullname is required' });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      // req.flash('error_msg', 'User not found');
      // return res.redirect('/user/profile');
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete old picture if a new one is uploaded and it's not the default
    if (picture && user.picture && !user.picture.includes('/images/default.png')) {
      const publicIdMatch = user.picture.match(/\/v\d+\/(.+?)\.(jpg|jpeg|png|webp)/);
      const publicId = publicIdMatch ? publicIdMatch[1] : null;

      if (publicId) {
        try {
          await cloudinary.v2.uploader.destroy(publicId);
          // console.log('Old Cloudinary image deleted:', publicId);
        } catch (cloudError) {
          console.error('Failed to delete old Cloudinary image:', cloudError);
        }
      }
    }

    // Update user profile
    const updateData = { fullname };
    if (picture) {
      updateData.picture = picture;
    }

    await userModel.findByIdAndUpdate(userId, updateData, {
      new: true,
      select: '-password'
    });

    // req.flash('success_msg', 'Profile updated successfully');
    // return res.redirect('/user/profile');

    return res.json({ success: true, message: 'Profile updated successfully' });

  } catch (error) {
    console.error("Update user profile error:", error);
    // req.flash('error_msg', 'Internal Server Error');
    // return res.redirect('/user/profile');
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const updatedUserPassword = async (req, res) => {
  try {
      const userId = req.user.id; 
      const { currentPassword, newPassword } = req.body;

      
      if (!currentPassword || !newPassword) {
          req.flash('error_msg', 'All fields are required');
          return res.redirect('/user/profile');
      }

      
      const user = await userModel.findById(userId);
      if (!user) {
        req.flash('error_msg', 'User not found');
        return res.redirect('/user/profile');
      }

      
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        req.flash('error_msg', 'Invalid credentials');
         return res.redirect('/user/profile');
        
      }

      
      const salt = await bcrypt.genSalt(10);
      const hashedNewPassword = await bcrypt.hash(newPassword, salt);

      
      user.password = hashedNewPassword;
      await user.save();

      req.flash('success_msg', 'Password updated successfully');
      return res.redirect('/user/profile');

  } catch (error) {
      console.error("Update user password error:", error);
      req.flash('error_msg', 'Internal Server Error');
      return res.redirect('/user/profile');
  }
}

export const userLogout = async (req, res) => {
    try {
        res.clearCookie("userToken");
        req.flash('success_msg', "logged out");
        return res.redirect("/user/login");
    } catch (error) {
        console.error("User logout error:", error);
        req.flash('error_msg', 'Internal Server Error');
        return res.redirect("/user/login");
    }
}
