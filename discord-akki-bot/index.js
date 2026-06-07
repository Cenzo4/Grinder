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

// Random sleep function
const sleep = (min, max) => new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));

client.on('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`💰 OwO Grinder Ready!`);
});

client.on('messageCreate', async (message) => {
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
        targetChannel.send(`owo cf ${currentBet}`);
      } else {
        message.reply(`❌ Cannot find target channel. Use !setchannel here first.`);
        isGrinding = false;
      }
    } 
    else if (command === '!stop') {
      isGrinding = false;
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
        
        await sleep(minDelayMs, maxDelayMs);
        if (isGrinding) newMessage.channel.send(`owo cf ${currentBet}`);
        
      } else if (isLoss) {
        currentBet = currentBet * 2;
        console.log(`😢 Lost! Doubling bet to ${currentBet}`);
        
        await sleep(minDelayMs, maxDelayMs);
        if (isGrinding) newMessage.channel.send(`owo cf ${currentBet}`);
      }
    }
  }
});

client.login(TOKEN);
