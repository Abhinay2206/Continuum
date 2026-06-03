'use client';

import { useWorkspaceStore } from '@/store/workspaceStore';
import Editor, { DiffEditor } from '@monaco-editor/react';
import { X, FileText } from 'lucide-react';

const EXT_COLORS: Record<string, string> = {
  ts: '#3B82F6', tsx: '#06B6D4', js: '#F59E0B', jsx: '#F59E0B',
  json: '#34D399', css: '#A78BFA', md: '#6B7280', py: '#F97316',
};

function getLanguage(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    json: 'json', css: 'css', html: 'html', py: 'python', md: 'markdown',
  };
  return map[ext ?? ''] ?? 'plaintext';
}

export default function MonacoEditor() {
  const { openFiles, activeFileId, updateFileContent } = useWorkspaceStore();
  const activeFile = openFiles.find(f => f.id === activeFileId);

  if (!activeFile && openFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-4" style={{ background: '#07070F' }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(123,108,246,0.08)', border: '1px solid rgba(123,108,246,0.15)' }}>
          <FileText size={22} style={{ color: '#7B6CF6', opacity: 0.7 }} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: '#4A4A6A' }}>No file open</p>
          <p className="text-xs mt-1" style={{ color: '#2E2E4A' }}>Select a file from the explorer</p>
        </div>
      </div>
    );
  }

  const language = activeFile ? getLanguage(activeFile.name) : 'plaintext';

  return (
    <div className="flex flex-col h-full w-full" style={{ background: '#07070F' }}>
      {/* Tab Bar */}
      <div className="flex h-9 overflow-x-auto flex-shrink-0 items-end" style={{ background: '#0A0A1C', borderBottom: '1px solid #1A1A32' }}>
        {openFiles.map(file => {
          const isActive = file.id === activeFileId;
          const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
          const color = EXT_COLORS[ext] ?? '#6B7280';
          return (
            <div
              key={file.id}
              className="flex items-center gap-2 px-4 h-full cursor-pointer transition-all flex-shrink-0 relative group"
              style={{
                background: isActive ? '#07070F' : 'transparent',
                color: isActive ? '#D0D0EE' : '#50506A',
                borderRight: '1px solid #1A1A32',
                fontSize: '12px',
                minWidth: 0,
              }}
              onClick={() => useWorkspaceStore.getState().setActiveFile(file.id)}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#0E0E22'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              {isActive && (
                <span className="absolute top-0 left-0 right-0 h-0.5" style={{ background: '#7B6CF6' }} />
              )}
              <span style={{ color, opacity: isActive ? 1 : 0.5 }}>
                <FileText size={12} />
              </span>
              <span className="font-medium tracking-tight truncate max-w-[120px]">{file.name}</span>
              {file.isModified && (
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#F59E0B' }} />
              )}
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 rounded hover:text-white"
                style={{ color: '#50506A' }}
                onClick={e => {
                  e.stopPropagation();
                  useWorkspaceStore.getState().closeFile(file.id);
                }}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        {activeFile ? (
          <Editor
            height="100%"
            language={language}
            value={activeFile.content ?? ''}
            theme="vs-dark"
            onChange={value => {
              if (value !== undefined) updateFileContent(activeFile.id, value);
            }}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", monospace',
              fontLigatures: true,
              lineHeight: 22,
              padding: { top: 20, bottom: 20 },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              formatOnPaste: true,
              renderLineHighlight: 'line',
              lineNumbers: 'on',
              glyphMargin: false,
              folding: true,
              scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
              overviewRulerBorder: false,
              hideCursorInOverviewRuler: true,
              renderWhitespace: 'none',
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
            }}
            beforeMount={monaco => {
              monaco.editor.defineTheme('continuum', {
                base: 'vs-dark',
                inherit: true,
                rules: [
                  { token: 'keyword', foreground: 'A78BFA' },
                  { token: 'string', foreground: '34D399' },
                  { token: 'comment', foreground: '3D3D6A', fontStyle: 'italic' },
                  { token: 'number', foreground: 'FB923C' },
                  { token: 'type', foreground: '22D3EE' },
                ],
                colors: {
                  'editor.background': '#07070F',
                  'editor.foreground': '#D0D0EE',
                  'editor.lineHighlightBackground': '#0F0F1E',
                  'editor.selectionBackground': '#7B6CF620',
                  'editorLineNumber.foreground': '#2A2A4A',
                  'editorLineNumber.activeForeground': '#5A5A8A',
                  'editorIndentGuide.background1': '#14142A',
                  'editorCursor.foreground': '#7B6CF6',
                  'editor.inactiveSelectionBackground': '#7B6CF610',
                  'scrollbar.shadow': '#00000000',
                  'scrollbarSlider.background': '#2A2A4A50',
                  'scrollbarSlider.hoverBackground': '#3A3A6A70',
                },
              });
            }}
            onMount={(_editor, monaco) => {
              monaco.editor.setTheme('continuum');
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full" style={{ background: '#07070F' }}>
            <p className="text-sm" style={{ color: '#2E2E4A' }}>Select a file to edit</p>
          </div>
        )}
      </div>
    </div>
  );
}
