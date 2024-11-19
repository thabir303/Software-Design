// backend/src/app.js
const express = require("express");
const cors = require("cors");
const { initializeRedis } = require("./config/redisClient");
const apiRoutes = require("./routes/api");

const app = express();
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    const redisClient = await initializeRedis();
    
    app.set('redisClient', redisClient);

    app.use(cors({
      origin: "http://localhost:5173",
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Retry-After'
      ]
    }));

    app.use(express.json());

    app.get('/health', async (req, res) => {
      const redisStatus = redisClient.isReady ? 'connected' : 'disconnected';
      res.json({ 
        status: 'ok',
        redis: redisStatus,
        timestamp: new Date().toISOString()
      });
    });

    app.use("/api", apiRoutes);

    app.use((err, req, res, next) => {
      console.error('Error:', err);
      res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();