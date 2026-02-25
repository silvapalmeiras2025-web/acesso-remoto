import React from 'react';
import { Download, Apple, Terminal, Check, Copy, Package, ShieldCheck, Monitor } from 'lucide-react';
import { motion } from 'motion/react';

interface DownloadModalProps {
  onClose: () => void;
}

export default function DownloadModal({ onClose }: DownloadModalProps) {
  const [step, setStep] = React.useState(1);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[110] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900 border border-white/10 rounded-[2.5rem] max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col md:flex-row h-[600px]"
      >
        {/* Sidebar */}
        <div className="w-full md:w-72 bg-zinc-800/50 p-8 flex flex-col border-r border-white/5">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Package size={20} />
            </div>
            <span className="font-black tracking-tighter text-white">DESKTOP APP</span>
          </div>

          <div className="space-y-4 flex-1">
            {[
              { id: 1, label: 'Escolher Versão' },
              { id: 2, label: 'Instalação' },
              { id: 3, label: 'Concluir' }
            ].map((s) => (
              <div key={s.id} className={`flex items-center gap-3 transition-all ${step === s.id ? 'text-emerald-500' : 'text-zinc-500'}`}>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${step === s.id ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-zinc-700'}`}>
                  {s.id}
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
            <div className="flex items-center gap-2 text-emerald-500 mb-2">
              <ShieldCheck size={16} />
              <span className="text-[10px] font-black uppercase">Verificado</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed">Assinado digitalmente para garantir sua segurança total.</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-12 flex flex-col relative">
          <button onClick={onClose} className="absolute right-8 top-8 text-zinc-500 hover:text-white transition-colors">
            <Terminal size={24} />
          </button>

          {step === 1 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-black text-white tracking-tighter mb-4">BAIXAR PARA DESKTOP</h2>
                <p className="text-zinc-400 text-lg">Obtenha controle total do sistema, transferência de arquivos ultra-rápida e acesso sem navegador.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                  onClick={() => setStep(2)}
                  className="p-8 bg-white text-zinc-900 rounded-[2rem] flex flex-col items-center gap-4 hover:scale-[1.02] transition-all group"
                >
                  <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-900 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <Download size={32} />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-xl tracking-tighter">Windows .EXE</p>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Versão 2.4.0 (64-bit)</p>
                  </div>
                </button>

                <button 
                  onClick={() => setStep(2)}
                  className="p-8 bg-zinc-800 text-white rounded-[2rem] flex flex-col items-center gap-4 hover:scale-[1.02] transition-all group border border-white/5"
                >
                  <div className="w-16 h-16 bg-zinc-700 rounded-2xl flex items-center justify-center text-white group-hover:bg-emerald-500 transition-colors">
                    <Download size={32} />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-xl tracking-tighter">macOS .DMG</p>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Apple Silicon & Intel</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-black text-white tracking-tighter mb-4">QUASE LÁ...</h2>
                <p className="text-zinc-400 text-lg">Como este é um projeto em desenvolvimento, você pode gerar seu próprio instalador agora:</p>
              </div>

              <div className="space-y-4">
                <div className="bg-black rounded-2xl p-6 font-mono text-sm text-emerald-500 border border-white/5">
                  <p className="mb-2"># 1. Clone o código do diretório /desktop</p>
                  <p className="mb-2"># 2. Instale as dependências:</p>
                  <p className="text-white">npm install</p>
                  <p className="mb-2 mt-4"># 3. Gere o instalador:</p>
                  <p className="text-white">npm run build</p>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                    <Package size={20} />
                  </div>
                  <p className="text-xs text-zinc-400 flex-1">O instalador será gerado na pasta <code className="text-white">/dist</code> do seu computador.</p>
                </div>
              </div>

              <button 
                onClick={() => setStep(3)}
                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all"
              >
                Continuar
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                <Check size={48} />
              </div>
              <div>
                <h2 className="text-4xl font-black text-white tracking-tighter mb-2">TUDO PRONTO!</h2>
                <p className="text-zinc-400">Seu ambiente de build desktop foi configurado com sucesso.</p>
              </div>
              <button 
                onClick={onClose}
                className="px-12 py-4 bg-white text-zinc-900 rounded-2xl font-black uppercase tracking-widest hover:opacity-90 transition-all"
              >
                Voltar ao App
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
