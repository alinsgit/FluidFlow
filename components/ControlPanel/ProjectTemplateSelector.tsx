import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, LayoutDashboard, Rocket, ClipboardList, Check, ChevronRight,
  FileCode, Sparkles
} from 'lucide-react';
import { PROJECT_TEMPLATES, ProjectTemplate } from '@/constants/projectTemplates';
import type { FileSystem } from '@/types';

const ICON_MAP: Record<string, typeof LayoutDashboard> = {
  LayoutDashboard,
  Rocket,
  ClipboardList,
};

interface ProjectTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (name: string, description: string, files: FileSystem) => Promise<void>;
  isLoading?: boolean;
}

export const ProjectTemplateSelector: React.FC<ProjectTemplateSelectorProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  isLoading = false,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [projectName, setProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSelectTemplate = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setProjectName(template.name);
  };

  const handleCreate = async () => {
    if (!selectedTemplate || !projectName.trim()) return;

    setIsCreating(true);
    try {
      await onSelectTemplate(
        projectName.trim(),
        selectedTemplate.description,
        selectedTemplate.files
      );
      handleClose();
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setSelectedTemplate(null);
    setProjectName('');
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-150"
      style={{ backgroundColor: 'var(--theme-overlay)' }}
      onClick={handleClose}
    >
      <div
        className="w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col mx-4"
        style={{ backgroundColor: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            borderBottom: '1px solid var(--theme-border-light)',
            background: 'linear-gradient(to right, color-mix(in srgb, var(--theme-accent) 10%, transparent), color-mix(in srgb, var(--theme-ai-accent) 10%, transparent))'
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl"
              style={{
                background: 'linear-gradient(to bottom right, var(--theme-accent), var(--theme-ai-accent))'
              }}
            >
              <Sparkles className="w-5 h-5" style={{ color: 'var(--theme-text-primary)' }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--theme-text-primary)' }}>Start from Template</h2>
              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Choose a pre-built template to get started quickly</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Templates Grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PROJECT_TEMPLATES.map((template) => {
                const Icon = ICON_MAP[template.icon] || LayoutDashboard;
                const isSelected = selectedTemplate?.id === template.id;

                return (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className="group relative p-5 rounded-xl border-2 transition-all text-left"
                    style={{
                      borderColor: isSelected ? 'var(--color-info)' : 'var(--theme-border-light)',
                      backgroundColor: isSelected ? 'var(--color-info-subtle)' : 'var(--theme-glass-100)'
                    }}
                  >
                    {/* Selected Indicator */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-info)' }}>
                        <Check className="w-4 h-4" style={{ color: 'var(--theme-text-primary)' }} />
                      </div>
                    )}

                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.previewColor} flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6" style={{ color: 'var(--theme-text-primary)' }} />
                    </div>

                    {/* Info */}
                    <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>{template.name}</h3>
                    <p className="text-xs mb-4 line-clamp-2" style={{ color: 'var(--theme-text-muted)' }}>{template.description}</p>

                    {/* Features */}
                    <div className="flex flex-wrap gap-1.5">
                      {template.features.slice(0, 3).map((feature) => (
                        <span
                          key={feature}
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: 'var(--theme-glass-200)', color: 'var(--theme-text-muted)' }}
                        >
                          {feature}
                        </span>
                      ))}
                      {template.features.length > 3 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--theme-glass-200)', color: 'var(--theme-text-dim)' }}>
                          +{template.features.length - 3}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Empty/Blank Project Option */}
              <button
                onClick={handleClose}
                className="group p-5 rounded-xl border-2 border-dashed transition-all text-left"
                style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-glass-100)' }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--theme-glass-200)' }}>
                  <FileCode className="w-6 h-6" style={{ color: 'var(--theme-text-dim)' }} />
                </div>
                <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--theme-text-muted)' }}>Start Blank</h3>
                <p className="text-xs" style={{ color: 'var(--theme-text-dim)' }}>Create an empty project and build from scratch</p>
              </button>
            </div>
          </div>

          {/* Preview Panel */}
          {selectedTemplate && (
            <div className="w-80 flex flex-col" style={{ borderLeft: '1px solid var(--theme-border-light)', backgroundColor: 'var(--theme-surface-dark)' }}>
              {/* Preview Header */}
              <div className="p-4" style={{ borderBottom: '1px solid var(--theme-border-light)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${selectedTemplate.previewColor} flex items-center justify-center`}>
                    {(() => {
                      const Icon = ICON_MAP[selectedTemplate.icon] || LayoutDashboard;
                      return <Icon className="w-5 h-5" style={{ color: 'var(--theme-text-primary)' }} />;
                    })()}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{selectedTemplate.name}</h3>
                    <p className="text-[10px]" style={{ color: 'var(--theme-text-dim)' }}>{selectedTemplate.category}</p>
                  </div>
                </div>

                <p className="text-xs mb-4" style={{ color: 'var(--theme-text-muted)' }}>{selectedTemplate.description}</p>

                {/* Features List */}
                <div className="space-y-1.5">
                  {selectedTemplate.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                      <Check className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-success)' }} />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* File Preview */}
              <div className="flex-1 p-4 overflow-y-auto">
                <h4 className="text-[10px] uppercase tracking-wide mb-2" style={{ color: 'var(--theme-text-dim)' }}>Included Files</h4>
                <div className="space-y-1">
                  {Object.keys(selectedTemplate.files).map((file) => (
                    <div key={file} className="flex items-center gap-2 text-xs py-1" style={{ color: 'var(--theme-text-muted)' }}>
                      <FileCode className="w-3.5 h-3.5" style={{ color: 'var(--theme-text-dim)' }} />
                      <span className="truncate font-mono">{file}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Create Form */}
              <div className="p-4 space-y-3" style={{ borderTop: '1px solid var(--theme-border-light)' }}>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--theme-text-muted)' }}>Project Name</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="My Project"
                    className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                    style={{ backgroundColor: 'var(--theme-glass-200)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}
                  />
                </div>
                <button
                  onClick={handleCreate}
                  disabled={!projectName.trim() || isCreating || isLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 font-medium rounded-lg transition-colors disabled:opacity-50"
                  style={{ backgroundColor: 'var(--color-info)', color: 'var(--theme-text-primary)' }}
                >
                  {isCreating || isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--theme-glass-300)', borderTopColor: 'var(--theme-text-primary)' }} />
                      Creating...
                    </>
                  ) : (
                    <>
                      <ChevronRight className="w-4 h-4" />
                      Create Project
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProjectTemplateSelector;
