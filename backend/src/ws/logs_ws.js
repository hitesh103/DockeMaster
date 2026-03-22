import docker from '../services/docker_client.js';

export async function handleLogsWs(ws, req, containerId) {
  const url = new URL(req.url, 'http://localhost');
  const tailParam = url.searchParams.get('tail') ?? '100';
  const tailValue = tailParam === 'all' ? 'all' : parseInt(tailParam, 10) || 100;

  let logStream;

  try {
    const container = docker.getContainer(containerId);
    logStream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
      tail: tailValue,
      timestamps: false,
    });
  } catch (err) {
    if (err.statusCode === 404) {
      ws.close(4404, 'Container not found');
    } else {
      ws.close(4500, 'Error attaching to container logs');
    }
    return;
  }

  logStream.on('data', (chunk) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(chunk.toString());
    }
  });

  logStream.on('end', () => {
    ws.close();
  });

  logStream.on('error', () => {
    ws.close();
  });

  ws.on('close', () => {
    logStream.destroy();
  });
}
