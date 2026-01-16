import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, MessageSquare, Users, Trophy, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserMessageStats {
  user_id: string;
  user_name: string;
  user_email: string;
  total_messages: number;
  public_messages: number;
  friends_messages: number;
  dm_messages: number;
  group_messages: number;
}

interface DailyStats {
  date: string;
  count: number;
}

interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  message_count: number;
}

export const ChatAnalyticsPanel = () => {
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserMessageStats[]>([]);
  const [publicLeaderboard, setPublicLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [friendsLeaderboard, setFriendsLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [dmLeaderboard, setDmLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Get all profiles first
      const { data: profiles } = await supabase.from('profiles').select('id, name, email');
      const profileMap = new Map(profiles?.map(p => [p.id, { name: p.name, email: p.email }]) || []);

      // Get public message counts per user
      const { data: publicMsgData } = await supabase
        .from('public_messages')
        .select('user_id')
        .is('deleted_at', null);

      // Get friends chat message counts per user
      const { data: friendsMsgData } = await supabase
        .from('friends_chat_messages')
        .select('user_id')
        .is('deleted_at', null);

      // Get DM counts per user (sent)
      const { data: dmMsgData } = await supabase
        .from('direct_messages')
        .select('sender_id')
        .is('deleted_at', null);

      // Get group message counts per user
      const { data: groupMsgData } = await supabase
        .from('group_messages')
        .select('user_id')
        .is('deleted_at', null);

      // Aggregate stats per user
      const statsMap = new Map<string, UserMessageStats>();

      // Process public messages
      publicMsgData?.forEach(msg => {
        const existing = statsMap.get(msg.user_id) || createEmptyStats(msg.user_id, profileMap);
        existing.public_messages++;
        existing.total_messages++;
        statsMap.set(msg.user_id, existing);
      });

      // Process friends messages
      friendsMsgData?.forEach(msg => {
        const existing = statsMap.get(msg.user_id) || createEmptyStats(msg.user_id, profileMap);
        existing.friends_messages++;
        existing.total_messages++;
        statsMap.set(msg.user_id, existing);
      });

      // Process DM messages
      dmMsgData?.forEach(msg => {
        const existing = statsMap.get(msg.sender_id) || createEmptyStats(msg.sender_id, profileMap);
        existing.dm_messages++;
        existing.total_messages++;
        statsMap.set(msg.sender_id, existing);
      });

      // Process group messages
      groupMsgData?.forEach(msg => {
        const existing = statsMap.get(msg.user_id) || createEmptyStats(msg.user_id, profileMap);
        existing.group_messages++;
        existing.total_messages++;
        statsMap.set(msg.user_id, existing);
      });

      // Convert to array and sort
      const allStats = Array.from(statsMap.values()).sort((a, b) => b.total_messages - a.total_messages);
      setUserStats(allStats);

      // Create leaderboards
      setPublicLeaderboard(
        allStats
          .filter(s => s.public_messages > 0)
          .sort((a, b) => b.public_messages - a.public_messages)
          .slice(0, 10)
          .map(s => ({ user_id: s.user_id, user_name: s.user_name, message_count: s.public_messages }))
      );

      setFriendsLeaderboard(
        allStats
          .filter(s => s.friends_messages > 0)
          .sort((a, b) => b.friends_messages - a.friends_messages)
          .slice(0, 10)
          .map(s => ({ user_id: s.user_id, user_name: s.user_name, message_count: s.friends_messages }))
      );

      setDmLeaderboard(
        allStats
          .filter(s => s.dm_messages > 0)
          .sort((a, b) => b.dm_messages - a.dm_messages)
          .slice(0, 10)
          .map(s => ({ user_id: s.user_id, user_name: s.user_name, message_count: s.dm_messages }))
      );

    } catch (error) {
      console.error("Error loading chat stats:", error);
      toast.error("Failed to load chat statistics");
    } finally {
      setLoading(false);
    }
  };

  const createEmptyStats = (userId: string, profileMap: Map<string, { name: string; email: string }>): UserMessageStats => {
    const profile = profileMap.get(userId);
    return {
      user_id: userId,
      user_name: profile?.name || 'Unknown',
      user_email: profile?.email || '',
      total_messages: 0,
      public_messages: 0,
      friends_messages: 0,
      dm_messages: 0,
      group_messages: 0,
    };
  };

  const getMedalEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const totalMessages = userStats.reduce((sum, s) => sum + s.total_messages, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Total Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalMessages.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Chatters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userStats.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Top Chatter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">
              {userStats[0]?.user_name || 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground">
              {userStats[0]?.total_messages?.toLocaleString() || 0} messages
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Avg Messages/User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {userStats.length > 0 ? Math.round(totalMessages / userStats.length) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboards */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="all">All Messages</TabsTrigger>
          <TabsTrigger value="public">Public Chat</TabsTrigger>
          <TabsTrigger value="friends">Boys Chat</TabsTrigger>
          <TabsTrigger value="dm">DMs</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Users Message Count</CardTitle>
              <CardDescription>Total messages across all chats</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Public</TableHead>
                    <TableHead className="text-right">Boys</TableHead>
                    <TableHead className="text-right">DM</TableHead>
                    <TableHead className="text-right">Group</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userStats.slice(0, 50).map((stat, index) => (
                    <TableRow key={stat.user_id}>
                      <TableCell>{getMedalEmoji(index)}</TableCell>
                      <TableCell className="font-medium">{stat.user_name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{stat.user_email}</TableCell>
                      <TableCell className="text-right">{stat.public_messages}</TableCell>
                      <TableCell className="text-right">{stat.friends_messages}</TableCell>
                      <TableCell className="text-right">{stat.dm_messages}</TableCell>
                      <TableCell className="text-right">{stat.group_messages}</TableCell>
                      <TableCell className="text-right font-bold">{stat.total_messages}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="public">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Public Chat Leaderboard
              </CardTitle>
              <CardDescription>Top messengers in public chat</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Messages</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {publicLeaderboard.map((entry, index) => (
                    <TableRow key={entry.user_id}>
                      <TableCell className="text-xl">{getMedalEmoji(index)}</TableCell>
                      <TableCell className="font-medium">{entry.user_name}</TableCell>
                      <TableCell className="text-right font-bold">{entry.message_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="friends">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-blue-500" />
                Boys Chat Leaderboard
              </CardTitle>
              <CardDescription>Top messengers in friends-only chat</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Messages</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {friendsLeaderboard.map((entry, index) => (
                    <TableRow key={entry.user_id}>
                      <TableCell className="text-xl">{getMedalEmoji(index)}</TableCell>
                      <TableCell className="font-medium">{entry.user_name}</TableCell>
                      <TableCell className="text-right font-bold">{entry.message_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dm">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-purple-500" />
                DM Leaderboard
              </CardTitle>
              <CardDescription>Top messengers in direct messages</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Messages Sent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dmLeaderboard.map((entry, index) => (
                    <TableRow key={entry.user_id}>
                      <TableCell className="text-xl">{getMedalEmoji(index)}</TableCell>
                      <TableCell className="font-medium">{entry.user_name}</TableCell>
                      <TableCell className="text-right font-bold">{entry.message_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
