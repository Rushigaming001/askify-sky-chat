import { AQIChecker } from '@/components/AQIChecker';

const AQI = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
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