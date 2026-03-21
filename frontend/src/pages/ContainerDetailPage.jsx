import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../components/ui/table';
import api from '../services/api';

function InfoRow({ label, value }) {
  return (
    <div className="flex gap-4 py-1 border-b border-border/40 last:border-0">
      <span className="text-muted-foreground text-sm w-36 shrink-0">{label}</span>
      <span className="text-sm font-mono break-all">{value ?? '—'}</span>
    </div>
  );
}

export default function ContainerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/containers/${id}/inspect`)
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-6 w-48 rounded animate-pulse bg-muted" />
        <div className="h-48 rounded animate-pulse bg-muted" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/containers')}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Alert variant="destructive">
          <AlertTitle>Container not found</AlertTitle>
          <AlertDescription>The container with ID "{id}" could not be found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) return null;

  const shortId = data.Id?.slice(0, 12) ?? '—';
  const envVars = data.Config?.Env ?? [];
  const portBindings = data.HostConfig?.PortBindings ?? {};
  const mounts = data.Mounts ?? [];
  const networks = data.NetworkSettings?.Networks ?? {};
  const ipAddress = data.NetworkSettings?.IPAddress;
  const gateway = data.NetworkSettings?.Gateway;
  const restartPolicy = data.HostConfig?.RestartPolicy?.Name ?? '—';
  const command = [data.Path, ...(data.Args ?? [])].filter(Boolean).join(' ');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/containers')}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-semibold">{data.Name?.replace(/^\//, '') ?? shortId}</h1>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
        <CardContent className="space-y-0">
          <InfoRow label="ID" value={shortId} />
          <InfoRow label="Image" value={data.Config?.Image} />
          <InfoRow label="Command" value={command || '—'} />
          <InfoRow label="Created" value={data.Created ? new Date(data.Created).toLocaleString() : '—'} />
          <InfoRow label="Status" value={data.State?.Status} />
          <InfoRow label="Restart Policy" value={restartPolicy} />
        </CardContent>
      </Card>

      {/* Environment Variables */}
      <Card>
        <CardHeader><CardTitle>Environment Variables</CardTitle></CardHeader>
        <CardContent>
          {envVars.length === 0 ? (
            <p className="text-sm text-muted-foreground">No environment variables</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {envVars.map((entry, i) => {
                  const eqIdx = entry.indexOf('=');
                  const key = eqIdx >= 0 ? entry.slice(0, eqIdx) : entry;
                  const val = eqIdx >= 0 ? entry.slice(eqIdx + 1) : '';
                  return (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{key}</TableCell>
                      <TableCell className="font-mono text-xs break-all">{val}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Port Bindings */}
      <Card>
        <CardHeader><CardTitle>Port Bindings</CardTitle></CardHeader>
        <CardContent>
          {Object.keys(portBindings).length === 0 ? (
            <p className="text-sm text-muted-foreground">No port bindings</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Container Port</TableHead>
                  <TableHead>Host Port</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(portBindings).map(([containerPort, bindings]) =>
                  (bindings ?? []).map((b, i) => (
                    <TableRow key={`${containerPort}-${i}`}>
                      <TableCell className="font-mono text-xs">{containerPort}</TableCell>
                      <TableCell className="font-mono text-xs">{b.HostIp ? `${b.HostIp}:${b.HostPort}` : b.HostPort}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Volume Mounts */}
      <Card>
        <CardHeader><CardTitle>Volume Mounts</CardTitle></CardHeader>
        <CardContent>
          {mounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No volume mounts</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Destination</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mounts.map((m, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs break-all">{m.Source}</TableCell>
                    <TableCell className="font-mono text-xs break-all">{m.Destination}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Network Settings */}
      <Card>
        <CardHeader><CardTitle>Network Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-0">
            <InfoRow label="IP Address" value={ipAddress || '—'} />
            <InfoRow label="Gateway" value={gateway || '—'} />
          </div>
          {Object.keys(networks).length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Network</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Gateway</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(networks).map(([netName, net]) => (
                  <TableRow key={netName}>
                    <TableCell className="font-mono text-xs">{netName}</TableCell>
                    <TableCell className="font-mono text-xs">{net.IPAddress || '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{net.Gateway || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
