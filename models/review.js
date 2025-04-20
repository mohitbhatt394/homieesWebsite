import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: "Provider", required: true },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  reviewMessage: { type: String, maxlength: 300 },
  createdAt: { type: Date, default: Date.now }
});

reviewSchema.index({ providerId: 1, createdAt: -1 });

export default mongoose.model("Review", reviewSchema);