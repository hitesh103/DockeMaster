import docker from './docker_client.js';

/**
 * Pull a Docker image, wrapping Dockerode's callback-based pull in a Promise.
 */
function pullImage(image) {
  return new Promise((resolve, reject) => {
    docker.pull(image, (err, stream) => {
      if (err) return reject(err);
      docker.modem.followProgress(stream, (err2) => {
        if (err2) return reject(err2);
        resolve();
      });
    });
  });
}

/**
 * Deploy a new container.
 *
 * @param {object} opts
 * @param {string} opts.image - Docker image name (required)
 * @param {string} [opts.name] - Container name
 * @param {Record<string, string>} [opts.env] - Environment variables
 * @param {Array<{host: number|string, container: number|string}>} [opts.ports] - Port mappings
 * @param {Array<{host: string, container: string}>} [opts.volumes] - Volume mounts
 * @param {string} [opts.restartPolicy] - Restart policy (default: 'no')
 * @returns {Promise<object>} Container inspect info
 */
export async function deploy({ image, name, env = {}, ports = [], volumes = [], restartPolicy = 'no' }) {
  // Pull the image first
  try {
    await pullImage(image);
  } catch (err) {
    const msg = err.message || '';
    if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('no such')) {
      const error = new Error(`Image not found: ${image}`);
      error.status = 422;
      throw error;
    }
    throw err;
  }

  // Convert env Record<string,string> → ["KEY=VALUE", ...]
  const Env = Object.entries(env).map(([k, v]) => `${k}=${v}`);

  // Convert ports [{host, container}] → PortBindings + ExposedPorts
  const PortBindings = {};
  const ExposedPorts = {};
  for (const { host, container } of ports) {
    const key = `${container}/tcp`;
    ExposedPorts[key] = {};
    PortBindings[key] = [{ HostPort: String(host) }];
  }

  // Convert volumes [{host, container}] → Binds ["host:container", ...]
  const Binds = volumes.map(({ host, container }) => `${host}:${container}`);

  // Create container
  const container = await docker.createContainer({
    Image: image,
    ...(name ? { name } : {}),
    Env,
    ExposedPorts,
    HostConfig: {
      PortBindings,
      Binds,
      RestartPolicy: { Name: restartPolicy || 'no' },
    },
  });

  // Start the container
  await container.start();

  // Return inspect info
  const info = await container.inspect();
  return info;
}
