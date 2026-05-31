param(
  [string]$StatusRoot = (Join-Path $env:LOCALAPPDATA "TradersLink\bigtime-week-ahead")
)

$ErrorActionPreference = "Stop"

$statusTextFile = Join-Path $StatusRoot "last-run-status.txt"
$statusJsonFile = Join-Path $StatusRoot "last-run-status.json"
$logRoot = Join-Path $StatusRoot "logs"

if (Test-Path -LiteralPath $statusTextFile) {
  Get-Content -LiteralPath $statusTextFile
  return
}

if (Test-Path -LiteralPath $statusJsonFile) {
  Get-Content -Raw -LiteralPath $statusJsonFile
  return
}

Write-Host "No BigTime week-ahead run status file was found yet."
Write-Host "Expected status file: $statusTextFile"

if (Test-Path -LiteralPath $logRoot) {
  $latestLog = Get-ChildItem -LiteralPath $logRoot -Filter "weekly-scraper-*.log" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if ($latestLog) {
    Write-Host "Latest log file: $($latestLog.FullName)"
  }
}
