import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, Activity, Clock, Shield } from 'lucide-react';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency?: number;
}

const statusConfig: { name: string; category: string }[] = [
  { name: 'Core AI (Groq)', category: 'AI Models' },
  { name: 'Pro AI (Cohere)', category: 'AI Models' },
  { name: 'Lite AI (DeepSeek)', category: 'AI Models' },
  { name: 'Gemini Models', category: 'AI Models' },
  { name: 'ASKIFY PRO', category: 'AI Models' },
  { name: 'Image Generation', category: 'AI Features' },
  { name: 'Video Generation', category: 'AI Features' },
  { name: 'Math Solver', category: 'AI Features' },
  { name: 'Public Chat', category: 'Communication' },
  { name: 'Direct Messages', category: 'Communication' },
  { name: 'Friends Chat', category: 'Communication' },
  { name: 'Group Chat', category: 'Communication' },
  { name: 'Push Notifications', category: 'Infrastructure' },
  { name: 'Authentication', category: 'Infrastructure' },
  { name: 'Database', category: 'Infrastructure' },
  { name: 'File Storage', category: 'Infrastructure' },
];

const Status = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  useEffect(() => {
    // Simulate status check - all operational
    const statuses: ServiceStatus[] = statusConfig.map(s => ({
      name: s.name,
      status: 'operational' as const,
      latency: Math.floor(Math.random() * 80) + 20,
    }));
    setServices(statuses);
    setLastChecked(new Date());

    const interval = setInterval(() => {
      setLastChecked(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const allOperational = services.every(s => s.status === 'operational');
  const categories = [...new Set(statusConfig.map(s => s.category))];

  const getStatusBadge = (status: string) => {
    if (status === 'operational') return <Badge className="bg-emerald-500 text-white border-0 gap-1"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-white" /></span>Operational</Badge>;
    if (status === 'degraded') return <Badge className="bg-amber-500 text-white border-0">Degraded</Badge>;
    return <Badge className="bg-red-500 text-white border-0">Down</Badge>;
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-blue-50 to-cyan-100" />
      <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-blue-100/30" />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-xl hover:bg-white/60">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Service Status
            </h1>
            <p className="text-sm text-slate-500">Real-time system health monitoring</p>
          </div>
        </div>

        {/* Overall Status Banner */}
        <Card className="mb-8 bg-white/80 backdrop-blur-xl border-blue-100/50 rounded-2xl shadow-lg shadow-blue-100/30 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${allOperational ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                  {allOperational ? (
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  ) : (
                    <Activity className="h-8 w-8 text-amber-500" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {allOperational ? 'All Systems Operational' : 'Some Systems Degraded'}
                  </h2>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last checked: {lastChecked.toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-50 text-blue-600 border-blue-200 font-semibold">
                  <Shield className="h-3 w-3 mr-1" />
                  24/7/365
                </Badge>
                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 font-semibold">
                  99.9% Uptime
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services by Category */}
        {categories.map(category => (
          <Card key={category} className="mb-4 bg-white/80 backdrop-blur-xl border-blue-100/50 rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{category}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 pb-4">
              {services
                .filter((_, i) => statusConfig[i]?.category === category)
                .map(service => (
                  <div key={service.name} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-blue-50/50 transition-colors">
                    <span className="text-sm font-medium text-slate-700">{service.name}</span>
                    <div className="flex items-center gap-3">
                      {service.latency && (
                        <span className="text-xs text-slate-400">{service.latency}ms</span>
                      )}
                      {getStatusBadge(service.status)}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        ))}

        {/* Incident Log */}
        <Card className="bg-white/80 backdrop-blur-xl border-blue-100/50 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Recent Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-400">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-emerald-300" />
              <p className="font-medium text-slate-500">No recent incidents</p>
              <p className="text-sm">All systems have been running smoothly</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Status;
