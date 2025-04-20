import dotenv from 'dotenv';
import path from 'path';
import providerModel from '../models/provider.js';
import { State, City } from "country-state-city";
import reviewModel from '../models/review.js';
import cloudinary from 'cloudinary';
import fs from 'fs';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../config", ".env") });


// Initialize Firebase Admin

const serviceCategories = JSON.parse(fs.readFileSync("./data/serviceCategories.json", "utf-8"));

export const registration = (req, res) => {
  try {
    const states = State.getStatesOfCountry("IN");
    res.render("providers/providerRegistration", { 
      states, 
      districts: [], 
      serviceCategories,
    });
  } catch (error) {
    console.error("Error in registration:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const getProviderCity = (req, res) => {
  try {
    const { stateCode } = req.query;
    if (!stateCode) return res.status(400).json({ error: "State code required" });

    const districts = City.getCitiesOfState("IN", stateCode);
    const state = State.getStateByCodeAndCountry(stateCode, "IN");

    res.json({ 
      stateName: state?.name, 
      districts 
    });
  } catch (error) {
    console.error("Error fetching districts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const providerRegistration = async (req, res) => {
  try {
    const { 
      providerName, 
      phoneNumber, 
      state, 
      stateName, 
      district, 
      area, 
      zipCode, 
      category, 
      
    } = req.body;

    const providerExists = await providerModel.findOne({ phoneNumber });
    if (providerExists) {
       if (req.file) {
              try {
                await cloudinary.uploader.destroy(req.file.filename); // Delete the uploaded file
              } catch (err) {
                console.error("Error deleting uploaded file:", err);
              }
            }
      return res.status(400).json({
        success: false,
        message: 'Provider with this phone number already exists.'
      });
    }
    
    const picture = req.file ? req.file.path : null;

    // Validate image file
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


    // Validate required fields
    const requiredFields = {
      providerName, phoneNumber, state, stateName, 
      district, area, zipCode, category, picture, /*firebaseToken*/
    };
    
    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value) {
      
        return res.status(400).json({
          success: false,
          message: `${field} is required`
        });
      }
    }

   

    // Create new provider
    await providerModel.create({
      providerName,
      phoneNumber: parseInt(phoneNumber),
      address: { 
        state: stateName, 
        district, 
        area, 
        zipCode: parseInt(zipCode) 
      },
      category,
      picture
    });

    res.status(200).json({
      success: true,
      message: 'Registration successful!'
    });

  } catch (error) {
    console.error("Provider registration error:", error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during registration'
    });
  }
};
  


export const services = async (req, res) => {

    try {
        const { category } = req.params;
        
        const providers = await providerModel.find({category: { $regex: new RegExp("^" + category + "$", "i") }})

        res.render("providers/service", { providers, message: providers.length ? null : "No service found in this category.",  currentCategory: category });

    } catch (error) {
        console.error("Error fetching providers:", error);
        res.render("service", { providers: [], message: "Internal server error. Please try again later." });
    }
};

export const getProviderReviews = async (req, res) => {
    try {
      const { providerId } = req.params;
  
      // Fetch all reviews for the provider
      const allReviews = await reviewModel.find({ providerId }).populate("userId", "fullname picture");
  
      const filteredReviews = allReviews.filter(review => review.userId !== null);

      res.status(200).json(filteredReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to load reviews" });
    }
  };



export const searchProviders = async (req, res) => {
  try {
    const { query } = req.query;
    const { category } = req.params; // Get category from URL

    if (!query) {
      return res.render("providers/service", {
        providers: [],
        message: "Please enter a ZIP code to search.",
        currentCategory: category
      });
    }

    const filter = { "address.zipCode": query };

    if (category && category.trim()) {
      filter.category = { $regex: new RegExp("^" + category.trim() + "$", "i") };
    }

    const providers = await providerModel.find(filter);

    if (!providers.length) {
      return res.render("providers/service", {
        providers: [],
        message: "No providers found for the given ZIP code and category.",
        currentCategory: category
      });
    }

    res.render("providers/service", { providers, message: null, currentCategory: category });

  } catch (error) {
    console.error("Error searching providers:", error);
    res.status(500).render("providers/service", {
      providers: [],
      message: "Internal server error.",
      currentCategory: category
    });
  }
};
