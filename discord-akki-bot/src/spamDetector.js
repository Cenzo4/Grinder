const config = require('../config');

const userMessages = new Map();
const spamScores = new Map();

function detectAndBlockSpam(message) {
  const userId = message.author.id;
  const now = Date.now();
  
  // Track user messages
  if (!userMessages.has(userId)) {
    userMessages.set(userId, []);
  }
  
  const userMsgs = userMessages.get(userId);
  userMsgs.push({ content: message.content, time: now, id: message.id });
  
  // Keep only last 20 messages
  if (userMsgs.length > 20) userMsgs.shift();
  
  // Detect rapid messages (10 seconds window)
  const recentMsgs = userMsgs.filter(m => now - m.time < 10000);
  if (recentMsgs.length >= config.spamThreshold) {
    spamScores.set(userId, (spamScores.get(userId) || 0) + 1);
    return true;
  }
  
  // Detect repeated content
  const lastContents = userMsgs.slice(-5).map(m => m.content.toLowerCase());
  const uniqueContents = new Set(lastContents);
  if (lastContents.length >= 4 && uniqueContents.size <= 2) {
    return true;
  }
  
  // Block everything from high spam score users
  const score = spamScores.get(userId) || 0;
  if (score >= config.spamThreshold) {
    return true;
  }
  
  // Decay spam scores every 30 seconds
  if (Math.random() < 0.01) {
    for (const [uid, score] of spamScores) {
      spamScores.set(uid, Math.max(0, score - 1));
    }
  }
  
  // Check for blocked patterns
  const content = message.content.toLowerCase();
  for (const word of config.blockedWords) {
    if (content.includes(word)) return true;
  }
  
  // Rate limit spam - max 3 replies total in 60s if spam detected
  if (recentMsgs.length >= 3) {
    return true; // Don't reply to heavy chatters
  }
  
  return false;
}

module.exports = { detectAndBlockSpam };
