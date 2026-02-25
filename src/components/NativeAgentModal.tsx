import React from 'react';
import { Terminal, Copy, Check, Download, AlertTriangle, Cpu, Globe } from 'lucide-react';
import { motion } from 'motion/react';

interface NativeAgentModalProps {
  myId: string;
  onClose: () => void;
}

export default function NativeAgentModal({ myId, onClose }: NativeAgentModalProps) {
  const [copied, setCopied] = React.useState(false);

  const agentCode = `
const { io } = require("socket.io-client");
const robot = require("robotjs"); // Necessário: npm install robotjs

// Configurações
const SERVER_URL = "${window.location.origin}";
const DEVICE_ID = "${myId}";

const socket = io(SERVER_URL);

console.log("🚀 Agente Nativo Iniciado para o ID: " + DEVICE_ID);

socket.on("connect", () => {
  console.log("✅ Conectado ao servidor de sinalização");
  socket.emit("identify-agent", DEVICE_ID);
});

socket.on("execute-command", (cmd) => {
  console.log("🎮 Executando comando:", cmd.type);
  
  if (cmd.type === "mouse_move") {
    const screenSize = robot.getScreenSize();
    const x = cmd.pos.x * screenSize.width;
    const y = cmd.pos.y * screenSize.height;
    robot.moveMouse(x, y);
  } else if (cmd.type === "mouse_click") {
    robot.mouseClick();
  } else if (cmd.type === "key_down") {
    robot.keyTap(cmd.key);
  }
});

socket.on("disconnect", () => {
  console.log("❌ Desconectado do servidor");
});
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(agentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 border border-white/10 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
              <Cpu size={20} />
            </div>
            <div>
              <h3 className="text-white font-bold">Configurar Agente Nativo</h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Controle Total do Windows</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <Terminal size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-4">
            <AlertTriangle className="text-amber-500 shrink-0" size={24} />
            <div className="text-sm text-amber-200/80 leading-relaxed">
              Para controlar o mouse e teclado **fora do navegador**, você precisa rodar este script no computador que será controlado.
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Código do Agente (Node.js)</span>
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'COPIADO' : 'COPIAR CÓDIGO'}
              </button>
            </div>
            <div className="bg-black rounded-2xl p-4 font-mono text-xs text-emerald-500/90 overflow-x-auto border border-white/5 max-h-60">
              <pre>{agentCode}</pre>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <h4 className="text-white text-xs font-bold uppercase mb-2">1. Requisitos</h4>
              <ul className="text-[11px] text-zinc-400 space-y-1">
                <li>• Node.js instalado no PC</li>
                <li>• <code className="text-emerald-500">npm install robotjs socket.io-client</code></li>
              </ul>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <h4 className="text-white text-xs font-bold uppercase mb-2">2. Execução</h4>
              <ul className="text-[11px] text-zinc-400 space-y-1">
                <li>• Salve como <code className="text-emerald-500">agent.js</code></li>
                <li>• Execute: <code className="text-emerald-500">node agent.js</code></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-6 bg-zinc-800/30 border-t border-white/5 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-white text-zinc-900 rounded-xl font-bold text-sm hover:opacity-90 transition-all"
          >
            Entendi, fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
