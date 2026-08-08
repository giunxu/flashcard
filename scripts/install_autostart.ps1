$ErrorActionPreference = "Stop"

$ProjectDir = Split-Path -Parent $PSScriptRoot
$TaskName = "English For Kids Local Server"
$ScriptPath = Join-Path $ProjectDir "scripts\start_server.ps1"
$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`""
$Trigger = New-ScheduledTaskTrigger -AtLogOn
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

try {
  Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Starts the English For Kids FastAPI server on localhost:8000" -Force | Out-Null
  Write-Host "Da cai tu dong bat server khi dang nhap Windows: $TaskName"
} catch {
  $StartupDir = [Environment]::GetFolderPath("Startup")
  $CmdPath = Join-Path $StartupDir "English For Kids Server.cmd"
  $Cmd = "@echo off`r`npowershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`""
  Set-Content -LiteralPath $CmdPath -Value $Cmd -Encoding ASCII
  Write-Host "Khong tao duoc Scheduled Task, da dung Startup folder: $CmdPath"
}
