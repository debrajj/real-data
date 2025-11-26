const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  shopDomain: {
    type: String,
    required: true,
    index: true,
  },
  collectionId: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  handle: String,
  body_html: String,
  published_at: Date,
  updated_at: Date,
  sort_order: String,
  template_suffix: String,
  published_scope: String,
  image: {
    created_at: Date,
    alt: String,
    width: Number,
    height: Number,
    src: String,
  },
  rawData: {
    type: mongoose.Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

collectionSchema.index({ shopDomain: 1, collectionId: 1 }, { unique: true });
collectionSchema.index({ shopDomain: 1, handle: 1 });

module.exports = mongoose.model('Collection', collectionSchema);
