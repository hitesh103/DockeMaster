import { useState, useEffect } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import api from '../services/api';

export default function NetworksPage() {
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  async function load() {
    try {
      const { data } = await api.get('/networks');
      setNetworks(data);
    } catch {
      toast.error('Failed to load networks');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleRemove(id) {
    setDeletingId(id);
    try {
      await api.delete(`/networks/${id}`);
      toast.success('Network removed');
      load();
    } catch (err) {
      if (err.response?.status === 409) toast.error('Network is in use');
      else toast.error('Failed to remove network');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Networks</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Subnet</TableHead>
                <TableHead>Containers</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
              ) : networks.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No networks found</TableCell></TableRow>
              ) : networks.map((n) => {
                const subnet = n.IPAM?.Config?.[0]?.Subnet || '—';
                const containerCount = Object.keys(n.Containers || {}).length;
                return (
                  <TableRow key={n.Id}>
                    <TableCell className="font-medium">{n.Name}</TableCell>
                    <TableCell><Badge variant="outline">{n.Driver}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{subnet}</TableCell>
                    <TableCell>{containerCount}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        disabled={deletingId === n.Id}
                        onClick={() => handleRemove(n.Id)}
                      >
                        {deletingId === n.Id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        Remove
                      </Button>
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
