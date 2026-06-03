'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Files, Sparkles, TerminalSquare, Settings, ChevronRight,
  ChevronDown, FolderOpen, Folder, FileText, Play, GitBranch, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspaceStore, FileNode } from '@/store/workspaceStore';
import MonacoEditor from '@/components/workspace/MonacoEditor';
import AIChatPanel from '@/components/workspace/AIChatPanel';
import dynamic from 'next/dynamic';

const TerminalPanel = dynamic(() => import('@/components/workspace/TerminalPanel'), {
  ssr: false,
});

const mockFileTree: FileNode[] = [
  {
    id: 'src', name: 'src', path: '/src', type: 'directory',
    children: [
      { id: 'src/main.ts', name: 'main.ts', path: '/src/main.ts', type: 'file', content: 'console.log("Hello Continuum");' },
      { id: 'src/app.tsx', name: 'app.tsx', path: '/src/app.tsx', type: 'file', content: 'export default function App() { return <div />; }' },
    ]
  },
  { id: 'package.json', name: 'package.json', path: '/package.json', type: 'file', content: '{\n  "name": "continuum-test"\n}' },
  { id: 'README.md', name: 'README.md', path: '/README.md', type: 'file', content: '# Continuum\nWorkspace test.' },
];

const EXT_COLORS: Record<string, string> = {
  ts: '#3B82F6', tsx: '#06B6D4', js: '#F59E0B', jsx: '#F59E0B',
  json: '#34D399', css: '#A78BFA', md: '#6B7280', py: '#F97316',
};

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const color = EXT_COLORS[ext] ?? '#6B7280';
  return <FileText size={13} style={{ color, flexShrink: 0 }} />;
}

