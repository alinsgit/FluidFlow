import React from 'react';

interface SettingsInputProps {
  label: string;
  description?: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'password';
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  monospace?: boolean;
}

export const SettingsInput: React.FC<SettingsInputProps> = ({
  label,
  description,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled = false,
  min,
  max,
  step,
  suffix,
  monospace = false
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
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className={`w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50 disabled:cursor-not-allowed ${
            monospace ? 'font-mono' : ''
          } ${suffix ? 'pr-12' : ''}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};

export default SettingsInput;
