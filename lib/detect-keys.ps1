Add-Type @"
using System;
using System.Runtime.InteropServices;
public class KeyState {
    [DllImport("user32.dll")]
    public static extern short GetAsyncKeyState(int vKey);
}
"@

$lastCopy = [DateTime]::MinValue
$lastPaste = [DateTime]::MinValue
$lastScreenshot = [DateTime]::MinValue
while ($true) {
    $now = [DateTime]::Now

    # Ctrl+C / Ctrl+V
    $ctrl = [KeyState]::GetAsyncKeyState(0x11)
    if ($ctrl -band 0x8000) {
        $c = [KeyState]::GetAsyncKeyState(0x43)
        $v = [KeyState]::GetAsyncKeyState(0x56)
        if (($c -band 0x8000) -and ($now - $lastCopy).TotalMilliseconds -gt 500) {
            $lastCopy = $now
            Write-Output "copy"
            [Console]::Out.Flush()
        }
        if (($v -band 0x8000) -and ($now - $lastPaste).TotalMilliseconds -gt 500) {
            $lastPaste = $now
            Write-Output "paste"
            [Console]::Out.Flush()
        }
    }

    # Screenshot: PrtSc (0x2C) or Win+Shift+S (0x5B/0x10/0x53)
    $prtsc = [KeyState]::GetAsyncKeyState(0x2C)
    if (($prtsc -band 0x8000) -and ($now - $lastScreenshot).TotalMilliseconds -gt 1000) {
        $lastScreenshot = $now
        Write-Output "screenshot"
        [Console]::Out.Flush()
    }
    $lwin = [KeyState]::GetAsyncKeyState(0x5B)
    $shift = [KeyState]::GetAsyncKeyState(0x10)
    $s = [KeyState]::GetAsyncKeyState(0x53)
    if (($lwin -band 0x8000) -and ($shift -band 0x8000) -and ($s -band 0x8000) -and ($now - $lastScreenshot).TotalMilliseconds -gt 1000) {
        $lastScreenshot = $now
        Write-Output "screenshot"
        [Console]::Out.Flush()
    }

    Start-Sleep -Milliseconds 80
}
