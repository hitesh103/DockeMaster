import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { useContainerLogs } from '../hooks/useContainerLogs';

const TAIL_OPTIONS = [
  { value: '50', label: '50 lines' },
  { value: '100', label: '100 lines' },
  { value: '500', label: '500 lines' },
  { value: 'all', label: 'All' },
];

export default function LogsPage() {
  const { id } = useParams();
  const [tail, setTail] = useState(100);
  const { lines, connected, reconnect } = useContainerLogs(id, tail);
  const bottomRef = useRef(null);

  // Auto-scroll to bottom when new lines arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lines]);

  function handleTailChange(value) {
    setTail(value === 'all' ? 'all' : Number(value));
  }

  function handleDownload() {
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const shortId = id ? id.slice(0, 12) : '';

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      {/* Header row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-mono text-sm text-muted-foreground">{shortId}</span>
        <h1 className="text-xl font-semibold">Logs</h1>

        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {/* Tail selector */}
          <Select
            value={String(tail)}
            onValueChange={handleTailChange}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAIL_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Download button */}
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Download logs
          </Button>

          {/* Connection status */}
          {connected ? (
            <Badge className="bg-green-600 text-white border-transparent">Connected</Badge>
          ) : (
            <Badge variant="destructive">Disconnected</Badge>
          )}

          {/* Reconnect button when disconnected */}
          {!connected && (
            <Button variant="outline" size="sm" onClick={reconnect}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Reconnect
            </Button>
          )}
        </div>
      </div>

      {/* Log area */}
      <ScrollArea className="h-[calc(100vh-12rem)] bg-black/50 rounded-md p-4">
        <div className="font-mono text-xs text-green-400">
          {lines.map((line, i) => (
            <div key={i}>
              {line === '' ? <>&nbsp;</> : line}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
