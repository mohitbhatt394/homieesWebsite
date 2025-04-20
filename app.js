

import express from "express";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import flash from "connect-flash";
import userModel from "./models/user.js";
import connectDB from "./config/db.js";
import userRoutes from "./routes/user.js";
import providerRoutes from "./routes/provider.js";
import adminRoutes from "./routes/admin.js";

// Initialize Express
const app = express();

// Configure environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, "config", ".env") });

// Database Connection
connectDB();

// =======================
// Middleware Configuration
// =======================

// Security Headers

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://www.gstatic.com",
        "https://www.googleapis.com",
        "https://www.google.com",
        "https://cdnjs.cloudflare.com",
        "https://cdn.jsdelivr.net" // ✅ Add this line
      ],
      scriptSrcAttr: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "data:"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: [
        "'self'",
        "https://www.googleapis.com",
        "https://*.firebaseio.com",
        "https://identitytoolkit.googleapis.com",
        "https://www.google.com"
      ],
      frameSrc: [
        "'self'",
        "https://www.gstatic.com",
        "https://www.google.com"
      ],
    }
  },
  crossOriginEmbedderPolicy: false
}));






// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Cookie Parser
app.use(cookieParser());

// Session Configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 15 * 24 * 60 * 60 // 15 days in seconds

    }),
    cookie: {
      maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days in milliseconds
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict",
      domain: process.env.COOKIE_DOMAIN || undefined
    }
  })
);

// Flash Messages
app.use(flash());

// Rate Limiting
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5,
//   message: "Too many attempts, please try again later"
// });

// ===================
// Application Settings
// ===================

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static Files with Caching
app.use(express.static(path.join(__dirname, "public"), {
  maxAge: "1y",
  immutable: true,
  setHeaders: (res, path) => {
    if (path.endsWith(".html")) {
      res.setHeader("Cache-Control", "no-cache");
    }
  }
}));

// ==============
// Custom Middleware
// ==============

// Flash Messages
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg")[0] || null;
  res.locals.error_msg = req.flash("error_msg")[0] || null;
  next();
});

// Authentication
app.use(async (req, res, next) => {
  const token = req.cookies.userToken;
  
  if (!token) {
    res.locals.user = null;
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id)
      .select("fullname email picture role");
    
    if (!user) {
      throw new Error("User not active");
    }

    res.locals.user = user;
    req.user = user;
  } catch (err) {
    res.clearCookie("userToken");
    console.error("Authentication error:", err.message);
    res.locals.user = null;
    req.user = null;
  }
  
  next();
});

// =============
// Data Loading
// =============
let serviceCategories;
try {
  serviceCategories = JSON.parse(
    fs.readFileSync(path.join(__dirname, "./data/serviceCategories.json"), "utf-8")
  );
} catch (err) {
  console.error("Failed to load service categories:", err);
  process.exit(1);
}

// ===========
// Routes
// ===========

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// Home Route
app.get("/", (req, res) => {
  res.render("index", { 
    serviceCategories,
    cacheBuster: Date.now() 
  });
});

// Apply rate limiting to auth routes
// app.use("/user/login", authLimiter);
// app.use("/user/register", authLimiter);

// Main Routes
app.use("/user", userRoutes);
app.use("/provider", providerRoutes);
app.use("/admin", adminRoutes)

// ================
// Error Handling
// ================

// 404 Handler
app.use((req, res) => {
  res.status(404).render("404");
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Don't leak stack traces in production
  const errorDetails = process.env.NODE_ENV === "development" ? err.stack : null;
  
  res.status(500).render("500", {
    error: errorDetails,
    message: "Something went wrong!"
  });
});

// ================
// Server Startup
// ================
const port = process.env.PORT || 6001;

const server = app.listen(port, () => {
  console.log(`
  Server running in ${process.env.NODE_ENV || "development"} mode
  Listening on port ${port}
  Access at: http://localhost:${port}
  `);
});

// Graceful Shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log("Server and database connections closed");
      process.exit(0);
    });
  });
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});
