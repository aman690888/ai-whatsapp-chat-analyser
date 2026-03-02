import { useState, useMemo } from 'react';
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
import { FileText, RotateCcw, Loader2, Key } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getStoredApiKey, saveApiKey } from '@/lib/gemini-ai';


type View = 'upload' | 'loading' | 'dashboard';

// Inline tiny ApiKey modal used in the analytics tab
function ApiKeyModal({ onClose }: { onClose: () => void }) {
  const [value, setVal] = useState(getStoredApiKey);
  const [saved, setSaved] = useState(false);
  const save = () => { saveApiKey(value); setSaved(true); setTimeout(() => { setSaved(false); onClose(); }, 900); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'hsl(0 0% 0% / 0.7)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-4 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 gradient-red rounded-lg flex items-center justify-center"><Key className="w-4 h-4 text-primary-foreground" /></div>
            <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Gemini API Key</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors" style={{ color: 'hsl(var(--muted-foreground))' }}>✕</button>
        </div>
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Stored only in your browser. Get a free key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'hsl(var(--primary))' }}>aistudio.google.com</a></p>
        <input type="password" value={value} onChange={e => setVal(e.target.value)} placeholder="AIza…" className="w-full rounded-xl border px-4 py-2.5 text-sm bg-transparent outline-none focus:border-primary transition-colors" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
        <button onClick={save} disabled={!value.trim()} className="w-full py-2.5 rounded-xl text-sm font-medium gradient-red disabled:opacity-40 flex items-center justify-center gap-2" style={{ color: 'hsl(var(--primary-foreground))' }}>
          {saved ? '✓ Saved!' : 'Save Key'}
        </button>
      </div>
    </div>
  );
}

const Index = () => {
  const [view, setView] = useState<View>('upload');
  const [filename, setFilename] = useState('');
  const [messages, setMessages] = useState<ParsedMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'analytics' | 'ai'>('analytics');
  const [showApiModal, setShowApiModal] = useState(false);

  const stats = useMemo<ChatStats | null>(() => {
    if (messages.length === 0) return null;
    return computeStats(messages);
  }, [messages]);

  const uploadChatArchive = async (file: File) => {
    const ext = file.name.split('.').pop() || 'txt';
    const path = `uploads/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from('chat_archives')
      .upload(path, file, { contentType: 'text/plain', upsert: false });
    if (error) console.error('Failed to upload chat archive:', error.message);
  };

  const handleFileLoaded = (text: string, name: string, file: File) => {
    setView('loading');
    setFilename(name);
    void uploadChatArchive(file);
    setTimeout(() => {
      const parsed = parseWhatsAppChat(text);
      setMessages(parsed);
      setView('dashboard');
    }, 600);
  };

  const reset = () => {
    setView('upload');
    setMessages([]);
    setFilename('');
    setActiveTab('analytics');
  };

  if (view === 'upload') return <UploadZone onFileLoaded={handleFileLoaded} />;

  if (view === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'hsl(var(--background))' }}>
        <div className="w-14 h-14 gradient-red rounded-2xl flex items-center justify-center animate-pulse" style={{ boxShadow: '0 0 30px hsl(0 85% 50% / 0.4)' }}>
          <Loader2 className="w-7 h-7 text-primary-foreground animate-spin" />
        </div>
        <p className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Parsing your chat…</p>
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{filename}</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>
      {showApiModal && <ApiKeyModal onClose={() => setShowApiModal(false)} />}

      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b" style={{ background: 'hsl(var(--card) / 0.9)', borderColor: 'hsl(var(--border))', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 gradient-red rounded-lg flex items-center justify-center" style={{ boxShadow: '0 0 14px hsl(0 85% 50% / 0.4)' }}>
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
              Chat<span style={{ color: 'hsl(var(--primary))' }}>Lens</span>
            </span>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'hsl(var(--muted))' }}>
            {(['analytics', 'ai'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={activeTab === tab
                  ? { background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }
                  : { color: 'hsl(var(--muted-foreground))' }
                }
              >
                {tab === 'analytics' ? '📊 Analytics' : '🤖 AI Chat'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowApiModal(true)}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors hover:border-primary/50"
              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
              title="Gemini API Key"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">API Key</span>
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-colors hover:border-primary/50"
              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New File</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* File info bar */}
        <div className="flex items-center gap-2 mb-6 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <FileText className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
          <span>{filename}</span>
          <span>·</span>
          <span>{messages.length.toLocaleString()} messages parsed</span>
        </div>

        {activeTab === 'analytics' ? (
          <div className="space-y-6">
            {/* AI Vibe Card */}
            <AIVibeCard
              messages={messages}
              stats={stats}
              onOpenApiKey={() => setShowApiModal(true)}
            />

            <SummaryCards stats={stats} />

            {/* Row 1: messages per user + activity over time */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MessagesPerUserChart stats={stats} />
              <ActivityOverTimeChart stats={stats} />
            </div>

            {/* Row 2: hourly heatmap + day of week */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <HourlyHeatmapChart stats={stats} />
              <DayOfWeekChart stats={stats} />
            </div>

            {/* Row 3: word stats + top emojis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WordStatsCard stats={stats} />
              <TopEmojisCard stats={stats} />
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <AIChat messages={messages} stats={stats} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
