import React from 'react';
import { FileText, FilePlus, FileX, GitMerge, Copy, LucideIcon } from 'lucide-react';
import { CommitFileChange } from '@/services/projectApi';
import { CommitFileIconProps } from './types';

const iconConfigs: Record<CommitFileChange['status'], { Icon: LucideIcon; color: string }> = {
  added: { Icon: FilePlus, color: 'text-emerald-400' },
  modified: { Icon: FileText, color: 'text-amber-400' },
  deleted: { Icon: FileX, color: 'text-red-400' },
  renamed: { Icon: GitMerge, color: 'text-purple-400' },
  copied: { Icon: Copy, color: 'text-blue-400' },
  unknown: { Icon: FileText, color: 'text-slate-400' },
};

export const CommitFileIcon: React.FC<CommitFileIconProps> = ({ status }) => {
  const { Icon, color } = iconConfigs[status] || iconConfigs.unknown;
  return <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />;
};

export default CommitFileIcon;
