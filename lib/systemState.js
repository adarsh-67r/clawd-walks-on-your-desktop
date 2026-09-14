const { execFile } = require('child_process');
const path = require('path');

const PS_SCRIPT = path.join(__dirname, 'get-state.ps1');

function getRawSystemInfo() {
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

// Turns the raw poll result into Clawd's behavior mode.
function deriveState(raw, ownPid) {
  const isOwnFocused = raw.focusedPid === ownPid;
  const isDesktopShellFocused =
    raw.focusedProcess === 'explorer' || raw.focusedTitle === '';

  const isClaudeActive = raw.isDesktopFocused || raw.isCliFocused;
  const totalInstances = raw.cliCount;

  let mode;
  if (isClaudeActive) {
    mode = 'action';
  } else if (raw.isDesktopRunning || raw.cliCount > 0 || isOwnFocused || isDesktopShellFocused) {
    // A Claude agent open in the background still counts as "awake" —
    // only truly asleep when no Claude instance is running anywhere.
    mode = 'awake';
  } else {
    mode = 'asleep';
  }

  return {
    mode,
    totalInstances,
    cliCount: raw.cliCount,
    isDesktopRunning: raw.isDesktopRunning,
    focusedProcess: raw.focusedProcess,
    spotifyPlaying: !!raw.spotifyPlaying,
    hour: raw.hour,
    batteryPct: raw.batteryPct ?? 100,
    isCharging: raw.isCharging ?? true,
  };
}

module.exports = { getRawSystemInfo, deriveState };
