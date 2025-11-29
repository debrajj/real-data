const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');
const { connectDB } = require('./config/database');
const webhookRoutes = require('./routes/webhooks');
const sseRoutes = require('./routes/sse');
const mediaRoutes = require('./routes/media');
const productsRoutes = require('./routes/products');
const collectionsRoutes = require('./routes/collections');
const blogsRoutes = require('./routes/blogs');
const discountsRoutes = require('./routes/discounts');
const authRoutes = require('./routes/auth');
const themeRoutes = require('./routes/theme');

const { initializeChangeStream } = require('./services/changeStream');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3002',
    'https://realtime-apps-json.vercel.app',
    /https:\/\/realtime-apps-json.*\.vercel\.app$/, // Allow all Vercel preview deployments
    'https://realx-dara.netlify.app',
    'https://691c7e1e7c957847997b8239--realx-dara.netlify.app',
    /https:\/\/.*--realx-dara\.netlify\.app$/ // Allow all Netlify preview deployments
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.raw({ type: 'application/json' }));

// API Routes (must come before static files)
app.use('/webhooks', webhookRoutes);
app.use('/api', sseRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/blogs', blogsRoutes);
app.use('/api/discounts', discountsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/theme', themeRoutes);


// Serve static files from React build
app.use(express.static(path.join(__dirname, 'client/build')));

// Catch-all route to serve React app for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    console.log('✅ MongoDB connected');

    // Initialize change stream
    initializeChangeStream();
    console.log('✅ Change stream initialized');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Webhook endpoint: ${process.env.HOST}/webhooks/theme`);
      console.log(`📊 SSE endpoint: ${process.env.HOST}/api/stream`);
    });
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

startServer();
