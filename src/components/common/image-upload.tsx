'use client';

import React, { useRef, useState } from 'react';
import { Camera, Loader2, X, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useS3Upload } from '@/hooks/use-s3-upload';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string;
  previewUrl?: string;
  onChange: (url: string) => void;
  className?: string;
  shape?: 'circle' | 'rectangle';
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  previewUrl,
  onChange,
  className,
  shape = 'circle',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, uploadProgress } = useS3Upload();
  
  // Create ref to store the last successful upload context
  const lastUploadRef = React.useRef<{ key: string; url: string } | null>(null);

  const [preview, setPreview] = useState<string | null>(
    previewUrl || (value?.startsWith('http') ? value : null)
  );

  // Update preview if previewUrl changes (e.g. after user data is loaded)
  React.useEffect(() => {
    if (lastUploadRef.current && lastUploadRef.current.key === value) {
      setPreview(lastUploadRef.current.url);
      return;
    }
    setPreview(previewUrl || (value?.startsWith('http') ? value : null));
  }, [previewUrl, value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to S3
    const result = await uploadFile(file);
    if (result) {
      lastUploadRef.current = { key: result.key, url: result.fileUrl };
      setPreview(result.fileUrl);
      onChange(result.key); // Save the path/key in the database
    } else {
      setPreview(value || null);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('relative group', className)}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={cn(
          'relative overflow-hidden cursor-pointer border-2 border-dashed border-muted-foreground/20 bg-muted/30 hover:border-primary/50 transition-colors flex items-center justify-center',
          shape === 'circle' ? 'rounded-full aspect-square w-32' : 'rounded-xl aspect-video w-full'
        )}
      >
        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <img
                src={preview}
                alt="Upload preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="text-white w-8 h-8" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2 text-muted-foreground"
            >
              <UploadCloud className="w-8 h-8" />
              <span className="text-xs font-medium">Upload Image</span>
            </motion.div>
          )}
        </AnimatePresence>

        {isUploading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-[10px] font-bold">{uploadProgress}%</span>
            <div className="w-20 h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </motion.div>


    </div>
  );
};
