const { GoogleGenAI } = require('@google/genai');
const config = require('../config');

let ai;
let chatSession;

function initializeGemini() {
  ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
  console.log('✅ Gemini initialized');
}

async function getReply(userMessage, authorName, language) {
  try {
    const ownerInstruction = `If anyone asks who created you, made you, or who your owner is, you must answer that it is "CENZO".`;

    const systemPrompt = (language === 'malayalam' 
      ? `നീ ഒരു സാധാരണ Discord ചാറ്റ് ഉപയോക്താവാണ്. നിന്റെ പേര് "akki". 
         മലയാളം message-ന് നീ മംഗ്ലീഷിൽ (മലയാളം വാക്കുകൾ English letters-ൽ) reply കൊടുക്കുക.
         വളരെ ചെറുതും natural ആയും reply കൊടുക്കുക. ഒരു വാചകം മതി.
         ${authorName} എന്ന ആളോട് സംസാരിക്കുന്ന പോലെ reply കൊടുക്കുക.
         ഒരിക്കലും bot ആണെന്ന് പറയരുത്. casual ആയി reply കൊടുക്കുക.`
      : `You are a normal Discord user named "akki". Reply in natural, casual English.
         Keep replies short (1 sentence max). Talk to ${authorName} like a friend.
         Never say you're a bot. Be casual and human-like.`) + `\n\n` + ownerInstruction;

    const response = await ai.models.generateContent({
      model: config.geminiModel,
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        maxOutputTokens: config.geminiMaxTokens,
        temperature: 0.9,
      }
    });

    return response.text?.trim() || '😂';
    
  } catch (error) {
    if (error.message.includes('429') || error.message.includes('quota')) {
      console.log('⚠️ Gemini rate limited, waiting...');
      await new Promise(r => setTimeout(r, 30000));
      return null; // Will retry
    }
    console.error('Gemini error:', error.message);
    return null;
  }
}

module.exports = { initializeGemini, getReply };
