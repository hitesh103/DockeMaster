import { useState, useEffect, useRef } from 'react';

const MAX_SNAPSHOTS = 30;

export function useGlobalStats() {
  const [snapshots, setSnapshots] = useState([]);
  const [latest, setLatest] = useState(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  function connect() {
    const token = localStorage.getItem('dockmaster_token');
    const ws = new WebSocket(`ws://localhost:4000/api/stats/stream?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLatest(data);
        setSnapshots((prev) => {
          const next = [...prev, { ...data, time: new Date(data.timestamp).toLocaleTimeString() }];
          return next.length > MAX_SNAPSHOTS ? next.slice(next.length - MAX_SNAPSHOTS) : next;
        });
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
  }

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, []);

  return { snapshots, latest, connected, reconnect: connect };
}
