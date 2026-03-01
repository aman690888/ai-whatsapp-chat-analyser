import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import type { ChatMessage } from '@/lib/mock-ai';
import { askAI } from '@/lib/mock-ai';
import type { ParsedMessage, ChatStats } from '@/lib/whatsapp-parser';

interface AIChatProps {
  messages: ParsedMessage[];
  stats: ChatStats;
}

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

const SUGGESTIONS = [
  'Who texts the most?',
  'How many messages in total?',
  'Which was the busiest day?',
  'List all participants',
];

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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const send = async (question: string) => {
    if (!question.trim() || loading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: question };
    setChatHistory(h => [...h, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const answer = await askAI(question, parsedMessages, stats);
      setChatHistory(h => [...h, { id: Date.now().toString() + 'a', role: 'assistant', content: answer }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-dark-raised flex flex-col h-full overflow-hidden" style={{ minHeight: 480 }}>
      {/* Header */}
      <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="w-9 h-9 gradient-red rounded-xl flex items-center justify-center" style={{ boxShadow: '0 0 16px hsl(0 85% 50% / 0.3)' }}>
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>AI Assistant</p>
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Ask questions about your chat</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Ready</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 360 }}>
        {chatHistory.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'gradient-red' : 'bg-muted'}`}
            >
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
              <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Analyzing...</span>
            </div>
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
            placeholder="Ask something about the chat..."
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
  );
}
