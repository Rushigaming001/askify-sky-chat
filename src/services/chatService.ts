import { supabase } from '@/integrations/supabase/client';

export async function callAI(
  messages: { role: string; content: string }[],
  model: 'gemini' | 'gpt' | 'askify' | 'gpt-mini' | 'gpt-nano' | 'gemini-3' | 'nvidia',
  mode: 'normal' | 'deepthink' | 'search' | 'reasoning'
): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('chat', {
      body: { messages, model, mode }
    });

    if (error) {
      console.error('Chat function error:', error);
      
      // Handle specific error types with user-friendly messages
      if (error.message?.includes('Payment required') || error.message?.includes('402')) {
        throw new Error('Out of AI credits! Please go to Settings → Workspace → Usage to add credits and continue using ASKIFY.');
      }
      
      if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      
      throw new Error(error.message || 'Failed to get AI response');
    }

    if (!data || !data.reply) {
      throw new Error('Invalid response from AI');
    }

    return data.reply;
  } catch (error: any) {
    console.error('AI service error:', error);
    
    // Re-throw with user-friendly message if available
    if (error.message) {
      throw error;
    }
    
    throw new Error('An unexpected error occurred. Please try again.');
  }
}
