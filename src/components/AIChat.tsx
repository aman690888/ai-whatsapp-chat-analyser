import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Key, Check, AlertCircle, X } from 'lucide-react';
import type { ChatMessage } from '@/lib/gemini-ai';
import { askGemini, getStoredApiKey, saveApiKey } from '@/lib/gemini-ai';
import type { ParsedMessage, ChatStats } from '@/lib/whatsapp-parser';

interface AIChatProps {
  messages: ParsedMessage[];
  stats: ChatStats;
}

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

const SUGGESTIONS = [
  'Who texts the most?',
  'How many messages in total?',
  'Which was the busiest day?',
  'List all participants',
];

function ApiKeyModal({ onClose }: { onClose: () => void }) {
  const [value, setValue] = useState(getStoredApiKey);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveApiKey(value);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'hsl(0 0% 0% / 0.7)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-4 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 gradient-red rounded-lg flex items-center justify-center">
              <Key className="w-4 h-4 text-primary-foreground" />
            </div>
            <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Gemini API Key</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Enter your Google AI Studio API key. It's stored only in your browser's local storage and never sent anywhere except Google's servers.
        </p>

        <div className="space-y-1">
          <input
            type="password"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="AIza…"
            className="w-full rounded-xl border px-4 py-2.5 text-sm bg-transparent outline-none focus:border-primary transition-colors"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
          />
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Get a free key at{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'hsl(var(--primary))' }}>
              aistudio.google.com
            </a>
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={!value.trim()}
          className="w-full py-2.5 rounded-xl text-sm font-medium gradient-red transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ color: 'hsl(var(--primary-foreground))' }}
        >
          {saved ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Key'}
        </button>
      </div>
    </div>
  );
}

export function AIChat({ messages: parsedMessages, stats }: AIChatProps) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Hello! I've analyzed your WhatsApp chat with **${stats.totalMessages} messages** from **${stats.participants.length} participants**. Ask me anything about it!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(() => !!getStoredApiKey());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const send = async (question: string) => {
    if (!question.trim() || loading) return;
    setError(null);

    const apiKey = getStoredApiKey();
    if (!apiKey) {
      setShowSettings(true);
      return;
    }

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: question };
    setChatHistory(h => [...h, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const answer = await askGemini(question, parsedMessages, stats, apiKey);
      setChatHistory(h => [...h, { id: Date.now().toString() + 'a', role: 'assistant', content: answer }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg === 'NO_API_KEY' ? 'Please add your Gemini API key in settings.' : `Gemini error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsClose = () => {
    setShowSettings(false);
    setHasApiKey(!!getStoredApiKey());
  };

  return (
    <>
      {showSettings && <ApiKeyModal onClose={handleSettingsClose} />}

      <div className="card-dark-raised flex flex-col h-full overflow-hidden" style={{ minHeight: 480 }}>
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="w-9 h-9 gradient-red rounded-xl flex items-center justify-center" style={{ boxShadow: '0 0 16px hsl(0 85% 50% / 0.3)' }}>
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>Gemini AI Assistant</p>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Powered by gemini-1.5-flash</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
              <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{hasApiKey ? 'Ready' : 'No key'}</span>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="p-1.5 rounded-lg border transition-colors hover:border-primary/50"
              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
              title="Gemini API Key"
            >
              <Key className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* No key banner */}
        {!hasApiKey && (
          <div className="mx-4 mt-3 px-4 py-3 rounded-xl flex items-center gap-3 border" style={{ background: 'hsl(0 85% 50% / 0.08)', borderColor: 'hsl(0 85% 50% / 0.25)' }}>
            <AlertCircle className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--primary))' }} />
            <p className="text-xs flex-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Add your Gemini API key to enable AI responses.
            </p>
            <button onClick={() => setShowSettings(true)} className="text-xs font-medium px-2.5 py-1 rounded-lg gradient-red" style={{ color: 'hsl(var(--primary-foreground))' }}>
              Add Key
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 360 }}>
          {chatHistory.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'gradient-red' : 'bg-muted'}`}>
                {msg.role === 'assistant'
                  ? <Bot className="w-4 h-4 text-primary-foreground" />
                  : <User className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                }
              </div>
              <div
                className="max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                style={msg.role === 'assistant'
                  ? { background: 'hsl(var(--surface))', color: 'hsl(var(--foreground))', borderRadius: '4px 16px 16px 16px' }
                  : { background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', borderRadius: '16px 4px 16px 16px' }
                }
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
              />
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full gradient-red flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="px-4 py-3 rounded-2xl flex items-center gap-2" style={{ background: 'hsl(var(--surface))', borderRadius: '4px 16px 16px 16px' }}>
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
                <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Asking Gemini…</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mx-1 px-4 py-3 rounded-xl flex items-start gap-2 border" style={{ background: 'hsl(0 85% 50% / 0.08)', borderColor: 'hsl(0 85% 50% / 0.3)', color: 'hsl(var(--destructive))' }}>
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="text-xs">{error}</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {chatHistory.length <= 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-xs px-3 py-1.5 rounded-full border transition-colors hover:border-primary/50"
                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--surface))' }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 pb-4 pt-2">
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex gap-2 items-center rounded-xl border p-2"
            style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--surface))' }}
          >
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={hasApiKey ? 'Ask something about the chat…' : 'Add your API key first…'}
              className="flex-1 bg-transparent text-sm outline-none px-2"
              style={{ color: 'hsl(var(--foreground))' }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-8 h-8 gradient-red rounded-lg flex items-center justify-center disabled:opacity-40 transition-opacity"
            >
              <Send className="w-3.5 h-3.5 text-primary-foreground" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
