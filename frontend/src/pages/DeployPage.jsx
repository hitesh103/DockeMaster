import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '../components/ui/form';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui/select';
import api from '../services/api';

const schema = z.object({
  image: z.string().min(1).refine((v) => v.trim().length > 0, 'Image name is required'),
  name: z.string().optional(),
  restartPolicy: z.enum(['no', 'always', 'on-failure', 'unless-stopped']).default('no'),
  env: z.array(z.object({ key: z.string(), value: z.string() })).default([]),
  ports: z.array(z.object({ host: z.string(), container: z.string() })).default([]),
  volumes: z.array(z.object({ host: z.string(), container: z.string() })).default([]),
});

function DeployImageForm() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState(null);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      image: '',
      name: '',
      restartPolicy: 'no',
      env: [],
      ports: [],
      volumes: [],
    },
  });

  const imageValue = form.watch('image');
  const isSubmitDisabled = !imageValue || imageValue.trim().length === 0 || form.formState.isSubmitting;

  const envFields = useFieldArray({ control: form.control, name: 'env' });
  const portFields = useFieldArray({ control: form.control, name: 'ports' });
  const volumeFields = useFieldArray({ control: form.control, name: 'volumes' });

  async function onSubmit(values) {
    setApiError(null);
    const payload = {
      image: values.image.trim(),
      name: values.name?.trim() || undefined,
      restartPolicy: values.restartPolicy,
      env: Object.fromEntries(values.env.map(({ key, value }) => [key, value])),
      ports: values.ports.map(({ host, container }) => ({ host: Number(host), container: Number(container) })),
      volumes: values.volumes.map(({ host, container }) => ({ host, container })),
    };
    try {
      await api.post('/containers/deploy', payload);
      toast.success('Container deployed successfully');
      navigate('/containers');
    } catch (err) {
      if (err.response?.status === 422) {
        setApiError(err.response.data?.detail || 'Validation error');
      }
      // other errors handled by api interceptor
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {apiError && (
          <Alert variant="destructive">
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        {/* Image name */}
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image Name <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input placeholder="e.g. nginx:latest" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Container name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Container Name <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
              <FormControl>
                <Input placeholder="e.g. my-nginx" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Restart policy */}
        <FormField
          control={form.control}
          name="restartPolicy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Restart Policy</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="no">no</SelectItem>
                  <SelectItem value="always">always</SelectItem>
                  <SelectItem value="on-failure">on-failure</SelectItem>
                  <SelectItem value="unless-stopped">unless-stopped</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Environment variables */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Environment Variables</span>
            <Button type="button" variant="outline" size="sm" onClick={() => envFields.append({ key: '', value: '' })}>
              <Plus className="h-4 w-4 mr-1" /> Add Variable
            </Button>
          </div>
          {envFields.fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-start">
              <FormField
                control={form.control}
                name={`env.${index}.key`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="KEY" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`env.${index}.value`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="value" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => envFields.remove(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Port mappings */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Port Mappings</span>
            <Button type="button" variant="outline" size="sm" onClick={() => portFields.append({ host: '', container: '' })}>
              <Plus className="h-4 w-4 mr-1" /> Add Port
            </Button>
          </div>
          {portFields.fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-start">
              <FormField
                control={form.control}
                name={`ports.${index}.host`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="Host port" type="number" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`ports.${index}.container`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="Container port" type="number" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => portFields.remove(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Volume mounts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Volume Mounts</span>
            <Button type="button" variant="outline" size="sm" onClick={() => volumeFields.append({ host: '', container: '' })}>
              <Plus className="h-4 w-4 mr-1" /> Add Volume
            </Button>
          </div>
          {volumeFields.fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-start">
              <FormField
                control={form.control}
                name={`volumes.${index}.host`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="Host path" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`volumes.${index}.container`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="Container path" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => volumeFields.remove(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button type="submit" disabled={isSubmitDisabled}>
          {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Deploy Container
        </Button>
      </form>
    </Form>
  );
}
function GitDeployForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [jobRunning, setJobRunning] = useState(false);
  const wsRef = useRef(null);
  const scrollRef = useRef(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { repositoryUrl: '', branch: 'main', dockerfilePath: 'Dockerfile', imageTag: '' },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  async function onSubmit(values) {
    setError(null);
    setLogs([]);
    setLoading(true);

    try {
      const { data } = await api.post('/deploy/git', {
        repositoryUrl: values.repositoryUrl,
        branch: values.branch || 'main',
        dockerfilePath: values.dockerfilePath || 'Dockerfile',
        imageTag: values.imageTag || undefined,
      });

      const { jobId } = data;
      setLoading(false);
      setJobRunning(true);

      const token = localStorage.getItem('dockmaster_token');
      const ws = new WebSocket(`ws://localhost:4000/api/deploy/git/${jobId}/logs?token=${token}`);
      wsRef.current = ws;

      ws.onmessage = (e) => setLogs((prev) => [...prev, e.data]);
      ws.onclose = () => setJobRunning(false);
      ws.onerror = () => {
        setJobRunning(false);
        toast.error('Build log connection failed');
      };
    } catch (err) {
      setLoading(false);
      if (err.response?.status === 422) {
        setError(err.response.data?.error || 'Validation error');
      } else {
        toast.error(err.response?.data?.error || 'Deploy failed');
      }
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Repository URL *</label>
          <Input placeholder="https://github.com/user/repo.git" {...register('repositoryUrl', { required: true })} />
          {errors.repositoryUrl && <p className="text-xs text-destructive">Repository URL is required</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Branch</label>
            <Input placeholder="main" {...register('branch')} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Dockerfile Path</label>
            <Input placeholder="Dockerfile" {...register('dockerfilePath')} />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Image Tag</label>
          <Input placeholder="my-app:latest (optional)" {...register('imageTag')} />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={loading || jobRunning} className="w-full">
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {loading ? 'Starting...' : jobRunning ? 'Building...' : 'Deploy from Git'}
        </Button>
      </form>

      {logs.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Build Output</p>
          <ScrollArea className="h-64 rounded-md border bg-black p-3">
            <pre ref={scrollRef} className="text-xs font-mono text-green-400 whitespace-pre-wrap">
              {logs.join('')}
            </pre>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

export default function DeployPage() {
  return (
    <div className="p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Deploy Container</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="image">
            <TabsList className="mb-6">
              <TabsTrigger value="image">Deploy Image</TabsTrigger>
              <TabsTrigger value="git">Deploy from Git</TabsTrigger>
            </TabsList>
            <TabsContent value="image">
              <DeployImageForm />
            </TabsContent>
            <TabsContent value="git">
              <GitDeployForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
