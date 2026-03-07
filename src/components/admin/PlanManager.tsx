import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Save, Trash2, Crown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Plan {
  id: string;
  display_name: string;
  description: string | null;
  role_name: string;
  coin_price: number;
  features: string[];
  is_popular: boolean;
  is_active: boolean;
  tier: string;
  sort_order: number;
}

export default function PlanManager() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [heroTitle, setHeroTitle] = useState('Choose Your Perfect Plan');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [savingHero, setSavingHero] = useState(false);

  useEffect(() => { loadPlans(); loadHero(); }, []);

  const loadPlans = async () => {
    const { data } = await supabase.from('subscription_plans').select('*').order('sort_order');
    setPlans((data || []).map(p => ({ ...p, features: Array.isArray(p.features) ? p.features as string[] : [] })));
  };

  const loadHero = async () => {
    const { data } = await supabase.from('app_settings').select('value').eq('key', 'pricing_hero_text').maybeSingle();
    if (data?.value && typeof data.value === 'object') {
      const v = data.value as Record<string, string>;
      if (v.title) setHeroTitle(v.title);
      if (v.subtitle) setHeroSubtitle(v.subtitle);
    }
  };

  const saveHeroText = async () => {
    setSavingHero(true);
    const { error } = await supabase.from('app_settings').upsert({
      key: 'pricing_hero_text',
      value: { title: heroTitle, subtitle: heroSubtitle },
    }, { onConflict: 'key' });
    if (error) toast.error(error.message);
    else toast.success('Hero text updated');
    setSavingHero(false);
  };

  const savePlan = async () => {
    if (!editing) return;
    const payload = {
      display_name: editing.display_name,
      description: editing.description,
      role_name: editing.role_name,
      coin_price: editing.coin_price,
      features: editing.features,
      is_popular: editing.is_popular,
      is_active: editing.is_active,
      tier: editing.tier,
      sort_order: editing.sort_order,
    };

    if (editing.id === 'new') {
      const { error } = await supabase.from('subscription_plans').insert(payload);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from('subscription_plans').update(payload).eq('id', editing.id);
      if (error) { toast.error(error.message); return; }
    }
    toast.success('Plan saved');
    setEditing(null);
    loadPlans();
  };

  const deletePlan = async (id: string) => {
    if (!confirm('Delete this plan?')) return;
    await supabase.from('subscription_plans').delete().eq('id', id);
    toast.success('Plan deleted');
    loadPlans();
  };

  const roleOptions = ['plus', 'pro', 'elite', 'silver', 'gold', 'platinum', 'basic', 'premium', 'vip'];

  return (
    <div className="space-y-6">
      {/* Hero Text Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pricing Page Hero Text</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input value={heroTitle} onChange={e => setHeroTitle(e.target.value)} />
          </div>
          <div>
            <Label>Subtitle</Label>
            <Input value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} />
          </div>
          <Button onClick={saveHeroText} disabled={savingHero} size="sm">
            <Save className="h-4 w-4 mr-1" /> Save
          </Button>
        </CardContent>
      </Card>

      {/* Plans List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Crown className="h-5 w-5 text-amber-500" /> Subscription Plans
          </CardTitle>
          <Button size="sm" onClick={() => setEditing({
            id: 'new', display_name: '', description: '', role_name: 'plus',
            coin_price: 100, features: [], is_popular: false, is_active: true,
            tier: 'Tier 1', sort_order: plans.length,
          })}>
            <Plus className="h-4 w-4 mr-1" /> Add Plan
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {plans.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium">{p.display_name} <span className="text-xs text-muted-foreground">({p.role_name})</span></p>
                  <p className="text-sm text-amber-500 font-bold">{p.coin_price} AC · {p.tier}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(p)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => deletePlan(p.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {plans.length === 0 && <p className="text-center text-muted-foreground py-8">No plans yet. Create one!</p>}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id === 'new' ? 'Create Plan' : 'Edit Plan'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Display Name</Label>
                <Input value={editing.display_name} onChange={e => setEditing({ ...editing, display_name: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Role</Label>
                  <select
                    className="w-full border rounded-md p-2 bg-background"
                    value={editing.role_name}
                    onChange={e => setEditing({ ...editing, role_name: e.target.value })}
                  >
                    {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Price (AC)</Label>
                  <Input type="number" value={editing.coin_price} onChange={e => setEditing({ ...editing, coin_price: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tier</Label>
                  <select className="w-full border rounded-md p-2 bg-background" value={editing.tier} onChange={e => setEditing({ ...editing, tier: e.target.value })}>
                    <option>Tier 1</option><option>Tier 2</option><option>Tier 3</option>
                  </select>
                </div>
                <div>
                  <Label>Sort Order</Label>
                  <Input type="number" value={editing.sort_order} onChange={e => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={editing.is_popular} onCheckedChange={v => setEditing({ ...editing, is_popular: v })} />
                  <Label>Popular</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editing.is_active} onCheckedChange={v => setEditing({ ...editing, is_active: v })} />
                  <Label>Active</Label>
                </div>
              </div>
              <div>
                <Label>Features (one per line)</Label>
                <Textarea
                  value={editing.features.join('\n')}
                  onChange={e => setEditing({ ...editing, features: e.target.value.split('\n').filter(Boolean) })}
                  rows={6}
                />
              </div>
              <Button className="w-full" onClick={savePlan}>
                <Save className="h-4 w-4 mr-2" /> Save Plan
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
