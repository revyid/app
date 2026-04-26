import { useState, useRef } from 'react';
import { Upload, Loader2, X } from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinary';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  /** Show a preview thumbnail */
  preview?: boolean;
  /** aspect-ratio class e.g. "aspect-video" or "aspect-square" */
  previewClass?: string;
}

export function ImageUpload({ value, onChange, placeholder = 'https://...', preview = true, previewClass = 'aspect-video' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const url = await uploadToCloudinary(file);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Preview */}
      {preview && value && (
        <div className={`relative w-full ${previewClass} rounded-xl overflow-hidden border border-border bg-surface-variant`}>
          <img src={value} alt="preview" className="w-full h-full object-cover" />
          <button
            onClick={() => onChange('')}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/50 hover:bg-black/70 text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* URL input + upload button */}
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-border bg-surface-container hover:bg-surface-container-high transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
