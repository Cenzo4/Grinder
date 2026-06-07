const config = require('../config');

const userMessageCount = new Map();
const userMessageTimestamps = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const windowMs = 60000; // 1 minute window
  
  // Clean old entries
  if (!userMessageCount.has(userId)) {
    userMessageCount.set(userId, []);
  }
  
  const timestamps = userMessageCount.get(userId);
  const recent = timestamps.filter(t => now - t < windowMs);
  recent.push(now);
  userMessageCount.set(userId, recent);
  
  // Global rate limit check
  let totalRecent = 0;
  for (const [uid, ts] of userMessageCount) {
    totalRecent += ts.filter(t => now - t < windowMs).length;
  }
  
  if (totalRecent > config.maxMessagesPerMinute) {
    console.log('⏱️ Global rate limit hit, slowing down');
    return false;
  }
  
  return true;
}

module.exports = { checkRateLimit };
