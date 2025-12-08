import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Package, Palette, Database, Globe, Check, RotateCcw, Sparkles, Layers, Zap, FileText } from 'lucide-react';
import { useTechStack } from '../../hooks/useTechStack';

interface TechStackOption {
  value: string;
  label: string;
  description: string;
  version: string;
}

interface TechCategory {
  key: string;
  label: string;
  icon: any;
  color: string;
  options: TechStackOption[];
}

interface TechStackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const techCategories: TechCategory[] = [
  {
    key: 'styling',
    label: 'Styling',
    icon: Palette,
    color: 'text-blue-400',
    options: [
      { value: 'tailwind', label: 'Tailwind CSS', description: 'Utility-first CSS framework', version: 'latest' },
      { value: 'bootstrap', label: 'Bootstrap', description: 'Popular CSS framework', version: 'latest' },
      { value: 'material-ui', label: 'Material-UI', description: 'React Material Design components', version: 'latest' },
      { value: 'ant-design', label: 'Ant Design', description: 'Enterprise UI design language', version: 'latest' },
      { value: 'chakra-ui', label: 'Chakra UI', description: 'Simple modular component library', version: 'latest' },
      { value: 'css-modules', label: 'CSS Modules', description: 'Locally scoped CSS', version: 'built-in' },
      { value: 'styled-components', label: 'Styled Components', description: 'CSS-in-JS styling', version: 'latest' },
      { value: 'emotion', label: 'Emotion', description: 'Performance-focused CSS-in-JS', version: 'latest' }
    ]
  },
  {
    key: 'icons',
    label: 'Icons',
    icon: Package,
    color: 'text-green-400',
    options: [
      { value: 'lucide-react', label: 'Lucide React', description: 'Beautiful & consistent icons', version: 'latest' },
      { value: 'react-icons', label: 'React Icons', description: 'Multiple icon packs in one', version: 'latest' },
      { value: 'heroicons', label: 'Heroicons', description: 'Handcrafted SVG icons', version: 'latest' },
      { value: 'material-icons', label: 'Material Icons', description: 'Google Material icons', version: 'latest' },
      { value: 'font-awesome', label: 'Font Awesome', description: 'The internet\'s icon library', version: 'latest' }
    ]
  },
  {
    key: 'stateManagement',
    label: 'State Management',
    icon: Database,
    color: 'text-purple-400',
    options: [
      { value: 'none', label: 'None (React State)', description: 'Built-in React useState/useReducer', version: 'built-in' },
      { value: 'zustand', label: 'Zustand', description: 'Small, fast, scalable state management', version: 'latest' },
      { value: 'redux-toolkit', label: 'Redux Toolkit', description: 'Official Redux toolkit', version: 'latest' },
      { value: 'context-api', label: 'Context API', description: 'React built-in context', version: 'built-in' },
      { value: 'recoil', label: 'Recoil', description: 'Facebook\'s state management library', version: 'latest' },
      { value: 'mobx', label: 'MobX', description: 'Simple, scalable state management', version: 'latest' }
    ]
  },
  {
    key: 'routing',
    label: 'Routing',
    icon: Globe,
    color: 'text-orange-400',
    options: [
      { value: 'none', label: 'None (Single Page)', description: 'No routing needed', version: 'built-in' },
      { value: 'react-router', label: 'React Router', description: 'Declarative routing for React', version: 'latest' },
      { value: 'next-router', label: 'Next.js Router', description: 'Next.js built-in router', version: 'built-in' },
      { value: 'reach-router', label: 'Reach Router', description: 'Accessible routing', version: 'latest' }
    ]
  },
  {
    key: 'dataFetching',
    label: 'Data Fetching',
    icon: Zap,
    color: 'text-cyan-400',
    options: [
      { value: 'none', label: 'None (Fetch API)', description: 'Built-in fetch API', version: 'built-in' },
      { value: 'axios', label: 'Axios', description: 'Promise based HTTP client', version: 'latest' },
      { value: 'react-query', label: 'React Query', description: 'Server state management', version: 'latest' },
      { value: 'swr', label: 'SWR', description: 'React Hooks for data fetching', version: 'latest' },
      { value: 'apollo-client', label: 'Apollo Client', description: 'GraphQL client', version: 'latest' }
    ]
  },
  {
    key: 'forms',
    label: 'Forms',
    icon: FileText,
    color: 'text-pink-400',
    options: [
      { value: 'none', label: 'None (HTML Forms)', description: 'Standard HTML forms', version: 'built-in' },
      { value: 'react-hook-form', label: 'React Hook Form', description: 'Performant forms with easy validation', version: 'latest' },
      { value: 'formik', label: 'Formik', description: 'Build forms in React', version: 'latest' },
      { value: 'final-form', label: 'Final Form', description: 'High performance subscription-based form state', version: 'latest' }
    ]
  },
  {
    key: 'animations',
    label: 'Animations',
    icon: Sparkles,
    color: 'text-yellow-400',
    options: [
      { value: 'none', label: 'None (CSS Transitions)', description: 'CSS transitions/animations', version: 'built-in' },
      { value: 'framer-motion', label: 'Framer Motion', description: 'Production-ready motion library', version: 'latest' },
      { value: 'react-spring', label: 'React Spring', description: 'Spring physics based animation', version: 'latest' },
      { value: 'react-transition-group', label: 'React Transition Group', description: 'Animation components for React', version: 'latest' }
    ]
  },
  {
    key: 'testing',
    label: 'Testing',
    icon: Check,
    color: 'text-red-400',
    options: [
      { value: 'none', label: 'None', description: 'No testing library', version: 'built-in' },
      { value: 'jest', label: 'Jest', description: 'JavaScript testing framework', version: 'latest' },
      { value: 'vitest', label: 'Vitest', description: 'Next generation testing framework', version: 'latest' },
      { value: 'react-testing-library', label: 'React Testing Library', description: 'Simple and complete testing utilities', version: 'latest' }
    ]
  }
];

