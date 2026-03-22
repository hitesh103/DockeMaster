import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Plus, Trash2, TestTube2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import api from '../services/api';

function AddRegistryDialog({ onAdded }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  async function onSubmit(values) {
    setLoading(true);
    try {
      await api.post('/registries', values);
      toast.success('Registry added');
      reset();
      setOpen(false);
      onAdded();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add registry');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Registry</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Registry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 mt-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Name *</label>
            <Input {...register('name', { required: true })} placeholder="My Registry" />
            {errors.name && <p className="text-xs text-destructive">Required</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">URL *</label>
            <Input {...register('url', { required: true })} placeholder="https://registry.example.com" />
            {errors.url && <p className="text-xs text-destructive">Required</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Username *</label>
            <Input {...register('username', { required: true })} />
            {errors.username && <p className="text-xs text-destructive">Required</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Password *</label>
            <Input type="password" {...register('password', { required: true })} />
            {errors.password && <p className="text-xs text-destructive">Required</p>}
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Add Registry
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function RegistriesPage() {
  const [registries, setRegistries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  async function load() {
    try {
      const { data } = await api.get('/registries');
      setRegistries(data);
    } catch {
      toast.error('Failed to load registries');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleTest(id) {
    setTestingId(id);
    try {
      const { data } = await api.post(`/registries/${id}/test`);
      if (data.ok) toast.success('Connection successful');
      else toast.error(`Connection failed (HTTP ${data.status})`);
    } catch {
      toast.error('Connection test failed');
    } finally {
      setTestingId(null);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await api.delete(`/registries/${id}`);
      toast.success('Registry removed');
      load();
    } catch {
      toast.error('Failed to remove registry');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Registries</h1>
        <AddRegistryDialog onAdded={load} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Username</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : registries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No registries configured
                  </TableCell>
                </TableRow>
              ) : (
                registries.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell className="font-medium">{reg.name}</TableCell>
                    <TableCell className="font-mono text-xs">{reg.url}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{reg.username}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={testingId === reg.id}
                          onClick={() => handleTest(reg.id)}
                        >
                          {testingId === reg.id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <TestTube2 className="h-3 w-3" />}
                          Test
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                          disabled={deletingId === reg.id}
                          onClick={() => handleDelete(reg.id)}
                        >
                          {deletingId === reg.id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <Trash2 className="h-3 w-3" />}
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
