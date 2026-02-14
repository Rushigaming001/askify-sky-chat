import { supabase } from '@/integrations/supabase/client';

// Response cache - stores last 50 Q&A pairs
const responseCache = new Map<string, string>();
const MAX_CACHE_SIZE = 50;

function getCacheKey(messages: { role: string; content: string }[], model: string, mode: string): string {
  const lastUserMessage = messages.filter(m => m.role === 'user').slice(-1)[0]?.content || '';
  return `${model}:${mode}:${lastUserMessage.toLowerCase().trim()}`;
}

export type AIModel = string;

export async function callAI(
  messages: { role: string; content: string }[],
  model: string,
  mode: 'normal' | 'deepthink' | 'search' | 'reasoning',
  image?: string
): Promise<string> {
  // Check cache first (skip if image is attached)
  const cacheKey = getCacheKey(messages, model, mode);
  if (!image && responseCache.has(cacheKey)) {
    console.log('✅ Using cached response');
    return responseCache.get(cacheKey)!;
  }

  const MAX_RETRIES = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('Your session is not ready or expired. Please log in again.');
      }

      const recentMessages = messages.slice(-6);

      const { data, error } = await supabase.functions.invoke('chat', {
        body: { messages: recentMessages, model, mode, image },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (error) {
        console.error('Chat function error:', error);
        const msg = error.message || '';

        // Don't retry auth or payment errors
        if (msg.toLowerCase().includes('unauthorized') || msg.includes('401')) {
          throw new Error('Session expired. Please log in again.');
        }
        if (msg.includes('Payment required') || msg.includes('402')) {
          throw new Error('Out of AI credits! Please go to Settings → Workspace → Usage to add credits.');
        }
        if (msg.includes('Rate limit') || msg.includes('429')) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        }

        // Retry on 503/500 errors
        if (attempt < MAX_RETRIES && (msg.includes('503') || msg.includes('500') || msg.includes('unavailable'))) {
          console.log(`Retrying (attempt ${attempt + 1}/${MAX_RETRIES})...`);
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          lastError = new Error(msg || 'Failed to get AI response');
          continue;
        }

        throw new Error(msg || 'Failed to get AI response');
      }

      if (!data || !data.reply) {
        if (attempt < MAX_RETRIES) {
          console.log(`Empty response, retrying (attempt ${attempt + 1}/${MAX_RETRIES})...`);
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          lastError = new Error('Invalid response from AI');
          continue;
        }
        throw new Error('Invalid response from AI');
      }

      // Store in cache
      if (!image) {
        responseCache.set(cacheKey, data.reply);
        if (responseCache.size > MAX_CACHE_SIZE) {
          const firstKey = responseCache.keys().next().value;
          responseCache.delete(firstKey);
        }
      }

      return data.reply;
    } catch (error: any) {
      // Don't retry non-retryable errors
      if (error?.message?.includes('Session expired') || error?.message?.includes('credits') || error?.message?.includes('Rate limit')) {
        throw error;
      }
      lastError = error;
      if (attempt < MAX_RETRIES) {
        console.log(`Error, retrying (attempt ${attempt + 1}/${MAX_RETRIES})...`);
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
    }
  }

  throw lastError || new Error('An unexpected error occurred. Please try again.');
}
