import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import type { KeyCommand } from '../engine/types';

const SCRIPT = path.join(__dirname, '..', '..', 'lib', 'detect-keys.ps1');

export interface KeypressSensor {
  onKey(cb: (cmd: KeyCommand) => void): void;
  destroy(): void;
}

export function createKeypressSensor(): KeypressSensor {
  const proc: ChildProcess = spawn('powershell', [
    '-NoProfile', '-ExecutionPolicy', 'Bypass',
    '-File', SCRIPT,
  ], { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] });

  let buffer = '';
  const listeners: Array<(cmd: KeyCommand) => void> = [];

  proc.stdout!.on('data', (chunk: Buffer) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop()!;
    for (const line of lines) {
      const cmd = line.trim();
      if (cmd === 'copy' || cmd === 'paste' || cmd === 'screenshot') {
        for (const cb of listeners) cb(cmd);
      }
    }
  });

  return {
    onKey(cb) {
      listeners.push(cb);
    },
    destroy() {
      proc.kill();
    },
  };
}
