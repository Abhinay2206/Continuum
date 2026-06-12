'use client';

import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { TerminalSquare, X } from 'lucide-react';

export default function TerminalPanel({ repoId }: { repoId: string }) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { isTerminalOpen, sandboxStatus, sandboxError, toggleTerminal } = useWorkspaceStore();

  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const term = new Terminal({
      theme: {
        background: '#07070F',
        foreground: '#C0C0DC',
        cursor: '#7B6CF6',
        cursorAccent: '#07070F',
        selectionBackground: 'rgba(123, 108, 246, 0.25)',
        black: '#1A1A32', red: '#F87171', green: '#34D399', yellow: '#FBBF24',
        blue: '#60A5FA', magenta: '#A78BFA', cyan: '#22D3EE', white: '#C0C0DC',
        brightBlack: '#3A3A5A', brightRed: '#FCA5A5', brightGreen: '#6EE7B7',
        brightYellow: '#FDE68A', brightBlue: '#93C5FD', brightMagenta: '#C4B5FD',
        brightCyan: '#67E8F9', brightWhite: '#E8E8F8',
      },
      fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", monospace',
      fontSize: 12,
      lineHeight: 1.6,
      cursorBlink: true,
      cursorStyle: 'bar',
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    let observer: ResizeObserver | null = null;
    let timeoutId: NodeJS.Timeout;

    // Delay opening the terminal to ensure the DOM layout is settled and container has dimensions
    timeoutId = setTimeout(() => {
      if (!terminalRef.current) return;
      
      try {
        term.open(terminalRef.current);
        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // Use ResizeObserver for reliable fit — avoids the "dimensions undefined" crash
        observer = new ResizeObserver(() => {
          if (!fitAddonRef.current || !xtermRef.current) return;
          const el = terminalRef.current;
          if (!el || el.clientWidth === 0 || el.clientHeight === 0) return;
          try { fitAddonRef.current.fit(); } catch { /* container not ready */ }
        });
        observer.observe(terminalRef.current);
        
        try { fitAddon.fit(); } catch { /* ignore */ }

        term.writeln('\x1b[2m── Continuum Terminal ──\x1b[0m');
        term.writeln('\x1b[38;5;99mWaiting for sandbox...\x1b[0m');
      } catch (err) {
        console.error("Error opening terminal:", err);
      }
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      if (observer) observer.disconnect();
      term.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!xtermRef.current) return;

    if (sandboxStatus === 'failed') {
      xtermRef.current.writeln(
        `\x1b[31m✗ Sandbox unavailable\x1b[0m${sandboxError ? ` \x1b[2m— ${sandboxError}\x1b[0m` : ''}`
      );
      return;
    }

    if (sandboxStatus === 'ready' && !wsRef.current) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//localhost:8000/ws/sandbox/${repoId}/terminal`);
      wsRef.current = ws;

      ws.onopen = () => {
        xtermRef.current?.writeln('\x1b[32m✓ Connected to sandbox\x1b[0m');
        try { fitAddonRef.current?.fit(); } catch { /* ignore */ }
      };
      ws.onmessage = e => xtermRef.current?.write(e.data);
      ws.onclose = () => {
        xtermRef.current?.writeln('\x1b[31m\r\n✗ Connection closed\x1b[0m');
        wsRef.current = null;
      };

      xtermRef.current.onData(data => {
        if (ws.readyState === WebSocket.OPEN) ws.send(data);
      });
    }

    return () => {
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    };
  }, [repoId, sandboxStatus, sandboxError]);

  if (!isTerminalOpen) return null;

  return (
    <div className="flex flex-col h-full" style={{ background: '#07070F', borderTop: '1px solid #1A1A32' }}>
      {/* Terminal Header */}
      <div className="flex items-center px-4 h-8 flex-shrink-0 gap-2" style={{ background: '#0A0A1C', borderBottom: '1px solid #1A1A32' }}>
        <TerminalSquare size={13} style={{ color: '#7B6CF6' }} />
        <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#4A4A6A' }}>Terminal</span>
        <div className="flex-1" />
        <button
          onClick={toggleTerminal}
          className="w-5 h-5 flex items-center justify-center rounded transition-colors"
          style={{ color: '#4A4A6A' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#8080A8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#4A4A6A')}
        >
          <X size={12} />
        </button>
      </div>
      {/* Terminal Body */}
      <div className="flex-1 overflow-hidden px-2 py-1" ref={terminalRef} />
    </div>
  );
}
