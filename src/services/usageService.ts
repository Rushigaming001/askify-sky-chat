import { supabase } from "@/integrations/supabase/client";

export interface UsageStats {
  totalRequests: number;
  requestsByModel: { model_id: string; count: number }[];
  requestsByUser: { user_id: string; user_name: string; user_email: string; count: number }[];
  recentActivity: {
    user_id: string;
    user_name: string;
    user_email: string;
    model_id: string;
    mode: string;
    created_at: string;
  }[];
}

export const getUsageStats = async (): Promise<UsageStats> => {
  // Get total requests
  const { count: totalRequests } = await supabase
    .from('usage_logs')
    .select('*', { count: 'exact', head: true });

  // Get requests by model
  const { data: modelData } = await supabase
    .from('usage_logs')
    .select('model_id')
    .order('created_at', { ascending: false });

  const modelCounts = modelData?.reduce((acc: Record<string, number>, log) => {
    acc[log.model_id] = (acc[log.model_id] || 0) + 1;
    return acc;
  }, {});

  const requestsByModel = Object.entries(modelCounts || {}).map(([model_id, count]) => ({
    model_id,
    count: count as number,
  })).sort((a, b) => b.count - a.count);

  // Get requests by user with profile info
  const { data: userLogs } = await supabase
    .from('usage_logs')
    .select('user_id, profiles!inner(name, email)')
    .order('created_at', { ascending: false });

  const userCounts = userLogs?.reduce((acc: Record<string, { count: number; name: string; email: string }>, log: any) => {
    if (!acc[log.user_id]) {
      acc[log.user_id] = {
        count: 0,
        name: log.profiles.name,
        email: log.profiles.email,
      };
    }
    acc[log.user_id].count++;
    return acc;
  }, {});

  const requestsByUser = Object.entries(userCounts || {}).map(([user_id, data]) => ({
    user_id,
    user_name: data.name,
    user_email: data.email,
    count: data.count,
  })).sort((a, b) => b.count - a.count);

  // Get recent activity (last 50)
  const { data: recentActivity } = await supabase
    .from('usage_logs')
    .select('user_id, model_id, mode, created_at, profiles!inner(name, email)')
    .order('created_at', { ascending: false })
    .limit(50);

  const formattedActivity = recentActivity?.map((log: any) => ({
    user_id: log.user_id,
    user_name: log.profiles.name,
    user_email: log.profiles.email,
    model_id: log.model_id,
    mode: log.mode,
    created_at: log.created_at,
  })) || [];

  return {
    totalRequests: totalRequests || 0,
    requestsByModel,
    requestsByUser,
    recentActivity: formattedActivity,
  };
};
