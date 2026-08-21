const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        // Allow empty string or valid 10-digit Indian mobile number
        if (!v || v === '') return true;
        return /^[6-9]\d{9}$/.test(v);
      },
      message: 'Phone number must be a valid 10-digit Indian mobile number starting with 6-9'
    }
  },
  address: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    default: ''
  },
  zipcode: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        // Allow empty string or valid 6-digit Indian pincode
        if (!v || v === '') return true;
        return /^\d{6}$/.test(v);
      },
      message: 'Pincode must be a valid 6-digit Indian pincode'
    }
  },
  country: {
    type: String,
    default: ''
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  seller: {
    type: Boolean,
    default: false
  },
  cart: [
    new mongoose.Schema({
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      name: String,
      price: Number,
      discountPrice: Number,
      discount: Number,
      images: [String],
      quantity: {
        type: Number,
        default: 1
      },
      // Variant information
      variant: {
        variantId: {
          type: mongoose.Schema.Types.ObjectId,
          default: null
        },
        type: {
          type: String,
          default: null
        },
        value: {
          type: String,
          default: null
        },
        price: {
          type: Number,
          default: null
        },
        image: {
          type: String,
          default: null
        }
      }
    }, { _id: true })
  ],
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  addresses: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true
    },
    recipientName: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipcode: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home'
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
