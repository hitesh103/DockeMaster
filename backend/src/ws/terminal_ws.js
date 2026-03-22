import docker from '../services/docker_client.js';

export async function handleTerminalWs(ws, req, containerId) {
  let execStream;

  try {
    const container = docker.getContainer(containerId);
    const exec = await container.exec({
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
      Cmd: ['/bin/sh'],
    });

    execStream = await exec.start({ hijack: true, stdin: true });
  } catch (err) {
    if (err.statusCode === 404) {
      ws.close(4404, 'Container not found');
    } else {
      ws.close(4500, 'Error creating exec session');
    }
    return;
  }

  execStream.on('data', (chunk) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(chunk);
    }
  });

  execStream.on('end', () => {
    ws.close();
  });

  execStream.on('error', () => {
    ws.close();
  });

  ws.on('message', (data) => {
    execStream.write(data);
  });

  ws.on('close', () => {
    execStream.destroy();
  });
}
