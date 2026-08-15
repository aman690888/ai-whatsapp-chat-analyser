import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Key, Check, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChatMessage } from '@/lib/gemini-ai';
import { askGemini, getStoredApiKey, saveApiKey } from '@/lib/gemini-ai';
import type { ParsedMessage, ChatStats } from '@/lib/whatsapp-parser';

interface AIChatProps { messages: ParsedMessage[]; stats: ChatStats; }

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

const SUGGESTIONS = [
  'Who texts the most?',
  'What was the busiest day?',
  'List all participants',
  'What topics come up most?',
];

const spring = { type: 'spring', bounce: 0, duration: 0.4 } as const;

function ApiKeyModal({ onClose }: { onClose: () => void }) {
  const [value, setValue] = useState(getStoredApiKey);
  const [saved, setSaved] = useState(false);
  const handleSave = () => { saveApiKey(value); setSaved(true); setTimeout(() => { setSaved(false); onClose(); }, 900); };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'hsl(221 39% 5% / 0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 30, opacity: 0 }}
        transition={spring}
        className="glass-raised w-full max-w-md p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="icon-badge accent-glow w-9 h-9 rounded-xl">
            <Key className="w-4 h-4" style={{ color: 'hsl(var(--bg-base))' }} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: 'hsl(var(--text-primary))' }}>Gemini API Key</p>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--text-tertiary))' }}>Stored only in your browser</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl hover:bg-white/5 transition-colors" style={{ color: 'hsl(var(--text-tertiary))' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm" style={{ color: 'hsl(var(--text-secondary))' }}>
          Get a free key at{' '}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'hsl(var(--accent))' }}>
            aistudio.google.com
          </a>
        </p>

        <input
          type="password" value={value} onChange={e => setValue(e.target.value)}
          placeholder="AIza…"
          className="w-full rounded-xl border px-4 py-3 text-sm bg-transparent outline-none transition-colors"
          style={{ borderColor: 'hsl(var(--border-bright))', color: 'hsl(var(--text-primary))', background: 'hsl(var(--bg-glass) / 0.5)' }}
        />
        <button
          onClick={handleSave} disabled={!value.trim()}
          className="w-full py-3 rounded-xl text-sm font-semibold accent-glow transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ color: 'hsl(var(--bg-base))' }}
        >
          {saved ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Key'}
        </button>
      </motion.div>
    </motion.div>
  );
}

