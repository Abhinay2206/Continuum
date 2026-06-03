'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Sparkles, User, Code2, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspaceStore } from '@/store/workspaceStore';

interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  isStreaming?: boolean;
  diffProposal?: { file: string; diff: string };
}

const MODELS = ['claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5'];
const MODEL_LABELS: Record<string, string> = {
  'claude-opus-4-8': 'Opus 4',
  'claude-sonnet-4-6': 'Sonnet 4',
  'claude-haiku-4-5': 'Haiku 4',
};

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="w-1 h-1 rounded-full"
          style={{ background: '#7B6CF6' }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

export default function AIChatPanel({ repoId }: { repoId: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'system', content: 'Continuum AI ready. Ask me to modify, explain, or debug your code.' }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[1]);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const { isChatOpen, toggleChat } = useWorkspaceStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSubmit = () => {
    if (!input.trim() || isThinking) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    setTimeout(() => {
      setIsThinking(false);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: 'I\'m analyzing your repository. WebSocket streaming will be wired here — I\'ll read the codebase and propose changes directly.',
      }]);
    }, 1400);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isChatOpen) return null;

  return (
    <div className="flex flex-col h-full w-80 flex-shrink-0" style={{ background: '#07070F', borderLeft: '1px solid #1A1A32' }}>

      {/* Header */}
      <div className="flex items-center px-4 h-10 flex-shrink-0 gap-3" style={{ background: '#0A0A1C', borderBottom: '1px solid #1A1A32' }}>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #7B6CF6, #A78BFA)' }}>
          <Sparkles size={13} className="text-white" />
        </div>
        <span className="text-sm font-semibold tracking-tight flex-1" style={{ color: '#D0D0EE' }}>Continuum AI</span>
        <button
          onClick={toggleChat}
          className="w-6 h-6 flex items-center justify-center rounded transition-colors"
          style={{ color: '#4A4A6A' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#8080A8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#4A4A6A')}
        >
          <X size={13} />
        </button>
      </div>

      {/* Model Selector */}
      <div className="relative px-3 py-2 flex-shrink-0" style={{ borderBottom: '1px solid #1A1A32' }}>
        <button
          className="flex items-center gap-1.5 w-full px-3 py-1.5 rounded-md text-xs font-medium transition-all"
          style={{ background: '#0F0F20', color: '#7070A0', border: '1px solid #1E1E38' }}
          onClick={() => setShowModelPicker(v => !v)}
          onMouseEnter={e => (e.currentTarget.style.background = '#141430')}
          onMouseLeave={e => (e.currentTarget.style.background = '#0F0F20')}
        >
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#7B6CF6' }} />
          <span className="flex-1 text-left">{MODEL_LABELS[selectedModel]}</span>
          <ChevronDown size={11} style={{ opacity: 0.5 }} />
        </button>
        <AnimatePresence>
          {showModelPicker && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute left-3 right-3 z-50 mt-1 rounded-lg overflow-hidden py-1"
              style={{ background: '#111124', border: '1px solid #1E1E38', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
            >
              {MODELS.map(m => (
                <button
                  key={m}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors"
                  style={{ color: m === selectedModel ? '#A89BF8' : '#6A6A88' }}
                  onClick={() => { setSelectedModel(m); setShowModelPicker(false); }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1A1A32')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {m === selectedModel && <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#7B6CF6' }} />}
                  {m !== selectedModel && <span className="w-1 h-1 flex-shrink-0" />}
                  {MODEL_LABELS[m]}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-3" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1E1E38 transparent' }}>
        {messages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            {msg.role === 'system' && (
              <div className="px-3 py-2 rounded-lg text-xs text-center" style={{ background: 'rgba(123,108,246,0.06)', color: '#5A5A82', border: '1px solid rgba(123,108,246,0.1)' }}>
                {msg.content}
              </div>
            )}

            {msg.role === 'user' && (
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-medium" style={{ color: '#4A4A6A' }}>You</span>
                  <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#1A1A32' }}>
                    <User size={9} style={{ color: '#7070A0' }} />
                  </div>
                </div>
                <div
                  className="max-w-[90%] px-3 py-2 rounded-2xl rounded-tr-sm text-xs leading-relaxed whitespace-pre-wrap"
                  style={{ background: 'linear-gradient(135deg, rgba(123,108,246,0.2), rgba(123,108,246,0.12))', color: '#D0D0EE', border: '1px solid rgba(123,108,246,0.2)' }}
                >
                  {msg.content}
                </div>
              </div>
            )}

            {msg.role === 'agent' && (
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7B6CF6, #A78BFA)' }}>
                    <Sparkles size={8} className="text-white" />
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: '#7B6CF6' }}>Agent</span>
                </div>
                <div
                  className="max-w-[95%] px-3 py-2 rounded-2xl rounded-tl-sm text-xs leading-relaxed whitespace-pre-wrap"
                  style={{ background: '#0F0F1E', color: '#C0C0DC', border: '1px solid #1E1E38' }}
                >
                  {msg.content}
                </div>
                {msg.diffProposal && (
                  <div className="mt-1 w-full rounded-lg overflow-hidden" style={{ border: '1px solid #1E1E38' }}>
                    <div className="flex items-center gap-2 px-3 py-2" style={{ background: '#0A0A1C' }}>
                      <Code2 size={12} style={{ color: '#7B6CF6' }} />
                      <span className="text-[10px] font-medium" style={{ color: '#6A6A88' }}>{msg.diffProposal.file}</span>
                    </div>
                    <button
                      className="w-full py-2 text-xs font-medium transition-colors"
                      style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34D399' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(52,211,153,0.18)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(52,211,153,0.1)')}
                    >
                      Review Changes →
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}

        {isThinking && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-start gap-1"
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7B6CF6, #A78BFA)' }}>
                <Sparkles size={8} className="text-white" />
              </div>
              <span className="text-[10px] font-medium" style={{ color: '#7B6CF6' }}>Agent</span>
            </div>
            <div className="px-3 py-2 rounded-2xl rounded-tl-sm" style={{ background: '#0F0F1E', border: '1px solid #1E1E38' }}>
              <ThinkingDots />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-3" style={{ borderTop: '1px solid #1A1A32', background: '#0A0A1C' }}>
        <div
          className="flex flex-col rounded-xl overflow-hidden transition-all"
          style={{ background: '#0F0F20', border: '1px solid #1E1E38' }}
          onFocus={() => {}}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI to modify code..."
            rows={1}
            className="w-full resize-none px-3 pt-3 pb-1 text-xs outline-none"
            style={{
              background: 'transparent',
              color: '#D0D0EE',
              lineHeight: 1.6,
              maxHeight: '100px',
              overflowY: 'auto',
              scrollbarWidth: 'none',
            }}
            onInput={e => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
            }}
          />
          <div className="flex items-center justify-between px-3 pb-2 pt-1">
            <span className="text-[10px]" style={{ color: '#3A3A5A' }}>⌘↵ to send</span>
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isThinking}
              className="w-6 h-6 flex items-center justify-center rounded-md transition-all"
              style={{
                background: input.trim() && !isThinking ? 'linear-gradient(135deg, #7B6CF6, #9B8CF8)' : '#1A1A32',
                color: input.trim() && !isThinking ? 'white' : '#3A3A5A',
              }}
            >
              <Send size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
