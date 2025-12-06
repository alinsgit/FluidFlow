import React, { useState } from 'react';
import { Layers, Trash2, Settings } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { FileSystem, ChatMessage, ChatAttachment, FileChange } from '../../types';
import { cleanGeneratedCode } from '../../utils/cleanCode';
import { generateContextForPrompt } from '../../utils/codemap';
import { debugLog } from '../../hooks/useDebugStore';

// Sub-components
import { ChatPanel } from './ChatPanel';
import { ChatInput } from './ChatInput';
import { SettingsPanel } from './SettingsPanel';
import { ModeToggle } from './ModeToggle';

interface ControlPanelProps {
  files: FileSystem;
  setFiles: (files: FileSystem) => void;
  activeFile: string;
  setActiveFile: (file: string) => void;
  setSuggestions: (suggestions: string[] | null) => void;
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
  resetApp: () => void;
  reviewChange: (label: string, newFiles: FileSystem) => void;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

// Calculate file changes between two file systems
function calculateFileChanges(oldFiles: FileSystem, newFiles: FileSystem): FileChange[] {
  const changes: FileChange[] = [];
  const allKeys = new Set([...Object.keys(oldFiles), ...Object.keys(newFiles)]);

  allKeys.forEach(path => {
    const oldContent = oldFiles[path] || '';
    const newContent = newFiles[path] || '';

    if (oldContent !== newContent) {
      const oldLines = oldContent ? oldContent.split('\n').length : 0;
      const newLines = newContent ? newContent.split('\n').length : 0;

      let type: 'added' | 'modified' | 'deleted' = 'modified';
      if (!oldContent) type = 'added';
      else if (!newContent) type = 'deleted';

      changes.push({
        path,
        type,
        additions: type === 'deleted' ? 0 : Math.max(0, newLines - oldLines + (type === 'added' ? newLines : 0)),
        deletions: type === 'added' ? 0 : Math.max(0, oldLines - newLines + (type === 'deleted' ? oldLines : 0))
      });
    }
  });

  return changes;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  files,
  setFiles,
  setSuggestions,
  isGenerating,
  setIsGenerating,
  resetApp,
  reviewChange,
  selectedModel,
  onModelChange
}) => {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConsultantMode, setIsConsultantMode] = useState(false);
  const [isEducationMode, setIsEducationMode] = useState(false);

  // Streaming state
  const [streamingStatus, setStreamingStatus] = useState<string>('');
  const [streamingChars, setStreamingChars] = useState(0);

  const existingApp = files['src/App.tsx'];

  const handleSend = async (prompt: string, attachments: ChatAttachment[]) => {
    // Create user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      timestamp: Date.now(),
      prompt: prompt || (attachments.length > 0 ? 'Generate from uploaded sketch' : ''),
      attachments: attachments.length > 0 ? attachments : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);
    setSuggestions(null);

    // Get attachments
    const sketchAtt = attachments.find(a => a.type === 'sketch');
    const brandAtt = attachments.find(a => a.type === 'brand');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      if (isConsultantMode) {
        // Consultant mode - return suggestions
        const systemInstruction = `You are a Senior Product Manager and UX Expert. Analyze the provided wireframe/sketch deeply.
Identify missing UX elements, accessibility gaps, logical inconsistencies, or edge cases.
Output ONLY a raw JSON array of strings containing your specific suggestions. Do not include markdown formatting.`;

        const parts: any[] = [];
        if (sketchAtt) {
          const base64Data = sketchAtt.preview.split(',')[1];
          parts.push({ inlineData: { mimeType: sketchAtt.file.type, data: base64Data } });
        }
        parts.push({
          text: prompt ? `Analyze this design. Context: ${prompt}` : 'Analyze this design for UX gaps.'
        });

        const requestId = debugLog.request('generation', {
          model: selectedModel,
          prompt: prompt || 'Analyze design for UX gaps',
          systemInstruction,
          attachments: attachments.map(a => ({ type: a.type, size: a.file.size })),
          metadata: { mode: 'consultant' }
        });
        const startTime = Date.now();

        const response = await ai.models.generateContent({
          model: selectedModel,
          contents: { parts },
          config: {
            systemInstruction,
            responseMimeType: 'application/json'
          }
        });

        const text = response.text || '[]';

        debugLog.response('generation', {
          id: requestId,
          model: selectedModel,
          duration: Date.now() - startTime,
          response: text,
          metadata: { mode: 'consultant' }
        });
        try {
          const suggestionsData = JSON.parse(text);
          setSuggestions(Array.isArray(suggestionsData) ? suggestionsData : ['Could not parse suggestions.']);

          // Add assistant message
          const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            timestamp: Date.now(),
            explanation: `## UX Analysis Complete\n\nI found **${Array.isArray(suggestionsData) ? suggestionsData.length : 0} suggestions** to improve your design. Check the suggestions panel on the right.`,
            snapshotFiles: { ...files }
          };
          setMessages(prev => [...prev, assistantMessage]);
        } catch {
          setSuggestions(['Error parsing consultant suggestions.']);
        }
      } else {
        // Generate/Update app mode
        let systemInstruction = `You are an expert React Developer. Your task is to generate or update a React application.

**RESPONSE FORMAT**: You MUST return a JSON object with exactly two keys:
1. "explanation": A markdown string explaining what you built/changed, the components created, and any important technical decisions.
2. "files": A JSON object where keys are file paths and values are the code content.

**CODE REQUIREMENTS**:
- Entry point MUST be 'src/App.tsx'
- Break UI into logical sub-components in 'src/components/'
- Use absolute import paths matching file keys (e.g., 'src/components/Header')
- Use Tailwind CSS for styling
- Use 'lucide-react' for icons
- Create realistic mock data (5-8 entries), NO "Lorem Ipsum"
- Modern, clean aesthetic with generous padding

**EXPLANATION REQUIREMENTS**:
Write a clear markdown explanation including:
- What was built/changed
- List of components created with brief descriptions
- Any technical decisions or patterns used
- Tips for customization`;

        if (brandAtt) {
          systemInstruction += `\n\n**BRANDING**: Extract the PRIMARY DOMINANT COLOR from the brand logo and use it for primary actions/accents.`;
        }

        if (isEducationMode) {
          systemInstruction += `\n\n**EDUCATION MODE**: Add detailed inline comments explaining complex Tailwind classes and React hooks.`;
        }

        const parts: any[] = [];

        if (sketchAtt) {
          const base64Data = sketchAtt.preview.split(',')[1];
          parts.push({ text: 'SKETCH/WIREFRAME:' });
          parts.push({ inlineData: { mimeType: sketchAtt.file.type, data: base64Data } });
        }

        if (brandAtt) {
          const base64Data = brandAtt.preview.split(',')[1];
          parts.push({ text: 'BRAND LOGO:' });
          parts.push({ inlineData: { mimeType: brandAtt.file.type, data: base64Data } });
        }

        if (existingApp) {
          // Generate codemap for better context understanding
          const codeContext = generateContextForPrompt(files);
          parts.push({ text: `${codeContext}\n\n### Full Source Files\n\`\`\`json\n${JSON.stringify(files, null, 2)}\n\`\`\`` });
          parts.push({ text: `USER REQUEST: ${prompt || 'Refine the app based on the attached images.'}` });
          systemInstruction += `\n\nYou are UPDATING an existing project. The codemap above shows the current structure.
- Maintain existing component names and prop interfaces
- Keep import paths consistent with the current structure
- Return ALL files in the "files" object, including unchanged ones
- Only modify files that need changes based on the user request`;
        } else {
          parts.push({ text: `TASK: Create a React app from this design. ${prompt ? `Additional context: ${prompt}` : ''}` });
        }

        // Use streaming for better UX
        setStreamingStatus('🚀 Starting generation...');
        setStreamingChars(0);

        const genRequestId = debugLog.request('generation', {
          model: selectedModel,
          prompt: prompt || 'Generate/Update app',
          systemInstruction,
          attachments: attachments.map(a => ({ type: a.type, size: a.file.size })),
          metadata: { mode: 'generator', hasExistingApp: !!existingApp }
        });
        const genStartTime = Date.now();

        const stream = await ai.models.generateContentStream({
          model: selectedModel,
          contents: { parts },
          config: {
            systemInstruction,
            responseMimeType: 'application/json'
          }
        });

        let fullText = '';
        let detectedFiles: string[] = [];
        let chunkCount = 0;

        // Process stream chunks
        for await (const chunk of stream) {
          const chunkText = chunk.text || '';
          fullText += chunkText;
          chunkCount++;
          setStreamingChars(fullText.length);

          // Log every 10th chunk to avoid spam
          if (chunkCount % 10 === 0) {
            debugLog.stream('generation', {
              id: genRequestId,
              metadata: { chunkCount, totalChars: fullText.length, filesDetected: detectedFiles.length }
            });
          }

          // Try to detect file paths as they appear
          const fileMatches = fullText.match(/"src\/[^"]+\.tsx?"/g);
          if (fileMatches) {
            const newFiles = fileMatches.map(m => m.replace(/"/g, '')).filter(f => !detectedFiles.includes(f));
            if (newFiles.length > 0) {
              detectedFiles = [...detectedFiles, ...newFiles];
              setStreamingStatus(`📁 ${detectedFiles.length} files detected: ${detectedFiles[detectedFiles.length - 1]}`);
            }
          }

          // Update status with character count
          if (detectedFiles.length === 0) {
            setStreamingStatus(`⚡ Generating... (${Math.round(fullText.length / 1024)}KB)`);
          }
        }

        setStreamingStatus('✨ Parsing response...');

        try {
          // Clean any markdown artifacts from the response
          const cleanedText = cleanGeneratedCode(fullText);
          const result = JSON.parse(cleanedText);
          const explanation = result.explanation || 'App generated successfully.';
          const newFiles = result.files || result; // Support both formats

          debugLog.response('generation', {
            id: genRequestId,
            model: selectedModel,
            duration: Date.now() - genStartTime,
            response: JSON.stringify({ explanation, fileCount: Object.keys(newFiles).length, files: Object.keys(newFiles) }),
            metadata: { mode: 'generator', totalChunks: chunkCount, totalChars: fullText.length }
          });

          // Clean code in each file
          for (const [path, content] of Object.entries(newFiles)) {
            if (typeof content === 'string') {
              newFiles[path] = cleanGeneratedCode(content);
            }
          }

          // Ensure we have src/App.tsx
          if (!newFiles['src/App.tsx']) {
            throw new Error('No src/App.tsx in response');
          }

          const mergedFiles = { ...files, ...newFiles };
          const fileChanges = calculateFileChanges(files, mergedFiles);

          setStreamingStatus(`✅ Generated ${Object.keys(newFiles).length} files!`);

          // Add assistant message
          const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            timestamp: Date.now(),
            explanation,
            files: newFiles,
            fileChanges,
            snapshotFiles: { ...files } // Save state before this change for revert
          };
          setMessages(prev => [...prev, assistantMessage]);

          // Show diff modal
          reviewChange(existingApp ? 'Updated App' : 'Generated Initial App', mergedFiles);
        } catch (e) {
          console.error('Parse error:', e, fullText.slice(0, 500));
          setStreamingStatus('❌ Failed to parse response');

          debugLog.error('generation', e instanceof Error ? e.message : 'Parse error', {
            id: genRequestId,
            model: selectedModel,
            duration: Date.now() - genStartTime,
            response: fullText.slice(0, 1000),
            metadata: { mode: 'generator', totalChunks: chunkCount }
          });

          const errorMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            timestamp: Date.now(),
            error: 'Failed to generate project. Please try again.',
            snapshotFiles: { ...files }
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      }
    } catch (error) {
      console.error('Error generating content:', error);

      debugLog.error('generation', error instanceof Error ? error.message : 'Unknown error', {
        model: selectedModel,
        metadata: { mode: isConsultantMode ? 'consultant' : 'generator' }
      });

      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        snapshotFiles: { ...files }
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
      // Clear streaming status after a delay so user sees final status
      setTimeout(() => {
        setStreamingStatus('');
        setStreamingChars(0);
      }, 2000);
    }
  };

  const handleRevert = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message?.snapshotFiles) {
      reviewChange(`Revert to earlier state`, message.snapshotFiles);
    }
  };

  const handleRetry = (errorMessageId: string) => {
    // Find the error message and the user message before it
    const errorIndex = messages.findIndex(m => m.id === errorMessageId);
    if (errorIndex < 1) return;

    const userMessage = messages[errorIndex - 1];
    if (userMessage.role !== 'user') return;

    // Remove the error message and user message from chat
    setMessages(prev => prev.filter((_, i) => i !== errorIndex && i !== errorIndex - 1));

    // Re-send the request
    handleSend(
      userMessage.prompt || '',
      userMessage.attachments || []
    );
  };

  const handleReset = () => {
    setMessages([]);
    resetApp();
  };

  return (
    <aside className="w-full md:w-[30%] md:min-w-[360px] md:max-w-[440px] h-full min-h-0 flex flex-col bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl overflow-hidden relative z-20 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-white/5">
            <Layers className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-slate-300">
              FluidFlow
            </h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide">AI APP BUILDER</p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="p-2 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
          title="Clear All & Reset"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Messages */}
      <ChatPanel
        messages={messages}
        onRevert={handleRevert}
        onRetry={handleRetry}
        isGenerating={isGenerating}
        streamingStatus={streamingStatus}
        streamingChars={streamingChars}
      />

      {/* Mode Toggle */}
      <div className="px-3 py-2 border-t border-white/5 flex-shrink-0">
        <ModeToggle
          isConsultantMode={isConsultantMode}
          onToggle={() => setIsConsultantMode(!isConsultantMode)}
        />
      </div>

      {/* Chat Input */}
      <ChatInput
        onSend={handleSend}
        isGenerating={isGenerating}
        hasExistingApp={!!existingApp}
        placeholder={isConsultantMode ? "Describe what to analyze..." : undefined}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isEducationMode={isEducationMode}
        onEducationModeChange={setIsEducationMode}
        hasApiKey={!!process.env.API_KEY}
        selectedModel={selectedModel}
        onModelChange={onModelChange}
      />
    </aside>
  );
};
