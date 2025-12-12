import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ChatProvider } from "./contexts/ChatContext";
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";
import AIFeatures from "./pages/AIFeatures";
import Settings from "./pages/Settings";
import PublicChat from "./pages/PublicChat";
import AdminPanel from "./pages/AdminPanel";
import Game from "./pages/Game";
import Skribbl from "./pages/Skribbl";
import AQI from "./pages/AQI";
import DataAnalyzerPage from "./pages/DataAnalyzer";
import YouTube from "./pages/YouTube";
import LanguageLearning from "./pages/LanguageLearning";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const isAQISubdomain = window.location.hostname.startsWith('aqi.');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          {isAQISubdomain ? (
            // AQI subdomain doesn't require authentication
            <>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="*" element={<AQI />} />
              </Routes>
            </>
          ) : (
            // Main app with authentication
            <AuthProvider>
              <ChatProvider>
                <Toaster />
                <Sonner />
                <Routes>
                  <Route path="/" element={<Chat />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/ai-features" element={<AIFeatures />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/public-chat" element={<PublicChat />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="/game" element={<Game />} />
                  <Route path="/skribbl" element={<Skribbl />} />
                  <Route path="/aqi" element={<AQI />} />
                  <Route path="/data-analyzer" element={<DataAnalyzerPage />} />
                  <Route path="/youtube" element={<YouTube />} />
                  <Route path="/learn" element={<LanguageLearning />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ChatProvider>
            </AuthProvider>
          )}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
