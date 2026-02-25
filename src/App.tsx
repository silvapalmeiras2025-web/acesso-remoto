import React, { useState, useEffect, useCallback } from 'react';
import { signalingService } from './services/signalingService';
import { WebRTCService } from './services/webRTCService';
import ConnectionPanel from './components/ConnectionPanel';
import RemoteSession from './components/RemoteSession';
import { Monitor, Shield, Activity, Globe, Wifi, Zap, Settings, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [myId] = useState(() => Math.floor(100000000 + Math.random() * 900000000).toString());
  const [session, setSession] = useState<{ deviceId: string; isHost: boolean; webRTC: WebRTCService } | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const socket = signalingService.connect();
    socket.emit('join', myId);

    socket.on('offer', async ({ from, offer }) => {
      const webRTC = new WebRTCService(from, false);
      await webRTC.handleOffer(offer);
      setSession({ deviceId: from, isHost: true, webRTC });
      
      // Auto-start screen share if host
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        webRTC.addStream(stream);
      } catch (err) {
        console.error("Failed to share screen:", err);
      }
    });

    socket.on('answer', async ({ from, answer }) => {
      if (session?.deviceId === from) {
        await session.webRTC.handleAnswer(answer);
      }
    });

    socket.on('ice-candidate', async ({ from, candidate }) => {
      if (session?.deviceId === from) {
        await session.webRTC.addIceCandidate(candidate);
      }
    });

    return () => {
      signalingService.disconnect();
    };
  }, [myId, session]);

  const handleConnect = useCallback(async (targetId: string) => {
    const webRTC = new WebRTCService(targetId, true);
    await webRTC.createOffer();
    setSession({ deviceId: targetId, isHost: false, webRTC });
    
    // Register device in history
    fetch('/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: targetId, nome: `Device ${targetId.substr(0, 4)}` })
    });
  }, []);

  const handleStartHosting = useCallback(async () => {
    // In this simplified version, hosting just waits for an incoming connection
    // But we could also pre-register or show a "waiting" state
    alert("Aguardando conexão de outro dispositivo...");
  }, []);

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300 font-sans selection:bg-emerald-500/30">
        
        {/* Navigation */}
        <nav className="h-20 border-b border-zinc-200 dark:border-zinc-900 px-6 flex items-center justify-between bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Zap size={24} fill="currentColor" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic">RemoteConnect</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-zinc-500 uppercase tracking-widest">
            <a href="#" className="text-emerald-500">Conectar</a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Dispositivos</a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Segurança</a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Suporte</a>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 bg-zinc-100 dark:bg-zinc-900 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all"
            >
              {isDarkMode ? <Settings size={20} /> : <Settings size={20} />}
            </button>
            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-1" />
            <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm transition-all hover:opacity-90">
              <User size={18} />
              Minha Conta
            </button>
          </div>
        </nav>

        <main className="py-12">
          <AnimatePresence mode="wait">
            {!session ? (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-center mb-16 space-y-4 px-4">
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl md:text-7xl font-black tracking-tighter text-zinc-900 dark:text-white max-w-4xl mx-auto leading-[0.9]"
                  >
                    CONECTE-SE A QUALQUER <span className="text-emerald-500 italic">LUGAR</span> DO MUNDO.
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto text-lg font-medium"
                  >
                    Acesso remoto de alto desempenho com latência zero, criptografia de grau militar e interface intuitiva.
                  </motion.p>
                </div>

                <ConnectionPanel 
                  myId={myId} 
                  onConnect={handleConnect} 
                  onStartHosting={handleStartHosting} 
                />

                {/* Features Grid */}
                <div className="max-w-5xl mx-auto mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 px-6">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                      <Wifi size={24} />
                    </div>
                    <h4 className="text-lg font-bold">Baixa Latência</h4>
                    <p className="text-sm text-zinc-500 leading-relaxed">Streaming otimizado via WebRTC para uma experiência fluida mesmo em conexões instáveis.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                      <Shield size={24} />
                    </div>
                    <h4 className="text-lg font-bold">Segurança Total</h4>
                    <p className="text-sm text-zinc-500 leading-relaxed">Criptografia AES-256 ponta a ponta. Seus dados nunca passam por nossos servidores em texto claro.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500">
                      <Globe size={24} />
                    </div>
                    <h4 className="text-lg font-bold">Multi-Plataforma</h4>
                    <p className="text-sm text-zinc-500 leading-relaxed">Acesse seu desktop de qualquer navegador, tablet ou smartphone com total compatibilidade.</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="session"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="fixed inset-0 z-50"
              >
                <RemoteSession 
                  deviceId={session.deviceId} 
                  isHost={session.isHost} 
                  onClose={() => setSession(null)} 
                  webRTC={session.webRTC}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer Stats */}
        {!session && (
          <footer className="border-t border-zinc-200 dark:border-zinc-900 py-8 mt-12">
            <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Servidor Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-zinc-400" />
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">1.2ms Latência Base</span>
                </div>
              </div>
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                © 2026 RemoteConnect • Versão 2.4.0-PRO
              </div>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
