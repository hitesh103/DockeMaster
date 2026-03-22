import { useState, useEffect, useCallback } from 'react';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import api from '../services/api';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const PAGE_SIZE = 50;

  const [filters, setFilters] = useState({ actor: '', action: '', from: '', to: '' });

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, pageSize: PAGE_SIZE });
      if (filters.actor) params.set('actor', filters.actor);
      if (filters.action) params.set('action', filters.action);
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);

      const { data } = await api.get(`/audit-logs?${params}`);
      setLogs(data.logs || data);
      setHasMore((data.logs || data).length === PAGE_SIZE);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    setPage(1);
    load(1);
  }, [filters]);

  useEffect(() => {
    load(page);
  }, [page]);

  function handleFilterChange(e) {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function formatTime(ts) {
    return new Date(ts * 1000).toLocaleString();
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Audit Logs</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Input
          name="actor"
          placeholder="Filter by actor"
          value={filters.actor}
          onChange={handleFilterChange}
          className="w-40"
        />
        <Input
          name="action"
          placeholder="Filter by action"
          value={filters.action}
          onChange={handleFilterChange}
          className="w-40"
        />
        <Input
          name="from"
          type="date"
          value={filters.from}
          onChange={handleFilterChange}
          className="w-40"
        />
        <Input
          name="to"
          type="date"
          value={filters.to}
          onChange={handleFilterChange}
          className="w-40"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
              ) : logs.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No audit logs found</TableCell></TableRow>
              ) : logs.map((log) => (
                <TableRow
                  key={log.id}
                  className={log.outcome === 'failure' ? 'bg-red-500/5' : ''}
                >
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTime(log.timestamp)}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{log.actor}</TableCell>
                  <TableCell className="font-mono text-xs">{log.action}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.target_name || log.target_id || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={log.outcome === 'success' ? 'outline' : 'destructive'}
                      className={log.outcome === 'success' ? 'text-green-400 border-green-500/30' : ''}
                    >
                      {log.outcome}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                    {log.detail || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Page {page}</span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
