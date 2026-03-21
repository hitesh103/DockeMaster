import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../components/ui/table';
import ContainerRow from '../components/containers/ContainerRow';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function LoadingSkeleton() {
  return Array.from({ length: 3 }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: 7 }).map((_, j) => (
        <TableCell key={j}>
          <div className="h-4 rounded animate-pulse bg-muted" />
        </TableCell>
      ))}
    </TableRow>
  ));
}

export default function ContainersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchContainers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/containers');
      setContainers(res.data);
    } catch {
      // errors handled by api interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContainers();
  }, [fetchContainers]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Containers</h1>
          {!loading && (
            <p className="text-sm text-muted-foreground">{containers.length} container{containers.length !== 1 ? 's' : ''}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={fetchContainers} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Image</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Ports</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <LoadingSkeleton />
          ) : containers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No containers found
              </TableCell>
            </TableRow>
          ) : (
            containers.map((container) => (
              <ContainerRow
                key={container.Id}
                container={container}
                onRefresh={fetchContainers}
                isAdmin={isAdmin}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
