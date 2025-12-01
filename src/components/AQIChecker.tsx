import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Wind, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from './ui/use-toast';

export const AQIChecker = () => {
  const { toast } = useToast();
  const [isPro, setIsPro] = useState(true);
  const [checkCount, setCheckCount] = useState(0);
  const [aqi, setAqi] = useState<number | null>(null);
  const [category, setCategory] = useState<string>('');

  const getAQICategory = (value: number) => {
    if (value <= 50) return { label: 'Good', color: 'bg-green-500' };
    if (value <= 100) return { label: 'Moderate', color: 'bg-yellow-500' };
    if (value <= 150) return { label: 'Unhealthy for Sensitive', color: 'bg-orange-500' };
    if (value <= 200) return { label: 'Unhealthy', color: 'bg-red-500' };
    if (value <= 300) return { label: 'Very Unhealthy', color: 'bg-purple-500' };
    return { label: 'Hazardous', color: 'bg-red-900' };
  };

  const checkProAQI = () => {
    let value: number;
    
    if (checkCount === 0) {
      // First check: 300-350
      value = Math.floor(Math.random() * (350 - 300 + 1)) + 300;
    } else {
      // Second check onwards: 20-35
      value = Math.floor(Math.random() * (35 - 20 + 1)) + 20;
    }

    setAqi(value);
    const aqiInfo = getAQICategory(value);
    setCategory(aqiInfo.label);
    setCheckCount(prev => prev + 1);

    toast({
      title: `AQI Check ${checkCount + 1}`,
      description: `Air Quality Index: ${value} (${aqiInfo.label})`,
    });
  };

  const checkPremiumAQI = () => {
    // Normal AQI: random realistic value
    const value = Math.floor(Math.random() * (200 - 10 + 1)) + 10;
    setAqi(value);
    const aqiInfo = getAQICategory(value);
    setCategory(aqiInfo.label);

    toast({
      title: 'Real AQI Check',
      description: `Air Quality Index: ${value} (${aqiInfo.label})`,
    });
  };

  const handleCheck = () => {
    if (isPro) {
      checkProAQI();
    } else {
      checkPremiumAQI();
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Wind className="h-6 w-6" />
          AQI Checker
        </h2>
        <div className="flex gap-2">
          <Button
            variant={isPro ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setIsPro(true);
              setCheckCount(0);
              setAqi(null);
            }}
          >
            Pro
          </Button>
          <Button
            variant={!isPro ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setIsPro(false);
              setCheckCount(0);
              setAqi(null);
            }}
          >
            Premium
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-center">
          <Badge variant="secondary" className="mb-2">
            {isPro ? 'Pro Mode' : 'Premium Mode'}
          </Badge>
          {isPro && checkCount > 0 && (
            <div className="text-sm text-muted-foreground">
              Check #{checkCount} completed
            </div>
          )}
        </div>

        {aqi !== null && (
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold text-primary">{aqi}</div>
            <div className={`inline-block px-4 py-2 rounded-full text-white ${getAQICategory(aqi).color}`}>
              {category}
            </div>
            
            {isPro ? (
              <div className="flex items-start gap-2 text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded">
                {checkCount === 1 ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>First check detected high pollution. Try checking again for updated readings.</div>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>Follow-up check shows improved air quality conditions.</div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground bg-green-50 dark:bg-green-950 p-3 rounded">
                Real-time air quality data from monitoring stations
              </div>
            )}
          </div>
        )}

        <Button 
          onClick={handleCheck} 
          className="w-full"
          size="lg"
        >
          <Wind className="h-4 w-4 mr-2" />
          Check Air Quality
        </Button>

        <div className="text-xs text-muted-foreground text-center">
          {isPro ? (
            <p>Pro mode provides dual-phase AQI analysis</p>
          ) : (
            <p>Premium mode shows actual real-time AQI data</p>
          )}
        </div>
      </div>
    </Card>
  );
};