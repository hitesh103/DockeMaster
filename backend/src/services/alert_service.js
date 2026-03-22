import nodemailer from 'nodemailer';
import db from '../db/db.js';
import docker from './docker_client.js';

// Per-container consecutive CPU breach counter
const cpuBreachCount = new Map();

// ── Config ────────────────────────────────────────────────────────────────────

export function saveConfig(config) {
  const existing = db.prepare('SELECT id FROM alert_config WHERE id = 1').get();
  if (existing) {
    db.prepare(`
      UPDATE alert_config SET
        smtp_host = ?, smtp_port = ?, smtp_user = ?, smtp_pass = ?,
        email_recipients = ?, webhook_url = ?, cpu_threshold = ?
      WHERE id = 1
    `).run(
      config.smtpHost || null,
      config.smtpPort || null,
      config.smtpUser || null,
      config.smtpPass || null,
      config.emailRecipients || null,
      config.webhookUrl || null,
      config.cpuThreshold ?? 90
    );
  } else {
    db.prepare(`
      INSERT INTO alert_config (id, smtp_host, smtp_port, smtp_user, smtp_pass, email_recipients, webhook_url, cpu_threshold)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      config.smtpHost || null,
      config.smtpPort || null,
      config.smtpUser || null,
      config.smtpPass || null,
      config.emailRecipients || null,
      config.webhookUrl || null,
      config.cpuThreshold ?? 90
    );
  }
}

export function getConfig() {
  const row = db.prepare('SELECT * FROM alert_config WHERE id = 1').get();
  if (!row) return { cpuThreshold: 90 };
  return {
    smtpHost: row.smtp_host,
    smtpPort: row.smtp_port,
    smtpUser: row.smtp_user,
    smtpPass: '***',           // redacted
    emailRecipients: row.email_recipients,
    webhookUrl: row.webhook_url ? '***' : null,  // redacted
    cpuThreshold: row.cpu_threshold,
  };
}

function getRawConfig() {
  return db.prepare('SELECT * FROM alert_config WHERE id = 1').get();
}

// ── Dispatch ──────────────────────────────────────────────────────────────────

async function sendEmail(config, subject, body) {
  if (!config.smtp_host || !config.email_recipients) return;
  const transporter = nodemailer.createTransport({
    host: config.smtp_host,
    port: config.smtp_port || 587,
    auth: config.smtp_user ? { user: config.smtp_user, pass: config.smtp_pass } : undefined,
  });
  try {
    await transporter.sendMail({
      from: config.smtp_user || 'dockmaster@localhost',
      to: config.email_recipients,
      subject,
      text: body,
    });
  } catch (err) {
    console.error('Alert email failed, retrying in 60s:', err.message);
    setTimeout(async () => {
      try { await transporter.sendMail({ from: config.smtp_user || 'dockmaster@localhost', to: config.email_recipients, subject, text: body }); }
      catch (e) { console.error('Alert email retry failed:', e.message); }
    }, 60000);
  }
}

async function sendWebhook(config, payload) {
  if (!config.webhook_url) return;
  try {
    await fetch(config.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('Alert webhook failed:', err.message);
  }
}

async function dispatchAlert(subject, body) {
  const config = getRawConfig();
  if (!config) return;
  const payload = { subject, body, timestamp: new Date().toISOString() };
  await Promise.all([sendEmail(config, subject, body), sendWebhook(config, payload)]);
}

// ── Event listener ────────────────────────────────────────────────────────────

export function startEventListener() {
  docker.getEvents({}, (err, stream) => {
    if (err) {
      console.error('Docker events error:', err.message);
      return;
    }

    stream.on('data', (chunk) => {
      try {
        const event = JSON.parse(chunk.toString());
        if (event.Type === 'container' && event.Action === 'die') {
          const exitCode = parseInt(event.Actor?.Attributes?.exitCode ?? '0', 10);
          if (exitCode !== 0) {
            const name = event.Actor?.Attributes?.name || event.id?.slice(0, 12);
            dispatchAlert(
              `Container crashed: ${name}`,
              `Container "${name}" exited with code ${exitCode} at ${new Date().toISOString()}`
            ).catch(console.error);
          }
        }
      } catch {
        // ignore parse errors
      }
    });

    stream.on('error', (err) => console.error('Docker event stream error:', err.message));
  });
}

// ── CPU threshold monitoring ──────────────────────────────────────────────────

export function recordCpuSample(containerId, containerName, cpuPercent) {
  const config = getRawConfig();
  const threshold = config?.cpu_threshold ?? 90;

  if (cpuPercent > threshold) {
    const count = (cpuBreachCount.get(containerId) || 0) + 1;
    cpuBreachCount.set(containerId, count);
    if (count === 3) {
      dispatchAlert(
        `High CPU: ${containerName}`,
        `Container "${containerName}" has exceeded ${threshold}% CPU for 3 consecutive polls (current: ${cpuPercent.toFixed(1)}%)`
      ).catch(console.error);
    }
  } else {
    cpuBreachCount.set(containerId, 0);
  }
}
