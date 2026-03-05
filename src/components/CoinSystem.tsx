import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Coins, Send, Gift, Infinity, TrendingUp, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CoinBalanceProps {
  compact?: boolean;
  onClick?: () => void;
}

export function CoinBalance({ compact = false, onClick }: CoinBalanceProps) {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [unlimited, setUnlimited] = useState(false);
  const [canClaim, setCanClaim] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    loadBalance();
  }, [user]);

  const loadBalance = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_coins')
      .select('balance, unlimited, last_daily_claim')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setBalance(data.balance);
      setUnlimited(data.unlimited);
      const lastClaim = data.last_daily_claim ? new Date(data.last_daily_claim) : null;
      setCanClaim(!lastClaim || lastClaim.toDateString() !== new Date().toDateString());
    } else {
      setCanClaim(true);
    }
  };

  const claimDaily = async () => {
    if (!user) return;
    const { data, error } = await supabase.rpc('claim_daily_coins', { _user_id: user.id });
    if (data) {
      toast({ title: '🎉 Daily Coins Claimed!', description: 'You received 10 Askify Coins!' });
      loadBalance();
    } else {
      toast({ title: 'Already claimed', description: 'Come back tomorrow!', variant: 'destructive' });
    }
  };

  if (compact) {
    return (
      <button onClick={onClick} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 transition-colors border border-amber-500/20">
        <Coins className="h-3.5 w-3.5 text-amber-500" />
        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
          {unlimited ? '∞' : balance}
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20">
        <Coins className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
          {unlimited ? '∞' : balance} AC
        </span>
      </div>
      {canClaim && (
        <Button size="sm" variant="outline" onClick={claimDaily} className="h-7 text-xs gap-1 border-green-500/30 text-green-600 hover:bg-green-500/10">
          <Gift className="h-3 w-3" />
          Claim Daily
        </Button>
      )}
    </div>
  );
}

interface SendCoinsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId?: string;
  recipientName?: string;
}

export function SendCoinsDialog({ isOpen, onClose, recipientId, recipientName }: SendCoinsDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState<{ id: string; name: string; avatar_url?: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState(recipientId || '');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && !recipientId) {
      loadUsers();
    }
    if (recipientId) setSelectedUser(recipientId);
  }, [isOpen, recipientId]);

  const loadUsers = async () => {
    const { data } = await supabase.from('profiles').select('id, name, avatar_url');
    if (data) setUsers(data.filter(u => u.id !== user?.id));
  };

  const handleSend = async () => {
    if (!user || !selectedUser || !amount || parseInt(amount) <= 0) return;
    setSending(true);
    
    const { data, error } = await supabase.rpc('transfer_coins', {
      _from_user_id: user.id,
      _to_user_id: selectedUser,
      _amount: parseInt(amount)
    });

    if (data) {
      toast({ title: '💰 Coins Sent!', description: `Sent ${amount} AC to ${recipientName || 'user'}` });
      onClose();
      setAmount('');
    } else {
      toast({ title: 'Transfer failed', description: 'Insufficient balance or invalid transfer', variant: 'destructive' });
    }
    setSending(false);
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            Send Askify Coins
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {recipientName ? (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm">To: <strong>{recipientName}</strong></span>
            </div>
          ) : (
            <>
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="max-h-32 overflow-y-auto space-y-1">
                {filteredUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUser(u.id)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors ${selectedUser === u.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'}`}
                  >
                    <Avatar className="h-6 w-6">
                      {u.avatar_url && <AvatarImage src={u.avatar_url} />}
                      <AvatarFallback className="text-[10px]">{u.name[0]}</AvatarFallback>
                    </Avatar>
                    <span>{u.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            <Input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="flex-1"
            />
          </div>
          <div className="flex gap-2">
            {[5, 10, 25, 50, 100].map(v => (
              <Button key={v} variant="outline" size="sm" onClick={() => setAmount(String(v))} className="flex-1 text-xs">
                {v}
              </Button>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSend} disabled={!selectedUser || !amount || sending} className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white">
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Send {amount || 0} AC
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Coin Leaderboard Component
export function CoinLeaderboard() {
  const [leaders, setLeaders] = useState<{ user_id: string; balance: number; unlimited: boolean; name?: string; avatar_url?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    const { data } = await supabase
      .from('user_coins')
      .select('user_id, balance, unlimited')
      .order('balance', { ascending: false })
      .limit(10);

    if (data && data.length > 0) {
      const userIds = data.map(d => d.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      setLeaders(data.map(d => ({
        ...d,
        name: profileMap.get(d.user_id)?.name,
        avatar_url: profileMap.get(d.user_id)?.avatar_url || undefined
      })));
    }
    setLoading(false);
  };

  if (loading) return <div className="text-center text-muted-foreground text-sm py-4">Loading leaderboard...</div>;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-amber-500" />
        Coin Leaderboard
      </h3>
      {leaders.map((leader, i) => (
        <div key={leader.user_id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <span className="text-sm font-bold w-6 text-center">
            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
          </span>
          <Avatar className="h-6 w-6">
            {leader.avatar_url && <AvatarImage src={leader.avatar_url} />}
            <AvatarFallback className="text-[10px]">{leader.name?.[0] || '?'}</AvatarFallback>
          </Avatar>
          <span className="text-sm flex-1 truncate">{leader.name || 'Unknown'}</span>
          <Badge variant="outline" className="text-amber-600 border-amber-500/30">
            {leader.unlimited ? '∞' : leader.balance} AC
          </Badge>
        </div>
      ))}
    </div>
  );
}

// Admin Coin Manager (for owner)
interface AdminCoinManagerProps {
  userId: string;
  userName: string;
}

export function AdminCoinManager({ userId, userName }: AdminCoinManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState('100');
  const [isUnlimited, setIsUnlimited] = useState(false);

  const giveCoins = async () => {
    if (!user) return;
    const { data } = await supabase.rpc('admin_give_coins', {
      _admin_user_id: user.id,
      _to_user_id: userId,
      _amount: parseInt(amount) || 0,
      _set_unlimited: isUnlimited
    });

    if (data) {
      toast({ title: '✅ Coins Given', description: `Gave ${isUnlimited ? 'unlimited' : amount} coins to ${userName}` });
    } else {
      toast({ title: 'Failed', description: 'Could not give coins', variant: 'destructive' });
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-amber-500/5 rounded-lg border border-amber-500/20">
      <Coins className="h-4 w-4 text-amber-500 flex-shrink-0" />
      <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-8 w-20 text-sm" />
      <Button size="sm" variant="outline" onClick={giveCoins} className="h-8 text-xs">
        <Gift className="h-3 w-3 mr-1" />Give
      </Button>
      <Button
        size="sm"
        variant={isUnlimited ? "default" : "outline"}
        onClick={() => { setIsUnlimited(!isUnlimited); }}
        className="h-8 text-xs"
      >
        <Infinity className="h-3 w-3 mr-1" />{isUnlimited ? 'Unlimited ON' : 'Unlimited'}
      </Button>
    </div>
  );
}
