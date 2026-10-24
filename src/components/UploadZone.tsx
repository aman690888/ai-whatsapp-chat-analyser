import { useState, useCallback } from 'react';
import { Upload, FileText, X, Shield, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadZoneProps {
  onFileLoaded: (text: string, filename: string, file?: File) => void;
}

const spring = { type: 'spring', bounce: 0, duration: 0.45 } as const;

export function UploadZone({ onFileLoaded }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);

  const processFile = useCallback((file: File) => {
    setError(null);
    if (!consentChecked) { setError('Please consent to secure processing before uploading.'); return; }
    if (!file.name.endsWith('.txt')) { setError('Please upload a .txt file exported from WhatsApp.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) { setError('Could not read this file. Please try exporting again.'); return; }
      onFileLoaded(text, file.name, file);
    };
    reader.onerror = () => setError('Failed to read file. Try a different .txt export.');
    reader.readAsText(file, 'UTF-8');
  }, [consentChecked, onFileLoaded]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={spring}
      className="relative min-h-screen mesh-bg flex flex-col items-center justify-center overflow-hidden px-4"
    >
      {/* Ambient orbs */}
      <div className="orb absolute -top-32 left-1/4 w-96 h-96" style={{ background: 'hsl(var(--accent) / 0.12)' }} />
      <div className="orb absolute bottom-0 right-1/4 w-80 h-80" style={{ background: 'hsl(200 70% 50% / 0.08)' }} />

      <div className="relative z-10 w-full max-w-lg">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.1 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="icon-badge accent-glow w-12 h-12 rounded-2xl" style={{ boxShadow: '0 0 32px hsl(var(--accent) / 0.45)' }}>
              <FileText className="w-6 h-6" style={{ color: 'hsl(var(--bg-base))' }} />
            </div>
            <span className="text-3xl font-bold tracking-tight" style={{ color: 'hsl(var(--text-primary))' }}>
              Chat<span style={{ color: 'hsl(var(--accent))' }}>Lens</span>
            </span>
          </div>

          <h1 className="text-5xl font-bold tracking-tight leading-[1.08] mb-4" style={{ color: 'hsl(var(--text-primary))' }}>
            Your WhatsApp<br />
            <span style={{ color: 'hsl(var(--accent))' }} className="glow-text">Decoded.</span>
          </h1>

          <p className="text-base leading-relaxed" style={{ color: 'hsl(var(--text-secondary))' }}>
            Deep analytics, AI insights, and beautiful visualisations — all from a single exported chat file.
          </p>
        </motion.div>

        {/* Drop zone */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.18 }}
        >
          <motion.label
            htmlFor="file-upload"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={spring}
            className={`drop-zone block cursor-pointer p-10 text-center ${isDragging ? 'drop-zone-active' : ''}`}
            style={{ background: isDragging ? 'hsl(var(--accent) / 0.06)' : 'hsl(var(--bg-glass) / 0.6)', backdropFilter: 'blur(20px)' }}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div
                animate={isDragging ? { scale: 1.2, rotate: 8 } : { scale: 1, rotate: 0 }}
                transition={spring}
                className="icon-badge w-14 h-14 rounded-2xl"
                style={{ background: isDragging ? 'hsl(var(--accent))' : 'hsl(var(--bg-glass-raised))' }}
              >
                <Upload className="w-7 h-7" style={{ color: isDragging ? 'hsl(var(--bg-base))' : 'hsl(var(--accent))' }} />
              </motion.div>

              <div>
                <p className="text-base font-semibold mb-1" style={{ color: 'hsl(var(--text-primary))' }}>
                  {isDragging ? 'Release to upload' : 'Drop your WhatsApp export here'}
                </p>
                <p className="text-sm" style={{ color: 'hsl(var(--text-secondary))' }}>
                  or <span style={{ color: 'hsl(var(--accent))' }}>click to browse</span> — .txt files only
                </p>
              </div>
            </div>
            <input id="file-upload" type="file" accept=".txt" className="hidden" onChange={handleChange} />
          </motion.label>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={spring}
              className="mt-4 flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm"
              style={{ background: 'hsl(var(--destructive) / 0.12)', border: '1px solid hsl(var(--destructive) / 0.3)', color: 'hsl(var(--destructive))' }}
            >
              <X className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Consent */}
        <motion.label
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ ...spring, delay: 0.28 }}
          className="mt-4 flex items-start gap-3 p-4 rounded-2xl cursor-pointer glass-card"
          style={{ background: 'hsl(var(--bg-glass) / 0.5)' }}
        >
          <div
            className="mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all"
            style={{ borderColor: consentChecked ? 'hsl(var(--accent))' : 'hsl(var(--border-bright))', background: consentChecked ? 'hsl(var(--accent))' : 'transparent' }}
          >
            {consentChecked && <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.4, duration: 0.3 }} className="w-3 h-3" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="hsl(var(--bg-base))" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></motion.svg>}
          </div>
          <input type="checkbox" checked={consentChecked} onChange={e => { setConsentChecked(e.target.checked); if (e.target.checked) setError(null); }} className="hidden" />
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Shield className="w-3.5 h-3.5" style={{ color: 'hsl(var(--accent))' }} />
              <span className="text-xs font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>Secure & Private</span>
            </div>
            <span className="text-xs" style={{ color: 'hsl(var(--text-secondary))' }}>
              I consent to having this chat file processed for analysis.
            </span>
          </div>
        </motion.label>

        {/* Export hint */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ ...spring, delay: 0.35 }}
          className="mt-6 flex items-center justify-center gap-2 text-xs"
          style={{ color: 'hsl(var(--text-tertiary))' }}
        >
          <span>WhatsApp</span>
          <ChevronRight className="w-3 h-3" />
          <span>Chat</span>
          <ChevronRight className="w-3 h-3" />
          <span>More</span>
          <ChevronRight className="w-3 h-3" />
          <span>Export Chat (without media)</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
