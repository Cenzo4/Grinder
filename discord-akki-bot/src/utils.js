function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function applyDelay(messageLength) {
  // Simulate human typing speed (~200-300 chars/min for typing)
  const readTime = Math.max(1000, messageLength * 30);
  const thinkTime = Math.random() * 2000 + 500;
  const totalDelay = Math.min(readTime + thinkTime, 5000);
  
  await sleep(totalDelay);
}

module.exports = { sleep, applyDelay };
