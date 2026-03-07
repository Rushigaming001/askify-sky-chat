import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Coins, Search, Infinity, Gift } from 'lucide-react';

interface UserCoin {
  user_id: string;
  balance: number;
  unlimited: boolean;
  name: string;
  email: string;
}

export default function CoinManager() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserCoin[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserCoin | null>(null);
  const [giveAmount, setGiveAmount] = useState(100);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from('profiles').select('id, name, email');
    const { data: coins } = await supabase.from('user_coins').select('user_id, balance, unlimited');

    const coinMap = new Map(coins?.map(c => [c.user_id, c]) || []);
    const combined = (profiles || []).map(p => ({
      user_id: p.id,
      name: p.name,
      email: p.email,
      balance: coinMap.get(p.id)?.balance || 0,
      unlimited: coinMap.get(p.id)?.unlimited || false,
    }));
    setUsers(combined);
    setLoading(false);
  };

  const handleGiveCoins = async () => {
    if (!selectedUser || !user) return;
    const { data, error } = await supabase.rpc('admin_give_coins', {
      _admin_user_id: user.id,
      _to_user_id: selectedUser.user_id,
      _amount: giveAmount,
      _set_unlimited: selectedUser.unlimited,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Gave ${giveAmount} AC to ${selectedUser.name}`);
    loadUsers();
  };

  const toggleUnlimited = async (u: UserCoin) => {
    if (!user) return;
    const { error } = await supabase.rpc('admin_give_coins', {
      _admin_user_id: user.id,
      _to_user_id: u.user_id,
      _amount: 0,
      _set_unlimited: !u.unlimited,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`${u.name} is now ${!u.unlimited ? 'unlimited' : 'limited'}`);
    loadUsers();
    if (selectedUser?.user_id === u.user_id) {
      setSelectedUser({ ...u, unlimited: !u.unlimited });
    }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Coins className="h-5 w-5 text-amber-500" /> User Coins
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-1">
              {filtered.map(u => (
                <div
                  key={u.user_id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedUser?.user_id === u.user_id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'}`}
                  onClick={() => setSelectedUser(u)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="text-right">
                      {u.unlimited ? (
                        <Badge text="∞ Unlimited" />
                      ) : (
                        <span className="font-bold text-amber-500">{u.balance} AC</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manage Coins</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedUser ? (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="font-semibold">{selectedUser.name}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                <p className="mt-2 text-lg font-bold text-amber-500">
                  {selectedUser.unlimited ? '∞ Unlimited' : `${selectedUser.balance} AC`}
                </p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Infinity className="h-4 w-4 text-primary" />
                  <Label>Unlimited Coins</Label>
                </div>
                <Switch checked={selectedUser.unlimited} onCheckedChange={() => toggleUnlimited(selectedUser)} />
              </div>

              <div className="space-y-2">
                <Label>Give Coins</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={giveAmount}
                    onChange={e => setGiveAmount(Number(e.target.value))}
                    min={1}
                  />
                  <Button onClick={handleGiveCoins}>
                    <Gift className="h-4 w-4 mr-1" /> Give
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {[50, 100, 500, 1000, 5000].map(n => (
                  <Button key={n} variant="outline" size="sm" onClick={() => setGiveAmount(n)}>{n} AC</Button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">Select a user to manage coins</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{text}</span>;
}
