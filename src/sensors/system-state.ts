import { execFile } from 'child_process';
import path from 'path';
import type { SystemState, DerivedState } from '../engine/types';

const PS_SCRIPT = path.join(__dirname, '..', '..', 'lib', 'get-state.ps1');

export function getRawSystemInfo(): Promise<SystemState> {
  return new Promise((resolve, reject) => {
    execFile(
      'powershell',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', PS_SCRIPT],
      { windowsHide: true, timeout: 4000, maxBuffer: 2 * 1024 * 1024 },
      (err, stdout) => {
        if (err) return reject(err);
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}

export function deriveState(raw: SystemState, ownPid: number): DerivedState {
  const isOwnFocused = raw.focusedPid === ownPid;
  const isDesktopShellFocused =
    raw.focusedProcess === 'explorer' || raw.focusedTitle === '';

  const isClaudeActive = raw.isDesktopFocused || raw.isCliFocused;

  let mode: DerivedState['mode'];
  if (isClaudeActive) {
    mode = 'action';
  } else if (raw.isDesktopRunning || raw.cliCount > 0 || isOwnFocused || isDesktopShellFocused) {
    mode = 'awake';
  } else {
    mode = 'asleep';
  }

  return {
    mode,
    totalInstances: raw.cliCount,
    cliCount: raw.cliCount,
    isDesktopRunning: raw.isDesktopRunning,
    focusedProcess: raw.focusedProcess,
    spotifyPlaying: !!raw.spotifyPlaying,
    hour: raw.hour,
    batteryPct: raw.batteryPct ?? 100,
    isCharging: raw.isCharging ?? true,
  };
}
