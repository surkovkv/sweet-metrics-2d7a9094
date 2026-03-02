import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Landing from "./pages/Landing";
import Analyzer from "./pages/Analyzer";
import TournamentStrategist from "./pages/TournamentStrategist";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Upgrade from "./pages/Upgrade";
import News from "./pages/News";
import NewsPost from "./pages/NewsPost";
import Contact from "./pages/Contact";
import MetaTracker from "./pages/MetaTracker";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/analyzer" element={<Analyzer />} />
            <Route path="/tournament" element={<TournamentStrategist />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/upgrade" element={<Upgrade />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:slug" element={<NewsPost />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/meta" element={<MetaTracker />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
