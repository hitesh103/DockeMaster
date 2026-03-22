import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '../components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import api from '../services/api';

function DeployStackDialog({ onDeployed }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [yaml, setYaml] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleDeploy() {
    setError(null);
    setLoading(true);
    try {
      await api.post('/stacks', { name, yaml });
      toast.success('Stack deployed');
      setOpen(false);
      setName('');
      setYaml('');
      onDeployed();
    } catch (err) {
      if (err.response?.status === 422) setError(err.response.data?.error || 'Invalid input');
      else toast.error(err.response?.data?.error || 'Deploy failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" />Deploy Stack</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Deploy Stack</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <Input placeholder="Stack name" value={name} onChange={(e) => setName(e.target.value)} />
          <textarea
            className="w-full h-48 rounded-md border bg-background px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Paste docker-compose YAML here..."
            value={yaml}
            onChange={(e) => setYaml(e.target.value)}
          />
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <Button onClick={handleDeploy} disabled={loading || !name || !yaml} className="w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Deploy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function StacksPage() {
  const [stacks, setStacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingName, setDeletingName] = useState(null);

  async function load() {
    try {
      const { data } = await api.get('/stacks');
      setStacks(data);
    } catch (err) {
      if (err.response?.status !== 503) toast.error('Failed to load stacks');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleRemove(name) {
    setDeletingName(name);
    try {
      await api.delete(`/stacks/${name}`);
      toast.success('Stack removed');
      load();
    } catch {
      toast.error('Failed to remove stack');
    } finally {
      setDeletingName(null);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Stacks</h1>
        <DeployStackDialog onDeployed={load} />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Services</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
              ) : stacks.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No stacks found</TableCell></TableRow>
              ) : stacks.map((s) => (
                <TableRow key={s.name}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.services}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                      disabled={deletingName === s.name}
                      onClick={() => handleRemove(s.name)}
                    >
                      {deletingName === s.name ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
