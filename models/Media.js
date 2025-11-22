const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  shopDomain: {
    type: String,
    required: true,
    index: true,
  },
  originalUrl: {
    type: String,
    required: true,
  },
  cdnUrl: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  contentType: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
  },
  data: {
    type: Buffer,
    required: true,
  },
  width: {
    type: Number,
  },
  height: {
    type: Number,
  },
  alt: {
    type: String,
  },
  usedIn: [{
    themeId: String,
    sectionId: String,
    blockId: String,
  }],
}, {
  timestamps: true,
});

mediaSchema.index({ shopDomain: 1, cdnUrl: 1 }, { unique: true });

module.exports = mongoose.model('Media', mediaSchema);
