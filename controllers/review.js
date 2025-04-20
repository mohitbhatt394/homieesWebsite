

import reviewModel from "../models/review.js";
import providerModel from "../models/provider.js";

export const providerReview = async (req, res) => {
  try {
    const userId = req.user?.id; // Ensure user is authenticated
    const { rating, reviewMessage } = req.body;
    const { providerId } = req.params;

    if (!userId || !providerId || !rating) {
      req.flash("error_msg", "All fields are required.");
      return res.status(400).json({ flashMessage: req.flash("error_msg")[0] });
    }

    if (rating < 1 || rating > 5) {
      req.flash("error_msg", "Rating must be between 1 and 5.");
      return res.status(400).json({ flashMessage: req.flash("error_msg")[0] });
    }

    // Check if the provider exists
    const provider = await providerModel.findById(providerId);
    if (!provider) {
      req.flash("error_msg", "Provider not found.");
      return res.status(404).json({ flashMessage: req.flash("error_msg")[0] });
    }

    // Check if the user already reviewed this provider
    const existingReview = await reviewModel.findOne({ userId, providerId });
    if (existingReview) {
      req.flash("error_msg", "You have already reviewed this provider.");
      return res.status(400).json({ flashMessage: req.flash("error_msg")[0] });
    }

    // Create new review
    const review = await reviewModel.create({ userId, providerId, rating, reviewMessage });

    // Add review to provider
    provider.reviews.push(review._id);

    // Efficiently calculate the new average rating using MongoDB aggregation
    const avgRating = await reviewModel.aggregate([
      { $match: { providerId: provider._id } },
      { $group: { _id: null, averageRating: { $avg: "$rating" } } }
    ]);

    // provider.averageRating = avgRating.length > 0 ? avgRating[0].averageRating : 0;

    provider.averageRating = avgRating.length > 0 ? parseFloat(avgRating[0].averageRating.toFixed(1)) : 0;

    // Save provider with updated rating
    await provider.save();

    req.flash("success_msg", "Review submitted successfully.");
    return res.status(201).json({ flashMessage: req.flash("success_msg")[0] });
  } catch (error) {
    console.error("Review submission error:", error);
    req.flash("error_msg", "Something went wrong. Please try again.");
    return res.status(500).json({ flashMessage: req.flash("error_msg")[0] });
  }
};
