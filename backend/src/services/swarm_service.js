import docker from './docker_client.js';

function swarmError() {
  return Object.assign(new Error('Docker is not in Swarm mode'), { status: 503 });
}

// ── Services ──────────────────────────────────────────────────────────────────

export async function listServices() {
  try {
    return await docker.listServices();
  } catch (err) {
    if (err.statusCode === 503 || err.message?.includes('swarm')) throw swarmError();
    throw err;
  }
}

export async function scaleService(id, replicas) {
  try {
    const service = docker.getService(id);
    const info = await service.inspect();
    await service.update({
      ...info.Spec,
      version: info.Version.Index,
      Mode: { Replicated: { Replicas: replicas } },
    });
  } catch (err) {
    if (err.statusCode === 503 || err.message?.includes('swarm')) throw swarmError();
    throw err;
  }
}

export async function removeService(id) {
  try {
    const service = docker.getService(id);
    await service.remove();
  } catch (err) {
    if (err.statusCode === 503 || err.message?.includes('swarm')) throw swarmError();
    throw err;
  }
}

// ── Stacks ────────────────────────────────────────────────────────────────────

export async function listStacks() {
  try {
    const services = await docker.listServices();
    const stacks = new Map();
    for (const svc of services) {
      const stackName = svc.Spec?.Labels?.['com.docker.stack.namespace'];
      if (stackName) {
        if (!stacks.has(stackName)) stacks.set(stackName, { name: stackName, services: 0 });
        stacks.get(stackName).services++;
      }
    }
    return Array.from(stacks.values());
  } catch (err) {
    if (err.statusCode === 503 || err.message?.includes('swarm')) throw swarmError();
    throw err;
  }
}

export async function deployStack(name, yaml) {
  // Write yaml to temp file and run docker stack deploy
  const { writeFile, unlink } = await import('fs/promises');
  const { join } = await import('path');
  const { tmpdir } = await import('os');
  const { spawn } = await import('child_process');

  const tmpFile = join(tmpdir(), `stack-${name}-${Date.now()}.yml`);
  await writeFile(tmpFile, yaml, 'utf8');

  try {
    await new Promise((resolve, reject) => {
      const proc = spawn('docker', ['stack', 'deploy', '-c', tmpFile, name]);
      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(Object.assign(new Error(`docker stack deploy failed (code ${code})`), { status: 500 }));
      });
    });
  } finally {
    await unlink(tmpFile).catch(() => {});
  }
}

export async function removeStack(name) {
  const { spawn } = await import('child_process');
  await new Promise((resolve, reject) => {
    const proc = spawn('docker', ['stack', 'rm', name]);
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`docker stack rm failed (code ${code})`));
    });
  });
}
