import { create } from 'zustand';

export type SandboxStatus = 'inactive' | 'creating' | 'cloning' | 'installing' | 'indexing' | 'ready' | 'failed';

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: string;
  isModified?: boolean;
}

export interface WorkspaceState {
  repositoryId: string | null;
  sandboxStatus: SandboxStatus;
  sandboxError: string | null;
  
  // File System
  fileTree: FileNode[];
  openFiles: FileNode[];
  activeFileId: string | null;
  
  // Layout State
  isSidebarOpen: boolean;
  isTerminalOpen: boolean;
  isChatOpen: boolean;
  
  // Actions
  setRepositoryId: (id: string) => void;
  setSandboxStatus: (status: SandboxStatus, error?: string | null) => void;
  setFileTree: (tree: FileNode[]) => void;
  openFile: (file: FileNode) => void;
  closeFile: (fileId: string) => void;
  setActiveFile: (fileId: string) => void;
  updateFileContent: (fileId: string, content: string) => void;
  toggleSidebar: () => void;
  toggleTerminal: () => void;
  toggleChat: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  repositoryId: null,
  sandboxStatus: 'inactive',
  sandboxError: null,
  
  fileTree: [],
  openFiles: [],
  activeFileId: null,
  
  isSidebarOpen: true,
  isTerminalOpen: true,
  isChatOpen: true,
  
  setRepositoryId: (id) => set({ repositoryId: id }),
  setSandboxStatus: (status, error = null) => set({ sandboxStatus: status, sandboxError: error }),
  setFileTree: (tree) => set({ fileTree: tree }),
  
  openFile: (file) => {
    const { openFiles } = get();
    if (!openFiles.find((f) => f.id === file.id)) {
      set({ openFiles: [...openFiles, file], activeFileId: file.id });
    } else {
      set({ activeFileId: file.id });
    }
  },
  
  closeFile: (fileId) => {
    const { openFiles, activeFileId } = get();
    const newOpenFiles = openFiles.filter((f) => f.id !== fileId);
    let newActiveId = activeFileId;
    if (activeFileId === fileId) {
      newActiveId = newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1].id : null;
    }
    set({ openFiles: newOpenFiles, activeFileId: newActiveId });
  },
  
  setActiveFile: (fileId) => set({ activeFileId: fileId }),
  
  updateFileContent: (fileId, content) => {
    const { openFiles } = get();
    set({
      openFiles: openFiles.map((f) =>
        f.id === fileId ? { ...f, content, isModified: true } : f
      ),
    });
  },
  
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleTerminal: () => set((state) => ({ isTerminalOpen: !state.isTerminalOpen })),
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
}));
