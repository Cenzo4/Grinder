const malayalamRegex = /[\u0D00-\u0D7F]/;  // Malayalam Unicode range

function detectLanguage(text) {
  if (!text || text.trim().length === 0) return 'unknown';
  
  // Check for Malayalam script
  if (malayalamRegex.test(text)) {
    return 'malayalam';
  }
  
  // Check for Manglish (Malayalam words in English letters)
  const manglishPatterns = [
    /\b(ente|ningal|avan|aval|ithu|athu|pinn|enn|appo|ila|illa|und|undo|aanu|alle|po|vaa|da|dei|mone|ponde|eda)\b/i,
    /\b(chey|poda|pokk|var|thaa|thar|kodukk|edukk|vekk|irikk|akk|undakk)\w*\b/i,
    /\b(illa|alla|poda|da|dei|macha|mone|ponde|alle|ila)\b/i,
    /\b(enth|enthu|entha|engane|evide|evda|ethra|aake|pakshe|enkil|ennal)\b/i
  ];
  
  const words = text.split(/\s+/);
  const manglishScore = words.filter(w => 
    manglishPatterns.some(p => p.test(w))
  ).length;
  
  // If more than 15% words match manglish patterns
  if (manglishScore > 0 && (manglishScore / words.length) > 0.15) {
    return 'manglish';
  }
  
  // Default to English
  return 'english';
}

module.exports = { detectLanguage };
