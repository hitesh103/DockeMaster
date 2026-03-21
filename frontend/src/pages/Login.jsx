import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '../components/ui/form';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values) {
    setError(null);
    try {
      await auth.login(values.username, values.password);
      navigate('/');
    } catch {
      setError('Invalid username or password');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">DockMaster</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="admin" autoComplete="username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" />}
                Sign in
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
