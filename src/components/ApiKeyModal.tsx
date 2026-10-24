import { useState } from 'react';
import { Key, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { getStoredApiKey, saveApiKey } from '@/lib/gemini-ai';

interface ApiKeyModalProps {
  onClose: () => void;
  onSaved?: () => void;
}

const spring = { type: 'spring', bounce: 0, duration: 0.4 } as const;

export function ApiKeyModal({ onClose, onSaved }: ApiKeyModalProps) {
  const [value, setValue] = useState(getStoredApiKey);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveApiKey(value);
    setSaved(true);
    onSaved?.();
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 900);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
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
          <button
            onClick={onClose}
            className="p-1 rounded-xl hover:bg-white/5 transition-colors"
            style={{ color: 'hsl(var(--text-tertiary))' }}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm" style={{ color: 'hsl(var(--text-secondary))' }}>
          Get a free key at{' '}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'hsl(var(--accent))' }}
          >
            aistudio.google.com
          </a>
        </p>

        <input
          type="password"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="AIza…"
          className="w-full rounded-xl border px-4 py-3 text-sm bg-transparent outline-none transition-colors"
          style={{
            borderColor: 'hsl(var(--border-bright))',
            color: 'hsl(var(--text-primary))',
            background: 'hsl(var(--bg-glass) / 0.5)',
          }}
          onFocus={e => (e.target.style.borderColor = 'hsl(var(--accent))')}
          onBlur={e => (e.target.style.borderColor = 'hsl(var(--border-bright))')}
        />

        <button
          onClick={handleSave}
          disabled={!value.trim()}
          className="w-full py-3 rounded-xl text-sm font-semibold accent-glow transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ color: 'hsl(var(--bg-base))' }}
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" /> Saved!
            </>
          ) : (
            'Save Key'
          )}
        </button>
      </motion.div>
    </motion.div>
  );
}
