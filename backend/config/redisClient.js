// backend/src/config/redisClient.js
const redis = require("redis");
require("dotenv").config();

let client;

const initializeRedis = async () => {
  try {
    client = redis.createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('Redis Client Connected');
    });

    await client.connect();
    
    // Test Redis connection
    await client.set('test', 'working');
    const testResult = await client.get('test');
    console.log('Redis connection test:', testResult === 'working' ? 'SUCCESS' : 'FAILED');
    
    return client;
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    process.exit(1); // Exit if Redis fails to connect
  }
};

module.exports = { initializeRedis };