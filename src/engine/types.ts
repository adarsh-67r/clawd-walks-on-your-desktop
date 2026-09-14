export interface SystemState {
  focusedTitle: string;
  focusedProcess: string;
  focusedPid: number;
  isDesktopRunning: boolean;
  isDesktopFocused: boolean;
  cliCount: number;
  isCliFocused: boolean;
  spotifyPlaying: boolean;
  hour: number;
  batteryPct: number;
  isCharging: boolean;
}

export interface DerivedState {
  mode: 'awake' | 'drowsy' | 'asleep' | 'action';
  totalInstances: number;
  cliCount: number;
  isDesktopRunning: boolean;
  focusedProcess: string;
  spotifyPlaying: boolean;
  hour: number;
  batteryPct: number;
  isCharging: boolean;
}

export interface TokenSummary {
  today: number;
  week: number;
  allTime: number;
  sessionsToday: number;
  computedAt: number;
}

export interface CursorPosition {
  x: number;
  y: number;
}

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScreenBounds {
  width: number;
  height: number;
}

export type KeyCommand = 'copy' | 'paste' | 'screenshot';
