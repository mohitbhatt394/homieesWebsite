import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  state: { type: String, required: true },
  district: { type: String, required: true },
  area: { type: String, required: true },
  zipCode: { type: Number, required: true, min: 100000, max: 999999 }
});

const providerSchema = new mongoose.Schema({
  providerName: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
    match: [/^[A-Za-z\s]+$/, 'Provider name must contain only letters and spaces.']
  },
  phoneNumber: {
    type: Number,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v.toString());
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  address: { type: addressSchema, required: true },
  category: {
    type: String,
    required: true,
    enum: ['Electrician', 'Plumber', 'labour', 'maid']
  },
  picture: {
    type: String,
    required: true
  },
  averageRating: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 5
  },
  reviews: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Review' 
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

providerSchema.index({ category: 1 }); 
providerSchema.index({ 'address.zipCode': 1 });
providerSchema.index({ averageRating: -1 });



export default mongoose.model('Provider', providerSchema);
