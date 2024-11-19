const moment = require('moment');

const unsafeRateLimiter = async (req, res, next) => {
  const redisClient = req.app.get('redisClient');
  if (!redisClient?.isReady) {
    console.error('Redis client not ready');
    return next();
  }

  try {
    const bucketKey = `unsafe_rate_limit:${req.ip}`;
    const capacity = 10;
    const interval = 1; // in seconds
    const currentTime = moment().unix();

    // RACE CONDITION POINT 1: Read current state
    // Multiple concurrent requests will all read the same values
    const bucketData = await redisClient.hGetAll(bucketKey);
    
    // Artificial delay to make race condition more likely
    // await new Promise(resolve => setTimeout(resolve, 50));

    let tokens = parseInt(bucketData.tokens);
    if (isNaN(tokens)) {
      tokens = capacity;
    }
    let lastRefillTime = parseInt(bucketData.lastRefillTime);
    if (isNaN(lastRefillTime)) {
      lastRefillTime = currentTime;
    }

    // Token refill calculation
    const elapsedTime = currentTime - lastRefillTime;
    const tokensToAdd = Math.floor(elapsedTime / interval);
    tokens = Math.min(capacity, tokens + tokensToAdd);

    // Update lastRefillTime only if tokens were added
    if (tokensToAdd > 0) {
      lastRefillTime = currentTime;
    }

    console.log(`[Unsafe] Request from ${req.ip} - Initial tokens: ${tokens}`);

    // RACE CONDITION POINT 2: Check and update
    // By this time, other concurrent requests might have already decremented the tokens
    // but we're still working with our original read value
    if (tokens > 0) {
      // Artificial delay to make race condition more likely
      // await new Promise(resolve => setTimeout(resolve, 50));
      
      tokens -= 1;
      
      // RACE CONDITION POINT 3: Update state
      // Multiple requests will try to update the same key with different values
      await redisClient.hSet(bucketKey, {
        tokens: tokens,
        lastRefillTime: lastRefillTime,
      });

      // Set expiry time for cleanup
      await redisClient.expire(bucketKey, capacity * interval);

      console.log(`[Unsafe] Request from ${req.ip} - Remaining tokens after decrement: ${tokens}`);

      res.setHeader('X-RateLimit-Limit', capacity);
      res.setHeader('X-RateLimit-Remaining', tokens);
      next();
    } else {
      await redisClient.hSet(bucketKey, {
        tokens: tokens,
        lastRefillTime: lastRefillTime,
      });
      
      await redisClient.expire(bucketKey, capacity * interval);

      const retryAfter = interval - (currentTime - lastRefillTime) % interval;
      res.setHeader('X-RateLimit-Limit', capacity);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Retry-After', retryAfter);
      res.status(429).json({
        success: false,
        message: 'Rate limit exceeded (Unsafe)',
        retryAfter,
      });
    }
  } catch (error) {
    console.error('[Unsafe] Rate limiter error:', error);
    next();
  }
};

module.exports = unsafeRateLimiter;