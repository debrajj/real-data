const mongoose = require('mongoose');

const themeDataSchema = new mongoose.Schema({
  shopDomain: {
    type: String,
    required: true,
    index: true,
  },
  storeName: {
    type: String,
    default: 'kidsszone',
    index: true,
  },
  themeId: {
    type: String,
    required: true,
  },
  themeName: {
    type: String,
  },
  components: {
    type: Array,
    default: [],
  },
  pages: {
    type: Object,
    default: {},
  },
  customPages: {
    type: Array,
    default: [],
  },
  theme: {
    type: Object,
    default: {},
  },
  rawData: {
    type: Object,
  },
  version: {
    type: Number,
    default: 1,
  },
}, {
  timestamps: true,
});

themeDataSchema.index({ shopDomain: 1, themeId: 1 });

module.exports = mongoose.model('ThemeData', themeDataSchema);
