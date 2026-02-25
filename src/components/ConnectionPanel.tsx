import React, { useState, useEffect } from 'react';
import { Shield, Monitor, ArrowRight, History, Settings, Laptop, Smartphone, Globe, Lock, Cpu } from 'lucide-react';
import { motion } from 'motion/react';
import { Device } from '../types';

interface ConnectionPanelProps {
  myId: string;
  onConnect: (targetId: string, password?: string) => void;
  onStartHosting: () => void;
}

export default function ConnectionPanel({ myId, onConnect, onStartHosting }: ConnectionPanelProps) {
  const [targetId, setTargetId] = useState('');
  const [password, setPassword] = useState('');
  const [myPassword, setMyPassword] = useState('123456');
  const [recentDevices, setRecentDevices] = useState<Device[]>([]);

  useEffect(() => {
    fetch('/api/devices')
      .then(res => res.json())
      .then(data => setRecentDevices(data));
      
    // Register self with default password
    fetch('/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: myId, nome: 'Este Computador', senha: myPassword })
    });
  }, [myId, myPassword]);

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 p-6">
      {/* Left Column: My Access */}
      <div className="lg:col-span-5 space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Este Dispositivo</h2>
              <p className="text-sm text-zinc-500">Pronto para conexões</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Seu Endereço</label>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-mono font-bold text-zinc-900 dark:text-white tracking-tighter">{myId}</span>
                <button 
                  onClick={() => navigator.clipboard.writeText(myId)}
                  className="text-emerald-500 text-xs font-bold hover:underline"
                >
                  COPIAR
                </button>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Senha de Acesso</label>
              <div className="flex items-center justify-between">
                <input 
                  type="text"
                  value={myPassword}
                  onChange={(e) => setMyPassword(e.target.value)}
                  className="bg-transparent text-xl font-mono font-medium text-zinc-600 dark:text-zinc-400 focus:outline-none w-32"
                />
                <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                  <Settings size={18} />
                </button>
              </div>
            </div>

            <button 
              onClick={onStartHosting}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <Monitor size={20} />
              Aguardar Conexão
            </button>

            <button 
              onClick={() => (window as any).openNativeAgentModal()}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 uppercase tracking-widest border border-white/5"
            >
              <Cpu size={16} />
              Configurar Agente Nativo
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
              <Cpu size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">CPU</p>
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">12% Uso</p>
            </div>
          </div>
          <div className="p-4 bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-500">
              <Globe size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Rede</p>
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Estável</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Connect to Others */}
      <div className="lg:col-span-7 space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none"
        >
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Conectar ao Dispositivo</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 ml-1">ID do Parceiro</label>
              <input 
                type="text"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="000 000 000"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 ml-1">Senha</label>
              <div className="relative">
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                <Lock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              </div>
            </div>
          </div>

          <button 
            onClick={() => onConnect(targetId, password)}
            disabled={!targetId}
            className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            Conectar Agora
            <ArrowRight size={20} />
          </button>
        </motion.div>

        {/* Recent Devices */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-bold text-zinc-500 flex items-center gap-2 uppercase tracking-widest">
              <History size={16} />
              Conexões Recentes
            </h3>
            <button className="text-xs font-bold text-emerald-500 hover:underline">Limpar Tudo</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentDevices.length > 0 ? recentDevices.map((device) => (
              <button 
                key={device.id}
                onClick={() => setTargetId(device.id)}
                className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center gap-4 hover:border-emerald-500/50 transition-all text-left group"
              >
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-emerald-500 transition-colors">
                  {device.id.includes('M') ? <Laptop size={24} /> : device.id.includes('P') ? <Smartphone size={24} /> : <Monitor size={24} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-zinc-900 dark:text-white truncate">{device.nome}</p>
                  <p className="text-xs font-mono text-zinc-500">{device.id}</p>
                </div>
                <div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
              </button>
            )) : (
              <div className="col-span-2 p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-zinc-400">
                <History size={32} className="mb-2 opacity-20" />
                <p className="text-sm font-medium">Nenhum histórico recente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
