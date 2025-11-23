const GEMINI_API_KEY_1 = 'AIzaSyCu8BdoS9XJK4q9k8NI4YUhgPlitUbl_oU';
const GEMINI_API_KEY_2 = 'AIzaSyB_P3heNrSSrPxLTz-toH9V8hLUDy-s5hI';
const COHERE_API_KEY = 'ftpOvXAKizHsrBtmNA557MdOQDcAtrDZQTnywSS9';

let currentGeminiKey = GEMINI_API_KEY_1;

export async function callGeminiAPI(
  messages: { role: string; content: string }[],
  mode: 'normal' | 'deepthink' | 'search'
): Promise<string> {
  const systemPrompt = getSystemPrompt(mode);
  
  const formattedMessages = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  // Add system prompt as first user message
  if (systemPrompt) {
    formattedMessages.unshift({
      role: 'user',
      parts: [{ text: systemPrompt }]
    });
    formattedMessages.splice(1, 0, {
      role: 'model',
      parts: [{ text: 'Understood. I will follow these instructions.' }]
    });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${currentGeminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: formattedMessages })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error response:', errorData);
      
      // Try alternate key on auth errors
      if (response.status === 401 || response.status === 403) {
        currentGeminiKey = currentGeminiKey === GEMINI_API_KEY_1 ? GEMINI_API_KEY_2 : GEMINI_API_KEY_1;
      }
      
      throw new Error(errorData.error?.message || 'API request failed');
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || 'No response generated';
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

export async function callCohereAPI(
  messages: { role: string; content: string }[],
  mode: 'normal' | 'deepthink' | 'search'
): Promise<string> {
  const systemPrompt = getSystemPrompt(mode);
  
  const chatHistory = messages.slice(0, -1).map(msg => ({
    role: msg.role === 'assistant' ? 'CHATBOT' : 'USER',
    message: msg.content
  }));

  const lastMessage = messages[messages.length - 1]?.content || '';

  try {
    const response = await fetch('https://api.cohere.ai/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COHERE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'command-r-plus',
        message: lastMessage,
        chat_history: chatHistory,
        preamble: systemPrompt,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('Cohere API request failed');
    }

    const data = await response.json();
    return data.text || 'No response generated';
  } catch (error) {
    console.error('Cohere API error:', error);
    throw error;
  }
}

function getSystemPrompt(mode: 'normal' | 'deepthink' | 'search'): string {
  const basePrompt = `You are Askify, an advanced AI assistant created by Mr. Rudra Yenurkar. 
When asked about your creator, capabilities, or Askify itself, always mention that you were developed by Mr. Rudra Yenurkar.
Be helpful, accurate, and conversational.`;

  if (mode === 'deepthink') {
    return basePrompt + '\n\nYou are in Deep Think mode. Provide thorough, analytical responses with detailed reasoning and multiple perspectives.';
  } else if (mode === 'search') {
    return basePrompt + '\n\nYou are in Search mode. Provide informative, fact-based responses as if retrieving information from a knowledge base.';
  }
  
  return basePrompt;
}