export const TechStackModal: React.FC<TechStackModalProps> = ({ isOpen, onClose }) => {
  const { techStack, updateTechStack, resetTechStack } = useTechStack();
  const [selectedCategory, setSelectedCategory] = useState<string>('styling');

  if (!isOpen) return null;

  const currentCategory = techCategories.find(cat => cat.key === selectedCategory);
  const currentOptions = currentCategory?.options || [];
  const currentSelection = techStack[selectedCategory as keyof typeof techStack];

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="w-full max-w-5xl bg-slate-950/98 backdrop-blur-xl rounded-2xl border border-white/10 animate-in zoom-in-95 duration-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
              <Package className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Technology Stack</h2>
              <p className="text-xs text-slate-400">Choose your preferred libraries and frameworks</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetTechStack}
              className="flex items-center gap-2 px-3 py-1.5 text-xs bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors"
              title="Reset to default stack"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Category Selection */}
          <div className="w-64 bg-slate-900/50 border-r border-white/5 p-4">
            <div className="space-y-1">
              {techCategories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.key;

                return (
                  <button
                    key={category.key}
                    onClick={() => setSelectedCategory(category.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                      isSelected
                        ? 'bg-white/10 text-white border border-white/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? category.color : ''}`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{category.label}</div>
                      <div className="text-xs opacity-70 capitalize">
                        {techStack[category.key as keyof typeof techStack]?.library}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-green-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content - Options */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              {/* Category Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  {currentCategory && <currentCategory.icon className={`w-6 h-6 ${currentCategory.color}`} />}
                  <h3 className="text-xl font-semibold text-white">
                    {currentCategory?.label}
                  </h3>
                </div>
                <p className="text-sm text-slate-400">
                  Select your preferred {selectedCategory.toLowerCase()} library for the generated code
                </p>
              </div>

              {/* Options Grid */}
              <div className="grid gap-3">
                {currentOptions.map((option) => {
                  const isSelected = currentSelection?.library === option.value;

                  return (
                    <button
                      key={option.value}
                      onClick={() => updateTechStack(selectedCategory as keyof typeof techStack, option.value, option.version)}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 text-white'
                          : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600 text-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm">{option.label}</h4>
                            {isSelected && <Check className="w-4 h-4 text-green-400" />}
                          </div>
                          <p className="text-xs text-slate-400 mb-2">{option.description}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-slate-900/50 rounded-md text-slate-400">
                              {option.version}
                            </span>
                            {isSelected && (
                              <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-md font-medium">
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Current Stack Summary */}
              <div className="mt-8 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                <h4 className="text-sm font-semibold text-white mb-3">Current Stack</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {techCategories.map((cat) => {
                    const selection = techStack[cat.key as keyof typeof techStack];
                    return (
                      <div key={cat.key} className="flex items-center gap-2">
                        <cat.icon className={`w-3 h-3 ${cat.color}`} />
                        <span className="text-slate-300">{selection?.library || 'none'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};