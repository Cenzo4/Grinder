const fs = require('fs');

async function crashGuardWrapper(fn) {
  try {
    await fn();
  } catch (error) {
    const errorLog = `[${new Date().toISOString()}] ${error.stack || error.message}\n`;
    fs.appendFileSync('./logs/error.log', errorLog);
    
    // Don't crash on individual message errors
    console.error('⚠️ Crash guard caught:', error.message);
  }
}

module.exports = { crashGuardWrapper };
