param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$EnvFile = "C:\Users\jerac\Documents\TraderLink\playwright\projects\press_release_levels_v2\.env.press_release_v2",
  [string]$Branch = "main",
  [string]$TaskName = "TradersLink BigTime Week-Ahead Scraper"
)

$ErrorActionPreference = "Stop"

$runner = Join-Path $RepoRoot "tools\big-time-pennies\run-weekly-local.ps1"

if (!(Test-Path -LiteralPath $runner)) {
  throw "Local weekly runner not found: $runner"
}

if (!(Test-Path -LiteralPath $EnvFile)) {
  throw "Env file not found: $EnvFile"
}

$quotedRunner = '"' + $runner + '"'
$quotedRepoRoot = '"' + $RepoRoot + '"'
$quotedEnvFile = '"' + $EnvFile + '"'
$arguments = "-NoProfile -ExecutionPolicy Bypass -File $quotedRunner -RepoRoot $quotedRepoRoot -EnvFile $quotedEnvFile -Branch $Branch"

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $arguments
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 8:00PM
$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -AllowStartIfOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Hours 7)
$principal = New-ScheduledTaskPrincipal `
  -UserId "$env:USERDOMAIN\$env:USERNAME" `
  -LogonType Interactive `
  -RunLevel Limited

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Principal $principal `
  -Force | Out-Null

Write-Host "Installed scheduled task: $TaskName"
Write-Host "Schedule: Sundays at 8:00 PM local computer time"
Write-Host "Runner: $runner"
Write-Host "Repo: $RepoRoot"
Write-Host "Env file: $EnvFile"
Write-Host "Required branch: $Branch"
