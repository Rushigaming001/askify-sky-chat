import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'user' | 'admin' | 'moderator' | 'owner' | 'ceo' | 'founder' | 'co_founder' | 'friend' | 'plus' | 'pro' | 'elite' | 'silver' | 'gold' | 'platinum' | 'basic' | 'premium' | 'vip';

export interface ModelPermission {
  id: string;
  model_id: string;
  role: AppRole;
  is_allowed: boolean;
}

export async function getModelPermissions(): Promise<ModelPermission[]> {
  const { data, error } = await supabase
    .from('model_permissions')
    .select('*')
    .order('model_id');

  if (error) {
    console.error('Error fetching model permissions:', error);
    return [];
  }

  return (data || []) as ModelPermission[];
}

export async function updateModelPermission(
  modelId: string,
  role: AppRole,
  isAllowed: boolean
): Promise<boolean> {
  const { error } = await supabase
    .from('model_permissions')
    .upsert({
      model_id: modelId,
      role,
      is_allowed: isAllowed
    }, {
      onConflict: 'model_id,role'
    });

  if (error) {
    console.error('Error updating model permission:', error);
    return false;
  }

  return true;
}

export async function canAccessModel(modelId: string, userId?: string): Promise<boolean> {
  if (!userId) return false;

  const { data, error } = await supabase.rpc('can_access_model', {
    _user_id: userId,
    _model_id: modelId,
  });

  if (error) {
    console.error('Error checking model access:', error);
    return false;
  }

  return data || false;
}

