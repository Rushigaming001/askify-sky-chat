import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Wind, AlertTriangle, CheckCircle, MapPin, Loader2, Activity } from 'lucide-react';
import { useToast } from './ui/use-toast';
import aqiBackground from '@/assets/aqi-background.png';

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
    <div className="relative w-full max-w-2xl mx-auto animate-fade-in">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 rounded-3xl overflow-hidden"
        style={{
          backgroundImage: `url(${aqiBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-sm" />
      </div>

      {/* Content */}
      <Card className="relative bg-transparent border-white/20 backdrop-blur-md shadow-2xl p-8 animate-scale-in">
        <div className="flex flex-col items-center mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg hover:scale-110 transition-transform duration-300">
              <Wind className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-white bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
              AQI Checker
            </h2>
          </div>
          <p className="text-white/70 text-center text-sm">Real-time Air Quality Monitoring</p>
        </div>

        <div className="flex justify-center gap-3 mb-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <Button
            variant={isPro ? 'default' : 'outline'}
            size="lg"
            onClick={() => {
              setIsPro(true);
              setCheckCount(0);
              setAqi(null);
              setLocation('');
            }}
            className={isPro 
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-lg hover:shadow-purple-500/50 transition-all hover:scale-105 duration-300' 
              : 'border-white/30 text-white hover:bg-white/10 transition-all duration-300'
            }
          >
            <Activity className="h-4 w-4 mr-2" />
            Pro Mode
          </Button>
          <Button
            variant={!isPro ? 'default' : 'outline'}
            size="lg"
            onClick={() => {
              setIsPro(false);
              setCheckCount(0);
              setAqi(null);
              setLocation('');
            }}
            className={!isPro 
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 shadow-lg hover:shadow-green-500/50 transition-all hover:scale-105 duration-300' 
              : 'border-white/30 text-white hover:bg-white/10 transition-all duration-300'
            }
          >
            <MapPin className="h-4 w-4 mr-2" />
            Premium Mode
          </Button>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            {!isPro && location && (
              <div className="flex items-center justify-center gap-2 text-white/90 mb-2 animate-fade-in">
                <MapPin className="h-4 w-4 animate-pulse" />
                <span className="font-medium">{location}</span>
              </div>
            )}
          </div>

          {aqi !== null && (
            <div className="text-center space-y-6 animate-scale-in">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-3xl rounded-full animate-pulse" />
                <div className="relative text-8xl font-bold text-white drop-shadow-2xl hover:scale-110 transition-transform duration-500">{aqi}</div>
              </div>
              <div className={`inline-block px-6 py-3 rounded-2xl text-white text-lg font-semibold shadow-lg ${getAQICategory(aqi).color} hover:scale-105 transition-transform duration-300`}>
                {category}
              </div>
              
              {isPro ? (
                <div className="flex items-start gap-3 text-sm text-white/80 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 animate-fade-in hover:bg-white/15 transition-all duration-300">
                  {(checkCount % 3) === 1 ? (
                    <>
                      <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5 animate-pulse" />
                      <div>High pollution detected</div>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>Air quality improved</div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-start gap-3 text-sm text-white/80 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 animate-fade-in hover:bg-white/15 transition-all duration-300">
                  <MapPin className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>Real-time air quality data from global monitoring stations based on your GPS location</div>
                </div>
              )}
            </div>
          )}

          <Button 
            onClick={handleCheck} 
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] animate-fade-in"
            size="lg"
            disabled={isLoading}
            style={{ animationDelay: '300ms' }}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Getting Location...
              </>
            ) : (
              <>
                <Wind className="h-5 w-5 mr-2" />
                Check Air Quality
              </>
            )}
          </Button>

          {!isPro && (
            <div className="text-xs text-white/60 text-center mt-4 animate-fade-in" style={{ animationDelay: '400ms' }}>
              <p>Powered by global air quality monitoring network</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};