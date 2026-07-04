import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * List listening TCP ports on the local machine.
 */
export async function listListeningPorts() {
  try {
    if (process.platform === 'win32') {
      return await listWindowsPorts();
    }
    return await listUnixPorts();
  } catch {
    return [];
  }
}

async function listWindowsPorts() {
  const { stdout } = await execAsync('netstat -ano -p tcp', {
    windowsHide: true,
    maxBuffer: 2 * 1024 * 1024,
  });

  const ports = [];
  const seen = new Set();

  for (const line of stdout.split(/\r?\n/)) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 5 || parts[0] !== 'TCP') continue;
    if (!/LISTENING/i.test(parts[3])) continue;

    const address = parts[1];
    const pid = parts[4];
    const portMatch = address.match(/:(\d+)$/);
    if (!portMatch) continue;

    const port = Number(portMatch[1]);
    const key = `${port}:${pid}`;
    if (seen.has(key)) continue;
    seen.add(key);

    ports.push({
      port,
      pid,
      address: address.replace(/:\d+$/, '') || '0.0.0.0',
      process: `pid ${pid}`,
      status: 'open',
    });
  }

  return ports.sort((a, b) => a.port - b.port).slice(0, 100);
}

async function listUnixPorts() {
  const { stdout } = await execAsync('lsof -iTCP -sTCP:LISTEN -P -n || netstat -an', {
    maxBuffer: 2 * 1024 * 1024,
    shell: '/bin/bash',
  });

  const ports = [];
  const seen = new Set();

  for (const line of stdout.split(/\n/)) {
    const lsof = line.match(/^(\S+)\s+(\d+)\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+TCP\s+(\S+)/i);
    if (lsof) {
      const processName = lsof[1];
      const pid = lsof[2];
      const addr = lsof[3];
      const portMatch = addr.match(/:(\d+)/);
      if (!portMatch) continue;
      const port = Number(portMatch[1]);
      const key = `${port}:${pid}`;
      if (seen.has(key)) continue;
      seen.add(key);
      ports.push({
        port,
        pid,
        process: processName,
        address: addr.replace(/:\d+.*$/, ''),
        status: 'open',
      });
      continue;
    }

    const netstat = line.match(/tcp\S*\s+\S+\s+\S+\s+(\S+)\s+LISTEN/i);
    if (netstat) {
      const addr = netstat[1];
      const portMatch = addr.match(/\.(\d+)$|:(\d+)$/);
      if (!portMatch) continue;
      const port = Number(portMatch[1] || portMatch[2]);
      if (seen.has(String(port))) continue;
      seen.add(String(port));
      ports.push({
        port,
        process: '—',
        address: addr,
        status: 'open',
      });
    }
  }

  return ports.sort((a, b) => a.port - b.port).slice(0, 100);
}
