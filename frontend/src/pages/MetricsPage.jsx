import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Cpu, MemoryStick, Network } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useContainerStats } from '../hooks/useContainerStats';

export default function MetricsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { snapshots, latest, error } = useContainerStats(id);

  const cpuWarning = latest?.cpu > 80;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/containers')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">Metrics</h1>
        <span className="font-mono text-sm text-muted-foreground">{id?.slice(0, 12)}</span>
      </div>

      {error && (
        <p className="text-sm text-destructive">Failed to fetch stats: {error}</p>
      )}

      {/* Stat summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className={cpuWarning ? 'border-yellow-500' : ''}>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Cpu className="h-4 w-4" /> CPU
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${cpuWarning ? 'text-yellow-400' : ''}`}>
              {latest ? `${latest.cpu.toFixed(1)}%` : '—'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MemoryStick className="h-4 w-4" /> Memory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {latest ? `${latest.memory.toFixed(1)} MB` : '—'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Network className="h-4 w-4" /> Network
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              ↓ {latest ? `${(latest.networkRx / 1024).toFixed(1)} KB` : '—'} &nbsp;
              ↑ {latest ? `${(latest.networkTx / 1024).toFixed(1)} KB` : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CPU chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">CPU %</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={snapshots}>
              <defs>
                <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={cpuWarning ? '#eab308' : '#3b82f6'} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={cpuWarning ? '#eab308' : '#3b82f6'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#555" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#555" unit="%" />
              <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
              <Area
                type="monotone"
                dataKey="cpu"
                stroke={cpuWarning ? '#eab308' : '#3b82f6'}
                fill="url(#cpuGrad)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Memory chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Memory (MB)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={snapshots}>
              <defs>
                <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#555" />
              <YAxis tick={{ fontSize: 10 }} stroke="#555" unit=" MB" />
              <Tooltip formatter={(v) => `${v.toFixed(1)} MB`} />
              <Area
                type="monotone"
                dataKey="memory"
                stroke="#8b5cf6"
                fill="url(#memGrad)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Network chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Network I/O (bytes)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={snapshots}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#555" />
              <YAxis tick={{ fontSize: 10 }} stroke="#555" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="networkRx"
                stroke="#10b981"
                fill="#10b98120"
                dot={false}
                isAnimationActive={false}
                name="RX"
              />
              <Area
                type="monotone"
                dataKey="networkTx"
                stroke="#f59e0b"
                fill="#f59e0b20"
                dot={false}
                isAnimationActive={false}
                name="TX"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
