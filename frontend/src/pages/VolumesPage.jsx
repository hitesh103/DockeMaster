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

export default function VolumesPage() {
  const [volumes, setVolumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingName, setDeletingName] = useState(null);

  async function load() {
    try {
      const { data } = await api.get('/volumes');
      setVolumes(data);
    } catch {
      toast.error('Failed to load volumes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleRemove(name) {
    setDeletingName(name);
    try {
      await api.delete(`/volumes/${name}`);
      toast.success('Volume removed');
      load();
    } catch (err) {
      if (err.response?.status === 409) toast.error('Volume is in use');
      else toast.error('Failed to remove volume');
    } finally {
      setDeletingName(null);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Volumes</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Mount Point</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
              ) : volumes.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No volumes found</TableCell></TableRow>
              ) : volumes.map((v) => (
                <TableRow key={v.Name}>
                  <TableCell className="font-mono text-xs">{v.Name}</TableCell>
                  <TableCell><Badge variant="outline">{v.Driver}</Badge></TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{v.Mountpoint}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                      disabled={deletingName === v.Name}
                      onClick={() => handleRemove(v.Name)}
                    >
                      {deletingName === v.Name ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
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
