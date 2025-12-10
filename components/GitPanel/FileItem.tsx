import React from 'react';
import { Check, FileText, FilePlus, FileX } from 'lucide-react';
import { FileItemProps } from './types';

const statusColors = {
  staged: 'text-emerald-400',
  modified: 'text-amber-400',
  untracked: 'text-blue-400',
  deleted: 'text-red-400',
};

const StatusIcons = {
  staged: Check,
  modified: FileText,
  untracked: FilePlus,
  deleted: FileX,
};

export const FileItem: React.FC<FileItemProps> = ({ file, status }) => {
  const StatusIcon = StatusIcons[status];

  return (
    <div className="flex items-center gap-2.5 px-2.5 py-1.5 ml-4 text-sm text-slate-400 hover:bg-white/5 rounded">
      <StatusIcon className={`w-4 h-4 ${statusColors[status]}`} />
      <span className="truncate">{file}</span>
    </div>
  );
};

export default FileItem;
