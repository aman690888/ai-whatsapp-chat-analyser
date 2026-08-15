import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { parseWhatsAppChat, computeStats } from '@/lib/whatsapp-parser';
import type { ParsedMessage, ChatStats } from '@/lib/whatsapp-parser';
import { UploadZone } from '@/components/UploadZone';
import { SummaryCards } from '@/components/SummaryCards';
import {
  MessagesPerUserChart,
  ActivityOverTimeChart,
  HourlyHeatmapChart,
  DayOfWeekChart,
  TopEmojisCard,
  WordStatsCard,
} from '@/components/Charts';
import { AIChat } from '@/components/AIChat';
import { AIVibeCard } from '@/components/AIVibeCard';
import { FileText, RotateCcw, Loader2, Key, BarChart2, Bot } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getStoredApiKey, saveApiKey } from '@/lib/gemini-ai';
import { BehaviorCards } from '@/components/BehaviorCards';

type View = 'upload' | 'loading' | 'dashboard' | 'error';

function ApiKeyModal({ onClose }: { onClose: () => void }) {
  const [value, setVal] = useState(getStoredApiKey);
  const [saved, setSaved] = useState(false);
  const save = () => {
    saveApiKey(value);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 900);
  };

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
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        className="glass-raised w-full max-w-md p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="icon-badge accent-glow">
            <Key className="w-4 h-4" style={{ color: 'hsl(var(--bg-base))' }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'hsl(var(--text-primary))' }}>Gemini API Key</p>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--text-tertiary))' }}>Stored only in your browser</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-xl transition-colors hover:bg-white/5" style={{ color: 'hsl(var(--text-tertiary))' }}>✕</button>
        </div>

        <p className="text-sm" style={{ color: 'hsl(var(--text-secondary))' }}>
          Get a free key at{' '}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'hsl(var(--accent))' }}>
            aistudio.google.com
          </a>
        </p>

        <input
          type="password" value={value}
          onChange={e => setVal(e.target.value)}
          placeholder="AIza…"
          className="w-full rounded-xl border px-4 py-3 text-sm bg-transparent outline-none transition-colors"
          style={{ borderColor: 'hsl(var(--border-bright))', color: 'hsl(var(--text-primary))', background: 'hsl(var(--bg-glass) / 0.5)' }}
          onFocus={e => (e.target.style.borderColor = 'hsl(var(--accent))')}
          onBlur={e => (e.target.style.borderColor = 'hsl(var(--border-bright))')}
        />

        <button
          onClick={save} disabled={!value.trim()}
          className="w-full py-3 rounded-xl text-sm font-semibold accent-glow transition-opacity disabled:opacity-40"
          style={{ color: 'hsl(var(--bg-base))' }}
        >
          {saved ? '✓ Saved!' : 'Save Key'}
        </button>
      </motion.div>
    </motion.div>
  );
}

const spring = { type: 'spring', bounce: 0, duration: 0.45 } as const;

