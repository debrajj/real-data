const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  shopDomain: {
    type: String,
    required: true,
    unique: true,
  },
  accessToken: {
    type: String,
    required: true,
  },
  themeId: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastSync: {
    type: Date,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Shop', shopSchema);
