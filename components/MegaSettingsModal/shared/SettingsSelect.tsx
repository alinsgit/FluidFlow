import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SettingsSelectProps {
  label: string;
  description?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const SettingsSelect: React.FC<SettingsSelectProps> = ({
  label,
  description,
  value,
  options,
  onChange,
  disabled = false
}) => {
  return (
    <div className={`space-y-2 ${disabled ? 'opacity-50' : ''}`}>
      <div>
        <span className="text-sm text-white block">{label}</span>
        {description && (
          <span className="text-xs text-slate-500 block mt-0.5">{description}</span>
        )}
      </div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-blue-500/50 appearance-none cursor-pointer disabled:cursor-not-allowed"
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
};

export default SettingsSelect;
