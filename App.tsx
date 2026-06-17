
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import SuperSidebar from './components/SuperSidebar';
import MobileNav from './components/MobileNav';
import Home from './pages/Home';
import Search from './pages/Search';
import Watch from './pages/Watch';
import Shorts from './pages/Shorts';
import Channel from './pages/Channel';
import Upload from './pages/Upload';
import Studio from './pages/Studio';
import Settings from './pages/Settings';
import AuthPage from './pages/AuthPage';
import Marketplace from './pages/Marketplace';
import MarketplaceItemPage from './pages/MarketplaceItemPage';
import AIChat from './pages/AIChat';
import Library from './pages/Library';
import Premium from './pages/Premium';
import Trending from './pages/Trending';
import Subscriptions from './pages/Subscriptions';
import { useAuth } from './hooks/useAuth';
import CallOverlay from './components/CallOverlay';
import { X, Maximize2 } from 'lucide-react';

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, initialized, loading } = useAuth();
  if (!initialized || loading) return <div className="fixed inset-0 bg-[#020617] flex items-center justify-center"></div>;
  if (!user) return <AuthPage />;
  return <>{children}</>;
};

const MainAppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1440);
  const location = useLocation();
  const { checkSession } = useAuth();

  useEffect(() => {
    checkSession();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const isImmersive = location.pathname.startsWith('/shorts') || location.pathname === '/reels';
  const isAuthPage = location.pathname === '/login';
  const isWatchPage = location.pathname.startsWith('/watch/');

  return (
    <div className="flex h-screen w-screen bg-[#020617] text-white font-sans overflow-hidden">
        {!isImmersive && !isAuthPage && (
          <div className="hidden md:block">
            <SuperSidebar isExpanded={true} onToggle={() => {}} />
          </div>
        )}
        
        <div className="flex flex-col flex-1 overflow-hidden relative">
          {!isImmersive && !isAuthPage && (
            <Header 
              toggleSidebar={toggleSidebar} 
              isSidebarExpanded={isSidebarOpen} 
            />
          )}
          
          <div className="flex flex-1 overflow-hidden relative">
            {!isImmersive && !isAuthPage && !isWatchPage && (
              <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
            )}
            
            <main className="flex-1 overflow-y-auto w-full scrollbar-hide bg-[#020617] relative">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/feed/trending" element={<Trending />} />
                <Route path="/feed/subscriptions" element={<Subscriptions />} />
                <Route path="/feed/:category" element={<Home />} />
                <Route path="/results" element={<Search />} />
                <Route path="/watch/:id" element={<Watch />} />
                <Route path="/shorts" element={<Shorts />} />
                <Route path="/shorts/:id" element={<Shorts />} />
                <Route path="/reels" element={<Shorts />} />
                <Route path="/premium" element={<Premium />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/marketplace/item/:id" element={<MarketplaceItemPage />} />
                <Route path="/ai-chat" element={<RequireAuth><AIChat /></RequireAuth>} />
                <Route path="/upload" element={<RequireAuth><Upload /></RequireAuth>} />
                <Route path="/studio" element={<RequireAuth><Studio /></RequireAuth>} />
                <Route path="/channel" element={<RequireAuth><Channel /></RequireAuth>} />
                <Route path="/channel/:handle" element={<Channel />} />
                <Route path="/library" element={<RequireAuth><Library /></RequireAuth>} />
                <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
                <Route path="/settings/:section" element={<RequireAuth><Settings /></RequireAuth>} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
          {!isAuthPage && <MobileNav />}
        </div>
        <CallOverlay />
    </div>
  );
};

const App: React.FC = () => (
    <Router>
        <MainAppLayout />
    </Router>
);

export default App;
