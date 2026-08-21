const mongoose = require('mongoose');

const rentalProductSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['car', 'house', 'bungalow', 'apartment', 'other'],
    required: true 
  },
  images: [{ type: String }],
  pricePerDay: { type: Number, required: true },
  location: { type: String, required: true },
  availability: { type: Boolean, default: true },
  specifications: {
    bedrooms: Number,
    bathrooms: Number,
    area: String,
    features: [String]
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('RentalProduct', rentalProductSchema);