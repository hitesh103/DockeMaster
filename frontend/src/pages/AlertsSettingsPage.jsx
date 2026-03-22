import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import api from '../services/api';

export default function AlertsSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    cpuThreshold: 90,
    emailRecipients: '',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    webhookUrl: '',
  });

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/alerts/config');
        setForm((prev) => ({
          ...prev,
          cpuThreshold: data.cpuThreshold ?? 90,
          emailRecipients: data.emailRecipients || '',
          smtpHost: data.smtpHost || '',
          smtpPort: data.smtpPort || 587,
          smtpUser: data.smtpUser || '',
          webhookUrl: data.webhookUrl && data.webhookUrl !== '***' ? data.webhookUrl : '',
        }));
      } catch {
        // config may not exist yet
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'cpuThreshold' || name === 'smtpPort' ? Number(value) : value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/alerts/config', form);
      toast.success('Alert settings saved');
    } catch {
      toast.error('Failed to save alert settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">Alert Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">
        {/* CPU Threshold */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">CPU Threshold</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Alert after 3 consecutive polls above this percentage
            </label>
            <Input
              name="cpuThreshold"
              type="number"
              min="1"
              max="100"
              value={form.cpuThreshold}
              onChange={handleChange}
              className="w-32"
            />
          </CardContent>
        </Card>

        {/* Email */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Email Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Recipients (comma-separated)</label>
              <Input name="emailRecipients" value={form.emailRecipients} onChange={handleChange} placeholder="ops@example.com, dev@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">SMTP Host</label>
                <Input name="smtpHost" value={form.smtpHost} onChange={handleChange} placeholder="smtp.example.com" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">SMTP Port</label>
                <Input name="smtpPort" type="number" value={form.smtpPort} onChange={handleChange} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">SMTP Username</label>
                <Input name="smtpUser" value={form.smtpUser} onChange={handleChange} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">SMTP Password</label>
                <Input name="smtpPass" type="password" value={form.smtpPass} onChange={handleChange} placeholder="Leave blank to keep existing" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webhook */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Webhook</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            <label className="text-sm font-medium">Webhook URL</label>
            <Input name="webhookUrl" value={form.webhookUrl} onChange={handleChange} placeholder="https://hooks.example.com/alert" />
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Save Settings
        </Button>
      </form>
    </div>
  );
}
