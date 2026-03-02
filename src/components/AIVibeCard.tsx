import { useEffect, useState } from 'react';
import { Sparkles, Loader2, RefreshCw, AlertCircle, Key } from 'lucide-react';
import { askGemini, getStoredApiKey } from '@/lib/gemini-ai';
import type { ParsedMessage, ChatStats } from '@/lib/whatsapp-parser';

interface AIVibeCardProps {
  messages: ParsedMessage[];
  stats: ChatStats;
  onOpenApiKey: () => void;
}

const VIBE_PROMPT =
  "Based on this chat history, summarize the exact relationship dynamic between these two people in 2 sentences. Then, provide a funny, 1-sentence Gen-Z style roast of their texting habits.";

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

export function AIVibeCard({ messages, stats, onOpenApiKey }: AIVibeCardProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'nokey' | 'error'>('idle');
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState('');

  const run = async () => {
    const apiKey = getStoredApiKey();
    if (!apiKey) { setStatus('nokey'); return; }
    setStatus('loading');
    setError('');
    try {
      const answer = await askGemini(VIBE_PROMPT, messages, stats, apiKey);
      setResult(answer);
      setStatus('done');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  };

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-xl border p-5"
      style={{
        background: 'linear-gradient(135deg, hsl(0 85% 50% / 0.08) 0%, hsl(0 0% 10%) 60%)',
        borderColor: 'hsl(0 85% 50% / 0.3)',
        boxShadow: '0 0 40px hsl(0 85% 50% / 0.07)',
      }}
    >
      {/* Glow orb */}
      <div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: 'hsl(0 85% 50% / 0.12)', filter: 'blur(40px)' }}
      />

      <div className="relative flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 gradient-red"
          style={{ boxShadow: '0 0 20px hsl(0 85% 50% / 0.4)' }}
        >
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <p className="font-bold text-sm tracking-wide" style={{ color: 'hsl(var(--foreground))' }}>
                AI Chat Analysis
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Powered by Gemini · Auto-generated
              </p>
            </div>
            {(status === 'done' || status === 'error') && (
              <button
                onClick={run}
                className="p-1.5 rounded-lg border transition-colors hover:border-primary/50 shrink-0"
                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
                title="Regenerate"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {status === 'loading' && (
            <div className="flex items-center gap-3 py-2">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: 'hsl(var(--primary))' }} />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 rounded-full animate-pulse w-3/4" style={{ background: 'hsl(var(--muted))' }} />
                <div className="h-3 rounded-full animate-pulse w-1/2" style={{ background: 'hsl(var(--muted))' }} />
                <div className="h-3 rounded-full animate-pulse w-2/3" style={{ background: 'hsl(var(--muted))' }} />
              </div>
            </div>
          )}

          {status === 'done' && (
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'hsl(var(--foreground) / 0.9)' }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }}
            />
          )}

          {status === 'nokey' && (
            <div className="flex items-center gap-3 py-1">
              <AlertCircle className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--primary))' }} />
              <p className="text-sm flex-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Add your Gemini API key to auto-generate the vibe analysis.
              </p>
              <button
                onClick={onOpenApiKey}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg gradient-red shrink-0"
                style={{ color: 'hsl(var(--primary-foreground))' }}
              >
                <Key className="w-3 h-3" /> Add Key
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-start gap-2 py-1">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'hsl(var(--destructive))' }} />
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {error}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
