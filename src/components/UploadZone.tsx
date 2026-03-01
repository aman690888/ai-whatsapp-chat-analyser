import { useCallback, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';

interface UploadZoneProps {
  onFileLoaded: (text: string, filename: string) => void;
}

export function UploadZone({ onFileLoaded }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = (file: File) => {
    setError(null);
    if (!file.name.endsWith('.txt')) {
      setError('Please upload a .txt file exported from WhatsApp.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      onFileLoaded(text, file.name);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

      <div className="relative z-10 text-center px-4 max-w-2xl w-full">
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 gradient-red rounded-2xl flex items-center justify-center shadow-lg" style={{ boxShadow: '0 0 30px hsl(0 85% 50% / 0.4)' }}>
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-3xl font-bold tracking-tight glow-text" style={{ color: 'hsl(var(--foreground))' }}>
              Chat<span style={{ color: 'hsl(var(--primary))' }}>Lens</span>
            </span>
          </div>
          <h1 className="text-5xl font-bold mb-4 leading-tight" style={{ color: 'hsl(var(--foreground))' }}>
            Analyze Your<br />
            <span style={{ color: 'hsl(var(--primary))' }} className="glow-text">WhatsApp Chats</span>
          </h1>
          <p style={{ color: 'hsl(var(--muted-foreground))' }} className="text-lg">
            Upload your exported chat file to unlock deep insights, beautiful analytics, and an AI-powered chat assistant.
          </p>
        </div>

        {/* Drop Zone */}
        <label
          htmlFor="file-upload"
          className={`block cursor-pointer rounded-2xl border-2 border-dashed p-12 transition-all duration-200 ${
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50 hover:bg-primary/5'
          }`}
          style={{ background: isDragging ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--card) / 0.7)' }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isDragging ? 'gradient-red scale-110' : 'bg-muted'}`}>
              <Upload className={`w-8 h-8 ${isDragging ? 'text-primary-foreground' : ''}`} style={{ color: isDragging ? undefined : 'hsl(var(--primary))' }} />
            </div>
            <div>
              <p className="text-lg font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                Drop your WhatsApp export here
              </p>
              <p style={{ color: 'hsl(var(--muted-foreground))' }}>
                or <span style={{ color: 'hsl(var(--primary))' }}>click to browse</span> — .txt files only
              </p>
            </div>
          </div>
          <input id="file-upload" type="file" accept=".txt" className="hidden" onChange={handleChange} />
        </label>

        {error && (
          <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'hsl(var(--destructive) / 0.15)', border: '1px solid hsl(var(--destructive) / 0.3)', color: 'hsl(var(--destructive))' }}>
            <X className="w-4 h-4 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <p className="mt-6 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          💡 Export: WhatsApp → Chat → More → Export Chat (without media)
        </p>
      </div>
    </div>
  );
}
