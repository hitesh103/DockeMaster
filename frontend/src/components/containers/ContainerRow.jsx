import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Terminal, RotateCcw, Square, Play, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { TableRow, TableCell } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../ui/tooltip';
import api from '../../services/api';

function formatRelativeTime(unixSeconds) {
  const diff = Math.floor(Date.now() / 1000) - unixSeconds;
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

function formatPorts(ports) {
  if (!ports || ports.length === 0) return '—';
  const formatted = ports.map((p) => {
    if (p.PublicPort) return `${p.PublicPort}:${p.PrivatePort}/${p.Type}`;
    return `${p.PrivatePort}/${p.Type}`;
  });
  if (formatted.length <= 2) return formatted.join(', ');
  return `${formatted.slice(0, 2).join(', ')} +${formatted.length - 2} more`;
}

function stateBadgeClass(state) {
  switch (state) {
    case 'running': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'exited':  return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'paused':  return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'created': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    default:        return '';
  }
}

export default function ContainerRow({ container, onRefresh, isAdmin }) {
  const [activeAction, setActiveAction] = useState(null);
  const navigate = useNavigate();

  const id = container.Id;
  const name = (container.Names?.[0] ?? id).replace(/^\//, '');
  const isRunning = container.State === 'running';

  async function runAction(action, apiCall) {
    setActiveAction(action);
    try {
      await apiCall();
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error ?? err.message ?? 'Action failed');
    } finally {
      setActiveAction(null);
    }
  }

  const busy = activeAction !== null;

  return (
    <TooltipProvider>
      <TableRow>
        <TableCell>
          <Link to={`/containers/${id}`} className="text-blue-400 hover:underline font-mono text-xs">
            {name}
          </Link>
        </TableCell>
        <TableCell className="font-mono text-xs">{container.Image}</TableCell>
        <TableCell className="text-xs text-muted-foreground">{container.Status}</TableCell>
        <TableCell>
          <Badge variant="outline" className={stateBadgeClass(container.State)}>
            {container.State}
          </Badge>
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">
          {formatRelativeTime(container.Created)}
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">
          {formatPorts(container.Ports)}
        </TableCell>
        <TableCell>
          {isAdmin && (
            <div className="flex items-center gap-1">
              {isRunning ? (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={busy}
                    onClick={() => runAction('stop', () => api.post(`/containers/${id}/stop`))}
                  >
                    {activeAction === 'stop' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Square className="h-3 w-3" />}
                    Stop
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => runAction('restart', () => api.post(`/containers/${id}/restart`))}
                  >
                    {activeAction === 'restart' ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                    Restart
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => navigate(`/terminal/${id}`)}
                  >
                    <Terminal className="h-3 w-3" />
                    Terminal
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    disabled={busy}
                    onClick={() => runAction('start', () => api.post(`/containers/${id}/start`))}
                  >
                    {activeAction === 'start' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                    Start
                  </Button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button variant="outline" size="sm" disabled>
                          <Terminal className="h-3 w-3" />
                          Terminal
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Container must be running to open terminal</TooltipContent>
                  </Tooltip>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                disabled={busy}
                className="text-red-400 hover:text-red-300"
                onClick={() => runAction('remove', () => api.delete(`/containers/${id}`))}
              >
                {activeAction === 'remove' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                Remove
              </Button>
            </div>
          )}
        </TableCell>
      </TableRow>
    </TooltipProvider>
  );
}
