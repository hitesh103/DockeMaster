import docker from './docker_client.js';
import { recordCpuSample } from './alert_service.js';

const POLL_INTERVAL_MS = 5000;
const clients = new Set();

let pollTimer = null;

function computeCpu(statsRaw) {
  const cpuDelta =
    statsRaw.cpu_stats.cpu_usage.total_usage -
    statsRaw.precpu_stats.cpu_usage.total_usage;
  const systemDelta =
    statsRaw.cpu_stats.system_cpu_usage - statsRaw.precpu_stats.system_cpu_usage;
  const cpuCount =
    statsRaw.cpu_stats.online_cpus ||
    statsRaw.cpu_stats.cpu_usage.percpu_usage?.length ||
    1;
  return systemDelta > 0 ? (cpuDelta / systemDelta) * cpuCount * 100 : 0;
}

async function pollAndBroadcast() {
  if (clients.size === 0) return;

  try {
    const containers = await docker.listContainers({ filters: { status: ['running'] } });

    const statsResults = await Promise.allSettled(
      containers.map(async (c) => {
        const container = docker.getContainer(c.Id);
        const raw = await container.stats({ stream: false });
        const cpu = computeCpu(raw);
        const memory = (raw.memory_stats?.usage || 0) / 1048576;
        let networkRx = 0;
        let networkTx = 0;
        if (raw.networks) {
          for (const iface of Object.values(raw.networks)) {
            networkRx += iface.rx_bytes || 0;
            networkTx += iface.tx_bytes || 0;
          }
        }
        return {
          containerId: c.Id,
          name: (raw.name || c.Names?.[0] || c.Id).replace(/^\//, ''),
          cpu,
          memory,
          networkRx,
          networkTx,
        };
      })
    );

    const containerStats = statsResults
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value);

    // Fire CPU threshold alerts
    for (const stat of containerStats) {
      recordCpuSample(stat.containerId, stat.name, stat.cpu);
    }

    const payload = JSON.stringify({
      containers: containerStats,
      timestamp: Date.now(),
    });

    for (const ws of clients) {
      if (ws.readyState === ws.OPEN) {
        ws.send(payload);
      }
    }
  } catch (err) {
    console.error('Stats poll error:', err.message);
  }
}

export function registerStatsClient(ws) {
  clients.add(ws);
  if (!pollTimer) {
    pollTimer = setInterval(pollAndBroadcast, POLL_INTERVAL_MS);
  }
  ws.on('close', () => {
    clients.delete(ws);
    if (clients.size === 0 && pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  });
}
