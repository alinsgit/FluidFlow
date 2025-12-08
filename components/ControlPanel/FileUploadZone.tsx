import React, { useRef } from 'react';
import { Upload, FileImage, Palette, X } from 'lucide-react';

interface FileUploadZoneProps {
  file: File | null;
  preview: string | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  variant: 'sketch' | 'brand';
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  file,
  preview,
  onFileSelect,
  onRemove,
  variant
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
    if (inputRef.current) inputRef.current.value = '';
  };

  const isSketch = variant === 'sketch';

  if (isSketch) {
    return (
      <div className="flex-none flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <FileImage className="w-4 h-4 text-slate-500" />
            Source Sketch
          </label>
          {file && (
            <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20 animate-in fade-in zoom-in duration-300">
              Uploaded
            </span>
          )}
        </div>

        <div
          onClick={() => !file && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`
            group relative border-2 border-dashed rounded-xl h-32 flex flex-col items-center justify-center transition-all duration-300 overflow-hidden
            ${file
              ? 'border-blue-500/30 bg-blue-500/5'
              : 'border-slate-700 hover:border-blue-500/50 hover:bg-slate-800/30 cursor-pointer hover:shadow-lg hover:shadow-blue-500/5'
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp"
          />

          {file ? (
            <div className="relative w-full h-full p-4 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
              {preview && preview.trim() ? (
                <div className="relative w-full h-full rounded-lg overflow-hidden border border-white/10 bg-black/20 shadow-inner group-hover:scale-[1.02] transition-transform duration-300">
                  <img src={preview} alt="Sketch preview" className="w-full h-full object-contain" />
                </div>
              ) : (
                <FileImage className="w-8 h-8 text-blue-400" />
              )}

              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 border border-white/10 text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all z-20 shadow-lg"
                title="Remove Image"
                aria-label="Remove sketch image"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <>
              <div className="p-2 rounded-full bg-slate-800/50 group-hover:scale-110 group-hover:bg-slate-700/50 transition-all mb-2 border border-white/5 shadow-xl">
                <Upload className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
              </div>
              <p className="text-xs text-slate-400 font-medium group-hover:text-slate-200 transition-colors">
                Drag sketch here
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Brand variant (compact)
  return (
    <div className="flex-none flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Palette className="w-4 h-4 text-slate-500" />
          Brand Identity{' '}
          <span className="text-[10px] text-slate-600 font-normal uppercase ml-1 tracking-wider border border-white/5 px-1.5 rounded">
            Optional
          </span>
        </label>
        {file && (
          <span className="text-[10px] text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20 animate-in fade-in zoom-in">
            Active
          </span>
        )}
      </div>

      <div
        onClick={() => !file && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`
          relative h-12 rounded-lg border border-dashed flex items-center transition-all cursor-pointer overflow-hidden
          ${file
            ? 'border-pink-500/30 bg-pink-500/5'
            : 'border-slate-700 hover:border-pink-500/40 hover:bg-slate-800/30'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp"
        />

        {file ? (
          <div className="w-full h-full flex items-center justify-between px-3 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-3 overflow-hidden">
              {preview && preview.trim() ? (
                <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex-none overflow-hidden">
                  <img src={preview} alt="Brand" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded bg-pink-500/20 flex items-center justify-center">
                  <Palette className="w-4 h-4 text-pink-400" />
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">{file.name}</p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="p-1.5 rounded-md hover:bg-red-500/10 hover:text-red-400 text-slate-500 transition-colors"
              aria-label="Remove brand image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-pink-300 transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Upload Logo / Style Guide</span>
          </div>
        )}
      </div>
    </div>
  );
};
