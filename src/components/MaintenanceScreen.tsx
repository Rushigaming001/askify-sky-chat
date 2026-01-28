import { Construction, Wrench } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface MaintenanceScreenProps {
  message?: string;
  featureName?: string;
}

export function MaintenanceScreen({ message, featureName }: MaintenanceScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <Card className="max-w-md w-full bg-white/10 border-white/20 backdrop-blur-xl">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400 to-orange-500 blur-2xl opacity-30 rounded-full animate-pulse" />
              <div className="relative p-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500">
                <Construction className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-3">
            {featureName ? `${featureName} Under Maintenance` : 'Under Maintenance'}
          </h1>
          
          <p className="text-white/70 mb-6">
            {message || 'We are currently performing scheduled maintenance. Please check back soon.'}
          </p>
          
          <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
            <Wrench className="h-4 w-4 animate-spin" />
            <span>Working on improvements...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
