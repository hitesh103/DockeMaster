import { useState, useEffect, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../components/ui/button';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '../components/ui/table';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function LoadingSkeleton() {
  return Array.from({ length: 4 }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: 6 }).map((_, j) => (
        <TableCell key={j}>
          <div className="h-4 rounded animate-pulse bg-muted" />
        </TableCell>
      ))}
    </TableRow>
  ));
}

export default function ImagesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingIds, setRemovingIds] = useState(new Set());

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/images');
      setImages(res.data);
    } catch {
      // errors handled by api interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  async function handleRemove(id) {
    setRemovingIds((prev) => new Set(prev).add(id));
    try {
      await api.delete(`/images/${id}`);
      await fetchImages();
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error(err.response.data?.detail || 'Image is in use and cannot be removed');
      }
      // other errors handled by api interceptor
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Images</h1>
        {!loading && (
          <p className="text-sm text-muted-foreground">
            {images.length} image{images.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Repository</TableHead>
            <TableHead>Tag</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Size (MB)</TableHead>
            <TableHead>Created</TableHead>
            {isAdmin && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <LoadingSkeleton />
          ) : images.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isAdmin ? 6 : 5} className="text-center text-muted-foreground py-8">
                No images found
              </TableCell>
            </TableRow>
          ) : (
            images.map((image) => {
              const repoTag = image.RepoTags?.[0] || '<none>:<none>';
              const [repo, tag] = repoTag.includes(':')
                ? repoTag.split(':')
                : [repoTag, '<none>'];
              const shortId = image.Id?.replace('sha256:', '').slice(0, 12) || '';
              const sizeMb = image.Size ? (image.Size / 1024 / 1024).toFixed(1) : '—';
              const created = image.Created
                ? new Date(image.Created * 1000).toLocaleDateString()
                : '—';

              return (
                <TableRow key={image.Id}>
                  <TableCell className="font-mono text-xs">{repo}</TableCell>
                  <TableCell>{tag}</TableCell>
                  <TableCell className="font-mono text-xs">{shortId}</TableCell>
                  <TableCell>{sizeMb}</TableCell>
                  <TableCell>{created}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={removingIds.has(image.Id)}
                        onClick={() => handleRemove(image.Id)}
                        title="Remove image"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
