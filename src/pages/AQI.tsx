import { AQIChecker } from '@/components/AQIChecker';

const AQI = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* India Flag Badge - Top Right */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-full border border-white/30 shadow-xl animate-fade-in hover:scale-105 transition-transform duration-300">
        <div className="relative w-10 h-7 rounded overflow-hidden shadow-md">
          <div className="absolute inset-0 flex flex-col">
            <div className="h-1/3 bg-gradient-to-r from-orange-500 to-orange-600" />
            <div className="h-1/3 bg-white relative flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-blue-900 rounded-full relative">
                {[...Array(24)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-px h-1.5 bg-blue-900 left-1/2 top-1/2"
                    style={{
                      transform: `translate(-50%, -50%) rotate(${i * 15}deg)`,
                      transformOrigin: 'center 6px',
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="h-1/3 bg-gradient-to-r from-green-600 to-green-700" />
          </div>
        </div>
        <span className="text-white font-semibold text-base tracking-wide">India</span>
      </div>

      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -top-48 -left-48 animate-pulse" />
        <div className="absolute w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse" style={{ animationDelay: '700ms' }} />
        <div className="absolute w-64 h-64 bg-purple-500/20 rounded-full blur-3xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: '300ms' }} />
        <div className="absolute w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl top-1/4 right-1/4 animate-pulse" style={{ animationDelay: '1000ms' }} />
        <div className="absolute w-72 h-72 bg-sky-500/15 rounded-full blur-3xl bottom-1/4 left-1/3 animate-pulse" style={{ animationDelay: '500ms' }} />
        
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/30 rounded-full animate-[pulse_3s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-cyan-400/30 rounded-full animate-[pulse_4s_ease-in-out_infinite]" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-purple-400/30 rounded-full animate-[pulse_3.5s_ease-in-out_infinite]" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-indigo-400/30 rounded-full animate-[pulse_4.5s_ease-in-out_infinite]" style={{ animationDelay: '1.5s' }} />
      </div>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-slate-900/30 pointer-events-none" />
      
      <div className="relative z-10 w-full animate-fade-in">
        <AQIChecker />
      </div>
    </div>
  );
};

export default AQI;