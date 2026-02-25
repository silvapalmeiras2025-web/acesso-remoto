import React, { useState, useEffect, useRef } from 'react';
import { Monitor, X, MessageSquare, Files, Maximize2, Activity, Shield, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WebRTCService } from '../services/webRTCService';
import { ChatMessage } from '../types';

interface RemoteSessionProps {
  deviceId: string;
  isHost: boolean;
  onClose: () => void;
  webRTC: WebRTCService;
}

export default function RemoteSession({ deviceId, isHost, onClose, webRTC }: RemoteSessionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [latency, setLatency] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');

  useEffect(() => {
    webRTC.onTrack((stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });

    webRTC.onData((data) => {
      if (data.type === 'chat') {
        setMessages((prev) => [...prev, data.message]);
      } else if (data.type === 'mouse' && isHost) {
        // In a real app, we'd use a native module to move the mouse
        console.log('Remote mouse move:', data.pos);
      }
    });

    webRTC.onStateChange((state) => {
      setConnectionState(state);
    });

    const interval = setInterval(() => {
      setLatency(Math.floor(Math.random() * 20) + 10); // Mock latency
    }, 2000);

    return () => {
      clearInterval(interval);
      webRTC.close();
    };
  }, [webRTC, isHost]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const msg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      sender: 'Me',
      text: inputText,
      timestamp: Date.now(),
    };
    webRTC.sendData({ type: 'chat', message: msg });
    setMessages((prev) => [...prev, msg]);
    setInputText('');
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isHost) return;
    const rect = videoRef.current?.getBoundingClientRect();
    if (rect) {
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      webRTC.sendData({ type: 'mouse', pos: { x, y } });
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {/* Header */}
      <div className="h-14 bg-zinc-900 border-b border-white/5 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white font-medium">
            <Monitor size={18} className="text-emerald-500" />
            <span>{deviceId}</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-1 bg-white/5 rounded-full text-xs text-zinc-400">
            <div className="flex items-center gap-1">
              <Activity size={12} />
              <span>{latency}ms</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-1">
              <Shield size={12} className="text-emerald-500" />
              <span>AES-256</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowChat(!showChat)}
            className={`p-2 rounded-lg transition-colors ${showChat ? 'bg-emerald-500 text-white' : 'text-zinc-400 hover:bg-white/5'}`}
          >
            <MessageSquare size={20} />
          </button>
          <button 
            onClick={() => setShowFiles(!showFiles)}
            className={`p-2 rounded-lg transition-colors ${showFiles ? 'bg-emerald-500 text-white' : 'text-zinc-400 hover:bg-white/5'}`}
          >
            <Files size={20} />
          </button>
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-zinc-400 hover:bg-white/5 rounded-lg transition-colors"
          >
            <Maximize2 size={20} />
          </button>
          <div className="w-px h-6 bg-white/10 mx-2" />
          <button 
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all font-medium text-sm"
          >
            <X size={18} />
            Encerrar
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative flex overflow-hidden">
        <div className="flex-1 bg-zinc-950 flex items-center justify-center relative">
          {connectionState !== 'connected' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 z-10">
              <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
              <p className="text-zinc-400 font-medium">
                {connectionState === 'connecting' ? 'Estabelecendo conexão...' : 'Aguardando stream...'}
              </p>
            </div>
          )}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            onMouseMove={handleMouseMove}
            className="max-w-full max-h-full object-contain cursor-none"
          />
        </div>

        {/* Side Panels */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              className="w-80 bg-zinc-900 border-l border-white/5 flex flex-col"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <MessageSquare size={16} />
                  Chat da Sessão
                </h3>
                <button onClick={() => setShowChat(false)} className="text-zinc-500 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.sender === 'Me' ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider font-bold">
                      {msg.sender} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className={`px-3 py-2 rounded-2xl text-sm max-w-[90%] ${
                      msg.sender === 'Me' ? 'bg-emerald-500 text-white rounded-tr-none' : 'bg-white/5 text-zinc-200 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-white/5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Digite uma mensagem..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    <Terminal size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
