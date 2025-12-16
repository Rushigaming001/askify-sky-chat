import { useState, useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Wind, MapPin, Loader2, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AQICheckerProps {
  region?: 'india' | 'worldwide';
}

export const AQIChecker = ({ region = 'india' }: AQICheckerProps) => {
  const { toast } = useToast();
  const [isPro, setIsPro] = useState(true);
  const [checkCount, setCheckCount] = useState(0);
  const [aqi, setAqi] = useState<number | null>(null);
  const [displayAqi, setDisplayAqi] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [category, setCategory] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const animationRef = useRef<number | null>(null);

  const getAQICategory = (value: number) => {
    if (value <= 50) return { label: 'Good', color: 'bg-green-500' };
    if (value <= 100) return { label: 'Moderate', color: 'bg-yellow-500' };
    if (value <= 150) return { label: 'Unhealthy for Sensitive', color: 'bg-orange-500' };
    if (value <= 200) return { label: 'Unhealthy', color: 'bg-red-500' };
    if (value <= 300) return { label: 'Very Unhealthy', color: 'bg-purple-500' };
    return { label: 'Hazardous', color: 'bg-red-900' };
  };

  // Animate AQI value from 0 to target
  const animateAQI = (targetValue: number) => {
    setIsAnimating(true);
    setDisplayAqi(0);
    
    const duration = 2000; // 2 seconds
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.round(easeOutQuart * targetValue);
      
      setDisplayAqi(currentValue);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayAqi(targetValue);
        setIsAnimating(false);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const checkProAQI = () => {
    let value: number;
    const currentCheck = checkCount + 1;
    
    if (currentCheck === 1) {
      // 1st time: 95-101
      value = Math.floor(Math.random() * (101 - 95 + 1)) + 95;
    } else if (currentCheck >= 2 && currentCheck <= 4) {
      // 2nd, 3rd, 4th time: 84-89
      value = Math.floor(Math.random() * (89 - 84 + 1)) + 84;
    } else if (currentCheck === 5) {
      // 5th time: 78
      value = 78;
    } else {
      // After 5th, cycle back: reset count and start from 1st pattern
      setCheckCount(0);
      value = Math.floor(Math.random() * (101 - 95 + 1)) + 95;
    }

    setAqi(value);
    animateAQI(value);
    const aqiInfo = getAQICategory(value);
    setCategory(aqiInfo.label);
    setCheckCount(prev => prev + 1);

    toast({
      title: `Pro AQI Check #${currentCheck > 5 ? 1 : currentCheck}`,
      description: `Air Quality Index: ${value} (${aqiInfo.label})`,
    });
  };

  const getExactLocation = async (latitude: number, longitude: number): Promise<string> => {
    try {
      // Use Nominatim reverse geocoding for exact location
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'AQI-Checker-App'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const address = data.address;
        
        // Build location string from most specific to least specific
        const parts = [];
        if (address.suburb || address.neighbourhood) {
          parts.push(address.suburb || address.neighbourhood);
        }
        if (address.city || address.town || address.village || address.municipality) {
          parts.push(address.city || address.town || address.village || address.municipality);
        }
        if (address.state) {
          parts.push(address.state);
        }
        if (address.country && region === 'worldwide') {
          parts.push(address.country);
        }
        
        if (parts.length > 0) {
          return parts.slice(0, 3).join(', ');
        }
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
    
    return 'Your Location';
  };

  const checkPremiumAQI = async () => {
    setIsLoading(true);
    
    try {
      // Get user's location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;

      // Get exact location name via reverse geocoding
      const exactLocation = await getExactLocation(latitude, longitude);

      // Fetch real AQI data from AQICN API
      const response = await fetch(
        `https://api.waqi.info/feed/geo:${latitude};${longitude}/?token=demo`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch AQI data');
      }

      const data = await response.json();
      
      if (data.status === 'ok' && data.data?.aqi) {
        const realAQI = data.data.aqi;
        
        setAqi(realAQI);
        animateAQI(realAQI);
        setLocation(exactLocation);
        const aqiInfo = getAQICategory(realAQI);
        setCategory(aqiInfo.label);

        toast({
          title: 'Real AQI Retrieved',
          description: `${exactLocation}: ${realAQI} AQI (${aqiInfo.label})`,
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

      {/* Content */}
      <Card className="relative bg-black/40 border-white/20 backdrop-blur-md shadow-2xl p-8 animate-scale-in">
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
            variant="default"
            size="lg"
            onClick={() => {
              setIsPro(true);
              setCheckCount(0);
              setAqi(null);
              setDisplayAqi(0);
              setLocation('');
            }}
            className={isPro 
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-lg hover:shadow-purple-500/50 transition-all hover:scale-105 duration-300' 
              : 'bg-white/10 border border-white/30 text-white/70 hover:text-white hover:bg-white/20 transition-all duration-300'
            }
          >
            <Activity className="h-4 w-4 mr-2" />
            Pro Mode
          </Button>
          <Button
            variant="default"
            size="lg"
            onClick={() => {
              setIsPro(false);
              setCheckCount(0);
              setAqi(null);
              setDisplayAqi(0);
              setLocation('');
            }}
            className={!isPro 
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 shadow-lg hover:shadow-green-500/50 transition-all hover:scale-105 duration-300' 
              : 'bg-white/10 border border-white/30 text-white/70 hover:text-white hover:bg-white/20 transition-all duration-300'
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
                <div className={`absolute inset-0 blur-3xl rounded-full transition-all duration-500 ${isAnimating ? 'animate-pulse' : ''} ${
                  displayAqi <= 50 ? 'bg-green-500/30' :
                  displayAqi <= 100 ? 'bg-yellow-500/30' :
                  displayAqi <= 150 ? 'bg-orange-500/30' :
                  displayAqi <= 200 ? 'bg-red-500/30' :
                  displayAqi <= 300 ? 'bg-purple-500/30' : 'bg-red-900/30'
                }`} />
                <div className={`relative text-8xl font-bold text-white drop-shadow-2xl transition-all duration-300 ${isAnimating ? 'scale-105' : 'hover:scale-110'}`}>
                  {displayAqi}
                </div>
              </div>
              <div className={`inline-block px-6 py-3 rounded-2xl text-white text-lg font-semibold shadow-lg transition-all duration-500 ${getAQICategory(displayAqi).color} hover:scale-105`}>
                {category}
              </div>
              
              {!isPro && (
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
