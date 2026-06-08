require('dotenv').config();
const { Client } = require('discord.js-selfbot-v13');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('OwO Grinder Bot is running!'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Dummy Web Server running on port ${PORT}`));

const TOKEN = process.env.DISCORD_TOKEN;
let currentChannelId = process.env.TARGET_CHANNEL_ID;

const client = new Client({ checkUpdate: false });

const ALLOWED_USER = '975002051849363476';

let BASE_BET = 50;
let currentBet = BASE_BET;
let isGrinding = false;
let minDelayMs = 13000;
let maxDelayMs = 18000;
let currentSide = 'h'; // Tracks the current side to bet
const MAX_BET = 250000; // OwO maximum bet limit

// Background task timers
let huntTimer = null;
let prayTimer = null;
let dailyTimer = null;

// Cat Bot Config
const CAT_CHANNEL_ID = '1395460222088253450';
const CAT_BOT_ID = '966695034340663367';
let catTimeout = null;
let catsSeen = 0;

function startBackgroundTasks(channel) {
  // Daily
  channel.send('owo daily');
  dailyTimer = setInterval(() => {
    if(isGrinding) channel.send('owo daily');
  }, 24 * 60 * 60 * 1000 + 5000); // 24 hours + 5s

  // Pray (Offset by 2s to avoid spam)
  setTimeout(() => { if(isGrinding) channel.send('owo pray'); }, 2000);
  prayTimer = setInterval(() => {
    if(isGrinding) channel.send('owo pray');
  }, 5 * 60 * 1000 + 5000); // 5 mins + 5s

  // Hunt & Battle (Offset by 4s and 6s)
  setTimeout(() => { if(isGrinding) channel.send('owo hunt'); }, 4000);
  setTimeout(() => { if(isGrinding) channel.send('owo battle'); }, 6000);
  
  huntTimer = setInterval(() => {
    if(isGrinding) {
      channel.send('owo hunt');
      setTimeout(() => {
        if(isGrinding) channel.send('owo battle');
      }, 2000); // Battle 2 seconds after hunt
    }
  }, 16000); // 16 seconds
}

function stopBackgroundTasks() {
  clearInterval(huntTimer);
  clearInterval(prayTimer);
  clearInterval(dailyTimer);
}

// Random sleep function
const sleep = (min, max) => new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));

client.on('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`💰 OwO Grinder Ready!`);
});

// Auto-restart if Discord disconnects the selfbot
client.on('disconnect', () => {
  console.log('❌ Bot disconnected from Discord! Forcing restart...');
  process.exit(1); // Render will automatically restart it
});

client.on('error', (error) => {
  console.error('⚠️ Discord Client Error:', error);
  process.exit(1);
});

process.on('unhandledRejection', error => {
  console.error('⚠️ Unhandled promise rejection:', error);
  // process.exit(1); // Uncomment if needed, but sometimes it's just a network glitch
});

client.on('messageCreate', async (message) => {
  // 🐱 Cat Bot Automation 🐱
  if (message.channel.id === CAT_CHANNEL_ID) {
    if (message.author.id === CAT_BOT_ID) {
      const content = message.content.toLowerCase();
      
      // Cat appears!
      if (content.includes('has appeared') && content.includes('type "cat"')) {
        catsSeen++;
        let delay = 0;
        
        if (catsSeen <= 2) {
          // First 2 cats: Extremely fast (90ms to 100ms)
          delay = Math.floor(Math.random() * (100 - 90 + 1)) + 90;
        } else {
          // 60% chance: 2 to 8 seconds
          // 40% chance: 10 to 25 seconds
          if (Math.random() < 0.6) {
            delay = Math.floor(Math.random() * (8000 - 2000 + 1)) + 2000;
          } else {
            delay = Math.floor(Math.random() * (25000 - 10000 + 1)) + 10000;
          }
        }
        
        console.log(`🐱 Cat appeared! Catching in ${delay/1000} seconds...`);
        
        catTimeout = setTimeout(() => {
          message.channel.send('cat');
          catTimeout = null;
        }, delay);
        
      } else if (content.includes('cought') || content.includes('caught')) {
        // Cat Bot announces someone caught it
        if (catTimeout) {
          clearTimeout(catTimeout);
          catTimeout = null;
          console.log('😿 Cat was already caught! Cancelled our typing.');
        }
      }
    } else if (!message.author.bot && message.content.toLowerCase() === 'cat') {
      // If another real user types 'cat' while we are waiting, cancel ours so we don't look like a bot
      if (message.author.id !== client.user.id && catTimeout) {
        clearTimeout(catTimeout);
        catTimeout = null;
        console.log('😿 Another user typed "cat" before us. Cancelled our typing to be safe.');
      }
    }
  }

  // Control Commands (Allow your own account OR the specific user)
  if (message.author.id === client.user.id || message.author.id === ALLOWED_USER) {
    const args = message.content.trim().split(/ +/);
    const command = args[0].toLowerCase();

    if (command === '!start') {
      if (isGrinding) return message.reply('Grinding is already running!');
      isGrinding = true;
      currentBet = BASE_BET;
      console.log(`▶️ Grinding started in channel ${currentChannelId}...`);
      
      const targetChannel = client.channels.cache.get(currentChannelId);
      if (targetChannel) {
        targetChannel.send(`owo cf ${currentBet} ${currentSide}`);
        startBackgroundTasks(targetChannel); // Start extra tasks!
      } else {
        message.reply(`❌ Cannot find target channel. Use !setchannel here first.`);
        isGrinding = false;
      }
    } 
    else if (command === '!stop') {
      isGrinding = false;
      stopBackgroundTasks(); // Stop extra tasks!
      console.log('🛑 Grinding stopped.');
      message.reply('🛑 Stopped grinding.');
    }
    else if (command === '!setbet') {
      const newBet = parseInt(args[1]);
      if (!isNaN(newBet) && newBet > 0) {
        BASE_BET = newBet;
        currentBet = BASE_BET;
        message.reply(`✅ Base bet updated to **${BASE_BET}**. Next game will start at ${BASE_BET}.`);
      } else {
        message.reply('❌ Invalid amount. Use: `!setbet 100`');
      }
    }
    else if (command === '!setdelay') {
      const min = parseInt(args[1]);
      const max = parseInt(args[2]);
      if (!isNaN(min) && !isNaN(max) && min > 0 && max >= min) {
        minDelayMs = min * 1000;
        maxDelayMs = max * 1000;
        message.reply(`⏳ Delay updated to random between **${min}s** and **${max}s**.`);
      } else {
        message.reply('❌ Invalid delay. Use: `!setdelay 13 18` (in seconds)');
      }
    }
    else if (command === '!setchannel') {
      currentChannelId = message.channel.id;
      message.reply(`✅ Target channel updated! OwO grinding will now happen in this channel.`);
    }
    else if (command === '!status') {
      message.reply(`📊 **Grinder Status**\nRunning: ${isGrinding ? '✅ Yes' : '❌ No'}\nChannel: <#${currentChannelId}>\nBase Bet: **${BASE_BET}**\nCurrent Bet: **${currentBet}**\nDelay: **${minDelayMs/1000}s - ${maxDelayMs/1000}s**`);
    }
  }

  // 🚨 Anti-Captcha System 🚨
  if (message.author.bot && isGrinding) {
    const content = message.content.toLowerCase();
    
    // Check if the message contains 'captcha' and is meant for us (either DM or mentions us)
    if (content.includes('captcha') && (!message.guild || content.includes(client.user.username.toLowerCase()) || message.mentions.users.has(client.user.id))) {
      isGrinding = false;
      stopBackgroundTasks();
      console.log('🚨 CAPTCHA DETECTED! Stopping all tasks and alerting friend...');
      
      try {
        const friend = await client.users.fetch(ALLOWED_USER);
        if (friend) {
          friend.send(`🚨 **CAPTCHA ALERT!** 🚨\nOwO Bot is asking for a Captcha on the selfbot account!\nAll grinding has been completely STOPPED.\nPlease check the account and solve the captcha ASAP to avoid a ban!`);
        }
      } catch(err) {
        console.error('⚠️ Could not send DM to friend:', err);
      }
    }
  }
});

