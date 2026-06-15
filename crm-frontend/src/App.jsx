import React, { useEffect } from 'react';
import { useCRMStore } from './store/crmStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, Sparkles, Layers, Send, Users, 
  RotateCcw, Database, AlertCircle 
} from 'lucide-react';
import Dashboard from './components/AnalyticsDashboard';
import AICommandCenter from './components/AICommandCenter';
import SegmentBuilder from './components/SegmentBuilder';
import ControlTower from './components/ControlTower';
import ShopperDatabase from './components/ShopperDatabase';

export default function App() {
  const { 
    activeTab, 
    setActiveTab, 
    loadData, 
    resetDatabase, 
    connectionError, 
    loading 
  } = useCRMStore();

  // Load initial data and poll updates silently every 4 seconds
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(true); // silent polling
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleReset = async () => {
    if (confirm("Reset shopper database and clear campaign histories?")) {
      await resetDatabase();
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={16} /> },
    { 
      id: 'ai-strategist', 
      label: 'AI Command Center', 
      icon: <Sparkles size={16} />,
      badge: 'GEMINI'
    },
    { id: 'segment-builder', label: 'Segment Builder', icon: <Layers size={16} /> },
    { id: 'campaigns', label: 'Control Tower', icon: <Send size={16} /> },
    { id: 'database', label: 'Shopper DB', icon: <Users size={16} /> }
  ];

  return (
    <div className="relative min-h-screen flex text-slate-100 overflow-hidden font-sans">
      {/* Background decoration */}
      <div className="grid-bg" />
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />

      {/* Glass Sidebar */}
      <aside className="w-[240px] border-r border-white/5 bg-[#05060b]/40 backdrop-blur-xl z-20 flex flex-col justify-between p-5 h-screen sticky top-0 shrink-0">
        <div className="space-y-6">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 flex items-center justify-center font-display font-extrabold text-sm text-white shadow-lg shadow-violet-500/10">
              X
            </div>
            <div>
              <h1 className="font-display font-bold text-white text-sm tracking-wide leading-none">XENO CRM</h1>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold mt-1 block">D2C Marketing OS</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1">
            {menuItems.map(item => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition text-xs font-semibold cursor-pointer relative ${
                    active 
                      ? 'bg-violet-600/10 border border-violet-500/20 text-white' 
                      : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/2'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[8px] bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 px-1.5 py-0.5 rounded font-extrabold tracking-wider">
                      {item.badge}
                    </span>
                  )}
                  {active && (
                    <motion.div 
                      layoutId="active-indicator"
                      className="absolute left-0 w-[3px] h-[18px] bg-violet-500 rounded-r"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer info */}
        <div className="space-y-4 border-t border-white/5 pt-4">
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <Database size={11} />
              <span>DB Status</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${connectionError ? 'bg-rose-500' : 'bg-emerald-400 pulse-glow'}`} />
              <span className={connectionError ? 'text-rose-400' : 'text-emerald-400'}>
                {connectionError ? 'Offline' : 'Connected'}
              </span>
            </div>
          </div>

          <button 
            onClick={handleReset}
            className="w-full py-2.5 bg-white/3 hover:bg-white/5 border border-white/5 hover:border-white/10 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw size={12} />
            Reset Sandbox DB
          </button>
        </div>
      </aside>

      {/* Main viewport area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="h-[64px] border-b border-white/5 bg-[#05060b]/20 backdrop-blur-xl z-20 flex items-center justify-between px-6 sticky top-0">
          <div>
            <h2 className="font-display font-semibold text-white text-sm capitalize">
              {activeTab.replace('-', ' ')}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-[10px] bg-white/2 border border-white/5 text-slate-400 px-3 py-1 rounded-full font-semibold">
              v1.0.0 Stable
            </span>
          </div>
        </header>

        {/* Viewport Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {connectionError && (
            <div className="mb-6 bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 text-rose-400 text-xs">
              <AlertCircle size={18} />
              <div>
                <p className="font-bold">Backend Connection Failure</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{connectionError}</p>
              </div>
            </div>
          )}

          {loading.data ? (
            <div className="h-[calc(100vh-200px)] flex flex-col justify-center items-center text-slate-500 text-xs gap-3">
              <div className="w-8 h-8 spinner-loader" />
              <span>Loading workspace environment...</span>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'ai-strategist' && <AICommandCenter />}
                {activeTab === 'segment-builder' && <SegmentBuilder />}
                {activeTab === 'campaigns' && <ControlTower />}
                {activeTab === 'database' && <ShopperDatabase />}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

    </div>
  );
}
