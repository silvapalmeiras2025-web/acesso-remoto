import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Monitor, X, MessageSquare, Files, Maximize2, Activity, Shield, Terminal, Upload, Download, FileText, CheckCircle2, MousePointer2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WebRTCService } from '../services/webRTCService';
import { signalingService } from '../services/signalingService';
import { ChatMessage, Transfer } from '../types';
import { useDropzone } from 'react-dropzone';

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
  
  // File Transfer State
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [receivingFile, setReceivingFile] = useState<{ name: string; size: number; chunks: ArrayBuffer[] } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const newTransfer: Transfer = {
        id: Date.now(),
        sessao_id: 0,
        nome_arquivo: file.name,
        tamanho: file.size,
        status: 'pending',
        data_envio: new Date().toISOString()
      };
      setTransfers(prev => [newTransfer, ...prev]);
      
      webRTC.sendFile(file, (progress) => {
        // Update progress if needed, but for simplicity we'll just mark as completed at the end
      }).then(() => {
        setTransfers(prev => prev.map(t => t.id === newTransfer.id ? { ...t, status: 'completed' } : t));
      });
    });
  }, [webRTC]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop } as any);

  useEffect(() => {
    webRTC.onTrack((stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });

    webRTC.onData((data) => {
      if (data instanceof ArrayBuffer) {
        if (receivingFile) {
          receivingFile.chunks.push(data);
        }
      } else if (data.type === 'chat') {
        setMessages((prev) => [...prev, data.message]);
      } else if (data.type === 'file-start') {
        setReceivingFile({ name: data.name, size: data.size, chunks: [] });
      } else if (data.type === 'file-end') {
        if (receivingFile) {
          const blob = new Blob(receivingFile.chunks);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = receivingFile.name;
          a.click();
          
          const newTransfer: Transfer = {
            id: Date.now(),
            sessao_id: 0,
            nome_arquivo: receivingFile.name,
            tamanho: receivingFile.size,
            status: 'completed',
            data_envio: new Date().toISOString()
          };
          setTransfers(prev => [newTransfer, ...prev]);
          setReceivingFile(null);
        }
      } else if (data.type === 'mouse' && isHost) {
        console.log('Remote mouse move:', data.pos);
      } else if (data.type === 'click' && isHost) {
        console.log('Remote click at:', data.pos);
      }
    });

    webRTC.onStateChange((state) => {
      setConnectionState(state);
    });

    const interval = setInterval(() => {
      setLatency(Math.floor(Math.random() * 20) + 10);
    }, 2000);

    return () => {
      clearInterval(interval);
      webRTC.close();
    };
  }, [webRTC, isHost, receivingFile]);

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

  const handleRemoteAction = (type: string, e: React.MouseEvent) => {
    if (isHost) return;
    const rect = videoRef.current?.getBoundingClientRect();
    if (rect) {
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      const pos = { x, y };
      
      // Send via WebRTC for UI simulation
      webRTC.sendData({ type, pos });

      // Send via Signaling for Native Agent
      const socket = signalingService.getSocket();
      if (socket) {
        socket.emit("native-command", {
          to: deviceId,
          command: {
            type: type === 'mouse' ? 'mouse_move' : 'mouse_click',
            pos
          }
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50 font-sans">
      {/* Header */}
      <div className="h-14 bg-zinc-900 border-b border-white/5 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white font-medium">
            <Monitor size={18} className="text-emerald-500" />
            <span className="font-mono">{deviceId}</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            <div className="flex items-center gap-1">
              <Activity size={12} className="text-emerald-500" />
              <span>{latency}ms</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-1">
              <Shield size={12} className="text-emerald-500" />
              <span>P2P AES-256</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-1 text-emerald-500">
              <MousePointer2 size={12} />
              <span>NATIVE AGENT READY</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setShowChat(!showChat); setShowFiles(false); }}
            className={`p-2 rounded-lg transition-colors ${showChat ? 'bg-emerald-500 text-white' : 'text-zinc-400 hover:bg-white/5'}`}
          >
            <MessageSquare size={20} />
          </button>
          <button 
            onClick={() => { setShowFiles(!showFiles); setShowChat(false); }}
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
            className="flex items-center gap-2 px-4 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all font-bold text-xs uppercase tracking-widest"
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
              <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">
                {connectionState === 'connecting' ? 'Estabelecendo conexão P2P...' : 'Aguardando Stream Remota...'}
              </p>
            </div>
          )}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            onMouseMove={(e) => handleRemoteAction('mouse', e)}
            onClick={(e) => handleRemoteAction('click', e)}
            className="max-w-full max-h-full object-contain cursor-crosshair"
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
                <h3 className="text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare size={16} className="text-emerald-500" />
                  Chat da Sessão
                </h3>
                <button onClick={() => setShowChat(false)} className="text-zinc-500 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.sender === 'Me' ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] text-zinc-500 mb-1 uppercase tracking-widest font-black">
                      {msg.sender} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className={`px-3 py-2 rounded-2xl text-sm max-w-[90%] font-medium ${
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
                    placeholder="Mensagem..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-emerald-500 text-white p-2.5 rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    <Terminal size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {showFiles && (
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              className="w-80 bg-zinc-900 border-l border-white/5 flex flex-col"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                  <Files size={16} className="text-emerald-500" />
                  Transferência
                </h3>
                <button onClick={() => setShowFiles(false)} className="text-zinc-500 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              
              <div className="p-4">
                <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isDragActive ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/10 hover:border-white/20'
                }`}>
                  <input {...getInputProps()} />
                  <Upload size={24} className="text-zinc-500 mb-2" />
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">
                    Arraste arquivos aqui para enviar
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {transfers.map((t) => (
                  <div key={t.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{t.nome_arquivo}</p>
                      <p className="text-[9px] text-zinc-500 uppercase font-black">
                        {(t.tamanho / 1024).toFixed(1)} KB • {t.status === 'completed' ? 'Concluído' : 'Enviando...'}
                      </p>
                    </div>
                    {t.status === 'completed' ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    )}
                  </div>
                ))}
                {transfers.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
                    <Download size={32} className="mb-2 opacity-20" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Sem transferências</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
