import { useState, useEffect } from 'react';
import { Loader2, Scale } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '../components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import api from '../services/api';

function ScaleDialog({ service, onScaled }) {
  const [open, setOpen] = useState(false);
  const [replicas, setReplicas] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleScale() {
    setLoading(true);
    try {
      await api.post(`/services/${service.ID}/scale`, { replicas: parseInt(replicas, 10) });
      toast.success('Service scaled');
      setOpen(false);
      onScaled();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Scale failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Scale className="h-3 w-3 mr-1" />Scale</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Scale {service.Spec?.Name}</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <Input
            type="number"
            min="0"
            placeholder="Number of replicas"
            value={replicas}
            onChange={(e) => setReplicas(e.target.value)}
          />
          <Button onClick={handleScale} disabled={loading || !replicas} className="w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Scale
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [swarmError, setSwarmError] = useState(false);

  async function load() {
    try {
      const { data } = await api.get('/services');
      setServices(data);
      setSwarmError(false);
    } catch (err) {
      if (err.response?.status === 503) setSwarmError(true);
      else toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Services</h1>

      {swarmError && (
        <Alert variant="destructive">
          <AlertDescription>Docker is not in Swarm mode. Initialize a swarm to manage services.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Replicas</TableHead>
                <TableHead>Update Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
              ) : services.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No services found</TableCell></TableRow>
              ) : services.map((svc) => {
                const spec = svc.Spec || {};
                const replicas = spec.Mode?.Replicated?.Replicas ?? '—';
                const image = spec.TaskTemplate?.ContainerSpec?.Image?.split('@')[0] || '—';
                return (
                  <TableRow key={svc.ID}>
                    <TableCell className="font-medium">{spec.Name}</TableCell>
                    <TableCell className="font-mono text-xs">{image}</TableCell>
                    <TableCell>{replicas}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{svc.UpdateStatus?.State || 'stable'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <ScaleDialog service={svc} onScaled={load} />
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
