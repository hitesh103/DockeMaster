import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const MAX_SNAPSHOTS = 60;

export function useContainerStats(containerId) {
  const [snapshots, setSnapshots] = useState([]);
  const [latest, setLatest] = useState(null);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!containerId) return;

    async function fetchStats() {
      try {
        const { data } = await api.get(`/containers/${containerId}/stats`);
        setLatest(data);
        setSnapshots((prev) => {
          const next = [...prev, { ...data, time: new Date(data.timestamp).toLocaleTimeString() }];
          return next.length > MAX_SNAPSHOTS ? next.slice(next.length - MAX_SNAPSHOTS) : next;
        });
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchStats();
    timerRef.current = setInterval(fetchStats, 2000);

    return () => clearInterval(timerRef.current);
  }, [containerId]);

  return { snapshots, latest, error };
}
