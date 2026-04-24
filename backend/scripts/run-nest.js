const { spawn } = require('node:child_process');
const path = require('node:path');

const args = process.argv.slice(2);
const systemRoot = process.env.SystemRoot || process.env.WINDIR || 'C:\\Windows';
const system32Path = path.join(systemRoot, 'System32');
const currentPath = process.env.PATH || '';
const pathEntries = currentPath.split(path.delimiter).filter(Boolean);

if (!pathEntries.some((entry) => entry.toLowerCase() === system32Path.toLowerCase())) {
  pathEntries.unshift(system32Path);
}

const child = spawn(
  process.execPath,
  [require.resolve('@nestjs/cli/bin/nest.js'), ...args],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      PATH: pathEntries.join(path.delimiter),
    },
  },
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

