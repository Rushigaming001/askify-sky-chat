import { supabase } from '@/integrations/supabase/client';

// Response cache - stores last 50 Q&A pairs
const responseCache = new Map<string, string>();
const MAX_CACHE_SIZE = 50;

function getCacheKey(messages: { role: string; content: string }[], model: string, mode: string): string {
  const lastUserMessage = messages.filter(m => m.role === 'user').slice(-1)[0]?.content || '';
  return `${model}:${mode}:${lastUserMessage.toLowerCase().trim()}`;
}

export async function callAI(
  messages: { role: string; content: string }[],
  model: 'gemini' | 'gpt' | 'askify' | 'gpt-mini' | 'gpt-nano' | 'gemini-3' | 'gemini-lite' | 'nano-banana' | 'grok' | 'cohere' | 'deepseek',
  mode: 'normal' | 'deepthink' | 'search' | 'reasoning'
): Promise<string> {
  // Check cache first
  const cacheKey = getCacheKey(messages, model, mode);
  if (responseCache.has(cacheKey)) {
    console.log('✅ Using cached response');
    return responseCache.get(cacheKey)!;
  }

  try {
    // Ensure we have a real user session token.
    // Without this, the backend function will return 401 and the app may appear to “log out”.
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      throw new Error('Your session is not ready or expired. Please log in again.');
    }

    // Limit conversation history to last 6 messages (saves credits)
    const recentMessages = messages.slice(-6);

    const { data, error } = await supabase.functions.invoke('chat', {
      body: { messages: recentMessages, model, mode },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (error) {
      console.error('Chat function error:', error);

      const msg = error.message || '';

      // Handle auth errors explicitly
      if (msg.toLowerCase().includes('unauthorized') || msg.includes('401')) {
        throw new Error('Session expired. Please log in again.');
      }

      // Handle specific error types with user-friendly messages
      if (msg.includes('Payment required') || msg.includes('402')) {
        throw new Error('Out of AI credits! Please go to Settings → Workspace → Usage to add credits and continue using ASKIFY.');
      }

      if (msg.includes('Rate limit') || msg.includes('429')) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }

      throw new Error(msg || 'Failed to get AI response');
    }

    if (!data || !data.reply) {
      throw new Error('Invalid response from AI');
    }

    // Store in cache
    responseCache.set(cacheKey, data.reply);

    // Limit cache size
    if (responseCache.size > MAX_CACHE_SIZE) {
      const firstKey = responseCache.keys().next().value;
      responseCache.delete(firstKey);
    }

    return data.reply;
  } catch (error: any) {
    console.error('AI service error:', error);

    // Re-throw with user-friendly message if available
    if (error?.message) {
      throw error;
    }

    throw new Error('An unexpected error occurred. Please try again.');
  }
}