function FileTreeItem({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const [isOpen, setIsOpen] = useState(depth === 0);
  const { openFile, activeFileId } = useWorkspaceStore();
  const isSelected = activeFileId === node.id;

  if (node.type === 'directory') {
    return (
      <div>
        <div
          className="flex items-center py-[5px] cursor-pointer select-none transition-colors duration-75"
          style={{
            paddingLeft: `${depth * 12 + 8}px`,
            color: '#8080A0',
            borderRadius: '4px',
          }}
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={e => (e.currentTarget.style.background = '#12122A')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {isOpen
            ? <ChevronDown size={12} className="mr-1 opacity-50 flex-shrink-0" />
            : <ChevronRight size={12} className="mr-1 opacity-50 flex-shrink-0" />}
          {isOpen
            ? <FolderOpen size={13} className="mr-1.5 flex-shrink-0" style={{ color: '#7B6CF6' }} />
            : <Folder size={13} className="mr-1.5 flex-shrink-0" style={{ color: '#7B6CF6' }} />}
          <span className="text-xs font-medium tracking-tight">{node.name}</span>
        </div>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              style={{ overflow: 'hidden' }}
            >
              {node.children?.map(child => (
                <FileTreeItem key={child.id} node={child} depth={depth + 1} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div
      className="flex items-center py-[5px] cursor-pointer text-xs select-none transition-all duration-75"
      style={{
        paddingLeft: `${depth * 12 + 24}px`,
        background: isSelected ? 'rgba(123, 108, 246, 0.12)' : 'transparent',
        color: isSelected ? '#A89BF8' : '#70708A',
        borderLeft: isSelected ? '2px solid rgba(123,108,246,0.7)' : '2px solid transparent',
        borderRadius: '0 4px 4px 0',
      }}
      onClick={() => openFile(node)}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#12122A'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
    >
      <span className="mr-1.5"><FileIcon name={node.name} /></span>
      <span className="truncate tracking-tight">{node.name}</span>
    </div>
  );
}

type ActivityTab = 'explorer' | 'chat' | 'terminal' | null;

export default function Workspace() {
  const params = useParams();
  const repoId = params?.id as string;
  const [activeActivity, setActiveActivity] = useState<ActivityTab>('explorer');
  const {
    setRepositoryId, setFileTree, fileTree,
    isSidebarOpen, isTerminalOpen, isChatOpen,
    toggleSidebar, toggleTerminal, toggleChat,
    sandboxStatus, setSandboxStatus, activeFileId, openFiles,
  } = useWorkspaceStore();

function buildFileTree(files: any[]): FileNode[] {
  const root: FileNode[] = [];
  const dirMap = new Map<string, FileNode>();

  files.forEach(file => {
    const parts = file.filePath.split('/');
    let currentLevel = root;
    let currentPath = '';

    parts.forEach((part: string, index: number) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = index === parts.length - 1;
      
      if (isFile) {
        currentLevel.push({
          id: currentPath,
          name: part,
          path: currentPath,
          type: 'file',
          content: file.content
        });
      } else {
        let dirNode = dirMap.get(currentPath);
        if (!dirNode) {
          dirNode = {
            id: currentPath,
            name: part,
            path: currentPath,
            type: 'directory',
            children: []
          };
          dirMap.set(currentPath, dirNode);
          currentLevel.push(dirNode);
        }
        currentLevel = dirNode.children!;
      }
    });
  });
  
  // Sort directories first, then alphabetically
  const sortTree = (nodes: FileNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(node => {
      if (node.children) sortTree(node.children);
    });
  };
  sortTree(root);
  return root;
}

  useEffect(() => {
    if (repoId) {
      setRepositoryId(repoId);
      
      // Fetch files
      const fetchFiles = async () => {
        try {
          const res = await fetch(`http://localhost:8000/repositories/${repoId}/files`);
          if (res.ok) {
            const data = await res.json();
            const tree = buildFileTree(data.files || []);
            setFileTree(tree);
          }
        } catch (error) {
          console.error("Failed to fetch repository files:", error);
        }
      };
      
      fetchFiles();

      const initSandbox = async () => {
        try {
          setSandboxStatus('creating');
          const res = await fetch(`http://localhost:8000/sandbox/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repo_id: repoId })
          });
          
          if (res.ok) {
            setSandboxStatus('ready');
          } else {
            setSandboxStatus('failed');
          }
        } catch (error) {
          console.error("Failed to init sandbox:", error);
          setSandboxStatus('failed');
        }
      };

      initSandbox();
    }
  }, [repoId, setRepositoryId, setFileTree, setSandboxStatus]);

  const handleActivityClick = (tab: ActivityTab) => {
    if (tab === 'explorer') {
      if (activeActivity === 'explorer') { toggleSidebar(); setActiveActivity(null); }
      else { if (!isSidebarOpen) toggleSidebar(); setActiveActivity('explorer'); }
    } else if (tab === 'terminal') {
      toggleTerminal();
    } else if (tab === 'chat') {
      if (activeActivity === 'chat') { toggleChat(); setActiveActivity(null); }
      else { if (!isChatOpen) toggleChat(); setActiveActivity('chat'); }
    }
  };

  const activeFile = openFiles.find(f => f.id === activeFileId);
  const activeExt = activeFile?.name.split('.').pop()?.toLowerCase() ?? '';
  const langMap: Record<string, string> = { ts: 'TypeScript', tsx: 'TSX', js: 'JavaScript', jsx: 'JSX', json: 'JSON', css: 'CSS', md: 'Markdown', py: 'Python' };
  const activeLang = langMap[activeExt] ?? 'Plain Text';

  const statusColor = {
    inactive: '#6B7280', creating: '#F59E0B', cloning: '#F59E0B',
    installing: '#F59E0B', indexing: '#A78BFA', ready: '#34D399', failed: '#F87171',
  }[sandboxStatus] ?? '#6B7280';

  const statusLabel = {
    inactive: 'Sandbox Inactive', creating: 'Creating…', cloning: 'Cloning…',
    installing: 'Installing…', indexing: 'Indexing…', ready: 'Ready', failed: 'Failed',
  }[sandboxStatus] ?? sandboxStatus;

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden" style={{ background: '#070710', color: '#E0E0EE', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Top Bar */}
      <div className="flex items-center h-10 flex-shrink-0 px-3 gap-3" style={{ background: '#0A0A1C', borderBottom: '1px solid #1A1A32' }}>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7B6CF6, #A78BFA)' }}>
            <Zap size={11} className="text-white" />
          </div>
          <span className="text-xs font-semibold" style={{ color: '#7070A0' }}>continuum</span>
        </div>
        <div style={{ color: '#2A2A4A' }}>/</div>
        <span className="text-xs font-medium tracking-tight" style={{ color: '#C0C0DC' }}>{repoId || 'workspace'}</span>
        <div className="flex-1" />
        <button
          className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all"
          style={{ background: 'rgba(123,108,246,0.15)', color: '#A89BF8', border: '1px solid rgba(123,108,246,0.25)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(123,108,246,0.25)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(123,108,246,0.15)')}
        >
          <Play size={11} />
          Run
        </button>
        <button
          className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all"
          style={{ background: '#12122A', color: '#7070A0', border: '1px solid #1E1E38' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#1A1A32')}
          onMouseLeave={e => (e.currentTarget.style.background = '#12122A')}
        >
          <GitBranch size={11} />
          main
        </button>
      </div>

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden">

        {/* Activity Bar */}
        <div className="flex flex-col items-center py-3 gap-1 flex-shrink-0" style={{ width: '48px', background: '#0A0A1C', borderRight: '1px solid #1A1A32' }}>
          {([
            { id: 'explorer', icon: Files, label: 'Explorer', active: isSidebarOpen && activeActivity === 'explorer' },
            { id: 'chat', icon: Sparkles, label: 'AI Chat', active: isChatOpen && activeActivity === 'chat' },
            { id: 'terminal', icon: TerminalSquare, label: 'Terminal', active: isTerminalOpen },
          ] as const).map(item => (
            <button
              key={item.id}
              title={item.label}
              onClick={() => handleActivityClick(item.id as ActivityTab)}
              className="relative w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-150"
              style={{
                background: item.active ? 'rgba(123,108,246,0.15)' : 'transparent',
                color: item.active ? '#A89BF8' : '#4A4A6A',
              }}
              onMouseEnter={e => { if (!item.active) e.currentTarget.style.color = '#8080A8'; }}
              onMouseLeave={e => { if (!item.active) e.currentTarget.style.color = '#4A4A6A'; }}
            >
              {item.active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{ background: '#7B6CF6' }} />
              )}
              <item.icon size={18} />
            </button>
          ))}
          <div className="flex-1" />
          <button
            title="Settings"
            className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: '#4A4A6A' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#8080A8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#4A4A6A')}
          >
            <Settings size={17} />
          </button>
        </div>

        {/* Explorer Sidebar */}
        <AnimatePresence initial={false}>
          {isSidebarOpen && activeActivity === 'explorer' && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 224, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="flex-shrink-0 flex flex-col overflow-hidden"
              style={{ background: '#0A0A1C', borderRight: '1px solid #1A1A32' }}
            >
              <div className="px-4 h-9 flex items-center flex-shrink-0" style={{ borderBottom: '1px solid #1A1A32' }}>
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#4A4A6A' }}>Explorer</span>
              </div>
              <div className="flex-1 overflow-y-auto py-2 px-1">
                {fileTree.map(node => (
                  <FileTreeItem key={node.id} node={node} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-hidden relative">
            <MonacoEditor />
          </div>
          <AnimatePresence initial={false}>
            {isTerminalOpen && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 220 }}
                exit={{ height: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="flex-shrink-0 overflow-hidden"
              >
                <TerminalPanel repoId={repoId} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI Chat Panel */}
        <AnimatePresence initial={false}>
          {isChatOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="flex-shrink-0 overflow-hidden"
            >
              <AIChatPanel repoId={repoId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status Bar */}
      <div className="flex items-center h-6 px-3 gap-4 flex-shrink-0 select-none" style={{ background: '#060614', borderTop: '1px solid #14142A' }}>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
          <span className="text-[10px] font-medium" style={{ color: statusColor }}>{statusLabel}</span>
        </div>
        <div className="w-px h-3" style={{ background: '#1A1A32' }} />
        <span className="text-[10px]" style={{ color: '#4A4A6A' }}>main</span>
        <div className="flex-1" />
        {activeFile && (
          <>
            <span className="text-[10px]" style={{ color: '#4A4A6A' }}>{activeLang}</span>
            <div className="w-px h-3" style={{ background: '#1A1A32' }} />
            <span className="text-[10px]" style={{ color: '#4A4A6A' }}>UTF-8</span>
          </>
        )}
      </div>
    </div>
  );
}
