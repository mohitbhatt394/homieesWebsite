import userModel from "../models/user.js";
import reviewModel from "../models/review.js";
import providerModel from "../models/provider.js";
import { v2 as cloudinary } from "cloudinary"; // 👈 Cloudinary import

export const dashboard = async(req, res) =>{
    try {
        const users = await userModel.find(); // get users
        const providers = await providerModel.find(); // if you have a provider model
        res.render("admin/adminDashboard", { users, providers });
    } catch (error) {
        console.error("Error in dashboard:", error);
        res.status(500).send("Internal Server Error");
    }
}



export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.user_id;

    // 1. Find user first
    const user = await userModel.findById(userId);
    if (!user) {
      req.flash("error_msg", "User not found.");
      return res.redirect("/admin/dashboard");
    }

    // 2. Delete profile picture if not default
    if (user.picture && !user.picture.includes('/images/default.png')) {
      const publicIdMatch = user.picture.match(/\/v\d+\/(.+?)\.(jpg|jpeg|png|webp)/);
      const publicId = publicIdMatch ? publicIdMatch[1] : null;

      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
          
        } catch (cloudError) {
          console.error('Failed to delete old Cloudinary image:', cloudError);
        }
      }
    }

    // 3. Find all reviews by this user first (we need the provider IDs)
    const reviews = await reviewModel.find({ userId });
    
    // Get unique provider IDs that will be affected
    const providerIds = [...new Set(reviews.map(review => review.providerId.toString()))];

    // 4. Delete the user
    await userModel.findByIdAndDelete(userId);

    // 5. Delete all reviews by this user
    await reviewModel.deleteMany({ userId });

    // 6. Update each affected provider to remove the reviews and recalculate average
    for (const providerId of providerIds) {
      // Remove all reviews by this user from the provider's reviews array
      await providerModel.findByIdAndUpdate(
        providerId,
        { $pull: { reviews: { $in: reviews.map(r => r._id) } } }
      );
      
      // Recalculate average rating for this provider
      const remainingReviews = await reviewModel.find({ providerId });
      const totalRatings = remainingReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = remainingReviews.length > 0 
        ? (totalRatings / remainingReviews.length).toFixed(1)
        : 0;

      await providerModel.findByIdAndUpdate(
        providerId,
        { averageRating }
      );
    }

    req.flash("success_msg", "User and associated reviews deleted successfully!");
    res.redirect("/admin/dashboard");

  } catch (error) {
    console.error("Error deleting user:", error);
    req.flash("error_msg", "Failed to delete user.");
    res.redirect("/admin/dashboard");
  }
};



export const deleteProvider = async (req, res) => {
  try {
    const providerId = req.params.provider_id;

    const provider = await providerModel.findById(providerId);
    if (!provider) {
      req.flash("error_msg", "Provider not found.");
      return res.redirect("/admin/dashboard");
    }

    // Delete provider image from Cloudinary if exists
    if (provider.picture) {
      const publicIdMatch = provider.picture.match(/\/v\d+\/(.+?)\.(jpg|jpeg|png|webp)/);
      const publicId = publicIdMatch ? publicIdMatch[1] : null;

      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
          
        } catch (cloudError) {
          console.error('Failed to delete Cloudinary image:', cloudError);
        }
      }
    }

    // 1. First remove this provider from all users' recentProviders arrays
    await userModel.updateMany(
      { recentProviders: providerId },
      { $pull: { recentProviders: providerId } }
    );

    // 2. Delete all reviews associated with this provider
    await reviewModel.deleteMany({ providerId });

    // 3. Finally delete the provider
    const deletedProvider = await providerModel.findByIdAndDelete(providerId);
    if (!deletedProvider) {
      req.flash("error_msg", "Provider not found.");
      return res.redirect("/admin/dashboard");
    }

    req.flash("success_msg", "Provider, associated reviews, and user references deleted successfully!");
    res.redirect("/admin/dashboard");

  } catch (error) {
    console.error("Error deleting provider:", error);
    req.flash("error_msg", "Failed to delete provider and associated data.");
    res.redirect("/admin/dashboard");
  }
};