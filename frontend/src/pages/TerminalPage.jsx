import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

export default function TerminalPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const terminalRef = useRef(null);
  const fitAddonRef = useRef(null);
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);

  const shortId = id ? id.slice(0, 12) : '';

  useEffect(() => {
    // Create terminal instance
    const terminal = new Terminal({
      cursorBlink: true,
      theme: { background: '#0a0a0a', foreground: '#e5e5e5' },
      fontSize: 13,
      fontFamily: 'monospace',
    });
    terminalRef.current = terminal;

    // Attach fit addon
    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    terminal.loadAddon(fitAddon);

    // Open terminal into DOM
    terminal.open(containerRef.current);
    fitAddon.fit();

    // Handle window resize
    function handleResize() {
      fitAddon.fit();
    }
    window.addEventListener('resize', handleResize);

    // Connect WebSocket
    const token = localStorage.getItem('dockmaster_token');
    const ws = new WebSocket(
      `ws://localhost:4000/api/containers/${id}/terminal?token=${token}`
    );
    ws.binaryType = 'blob';
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onmessage = async (event) => {
      const bytes = new Uint8Array(await event.data.arrayBuffer());
      terminal.write(bytes);
    };

    ws.onclose = () => {
      setConnected(false);
      terminal.write('\r\n\x1b[31mConnection closed\x1b[0m\r\n');
    };

    ws.onerror = () => {
      setConnected(false);
      terminal.write('\r\n\x1b[31mConnection closed\x1b[0m\r\n');
    };

    // Send keystrokes to WS
    terminal.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      ws.close();
      terminal.dispose();
    };
  }, [id]);

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/containers')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-mono text-sm text-muted-foreground">{shortId}</span>
        <h1 className="text-xl font-semibold">Terminal</h1>
        <div className="ml-auto">
          {connected ? (
            <Badge className="bg-green-600 text-white border-transparent">Connected</Badge>
          ) : (
            <Badge variant="destructive">Disconnected</Badge>
          )}
        </div>
      </div>

      {/* Terminal container */}
      <div className="flex-1 bg-[#0a0a0a] rounded-md overflow-hidden p-2">
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
