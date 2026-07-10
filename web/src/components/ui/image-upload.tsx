'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2, CheckCircle2, Camera } from 'lucide-react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  variant?: 'cover' | 'avatar';
  bucket?: string;
  path?: string;
  transformOptions?: Record<string, unknown>;
  className?: string;
}

export default function ImageUpload({
  value,
  onChange,
  label = 'รูปภาพ',
  variant = 'cover',
  bucket = 'product',
  path = 'public',
  transformOptions: rawTransformOptions,
  className = '',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const blobUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (value) {
      setPreviewUrl(value)
    }
  }, [value])

  const transformOptions = rawTransformOptions ?? (variant === 'avatar'
    ? { resize: { width: 128, height: 0 }, transparent: true, format: 'png', quality: 80 }
    : { resize: { width: 640, height: 0 }, format: 'webp', quality: 80 });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    blobUrlRef.current = objectUrl;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', path);
      formData.append('options', JSON.stringify(transformOptions));
      formData.append('bucket', bucket);

      const res = await fetch(`${SUPABASE_URL}/functions/v1/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ANON_KEY}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setPreviewUrl(data.url);
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      onChange(data.url);
    } catch {
      setPreviewUrl(value || null);
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      onChange(value || '');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  /* ─── Avatar variant ─── */
  if (variant === 'avatar') {
    return (
      <div className={`relative inline-flex flex-col items-center gap-2 ${className}`}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        <button
          type="button"
          onClick={isUploading ? undefined : triggerFileInput}
          disabled={isUploading}
          className="group relative h-28 w-28 overflow-hidden rounded-full border-2 border-primary/20 bg-primary/5 shadow-sm transition-colors hover:border-primary/40"
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Camera className="h-8 w-8 text-primary/40" />
            </div>
          )}

          {isUploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 className="h-7 w-7 animate-spin text-white" />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
              <Camera className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          )}
        </button>

        {label && (
          <span className="text-xs text-muted-foreground">{label}</span>
        )}

        {previewUrl && !isUploading && (
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white shadow-sm hover:bg-destructive/90"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  /* ─── Cover variant (default) ─── */
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-primary">{label}</label>
      )}

      {previewUrl ? (
        <div className="relative w-full overflow-hidden rounded-lg border border-primary/20 bg-white shadow-sm">
          <img
            src={previewUrl}
            alt="Preview"
            className="mx-auto max-h-56 w-full object-contain"
          />
          {isUploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          ) : (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/30 bg-white/50 px-4 py-8 transition-colors hover:border-primary/60 hover:bg-primary/5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          {isUploading ? (
            <>
              <Loader2 className="mb-2 h-8 w-8 animate-spin text-primary/60" />
              <span className="text-sm text-muted-foreground">กำลังอัปโหลด...</span>
            </>
          ) : (
            <>
              <Upload className="mb-2 h-8 w-8 text-primary/40" />
              <span className="text-sm text-muted-foreground">
                คลิกเพื่อเลือกรูป หรือลากวางที่นี่
              </span>
              <span className="mt-1 text-xs text-muted-foreground/60">
                รองรับ JPG, PNG, WebP (สูงสุด 640px กว้าง)
              </span>
            </>
          )}
        </label>
      )}

      {value && !isUploading && (
        <p className="flex items-center gap-1 text-xs text-success">
          <CheckCircle2 className="h-3 w-3" />
          อัปโหลดรูปเรียบร้อย
        </p>
      )}
    </div>
  );
}
