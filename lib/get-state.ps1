$ErrorActionPreference = "SilentlyContinue"

Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class ClawdWin32 {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern int GetWindowThreadProcessId(IntPtr hWnd, out int pid);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
}
"@

$hwnd = [ClawdWin32]::GetForegroundWindow()
$sb = New-Object System.Text.StringBuilder 512
[ClawdWin32]::GetWindowText($hwnd, $sb, 512) | Out-Null
$fgPid = 0
[ClawdWin32]::GetWindowThreadProcessId($hwnd, [ref]$fgPid) | Out-Null
$fgProc = Get-Process -Id $fgPid

# Lightweight full process map (Id -> ParentId) for walking ancestor chains.
$allProcs = Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId
$parentMap = @{}
foreach ($p in $allProcs) { $parentMap[[int]$p.ProcessId] = [int]$p.ParentProcessId }

function Test-IsAncestor($startPid, $targetPid, $maxDepth = 25) {
  $cur = $startPid
  for ($i = 0; $i -lt $maxDepth; $i++) {
    if (-not $parentMap.ContainsKey($cur)) { return $false }
    $cur = $parentMap[$cur]
    if ($cur -eq $targetPid) { return $true }
    if ($cur -eq 0) { return $false }
  }
  return $false
}

# All processes named claude.exe: this includes the Desktop app + its helper
# subprocesses (gpu/renderer/utility/crashpad, all also named claude.exe) AND
# any Claude Code CLI invocations. Desktop-family processes are launched from
# the WindowsApps package path; a bare CLI invocation's CommandLine is just
# "claude" (resolved via PATH), with no such path.
$claudeExeProcs = @(Get-CimInstance Win32_Process -Filter "Name='claude.exe'" | Select-Object ProcessId, CommandLine)

$desktopFamily = @($claudeExeProcs | Where-Object { $_.CommandLine -like '*WindowsApps*' })
$isDesktopRunning = [bool]($desktopFamily | Where-Object { $_.CommandLine -notlike '*--type=*' })

$cliProcs = @($claudeExeProcs | Where-Object { $_.CommandLine -notlike '*WindowsApps*' })
$cliCount = $cliProcs.Count

$isCliFocused = $false
$fgTitle = $sb.ToString()
if ($fgTitle -match 'Claude Code') {
  $isCliFocused = $true
} else {
  foreach ($cli in $cliProcs) {
    if (Test-IsAncestor -startPid ([int]$cli.ProcessId) -targetPid $fgPid) { $isCliFocused = $true; break }
  }
}

$isDesktopFocused = [bool]($fgPid -in @($desktopFamily.ProcessId))

$spotify = Get-Process -Name Spotify -ErrorAction SilentlyContinue |
  Where-Object { $_.MainWindowTitle -ne '' } |
  Select-Object -First 1
$spotifyPlaying = $false
if ($spotify -and $spotify.MainWindowTitle -and $spotify.MainWindowTitle -ne 'Spotify' -and $spotify.MainWindowTitle -ne 'Spotify Free' -and $spotify.MainWindowTitle -ne 'Spotify Premium') {
  $spotifyPlaying = $true
}

$hour = (Get-Date).Hour
$bat = Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue | Select-Object -First 1
$batteryPct = if ($bat) { [int]$bat.EstimatedChargeRemaining } else { 100 }
$isCharging = if ($bat) { $bat.BatteryStatus -eq 2 } else { $true }

$out = [PSCustomObject]@{
  focusedTitle      = $sb.ToString()
  focusedProcess    = if ($fgProc) { $fgProc.ProcessName } else { "" }
  focusedPid        = $fgPid
  isDesktopRunning  = $isDesktopRunning
  isDesktopFocused  = [bool]$isDesktopFocused
  cliCount          = $cliCount
  isCliFocused      = $isCliFocused
  spotifyPlaying    = $spotifyPlaying
  hour              = $hour
  batteryPct        = $batteryPct
  isCharging        = [bool]$isCharging
}

$out | ConvertTo-Json -Compress
