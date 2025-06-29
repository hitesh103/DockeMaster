import Docker from 'dockerode';
import os from 'os';

// Connect to local Docker socket
const docker = new Docker({
  socketPath: '/var/run/docker.sock',
});

// Optional: print connection test
docker.ping((err, data) => {
  if (err) {
    console.error('❌ Docker Engine connection failed:', err.message);
  } else {
    console.log('🐳 Connected to Docker Engine');
  }
});

export default docker;
