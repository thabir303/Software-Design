// backend/src/routes/api.js
const express = require("express");
const router = express.Router();
const safeRateLimiter = require("../middlewares/safeRateLimiter");
const unsafeRateLimiter = require("../middlewares/unsafeRateLimiter");

router.get("/data/safe", safeRateLimiter, (req, res) => {
  res.json({ 
    success: true,
    message: "Request successful from Safe Endpoint", 
    data: "Your data has been retrieved successfully",
    timestamp: new Date().toISOString()
  });
});

router.get("/data/unsafe", unsafeRateLimiter, (req, res) => {
  res.json({ 
    success: true,
    message: "Request successful from Unsafe Endpoint", 
    data: "Your data has been retrieved successfully",
    timestamp: new Date().toISOString()
  });
});

router.get("/health", (req, res) => {
  const redisClient = req.app.get('redisClient');
  res.json({ 
    status: 'ok',
    redis: redisClient.isReady ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;