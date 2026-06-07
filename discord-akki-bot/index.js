const { Client } = require('discord.js-selfbot-v13');
const config = require('./config');
const { initializeGemini } = require('./src/geminiHandler');
const { routeMessage } = require('./src/messageRouter');
const { checkRateLimit } = require('./src/rateLimiter');
const { detectAndBlockSpam } = require('./src/spamDetector');
const { crashGuardWrapper } = require('./src/crashGuard');

const client = new Client();

client.on('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  initializeGemini();
  
  // Set activity to look normal
  client.user.setActivity('Discord', { type: 'PLAYING' });
});

client.on('messageCreate', async (message) => {
  // Don't reply to self
  if (message.author.id === client.user.id) return;
  
  // Only target specific channel in specific server
  if (message.channel.id !== config.targetChannelId) return;
  if (message.guild?.id !== config.targetGuildId) return;
  
  // Crash guard - wrap everything
  await crashGuardWrapper(async () => {
    // 1. Spam detection
    if (detectAndBlockSpam(message)) {
      console.log(`🛑 Spam blocked from ${message.author.tag}`);
      return;
    }
    
    // 2. Rate limit check
    if (!checkRateLimit(message.author.id)) {
      return;
    }
    
    // 3. Route and reply
    await routeMessage(client, message);
  });
});

client.on('error', (err) => {
  console.error('Client error:', err.message);
  // Auto-reconnect logic
  setTimeout(() => client.login(config.discordToken), 5000);
});

client.login(config.discordToken);
