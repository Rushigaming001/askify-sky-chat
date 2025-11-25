import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { getUsageStats, UsageStats } from "@/services/usageService";
import { toast } from "sonner";

const modelNames: Record<string, string> = {
  'google/gemini-2.5-flash': 'Gemini Flash',
  'openai/gpt-5': 'GPT-5',
  'openai/gpt-5-mini': 'GPT-5 Mini',
  'openai/gpt-5-nano': 'GPT-5 Nano',
  'google/gemini-3-pro-preview': 'Gemini 3 Pro',
  'google/gemini-2.5-pro': 'ASKIFY-PRO',
};

export const UsageTrafficPanel = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UsageStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getUsageStats();
      setStats(data);
    } catch (error) {
      console.error("Error loading usage stats:", error);
      toast.error("Failed to load usage statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Total Requests</CardTitle>
          <CardDescription>Total number of AI model requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{stats?.totalRequests || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Requests by Model</CardTitle>
          <CardDescription>Usage statistics per AI model</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Requests</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.requestsByModel.map((item) => (
                <TableRow key={item.model_id}>
                  <TableCell>{modelNames[item.model_id] || item.model_id}</TableCell>
                  <TableCell className="text-right">{item.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Requests by User</CardTitle>
          <CardDescription>Top users by request count</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Requests</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.requestsByUser.map((item) => (
                <TableRow key={item.user_id}>
                  <TableCell>{item.user_name}</TableCell>
                  <TableCell>{item.user_email}</TableCell>
                  <TableCell className="text-right">{item.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Last 50 model requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.recentActivity.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.user_name}</TableCell>
                  <TableCell>{modelNames[item.model_id] || item.model_id}</TableCell>
                  <TableCell className="capitalize">{item.mode}</TableCell>
                  <TableCell>{new Date(item.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
