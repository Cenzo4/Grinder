require('dotenv').config();

module.exports = {
  discordToken: process.env.DISCORD_TOKEN,
  geminiApiKey: process.env.GEMINI_API_KEY,
  targetGuildId: process.env.TARGET_GUILD_ID,
  targetChannelId: process.env.TARGET_CHANNEL_ID,
  replyDelay: parseInt(process.env.BOT_REPLY_DELAY) || 2000,
  maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
  
  // Safety limits
  maxMessagesPerMinute: 10,
  cooldownPerUser: 3000,         // 3 sec cooldown per user
  spamThreshold: 5,              // 5+ msgs in 10 sec = spam
  maxMessageLength: 2000,
  blockedWords: ['@everyone', '@here', 'discord.gg/'],
  
  // Gemini config
  geminiModel: 'gemini-2.0-flash',
  geminiMaxTokens: 150,
  
  // Credit system
  replyChance: 0.8,              // 80% chance to reply
  minMessagesBeforeReply: 3,     // Reply only after 3 msgs in channel
};
