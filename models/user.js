import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
    max: 30,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    min: 6,
  },
  picture: {
    type: String,
    
  },
  recentProviders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider',
    },
  ],

  role: {
    type: String,
    enum: ['user', 'admin'], 
    default: 'user',
  },

  resetToken: String,
resetTokenExpiry: Date,
})

export default mongoose.model('User', userSchema)


