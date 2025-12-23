import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, MousePointer2, Sparkles, Layers, Target, GripVertical, Minimize2, Maximize2 } from 'lucide-react';

export interface InspectedElement {
  tagName: string;
  className: string;
  id?: string;
  textContent?: string;
  rect: { top: number; left: number; width: number; height: number };
  componentName?: string;
  parentComponents?: string[];
  styles?: Record<string, string>;
  // FluidFlow identification attributes
  ffGroup?: string;  // data-ff-group value
  ffId?: string;     // data-ff-id value
}

export type EditScope = 'element' | 'group';

interface ComponentInspectorProps {
  element: InspectedElement | null;
  onClose: () => void;
  onSubmit: (prompt: string, element: InspectedElement, scope: EditScope) => void;
  isProcessing: boolean;
}

export const ComponentInspector: React.FC<ComponentInspectorProps> = ({
  element,
  onClose,
  onSubmit,
  isProcessing
}) => {
  const [prompt, setPrompt] = useState('');
  const [scope, setScope] = useState<EditScope>('element');
  const [isMinimized, setIsMinimized] = useState(false);

  // Drag state for modal - floating mode
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasBeenDragged, setHasBeenDragged] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset position when element changes
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
    setHasBeenDragged(false);
  }, [element?.ffId]);

  // Drag handlers - improved for smoother movement
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setHasBeenDragged(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    // Add cursor style to body during drag
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      // Get viewport bounds for constraining
      const modal = modalRef.current;
      if (modal) {
        const rect = modal.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width / 2;
        const minX = -window.innerWidth + rect.width / 2;
        const maxY = window.innerHeight - rect.height - 20;
        const minY = -window.innerHeight + 100;

        setPosition({
          x: Math.max(minX, Math.min(maxX, dragStartRef.current.posX + dx)),
          y: Math.max(minY, Math.min(maxY, dragStartRef.current.posY + dy)),
        });
      } else {
        setPosition({
          x: dragStartRef.current.posX + dx,
          y: dragStartRef.current.posY + dy,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  if (!element) return null;

  const hasGroup = !!element.ffGroup;
  const hasId = !!element.ffId;

  const handleSubmit = () => {
    if (!prompt.trim()) return;

    // Build enhanced prompt with scope context
    let enhancedPrompt = prompt;

    if (scope === 'group' && hasGroup) {
      enhancedPrompt = `[SCOPE: Apply to ALL elements with data-ff-group="${element.ffGroup}"]\n${prompt}`;
    } else if (hasId) {
      enhancedPrompt = `[SCOPE: Apply ONLY to element with data-ff-id="${element.ffId}"${hasGroup ? ` in group "${element.ffGroup}"` : ''}]\n${prompt}`;
    }

    onSubmit(enhancedPrompt, element, scope);
  };

  const quickActions = [
    { label: 'Beautify', prompt: 'Make this component more visually appealing with better colors, shadows, and spacing' },
    { label: 'Add Animation', prompt: 'Add smooth hover animation and transition effects' },
    { label: 'Improve UX', prompt: 'Improve the user experience with better feedback and interactions' },
    { label: 'Make Responsive', prompt: 'Make this component fully responsive for all screen sizes' },
    { label: 'Add Dark Mode', prompt: 'Add dark mode support with appropriate colors' },
    { label: 'Fix Accessibility', prompt: 'Improve accessibility with proper ARIA labels and keyboard support' },
  ];

  // Minimized view
  if (isMinimized) {
    return (
      <div
        ref={modalRef}
        className="absolute z-[200] animate-in fade-in duration-200"
        style={{
          bottom: `calc(16px - ${position.y}px)`,
          left: '50%',
          transform: `translateX(calc(-50% + ${position.x}px))`,
        }}
      >
        <div
          className={`flex items-center gap-2 px-3 py-2 bg-purple-600/90 backdrop-blur-xl rounded-full shadow-2xl cursor-move select-none transition-all ${
            isDragging ? 'ring-2 ring-white/30 scale-105' : 'hover:bg-purple-500/90'
          }`}
          onMouseDown={handleDragStart}
        >
          <GripVertical className="w-4 h-4 text-white/60" />
          <MousePointer2 className="w-4 h-4 text-white" />
          <span className="text-sm font-medium text-white">
            {element.componentName || element.tagName.toLowerCase()}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            title="Expand"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={modalRef}
      className={`absolute z-[200] w-[90%] max-w-[520px] ${
        !hasBeenDragged ? 'animate-in slide-in-from-bottom-4 duration-300' : ''
      }`}
      style={{
        bottom: `calc(16px - ${position.y}px)`,
        left: '50%',
        transform: `translateX(calc(-50% + ${position.x}px))`,
      }}
    >
      <div className={`bg-slate-900/95 backdrop-blur-xl border rounded-2xl shadow-2xl overflow-hidden transition-all ${
        isDragging ? 'border-purple-400 ring-2 ring-purple-500/40 shadow-purple-500/20' : 'border-purple-500/30'
      }`}>
        {/* Header - Full Draggable Area with prominent grip */}
        <div
          className={`flex items-center justify-between px-3 py-2.5 border-b border-white/10 cursor-grab active:cursor-grabbing select-none transition-all ${
            isDragging ? 'bg-purple-500/30' : 'bg-purple-500/10 hover:bg-purple-500/15'
          }`}
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center gap-2">
            {/* Large drag grip indicator */}
            <div className={`p-1.5 rounded-lg transition-colors ${isDragging ? 'bg-purple-500/30' : 'bg-white/5 hover:bg-white/10'}`}>
              <GripVertical className={`w-4 h-4 transition-colors ${isDragging ? 'text-purple-300' : 'text-purple-400/70'}`} />
            </div>
            <MousePointer2 className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-white">Element Selected</span>
            {!hasBeenDragged && (
              <span className="text-[10px] text-purple-400/60 ml-1">drag to move</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
              onMouseDown={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Minimize"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              onMouseDown={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Element Info */}
        <div className="px-4 py-3 border-b border-white/5 bg-slate-950/50">
          <div className="flex items-center gap-2 flex-wrap">
            {element.componentName && (
              <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs font-mono">
                {element.componentName}
              </span>
            )}
            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-mono">
              &lt;{element.tagName.toLowerCase()}&gt;
            </span>
            {element.ffGroup && (
              <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded text-xs font-mono">
                group:{element.ffGroup}
              </span>
            )}
            {element.ffId && (
              <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded text-xs font-mono">
                id:{element.ffId}
              </span>
            )}
            {element.id && (
              <span className="px-2 py-1 bg-amber-500/20 text-amber-300 rounded text-xs font-mono">
                #{element.id}
              </span>
            )}
            {element.className && (
              <span className="px-2 py-1 bg-slate-500/20 text-slate-400 rounded text-xs font-mono truncate max-w-[200px]" title={element.className}>
                .{element.className.split(' ')[0]}
              </span>
            )}
          </div>
          {element.textContent && (
            <p className="mt-2 text-xs text-slate-500 truncate">
              "{element.textContent}"
            </p>
          )}
        </div>

        {/* Scope Selector - Only show if we have ff-group */}
        {hasGroup && (
          <div className="px-4 py-3 border-b border-white/5 bg-slate-900/50">
            <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wide">Apply Changes To</p>
            <div className="flex gap-2">
              <button
                onClick={() => setScope('element')}
                disabled={isProcessing}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  scope === 'element'
                    ? 'bg-cyan-500/20 border-2 border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-800/50 border-2 border-transparent text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Target className="w-4 h-4" />
                <div className="text-left">
                  <div>Only This Element</div>
                  {hasId && <div className="text-[10px] opacity-70">id: {element.ffId}</div>}
                </div>
              </button>
              <button
                onClick={() => setScope('group')}
                disabled={isProcessing}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  scope === 'group'
                    ? 'bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-800/50 border-2 border-transparent text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Layers className="w-4 h-4" />
                <div className="text-left">
                  <div>All in Group</div>
                  <div className="text-[10px] opacity-70">group: {element.ffGroup}</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="px-4 py-3 border-b border-white/5">
          <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wide">Quick Actions</p>
          <div className="flex flex-wrap gap-1.5">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => setPrompt(action.prompt)}
                disabled={isProcessing}
                className="px-2.5 py-1.5 text-xs bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white rounded-lg border border-white/5 hover:border-purple-500/30 transition-all disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Prompt Input */}
        <div className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Describe what to change..."
                disabled={isProcessing}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 disabled:opacity-50"
                autoFocus
              />
              <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/50" />
            </div>
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isProcessing}
              className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white transition-colors"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-slate-600 mt-2 text-center">
            {scope === 'group' && hasGroup
              ? `Changes will apply to all "${element.ffGroup}" elements`
              : hasId
                ? `Changes will apply only to "${element.ffId}"`
                : element.id
                  ? `Editing <${element.tagName.toLowerCase()}>#${element.id}`
                  : element.className
                    ? `Editing <${element.tagName.toLowerCase()}>.${element.className.split(' ')[0]}`
                    : element.textContent
                      ? `Editing <${element.tagName.toLowerCase()}> "${element.textContent.slice(0, 30)}${element.textContent.length > 30 ? '...' : ''}"`
                      : `Editing <${element.tagName.toLowerCase()}> in ${element.componentName || 'component'}`
            }
          </p>
        </div>
      </div>
    </div>
  );
};

// Draggable selection label component
const DraggableLabel: React.FC<{
  selectedRect: { top: number; left: number; width: number; height: number };
  selectedElement?: InspectedElement | null;
}> = ({ selectedRect, selectedElement }) => {
  const [offset, setOffset] = useState({ x: 0, y: -28 }); // Default position above element
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setOffset({
        x: dragStartRef.current.offsetX + dx,
        y: dragStartRef.current.offsetY + dy,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Reset offset when selected element changes
  useEffect(() => {
    setOffset({ x: 0, y: -28 });
  }, [selectedElement?.ffId]);

  return (
    <div
      className={`absolute px-2 py-1.5 bg-purple-600 text-white text-[10px] rounded-lg shadow-xl whitespace-nowrap flex items-center gap-1.5 pointer-events-auto cursor-move select-none z-[150] ${
        isDragging ? 'ring-2 ring-white/50 scale-105' : 'hover:ring-2 hover:ring-white/30'
      } transition-all`}
      style={{
        top: selectedRect.top + offset.y,
        left: selectedRect.left + offset.x,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Drag handle */}
      <svg className="w-3 h-3 opacity-50" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="5" cy="6" r="2" />
        <circle cx="12" cy="6" r="2" />
        <circle cx="5" cy="12" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="5" cy="18" r="2" />
        <circle cx="12" cy="18" r="2" />
      </svg>
      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
      <span className="font-semibold">
        {selectedElement?.componentName || selectedElement?.tagName?.toLowerCase() || 'Element'}
      </span>
      {selectedElement?.ffId && (
        <span className="opacity-60 text-[9px]">#{selectedElement.ffId.slice(0, 6)}</span>
      )}
      {selectedElement?.className && (
        <span className="opacity-50 text-[9px] max-w-[80px] truncate">.{selectedElement.className.split(' ')[0]}</span>
      )}
    </div>
  );
};

// Inspection overlay that shows on the preview when inspect mode is active
export const InspectionOverlay: React.FC<{
  isActive: boolean;
  hoveredRect: { top: number; left: number; width: number; height: number } | null;
  selectedRect: { top: number; left: number; width: number; height: number } | null;
  selectedElement?: InspectedElement | null;
}> = ({ isActive, hoveredRect, selectedRect, selectedElement }) => {
  if (!isActive) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-[100]">
      {/* Hovered element highlight */}
      {hoveredRect && !selectedRect && (
        <div
          className="absolute border-2 border-blue-400 bg-blue-400/10 transition-all duration-75"
          style={{
            top: hoveredRect.top,
            left: hoveredRect.left,
            width: hoveredRect.width,
            height: hoveredRect.height,
          }}
        >
          <div className="absolute -top-6 left-0 px-2 py-0.5 bg-blue-500 text-white text-[10px] rounded whitespace-nowrap shadow-lg">
            Click to select
          </div>
        </div>
      )}

      {/* Selected element highlight with animation */}
      {selectedRect && (
        <>
          {/* Pulsing ring animation */}
          <div
            className="absolute border-2 border-purple-400 rounded-sm animate-pulse"
            style={{
              top: selectedRect.top - 3,
              left: selectedRect.left - 3,
              width: selectedRect.width + 6,
              height: selectedRect.height + 6,
            }}
          />
          {/* Main selection box */}
          <div
            className="absolute border-2 border-purple-500 bg-purple-500/15 shadow-lg shadow-purple-500/25"
            style={{
              top: selectedRect.top,
              left: selectedRect.left,
              width: selectedRect.width,
              height: selectedRect.height,
            }}
          >
            {/* Corner markers */}
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-purple-400" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-purple-400" />
            <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-purple-400" />
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-purple-400" />
          </div>
          {/* Draggable selection label */}
          <DraggableLabel selectedRect={selectedRect} selectedElement={selectedElement} />
        </>
      )}

      {/* Info banner when in inspect mode */}
      {!selectedRect && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-blue-500/90 backdrop-blur text-white text-sm font-medium rounded-full shadow-lg flex items-center gap-2">
          <MousePointer2 className="w-4 h-4" />
          Hover & click to select a component
        </div>
      )}
    </div>
  );
};
