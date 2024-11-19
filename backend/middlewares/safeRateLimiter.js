// Middleware/safeRateLimiter.js
const moment = require('moment');

const safeRateLimiter = async (req, res, next) => {
  const redisClient = req.app.get('redisClient');

  if (!redisClient?.isReady) {
    console.error('Redis client not ready');
    return next();
  }

  try {
    // const bucketKey = `safe_rate_limit:${req.ip}`;
    const bucketKey = `safe_rate_limit`;
    const capacity = 10;
    const interval = 1; // seconds
    const currentTime = moment().unix();

    const luaScript = `
      local capacity = tonumber(ARGV[1])
      local interval = tonumber(ARGV[2])
      local currentTime = tonumber(ARGV[3])
      
      local bucketInfo = redis.call("HGETALL", KEYS[1])
      local tokens = capacity
      local lastRefillTime = currentTime
      
      if #bucketInfo > 0 then
        for i = 1, #bucketInfo, 2 do
          if bucketInfo[i] == "tokens" then
            tokens = tonumber(bucketInfo[i + 1])
          elseif bucketInfo[i] == "lastRefillTime" then
            lastRefillTime = tonumber(bucketInfo[i + 1])
          end
        end
      end

      local elapsedTime = currentTime - lastRefillTime
      local tokensToAdd = math.floor(elapsedTime / interval)
      if tokensToAdd > 0 then
        tokens = math.min(capacity, tokens + tokensToAdd)
        lastRefillTime = currentTime
      end

      if tokens > 0 then
        tokens = tokens - 1
        redis.call("HSET", KEYS[1], "tokens", tokens, "lastRefillTime", lastRefillTime)
        return {1, tokens, capacity} -- Allowed, remainingTokens, capacity
      else
        redis.call("HSET", KEYS[1], "tokens", tokens, "lastRefillTime", lastRefillTime)
        return {0, tokens, capacity} -- Blocked, remainingTokens, capacity
      end
    `;

    console.log('[Safe] Executing rate limit check for IP:', req.ip);

    const [allowed, remainingTokens, limit] = await redisClient.eval(luaScript, {
      keys: [bucketKey],
      arguments: [capacity.toString(), interval.toString(), currentTime.toString()]
    });

    // Convert the returned values to numbers
    const isAllowed = Number(allowed) === 1;
    const tokens = Number(remainingTokens);

    console.log('[Safe] Rate limit results:', { isAllowed, tokens, limit });

    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, tokens));

    if (isAllowed) {
      next();
    } else {
      const retryAfter = interval;
      res.setHeader('X-RateLimit-Retry-After', retryAfter);
      res.status(429).json({
        success: false,
        message: 'Rate limit exceeded (Safe)',
        retryAfter
      });
    }
  } catch (error) {
    console.error('[Safe] Rate limiter error:', error);
    next();
  }
};

module.exports = safeRateLimiter;
