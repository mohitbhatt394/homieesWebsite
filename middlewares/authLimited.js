import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    handler: (req, res, next, options) => {
        return res.status(429).json({
            success: false,
             message: "Too many attempts. Please try again later."
        })
      
    }
  });

  export default authLimiter;
  