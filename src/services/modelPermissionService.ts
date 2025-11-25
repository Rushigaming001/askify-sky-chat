import { supabase } from '@/integrations/supabase/client';

export interface ModelPermission {
  id: string;
  model_id: string;
  role: 'user' | 'admin' | 'moderator' | 'owner';
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

  return data || [];
}

export async function updateModelPermission(
  modelId: string,
  role: 'user' | 'admin' | 'moderator' | 'owner',
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

export async function canAccessModel(modelId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  const { data, error } = await supabase.rpc('can_access_model', {
    _user_id: user.id,
    _model_id: modelId
  });

  if (error) {
    console.error('Error checking model access:', error);
    return false;
  }

  return data || false;
}
