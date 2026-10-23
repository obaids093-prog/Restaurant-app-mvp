const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9_.+-]+@gmail\.com$/,
        'Please provide a valid Gmail address (@gmail.com)',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: {
        values: ['customer', 'manager'],
        message: '{VALUE} is not a valid role',
      },
      default: 'customer',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    dob: {
      type: String,
      trim: true,
      default: '',
    },
    membership: {
      type: String,
      default: 'Member',
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: [0, 'Loyalty points cannot be negative'],
    },
    lifetimePoints: {
      type: Number,
      default: 0,
      min: [0, 'Lifetime points cannot be negative'],
    },
    loyaltyTier: {
      type: String,
      enum: {
        values: ['Bronze', 'Silver', 'Gold', 'Platinum'],
        message: '{VALUE} is not a valid loyalty tier',
      },
      default: 'Bronze',
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fm=jpg&fit=crop&q=80',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