// Listen to OwO bot edits
client.on('messageUpdate', async (oldMessage, newMessage) => {
  if (newMessage.channel.id !== currentChannelId) return;
  
  if (newMessage.author.bot && isGrinding) {
    const content = newMessage.content.toLowerCase();
    
    // Check if it's a coinflip result message
    if (content.includes('the coin spins')) {
      console.log(`OwO edited message: ${newMessage.content}`);
      
      // Extremely strict matching
      const isWin = content.includes('and you won');
      const isLoss = content.includes('lost it all');
      
      if (isWin) {
        console.log(`🎉 Won! Resetting bet to base: ${BASE_BET}`);
        currentBet = BASE_BET;
        
        // Switch side if we won
        currentSide = currentSide === 'h' ? 't' : 'h';
        
        await sleep(minDelayMs, maxDelayMs);
        if (isGrinding) {
          newMessage.channel.send(`owo cf ${currentBet} ${currentSide}`);
        }
        
      } else if (isLoss) {
        // Double the bet and add an extra 20%
        currentBet = Math.ceil(currentBet * 2.20);
        
        // Cap the bet at 250,000 (OwO limit)
        if (currentBet > MAX_BET) {
          currentBet = MAX_BET;
        }
        
        console.log(`😢 Lost! Increasing bet to ${currentBet}`);
        
        // Do NOT switch side if we lost. Keep betting the same side.
        
        await sleep(minDelayMs, maxDelayMs);
        if (isGrinding) {
          newMessage.channel.send(`owo cf ${currentBet} ${currentSide}`);
        }
      }
    }
  }
});

client.login(TOKEN);
