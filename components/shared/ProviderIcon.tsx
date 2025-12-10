import React from 'react';
import { Sparkles, Server, Monitor, Cloud, Cpu } from 'lucide-react';
import { ProviderType } from '@/services/ai/types';

interface ProviderIconProps {
  type: ProviderType;
  className?: string;
}

/**
 * Shared component for displaying AI provider icons
 * Used across AISettingsModal, AIProviderSettings, and AIProvidersPanel
 */
export const ProviderIcon: React.FC<ProviderIconProps> = ({ type, className = "w-5 h-5" }) => {
  switch (type) {
    case 'gemini':
      return <Sparkles className={`${className} text-blue-400`} />;
    case 'openai':
      return <div className={`${className} rounded-sm bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white`}>AI</div>;
    case 'anthropic':
      return <div className={`${className} rounded-sm bg-orange-500 flex items-center justify-center text-[10px] font-bold text-white`}>A</div>;
    case 'zai':
      return <div className={`${className} rounded-sm bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white`}>Z</div>;
    case 'ollama':
      return <Server className={`${className} text-purple-400`} />;
    case 'lmstudio':
      return <Monitor className={`${className} text-pink-400`} />;
    case 'openrouter':
      return <Cloud className={`${className} text-cyan-400`} />;
    case 'custom':
      return <Cpu className={`${className} text-amber-400`} />;
    default:
      return <Cpu className={`${className} text-slate-400`} />;
  }
};

export default ProviderIcon;