const Index = () => {
  const [view, setView] = useState<View>('upload');
  const [filename, setFilename] = useState('');
  const [messages, setMessages] = useState<ParsedMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'analytics' | 'ai'>('analytics');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showApiModal, setShowApiModal] = useState(false);

  const stats = useMemo<ChatStats | null>(() => {
    if (messages.length === 0) return null;
    return computeStats(messages);
  }, [messages]);

  const uploadChatArchive = async (file: File) => {
    try {
      const ext = file.name.split('.').pop() || 'txt';
      const path = `uploads/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      if (!isSupabaseConfigured || !supabase) return;
      const { error } = await supabase.storage.from('chat_archives').upload(path, file, { contentType: 'text/plain', upsert: false });
      if (error) console.error('Supabase upload error:', error.message);
    } catch (err) {
      console.error('Unexpected Supabase error:', err);
    }
  };

  const handleFileLoaded = (text: string, name: string, file: File) => {
    setUploadError(null);
    setView('loading');
    setFilename(name);
    void uploadChatArchive(file);
    setTimeout(() => {
      try {
        setMessages(parseWhatsAppChat(text));
        setView('dashboard');
      } catch (err) {
        console.error(err);
        setUploadError('Something went wrong parsing this chat. Re-export and try again.');
        setView('error');
      }
    }, 600);
  };

  const reset = () => { setView('upload'); setMessages([]); setFilename(''); setActiveTab('analytics'); setUploadError(null); };

  return (
    <AnimatePresence mode="wait">
      {view === 'upload' && <UploadZone key="upload" onFileLoaded={handleFileLoaded} />}

      {view === 'loading' && (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={spring}
          className="min-h-screen mesh-bg flex flex-col items-center justify-center gap-5"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="icon-badge accent-glow w-16 h-16 rounded-2xl"
            style={{ boxShadow: '0 0 40px hsl(var(--accent) / 0.4)' }}
          >
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(var(--bg-base))' }} />
          </motion.div>
          <div className="text-center">
            <p className="text-lg font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>Parsing your chat…</p>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--text-secondary))' }}>{filename}</p>
          </div>
        </motion.div>
      )}

      {view === 'error' && (
        <motion.div
          key="error"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={spring}
          className="min-h-screen mesh-bg flex flex-col items-center justify-center gap-5 px-4 text-center"
        >
          <div className="icon-badge w-16 h-16 rounded-2xl" style={{ background: 'hsl(var(--destructive) / 0.15)' }}>
            <FileText className="w-8 h-8" style={{ color: 'hsl(var(--destructive))' }} />
          </div>
          <div>
            <p className="text-xl font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>Upload failed</p>
            <p className="text-sm mt-2 max-w-sm" style={{ color: 'hsl(var(--text-secondary))' }}>
              {uploadError || 'Something unexpected happened. Please try again.'}
            </p>
          </div>
          <button onClick={reset} className="accent-glow rounded-xl px-5 py-2.5 text-sm font-semibold" style={{ color: 'hsl(var(--bg-base))' }}>
            Try another file
          </button>
        </motion.div>
      )}

      {view === 'dashboard' && stats && (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={spring}
          className="min-h-screen mesh-bg"
        >
          <AnimatePresence>
            {showApiModal && <ApiKeyModal onClose={() => setShowApiModal(false)} />}
          </AnimatePresence>

          {/* ── Nav ── */}
          <header className="sticky top-0 z-40 nav-glass">
            <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
              {/* Logo */}
              <div className="flex items-center gap-2.5">
                <div className="icon-badge accent-glow w-8 h-8 rounded-xl" style={{ boxShadow: '0 0 14px hsl(var(--accent) / 0.4)' }}>
                  <FileText className="w-4 h-4" style={{ color: 'hsl(var(--bg-base))' }} />
                </div>
                <span className="font-bold text-base tracking-tight" style={{ color: 'hsl(var(--text-primary))' }}>
                  Chat<span style={{ color: 'hsl(var(--accent))' }}>Lens</span>
                </span>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-full" style={{ background: 'hsl(var(--bg-glass))' }}>
                {(['analytics', 'ai'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`tab-pill ${activeTab === tab ? 'tab-pill-active' : 'tab-pill-inactive'}`}
                  >
                    {tab === 'analytics'
                      ? <><BarChart2 className="w-3.5 h-3.5" /> Analytics</>
                      : <><Bot className="w-3.5 h-3.5" /> AI Chat</>
                    }
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowApiModal(true)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all hover:border-accent/50"
                  style={{ borderColor: 'hsl(var(--border-bright))', color: 'hsl(var(--text-secondary))' }}
                >
                  <Key className="w-3 h-3" />
                  <span className="hidden sm:inline">API Key</span>
                </button>
                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all hover:border-accent/50"
                  style={{ borderColor: 'hsl(var(--border-bright))', color: 'hsl(var(--text-secondary))' }}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline">New File</span>
                </button>
              </div>
            </div>
          </header>

          {/* ── Content ── */}
          <main className="max-w-7xl mx-auto px-4 py-8">
            {/* File badge */}
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.1 }}
              className="flex items-center gap-2 mb-8 text-xs"
              style={{ color: 'hsl(var(--text-tertiary))' }}
            >
              <FileText className="w-3.5 h-3.5" style={{ color: 'hsl(var(--accent))' }} />
              <span style={{ color: 'hsl(var(--text-secondary))' }}>{filename}</span>
              <span>·</span>
              <span style={{ color: 'hsl(var(--accent))' }}>{messages.length.toLocaleString()}</span>
              <span>messages parsed</span>
            </motion.div>

            <AnimatePresence mode="wait">
              {activeTab === 'analytics' ? (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                  transition={spring}
                  className="space-y-6"
                >
                  <AIVibeCard messages={messages} stats={stats} onOpenApiKey={() => setShowApiModal(true)} />
                  <SummaryCards stats={stats} />
                  <BehaviorCards stats={stats} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <MessagesPerUserChart stats={stats} />
                    <ActivityOverTimeChart stats={stats} />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <HourlyHeatmapChart stats={stats} />
                    <DayOfWeekChart stats={stats} />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <WordStatsCard stats={stats} />
                    <TopEmojisCard stats={stats} />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="ai"
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                  transition={spring}
                  className="max-w-2xl mx-auto"
                >
                  <AIChat messages={messages} stats={stats} />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Index;
