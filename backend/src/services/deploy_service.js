import { v4 as uuidv4 } from 'uuid';
import { tmpdir } from 'os';
import { join } from 'path';
import { rm } from 'fs/promises';
import { spawn } from 'child_process';
import simpleGit from 'simple-git';

// In-memory job store: jobId → { status, logs: string[], clients: Set<ws> }
const jobs = new Map();

export function getJob(jobId) {
  return jobs.get(jobId);
}

export function registerJobClient(jobId, ws) {
  const job = jobs.get(jobId);
  if (!job) {
    ws.send(JSON.stringify({ error: 'Job not found' }));
    ws.close();
    return;
  }

  // Send buffered logs first
  for (const line of job.logs) {
    ws.send(line);
  }

  if (job.status !== 'running') {
    ws.close();
    return;
  }

  job.clients.add(ws);
  ws.on('close', () => job.clients.delete(ws));
}

function appendLog(job, line) {
  job.logs.push(line);
  for (const ws of job.clients) {
    if (ws.readyState === ws.OPEN) ws.send(line);
  }
}

export async function gitDeploy({ repositoryUrl, branch = 'main', dockerfilePath = 'Dockerfile', imageTag, env = {} }) {
  const jobId = uuidv4();
  const tmpDir = join(tmpdir(), `dockmaster-build-${jobId}`);

  const job = { status: 'running', logs: [], clients: new Set() };
  jobs.set(jobId, job);

  // Run async — don't await
  (async () => {
    try {
      appendLog(job, `[INFO] Cloning ${repositoryUrl} (branch: ${branch})...\n`);
      const git = simpleGit();
      await git.clone(repositoryUrl, tmpDir, ['--branch', branch, '--depth', '1']);
      appendLog(job, `[INFO] Clone complete.\n`);

      const dockerfileArg = join(tmpDir, dockerfilePath);
      const tag = imageTag || `dockmaster-build-${jobId.slice(0, 8)}`;

      appendLog(job, `[INFO] Building image: ${tag}\n`);

      await new Promise((resolve, reject) => {
        const envVars = Object.entries(env).map(([k, v]) => `${k}=${v}`);
        const buildArgs = envVars.flatMap((e) => ['--build-arg', e]);

        const proc = spawn('docker', [
          'build',
          '-t', tag,
          '-f', dockerfileArg,
          ...buildArgs,
          tmpDir,
        ]);

        proc.stdout.on('data', (d) => appendLog(job, d.toString()));
        proc.stderr.on('data', (d) => appendLog(job, d.toString()));

        proc.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`docker build exited with code ${code}`));
        });
      });

      appendLog(job, `[INFO] Build succeeded: ${tag}\n`);
      job.status = 'success';
    } catch (err) {
      appendLog(job, `[ERROR] ${err.message}\n`);
      job.status = 'failed';
    } finally {
      // Close all live clients
      for (const ws of job.clients) ws.close();
      job.clients.clear();
      // Clean up temp dir
      await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  })();

  return jobId;
}
