import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '../components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import api from '../services/api';

function AddNodeDialog({ onAdded }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ hostname: '', ip_address: '', port: '2376', tls_cert: '' });

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/nodes', {
        hostname: form.hostname,
        ip_address: form.ip_address,
        port: parseInt(form.port, 10) || 2376,
        tls_cert: form.tls_cert || undefined,
      });
      toast.success('Node added');
      setOpen(false);
      setForm({ hostname: '', ip_address: '', port: '2376', tls_cert: '' });
      onAdded();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add node');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Node</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Node</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Hostname *</label>
            <Input name="hostname" value={form.hostname} onChange={handleChange} placeholder="worker-01" required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">IP Address *</label>
            <Input name="ip_address" value={form.ip_address} onChange={handleChange} placeholder="192.168.1.10" required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Port</label>
            <Input name="port" value={form.port} onChange={handleChange} type="number" placeholder="2376" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">TLS Certificate (PEM, optional)</label>
            <textarea
              name="tls_cert"
              value={form.tls_cert}
              onChange={handleChange}
              className="w-full h-24 rounded-md border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="-----BEGIN CERTIFICATE-----"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Add Node
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function NodesPage() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [healthMap, setHealthMap] = useState({});
  const [checkingId, setCheckingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  async function load() {
    try {
      const { data } = await api.get('/nodes');
      setNodes(data);
    } catch {
      toast.error('Failed to load nodes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function checkHealth(id) {
    setCheckingId(id);
    try {
      const { data } = await api.get(`/nodes/${id}/health`);
      setHealthMap((prev) => ({ ...prev, [id]: data.reachable }));
    } catch {
      setHealthMap((prev) => ({ ...prev, [id]: false }));
    } finally {
      setCheckingId(null);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await api.delete(`/nodes/${id}`);
      toast.success('Node removed');
      load();
    } catch {
      toast.error('Failed to remove node');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Nodes</h1>
        <AddNodeDialog onAdded={load} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hostname</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Port</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : nodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No nodes configured
                  </TableCell>
                </TableRow>
              ) : nodes.map((node) => {
                const reachable = healthMap[node.id];
                return (
                  <TableRow key={node.id}>
                    <TableCell className="font-medium">{node.hostname}</TableCell>
                    <TableCell className="font-mono text-xs">{node.ip_address}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{node.port}</TableCell>
                    <TableCell>
                      {reachable === undefined ? (
                        <Badge variant="outline" className="text-muted-foreground">Unknown</Badge>
                      ) : reachable ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Reachable</Badge>
                      ) : (
                        <Badge variant="destructive">Unreachable</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={checkingId === node.id}
                          onClick={() => checkHealth(node.id)}
                        >
                          {checkingId === node.id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <RefreshCw className="h-3 w-3" />}
                          Check
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                          disabled={deletingId === node.id}
                          onClick={() => handleDelete(node.id)}
                        >
                          {deletingId === node.id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <Trash2 className="h-3 w-3" />}
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
