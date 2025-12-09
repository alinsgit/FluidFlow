import React from 'react';

interface SettingsSliderProps {
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  suffix?: string;
  showValue?: boolean;
}

export const SettingsSlider: React.FC<SettingsSliderProps> = ({
  label,
  description,
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled = false,
  suffix = '',
  showValue = true
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`space-y-2 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-white block">{label}</span>
          {description && (
            <span className="text-xs text-slate-500 block mt-0.5">{description}</span>
          )}
        </div>
        {showValue && (
          <span className="text-sm text-slate-400 tabular-nums">
            {value}{suffix}
          </span>
        )}
      </div>
      <div className="relative">
        <input
          type="range"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${percentage}%, rgb(51 65 85) ${percentage}%, rgb(51 65 85) 100%)`
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-600">
        <span>{min}{suffix}</span>
        <span>{max}{suffix}</span>
      </div>
    </div>
  );
};

export default SettingsSlider;