export function AIChat({ messages: parsedMessages, stats }: AIChatProps) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([{
    id: '0', role: 'assistant',
    content: `Hello! I've analyzed your WhatsApp chat with **${stats.totalMessages.toLocaleString()} messages** from **${stats.participants.length} participants**. Ask me anything about it!`,
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(() => !!getStoredApiKey());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

  const send = async (question: string) => {
    if (!question.trim() || loading) return;
    setError(null);
    const apiKey = getStoredApiKey();
    if (!apiKey) { setShowSettings(true); return; }
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: question };
    setChatHistory(h => [...h, userMsg]);
    setInput(''); setLoading(true);
    try {
      const answer = await askGemini(question, parsedMessages, stats, apiKey);
      setChatHistory(h => [...h, { id: Date.now().toString() + 'a', role: 'assistant', content: answer }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg === 'NO_API_KEY' ? 'Please add your Gemini API key.' : `Gemini error: ${msg}`);
    } finally { setLoading(false); }
  };

  const handleSettingsClose = () => { setShowSettings(false); setHasApiKey(!!getStoredApiKey()); };

  return (
    <>
      <AnimatePresence>
        {showSettings && <ApiKeyModal onClose={handleSettingsClose} />}
      </AnimatePresence>

      <div className="glass-raised flex flex-col overflow-hidden" style={{ minHeight: 520, borderRadius: '20px' }}>
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: 'hsl(var(--border-bright) / 0.5)' }}>
          <div className="icon-badge accent-glow w-9 h-9 rounded-xl" style={{ boxShadow: '0 0 16px hsl(var(--accent) / 0.3)' }}>
            <Sparkles className="w-4 h-4" style={{ color: 'hsl(var(--bg-base))' }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'hsl(var(--text-primary))' }}>Gemini AI Assistant</p>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--text-tertiary))' }}>Powered by gemini-2.5-flash</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-emerald-400' : 'bg-amber-400'}`} style={hasApiKey ? { boxShadow: '0 0 6px hsl(var(--accent))' } : {}} />
              <span className="text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>{hasApiKey ? 'Ready' : 'No key'}</span>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="p-1.5 rounded-xl border transition-all hover:border-accent/50"
              style={{ borderColor: 'hsl(var(--border-bright))', color: 'hsl(var(--text-secondary))' }}
              title="API Key"
            >
              <Key className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* No key banner */}
        <AnimatePresence>
          {!hasApiKey && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={spring}
              className="overflow-hidden"
            >
              <div className="mx-4 mt-3 px-4 py-3 rounded-xl flex items-center gap-3" style={{ background: 'hsl(var(--accent) / 0.07)', border: '1px solid hsl(var(--accent) / 0.2)' }}>
                <AlertCircle className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--accent))' }} />
                <p className="text-xs flex-1" style={{ color: 'hsl(var(--text-secondary))' }}>Add your Gemini API key to enable AI responses.</p>
                <button onClick={() => setShowSettings(true)} className="text-xs font-semibold px-2.5 py-1 rounded-xl accent-glow" style={{ color: 'hsl(var(--bg-base))' }}>
                  Add Key
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 380 }}>
          <AnimatePresence initial={false}>
            {chatHistory.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={spring}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'accent-glow' : ''}`}
                  style={msg.role === 'user' ? { background: 'hsl(var(--bg-glass-raised))', border: '1px solid hsl(var(--border-bright))' } : {}}>
                  {msg.role === 'assistant'
                    ? <Bot className="w-4 h-4" style={{ color: 'hsl(var(--bg-base))' }} />
                    : <User className="w-4 h-4" style={{ color: 'hsl(var(--text-secondary))' }} />
                  }
                </div>
                <div
                  className={`max-w-xs lg:max-w-sm px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user' ? 'bubble-user' : 'bubble-ai'}`}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="flex gap-3">
              <div className="w-8 h-8 rounded-full accent-glow flex items-center justify-center">
                <Bot className="w-4 h-4" style={{ color: 'hsl(var(--bg-base))' }} />
              </div>
              <div className="px-4 py-3 rounded-xl bubble-ai flex items-center gap-2.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'hsl(var(--accent))' }} />
                <span className="text-sm" style={{ color: 'hsl(var(--text-secondary))' }}>Asking Gemini…</span>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={spring}
              className="mx-1 px-4 py-3 rounded-xl flex items-start gap-2"
              style={{ background: 'hsl(var(--destructive) / 0.1)', border: '1px solid hsl(var(--destructive) / 0.3)', color: 'hsl(var(--destructive))' }}
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="text-xs">{error}</span>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        <AnimatePresence>
          {chatHistory.length <= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              transition={spring}
              className="px-4 pb-2 flex flex-wrap gap-2"
            >
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 rounded-full border transition-all hover:border-accent/50 hover:text-accent"
                  style={{ borderColor: 'hsl(var(--border-bright))', color: 'hsl(var(--text-secondary))', background: 'hsl(var(--bg-glass) / 0.5)' }}
                >
                  {s}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="px-4 pb-4 pt-2">
          <form
            onSubmit={e => { e.preventDefault(); send(input); }}
            className="flex gap-2 items-center rounded-2xl border p-2"
            style={{ borderColor: 'hsl(var(--border-bright))', background: 'hsl(var(--bg-glass) / 0.6)', backdropFilter: 'blur(12px)' }}
          >
            <input
              value={input} onChange={e => setInput(e.target.value)}
              placeholder={hasApiKey ? 'Ask something about the chat…' : 'Add your API key first…'}
              className="flex-1 bg-transparent text-sm outline-none px-2"
              style={{ color: 'hsl(var(--text-primary))' }}
            />
            <motion.button
              type="submit" disabled={loading || !input.trim()}
              whileTap={{ scale: 0.9 }} transition={spring}
              className="w-8 h-8 accent-glow rounded-xl flex items-center justify-center disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" style={{ color: 'hsl(var(--bg-base))' }} />
            </motion.button>
          </form>
        </div>
      </div>
    </>
  );
}
