import { useState, useMemo } from 'react';
import { parseWhatsAppChat, computeStats } from '@/lib/whatsapp-parser';
import type { ParsedMessage, ChatStats } from '@/lib/whatsapp-parser';
import { UploadZone } from '@/components/UploadZone';
import { SummaryCards } from '@/components/SummaryCards';
import { MessagesPerUserChart, ActivityOverTimeChart } from '@/components/Charts';
import { AIChat } from '@/components/AIChat';
import { ChatLensWrapped } from '@/components/ChatLensWrapped';
import { FileText, RotateCcw, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

type View = 'upload' | 'loading' | 'dashboard' | 'error';

const Index = () => {
  const [view, setView] = useState<View>('upload');
  const [filename, setFilename] = useState('');
  const [messages, setMessages] = useState<ParsedMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'analytics' | 'ai'>('analytics');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const stats = useMemo<ChatStats | null>(() => {
    if (messages.length === 0) return null;
    return computeStats(messages);
  }, [messages]);

  const uploadChatArchive = async (file: File) => {
    try {
      const ext = file.name.split('.').pop() || 'txt';
      const path = `uploads/${Date.now()}-${crypto.randomUUID()}.${ext}`;

      if (!isSupabaseConfigured || !supabase) {
        console.warn('Supabase upload skipped: missing environment configuration.');
        return;
      }

      const { error } = await supabase.storage
        .from('chat_archives')
        .upload(path, file, {
          contentType: 'text/plain',
          upsert: false,
        });

      if (error) {
        console.error('Failed to upload chat archive:', error.message);
      }
    } catch (err) {
      console.error('Unexpected Supabase upload failure:', err);
    }
  };

  const handleFileLoaded = (text: string, name: string, file: File) => {
    setUploadError(null);
    setView('loading');
    setFilename(name);

    void uploadChatArchive(file);

    // Parse in a non-blocking fashion
    setTimeout(() => {
      try {
        const parsed = parseWhatsAppChat(text);
        setMessages(parsed);
        setView('dashboard');
      } catch (err) {
        console.error('Failed to parse uploaded chat:', err);
        setUploadError('Something went wrong while parsing this chat export. Please re-export the WhatsApp .txt file and try again.');
        setView('error');
      }
    }, 600);
  };

  const reset = () => {
    setView('upload');
    setMessages([]);
    setFilename('');
    setActiveTab('analytics');
    setUploadError(null);
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

  if (view === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center" style={{ background: 'hsl(var(--background))' }}>
        <div className="w-14 h-14 gradient-red rounded-2xl flex items-center justify-center" style={{ boxShadow: '0 0 30px hsl(0 85% 50% / 0.4)' }}>
          <FileText className="w-7 h-7 text-primary-foreground" />
        </div>
        <p className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Upload failed</p>
        <p className="text-sm max-w-md" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {uploadError || 'Something unexpected happened while processing your file.'}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg gradient-red text-sm font-medium"
          style={{ color: 'hsl(var(--primary-foreground))' }}
        >
          Try another file
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>
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

          <button
            onClick={reset}
            className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-colors hover:border-primary/50"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New File</span>
          </button>
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
            <ChatLensWrapped stats={stats} messages={messages} />
            <SummaryCards stats={stats} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MessagesPerUserChart stats={stats} />
              <ActivityOverTimeChart stats={stats} />
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
