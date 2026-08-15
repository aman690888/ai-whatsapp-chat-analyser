import { useEffect, useState } from 'react';
import { Sparkles, Loader2, RefreshCw, AlertCircle, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { askGemini, getStoredApiKey } from '@/lib/gemini-ai';
import type { ParsedMessage, ChatStats } from '@/lib/whatsapp-parser';

interface AIVibeCardProps {
  messages: ParsedMessage[];
  stats: ChatStats;
  onOpenApiKey: () => void;
}

const VIBE_PROMPT =
  'Analyze this WhatsApp chat history and give me a dramatic, deep, and highly detailed psychological breakdown of the relationship dynamic between these two people. Explain their communication styles, who holds the conversational power, any unspoken tension, and the overall vibe of their connection. Write a compelling, detailed paragraph. Finally, hit return twice, and end with a brutal, highly accurate, one-line Gen-Z style roast summarizing their texting habits.';

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

export function AIVibeCard({ messages, stats, onOpenApiKey }: AIVibeCardProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'nokey' | 'error'>('idle');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const run = async () => {
    const apiKey = getStoredApiKey();
    if (!apiKey) { setStatus('nokey'); return; }
    setStatus('loading'); setError('');
    try {
      const answer = await askGemini(VIBE_PROMPT, messages, stats, apiKey, 2048);
      setResult(answer); setStatus('done');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e)); setStatus('error');
    }
  };

  useEffect(() => { run(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
      className="relative rounded-2xl border p-5 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--accent) / 0.07) 0%, hsl(var(--bg-glass)) 55%)',
        borderColor: 'hsl(var(--accent) / 0.25)',
        boxShadow: '0 0 60px hsl(var(--accent) / 0.06), 0 8px 32px hsl(0 0% 0% / 0.4)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Glow orb */}
      <div className="orb absolute -top-16 -right-16 w-48 h-48" style={{ background: 'hsl(var(--accent) / 0.1)' }} />

      <div className="relative flex items-start gap-3">
        <div className="icon-badge accent-glow w-10 h-10 rounded-xl shrink-0" style={{ boxShadow: '0 0 24px hsl(var(--accent) / 0.4)' }}>
          <Sparkles className="w-5 h-5" style={{ color: 'hsl(var(--bg-base))' }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <p className="font-semibold text-sm" style={{ color: 'hsl(var(--text-primary))' }}>AI Chat Analysis</p>
              <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--text-tertiary))' }}>Powered by Gemini · Auto-generated</p>
            </div>
            {(status === 'done' || status === 'error') && (
              <button
                onClick={run}
                className="p-1.5 rounded-xl border transition-all hover:border-accent/50"
                style={{ borderColor: 'hsl(var(--border-bright))', color: 'hsl(var(--text-secondary))' }}
                title="Regenerate"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {status === 'loading' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: 'hsl(var(--accent))' }} />
                <div className="space-y-2 flex-1">
                  <div className="shimmer h-3 w-3/4" />
                  <div className="shimmer h-3 w-1/2" />
                  <div className="shimmer h-3 w-2/3" />
                </div>
              </motion.div>
            )}

            {status === 'done' && (
              <motion.p
                key="done"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                className="text-sm leading-relaxed whitespace-pre-wrap"
                style={{ color: 'hsl(var(--text-secondary))' }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }}
              />
            )}

            {status === 'nokey' && (
              <motion.div key="nokey" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 py-1">
                <AlertCircle className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--accent))' }} />
                <p className="text-sm flex-1" style={{ color: 'hsl(var(--text-secondary))' }}>
                  Add your Gemini API key to auto-generate the vibe analysis.
                </p>
                <button onClick={onOpenApiKey} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl accent-glow shrink-0" style={{ color: 'hsl(var(--bg-base))' }}>
                  <Key className="w-3 h-3" /> Add Key
                </button>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-start gap-2 py-1">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'hsl(var(--destructive))' }} />
                <p className="text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
