import { AQIChecker } from '@/components/AQIChecker';

const AQI = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center p-4">
      <AQIChecker />
    </div>
  );
};

export default AQI;