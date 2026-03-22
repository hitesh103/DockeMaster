import { useState, useEffect, useRef, useCallback } from 'react';

const MAX_LINES = 5000;

/**
 * Strips the 8-byte Docker multiplexed stream header from a chunk.
 * Header format: [stream_type(1), 0, 0, 0, size(4 bytes big-endian)]
 * stream_type: 0=stdin, 1=stdout, 2=stderr
 * Only strips when the first byte is 0x01 or 0x02 (stdout/stderr).
 */
function stripDockerHeader(text) {
  // Process potentially multiple framed chunks in one message
  const lines = [];
  // Split on newlines first, then strip headers from each segment
  const raw = text.split('\n');
  for (const segment of raw) {
    if (segment.length === 0) {
      lines.push('');
      continue;
    }
    const firstCharCode = segment.charCodeAt(0);
    // 0x01 = stdout, 0x02 = stderr header marker
    if (firstCharCode === 0x01 || firstCharCode === 0x02) {
      // Skip the 8-byte header (characters 0-7)
      lines.push(segment.slice(8));
    } else {
      lines.push(segment);
    }
  }
  // Remove trailing empty string from split if present
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines;
}

export function useContainerLogs(containerId, tail) {
  const [lines, setLines] = useState([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (!containerId) return;

    const token = localStorage.getItem('dockmaster_token') ?? '';
    const tailParam = tail === 'all' ? 'all' : String(tail);
    const url = `ws://localhost:4000/api/containers/${containerId}/logs?tail=${tailParam}&token=${token}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      const newLines = stripDockerHeader(event.data);
      setLines((prev) => {
        const combined = [...prev, ...newLines];
        return combined.length > MAX_LINES ? combined.slice(combined.length - MAX_LINES) : combined;
      });
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onerror = () => {
      setConnected(false);
    };
  }, [containerId, tail]);

  // Connect on mount and when containerId/tail changes
  useEffect(() => {
    setLines([]);
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const reconnect = useCallback(() => {
    setLines([]);
    connect();
  }, [connect]);

  return { lines, connected, reconnect };
}
