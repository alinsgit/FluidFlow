import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Check, AlertCircle, FileCode, Zap } from 'lucide-react';
import { batchGenerator } from '../../services/batchGeneration';
import { FileSystem } from '../../types';

interface BatchGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  systemInstruction: string;
  targetFiles: string[];
  onComplete: (files: FileSystem) => void;
}

interface BatchProgress {
  current: number;
  total: number;
  currentBatch: number;
  totalBatches: number;
  status: 'generating' | 'complete' | 'error';
  message?: string;
  error?: string;
}

export const BatchGenerationModal: React.FC<BatchGenerationModalProps> = ({
  isOpen,
  onClose,
  prompt,
  systemInstruction,
  targetFiles,
  onComplete
}) => {
  const [progress, setProgress] = useState<BatchProgress>({
    current: 0,
    total: targetFiles.length,
    currentBatch: 0,
    totalBatches: Math.ceil(targetFiles.length / 5),
    status: 'generating'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [completedFiles, setCompletedFiles] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleStart = async () => {
    setIsGenerating(true);
    setProgress({
      current: 0,
      total: targetFiles.length,
      currentBatch: 0,
      totalBatches: Math.ceil(targetFiles.length / 5),
      status: 'generating'
    });

    try {
      const result = await batchGenerator.generateInBatches(
        prompt,
        systemInstruction,
        targetFiles,
        {
          maxFilesPerBatch: 5,
          maxTokensPerBatch: 8192,
          onProgress: (current, total, currentBatch, totalBatches) => {
            setProgress({
              current,
              total,
              currentBatch,
              totalBatches,
              status: 'generating'
            });
          },
          onBatchComplete: (batchFiles, batchNumber) => {
            const newFiles = Object.keys(batchFiles);
            setCompletedFiles(prev => [...prev, ...newFiles]);
            setProgress(prev => ({
              ...prev,
              message: `Batch ${batchNumber} completed: ${newFiles.join(', ')}`
            }));
          },
          onError: (error, batchNumber) => {
            console.error(`Batch ${batchNumber} failed:`, error);
            setProgress(prev => ({
              ...prev,
              status: 'error',
              error: `Batch ${batchNumber} failed: ${error.message}`
            }));
          }
        }
      );

      if (result.success) {
        setProgress({
          ...progress,
          status: 'complete',
          message: `Successfully generated ${Object.keys(result.files).length} files!`
        });

        // Wait a moment to show success
        setTimeout(() => {
          onComplete(result.files);
          onClose();
        }, 1500);
      } else {
        setProgress(prev => ({
          ...prev,
          status: 'error',
          error: result.error || 'Generation failed'
        }));
      }
    } catch (error) {
      console.error('Batch generation failed:', error);
      setProgress({
        ...progress,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const progressPercentage = Math.round((progress.current / progress.total) * 100);

  return createPortal(
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-slate-950/98 backdrop-blur-xl rounded-2xl border border-white/10 animate-in zoom-in-95 duration-200 shadow-2xl p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
              <FileCode className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">Batch Generation</h2>
              <p className="text-sm text-slate-400">
                Generating {targetFiles.length} files in batches
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Progress */}
        <div className="space-y-6">
          {/* Overall Progress */}
          <div className="bg-slate-900/50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {progress.status === 'generating' && <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />}
                {progress.status === 'complete' && <Check className="w-5 h-5 text-green-400" />}
                {progress.status === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
                <div>
                  <h3 className="text-white font-medium">
                    {progress.status === 'generating' && 'Generating...'}
                    {progress.status === 'complete' && 'Generation Complete!'}
                    {progress.status === 'error' && 'Generation Failed'}
                  </h3>
                  {progress.message && (
                    <p className="text-sm text-slate-400 mt-1">{progress.message}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{progressPercentage}%</div>
                <div className="text-sm text-slate-400">
                  {progress.current}/{progress.total} files
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Batch Info */}
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-slate-400">
                Batch {progress.currentBatch} of {progress.totalBatches}
              </span>
              <span className="text-slate-400">
                5 files per batch max
              </span>
            </div>
          </div>

          {/* Completed Files */}
          {completedFiles.length > 0 && (
            <div className="bg-slate-900/50 rounded-lg p-4 max-h-40 overflow-y-auto">
              <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                Completed Files ({completedFiles.length})
              </h4>
              <div className="space-y-1">
                {completedFiles.map((file, index) => (
                  <div key={index} className="text-xs text-slate-300 font-mono flex items-center gap-2">
                    <FileCode className="w-3 h-3 text-green-400" />
                    {file}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {progress.status === 'error' && progress.error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 text-sm">{progress.error}</p>
            </div>
          )}

          {/* Action Buttons */}
          {!isGenerating && progress.status !== 'complete' && (
            <div className="flex gap-3">
              <button
                onClick={handleStart}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Start Batch Generation
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};