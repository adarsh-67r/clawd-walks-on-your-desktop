use chrono::{Datelike, Local, NaiveDate};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenSummary {
    pub today: u64,
    pub week: u64,
    pub all_time: u64,
    pub sessions_today: u32,
    pub computed_at: u64,
}

#[derive(Deserialize)]
struct TranscriptEntry {
    message: Option<MessageInfo>,
    #[serde(rename = "requestId")]
    request_id: Option<String>,
    #[serde(rename = "sessionId")]
    session_id: Option<String>,
    timestamp: Option<String>,
}

#[derive(Deserialize)]
struct MessageInfo {
    id: Option<String>,
    usage: Option<Usage>,
}

#[derive(Deserialize)]
struct Usage {
    input_tokens: Option<u64>,
    output_tokens: Option<u64>,
    cache_creation_input_tokens: Option<u64>,
    cache_read_input_tokens: Option<u64>,
}

impl Usage {
    fn total(&self) -> u64 {
        self.input_tokens.unwrap_or(0)
            + self.output_tokens.unwrap_or(0)
            + self.cache_creation_input_tokens.unwrap_or(0)
            + self.cache_read_input_tokens.unwrap_or(0)
    }
}

fn walk_jsonl_files(dir: &Path) -> Vec<PathBuf> {
    let mut files = Vec::new();
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                files.extend(walk_jsonl_files(&path));
            } else if path.extension().is_some_and(|e| e == "jsonl") {
                files.push(path);
            }
        }
    }
    files
}

fn start_of_week(d: NaiveDate) -> NaiveDate {
    let weekday = d.weekday().num_days_from_sunday();
    d - chrono::Duration::days(weekday as i64)
}

pub fn get_token_summary() -> TokenSummary {
    let projects_dir = dirs::home_dir()
        .map(|h| h.join(".claude").join("projects"))
        .unwrap_or_default();

    let now = Local::now();
    let today_start = now.date_naive();
    let week_start = start_of_week(today_start);

    let mut seen = HashSet::new();
    let mut sessions_today = HashSet::new();
    let mut today: u64 = 0;
    let mut week: u64 = 0;
    let mut all_time: u64 = 0;

    for file in walk_jsonl_files(&projects_dir) {
        let Ok(f) = fs::File::open(&file) else { continue };
        let reader = BufReader::new(f);

        for line in reader.lines() {
            let Ok(line) = line else { continue };
            if line.is_empty() { continue; }

            let Ok(entry) = serde_json::from_str::<TranscriptEntry>(&line) else {
                continue;
            };

            let usage = match entry.message.as_ref().and_then(|m| m.usage.as_ref()) {
                Some(u) => u,
                None => continue,
            };

            let id = entry
                .message
                .as_ref()
                .and_then(|m| m.id.clone())
                .or(entry.request_id.clone());
            let Some(id) = id else { continue };
            if !seen.insert(id) { continue; }

            let tokens = usage.total();
            all_time += tokens;

            if let Some(ts_str) = &entry.timestamp {
                if let Ok(ts) = chrono::DateTime::parse_from_rfc3339(ts_str) {
                    let ts_date = ts.with_timezone(&chrono::Local).date_naive();
                    if ts_date >= today_start {
                        today += tokens;
                        if let Some(sid) = &entry.session_id {
                            sessions_today.insert(sid.clone());
                        }
                    }
                    if ts_date >= week_start {
                        week += tokens;
                    }
                }
            }
        }
    }

    TokenSummary {
        today,
        week,
        all_time,
        sessions_today: sessions_today.len() as u32,
        computed_at: now.timestamp_millis() as u64,
    }
}
