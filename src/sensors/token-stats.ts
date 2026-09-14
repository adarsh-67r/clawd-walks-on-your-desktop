import fs from 'fs';
import path from 'path';
import os from 'os';
import type { TokenSummary } from '../engine/types';

const PROJECTS_DIR = path.join(os.homedir(), '.claude', 'projects');

interface MessageUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

interface TranscriptEntry {
  message?: { id?: string; usage?: MessageUsage };
  requestId?: string;
  sessionId?: string;
  timestamp?: string;
}

async function* walkJsonlFiles(dir: string): AsyncGenerator<string> {
  let entries: fs.Dirent[];
  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkJsonlFiles(full);
    } else if (entry.isFile() && entry.name.endsWith('.jsonl')) {
      yield full;
    }
  }
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

function usageTokenCount(usage: MessageUsage): number {
  return (
    (usage.input_tokens || 0) +
    (usage.output_tokens || 0) +
    (usage.cache_creation_input_tokens || 0) +
    (usage.cache_read_input_tokens || 0)
  );
}

export async function getTokenSummary(): Promise<TokenSummary> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);

  const seen = new Set<string>();
  const sessionsToday = new Set<string>();
  let today = 0;
  let week = 0;
  let allTime = 0;

  for await (const file of walkJsonlFiles(PROJECTS_DIR)) {
    let content: string;
    try {
      content = await fs.promises.readFile(file, 'utf8');
    } catch {
      continue;
    }
    for (const line of content.split('\n')) {
      if (!line) continue;
      let obj: TranscriptEntry;
      try {
        obj = JSON.parse(line);
      } catch {
        continue;
      }
      const usage = obj.message?.usage;
      if (!usage) continue;
      const id = obj.message?.id || obj.requestId;
      if (!id || seen.has(id)) continue;
      seen.add(id);

      const tokens = usageTokenCount(usage);
      allTime += tokens;

      const ts = obj.timestamp ? new Date(obj.timestamp) : null;
      if (ts) {
        if (ts >= todayStart) {
          today += tokens;
          if (obj.sessionId) sessionsToday.add(obj.sessionId);
        }
        if (ts >= weekStart) week += tokens;
      }
    }
  }

  return { today, week, allTime, sessionsToday: sessionsToday.size, computedAt: Date.now() };
}
