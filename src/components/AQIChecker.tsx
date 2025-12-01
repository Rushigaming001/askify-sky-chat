import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Wind, AlertTriangle, CheckCircle, MapPin, Loader2 } from 'lucide-react';
import { useToast } from './ui/use-toast';

export const AQIChecker = () => {
  const { toast } = useToast();
  const [isPro, setIsPro] = useState(true);
  const [checkCount, setCheckCount] = useState(0);
  const [aqi, setAqi] = useState<number | null>(null);
  const [category, setCategory] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

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
    const cyclePosition = checkCount % 3;
    
    if (cyclePosition === 0) {
      // First check in cycle: 300-350
      value = Math.floor(Math.random() * (350 - 300 + 1)) + 300;
    } else {
      // Second and third check in cycle: 20-25
      value = Math.floor(Math.random() * (25 - 20 + 1)) + 20;
    }

    setAqi(value);
    const aqiInfo = getAQICategory(value);
    setCategory(aqiInfo.label);
    setCheckCount(prev => prev + 1);

    toast({
      title: `Pro AQI Check #${checkCount + 1}`,
      description: `Air Quality Index: ${value} (${aqiInfo.label})`,
    });
  };

  const checkPremiumAQI = async () => {
    setIsLoading(true);
    
    try {
      // Get user's location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;

      // Fetch real AQI data from AQICN API (free, no key required for basic use)
      const response = await fetch(
        `https://api.waqi.info/feed/geo:${latitude};${longitude}/?token=demo`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch AQI data');
      }

      const data = await response.json();
      
      if (data.status === 'ok' && data.data?.aqi) {
        const realAQI = data.data.aqi;
        const cityName = data.data.city?.name || 'Your Location';
        
        setAqi(realAQI);
        setLocation(cityName);
        const aqiInfo = getAQICategory(realAQI);
        setCategory(aqiInfo.label);

        toast({
          title: 'Real AQI Retrieved',
          description: `${cityName}: ${realAQI} AQI (${aqiInfo.label})`,
        });
      } else {
        throw new Error('Invalid AQI data received');
      }
    } catch (error) {
      console.error('AQI fetch error:', error);
      
      if (error instanceof GeolocationPositionError) {
        toast({
          title: 'Location Access Denied',
          description: 'Please enable location access to get real AQI data.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch real AQI data. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
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
            {isPro ? 'Pro Mode (Simulated)' : 'Premium Mode (Real Data)'}
          </Badge>
          {isPro && checkCount > 0 && (
            <div className="text-sm text-muted-foreground">
              Check #{checkCount} - Cycle position: {(checkCount % 3) || 3}/3
            </div>
          )}
          {!isPro && location && (
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="h-3 w-3" />
              {location}
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
                {(checkCount % 3) === 1 ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>High pollution detected in simulation cycle.</div>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>Air quality improved in simulation cycle.</div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground bg-green-50 dark:bg-green-950 p-3 rounded flex items-start gap-2">
                <MapPin className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div>Real-time air quality data from monitoring stations based on your actual GPS location</div>
              </div>
            )}
          </div>
        )}

        <Button 
          onClick={handleCheck} 
          className="w-full"
          size="lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Getting Location...
            </>
          ) : (
            <>
              <Wind className="h-4 w-4 mr-2" />
              Check Air Quality
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground text-center space-y-1">
          {isPro ? (
            <>
              <p className="font-medium">Pro mode: Simulated AQI cycle</p>
              <p>Check 1: High (300-350) → Checks 2-3: Good (20-25) → Repeat</p>
            </>
          ) : (
            <>
              <p className="font-medium">Premium mode: 100% Real AQI Data</p>
              <p>Uses GPS location + global air quality monitoring network</p>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};