import { supabase } from '@/integrations/supabase/client';

export async function callAI(
  messages: { role: string; content: string }[],
  model: 'gemini' | 'cohere',
  mode: 'normal' | 'deepthink' | 'search'
): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('chat', {
      body: { messages, model, mode }
    });

    if (error) {
      console.error('Chat function error:', error);
      throw new Error(error.message || 'Failed to get AI response');
    }

    if (!data || !data.reply) {
      throw new Error('Invalid response from AI');
    }

    return data.reply;
  } catch (error) {
    console.error('AI service error:', error);
    throw error;
  }
}
