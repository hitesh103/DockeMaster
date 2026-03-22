import { useEffect, useState } from 'react';
import { Container, Image, Play, Square } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../services/api';
import { useGlobalStats } from '../hooks/useGlobalStats';

function StatCard({ title, value, icon: Icon, description }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value ?? '—'}</p>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

export default function DashboardHome() {
  const [counts, setCounts] = useState({ total: 0, running: 0, stopped: 0, images: 0 });
  const { snapshots } = useGlobalStats();

  useEffect(() => {
    async function load() {
      try {
        const [containersRes, imagesRes] = await Promise.all([
          api.get('/containers'),
          api.get('/images'),
        ]);
        const containers = containersRes.data;
        const running = containers.filter((c) => c.State === 'running').length;
        setCounts({
          total: containers.length,
          running,
          stopped: containers.length - running,
          images: imagesRes.data.length,
        });
      } catch {
        // silently fail — dashboard is best-effort
      }
    }
    load();
  }, []);

  // Aggregate CPU across all containers per snapshot
  const cpuData = snapshots.map((s) => ({
    time: s.time,
    cpu: s.containers
      ? s.containers.reduce((sum, c) => sum + (c.cpu || 0), 0) / Math.max(s.containers.length, 1)
      : 0,
  }));

  const memData = snapshots.map((s) => ({
    time: s.time,
    memory: s.containers
      ? s.containers.reduce((sum, c) => sum + (c.memory || 0), 0)
      : 0,
  }));

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Containers" value={counts.total} icon={Container} />
        <StatCard title="Running" value={counts.running} icon={Play} description="containers active" />
        <StatCard title="Stopped" value={counts.stopped} icon={Square} description="containers inactive" />
        <StatCard title="Images" value={counts.images} icon={Image} />
      </div>

      {/* Global CPU chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Avg CPU % (all containers)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={cpuData}>
              <defs>
                <linearGradient id="globalCpuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#555" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#555" unit="%" />
              <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
              <Area
                type="monotone"
                dataKey="cpu"
                stroke="#3b82f6"
                fill="url(#globalCpuGrad)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Global memory bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Total Memory (MB)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={memData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#555" />
              <YAxis tick={{ fontSize: 10 }} stroke="#555" unit=" MB" />
              <Tooltip formatter={(v) => `${v.toFixed(1)} MB`} />
              <Bar dataKey="memory" fill="#8b5cf6" radius={[2, 2, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
