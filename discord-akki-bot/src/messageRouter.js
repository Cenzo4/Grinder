const config = require('../config');
const { getReply } = require('./geminiHandler');
const { detectLanguage } = require('./languageDetector');
const { applyDelay, sleep } = require('./utils');

const recentChannelMessages = new Map();
const lastReplyTime = new Map();

async function routeMessage(client, message) {
  // Track channel activity
  if (!recentChannelMessages.has(message.channel.id)) {
    recentChannelMessages.set(message.channel.id, []);
  }
  const messages = recentChannelMessages.get(message.channel.id);
  messages.push({ id: message.id, author: message.author.id, time: Date.now() });
  
  // Keep only last 20 messages
  if (messages.length > 20) messages.shift();
  
  // Check if channel has enough activity to reply
  const uniqueUsers = new Set(messages.map(m => m.author));
  if (uniqueUsers.size < config.minMessagesBeforeReply && 
      messages.length < config.minMessagesBeforeReply + 3) {
    return; // Not enough activity, act like a lurker
  }
  
  // Random chance to reply (simulate human behavior)
  if (Math.random() > config.replyChance) return;
  
  // Don't reply if we just replied
  const channelLastReply = lastReplyTime.get(message.channel.id) || 0;
  if (Date.now() - channelLastReply < config.replyDelay) return;
  
  // Cooldown per user
  const userLastReply = lastReplyTime.get(message.author.id) || 0;
  if (Date.now() - userLastReply < config.cooldownPerUser) return;
  
  // Check if message is directed at "akki" or the bot's name
  const botName = client.user.username.toLowerCase();
  const content = message.content.toLowerCase();
  const isMentioned = content.includes(botName) || 
                      content.includes('akki') ||
                      message.mentions.users.has(client.user.id);
  
  // If not mentioned, only reply sometimes
  if (!isMentioned && Math.random() > 0.3) return;
  
  // Apply human-like delay
  await applyDelay(message.content.length);
  
  // Detect language
  const language = detectLanguage(message.content);
  
  // Get Gemini reply with retry
  let reply = null;
  for (let i = 0; i < config.maxRetries; i++) {
    reply = await getReply(message.content, message.author.username, language);
    if (reply) break;
    if (i < config.maxRetries - 1) await sleep(5000);
  }
  
  if (!reply) return;
  
  // Send the reply
  try {
    await message.channel.sendTyping();
    await sleep(1500); // Simulate typing
    await message.channel.send(reply);
    
    lastReplyTime.set(message.channel.id, Date.now());
    lastReplyTime.set(message.author.id, Date.now());
    console.log(`💬 Replied to ${message.author.tag}: "${reply.substring(0, 50)}..."`);
  } catch (err) {
    console.error('Failed to send reply:', err.message);
  }
}

module.exports = { routeMessage };
