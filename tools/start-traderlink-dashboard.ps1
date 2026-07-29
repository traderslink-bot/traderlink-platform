$ErrorActionPreference = "Stop"

$projectPath = "C:\Users\jerac\Documents\TraderLink\traderslink.pro"
$dashboardUrl = "http://127.0.0.1:3010/workspace"

function Show-LauncherMessage([string]$message) {
  Add-Type -AssemblyName PresentationFramework
  [System.Windows.MessageBox]::Show(
    $message,
    "TraderLink Dashboard",
    [System.Windows.MessageBoxButton]::OK,
    [System.Windows.MessageBoxImage]::Information
  ) | Out-Null
}

try {
  $branch = (& git -C $projectPath branch --show-current).Trim()
  if ($branch -ne "main") {
    Show-LauncherMessage "TraderLink Dashboard starts only from main. Current branch: $branch"
    exit 1
  }

  $listener = Get-NetTCPConnection -LocalPort 3010 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($null -ne $listener) {
    Show-LauncherMessage "Port 3010 is already in use. Close that dashboard before starting the canonical main dashboard."
    exit 1
  }

  $tsxPath = Join-Path $projectPath "node_modules\.bin\tsx.cmd"
  Start-Process -FilePath $tsxPath -ArgumentList "src\scripts\run-trader-intelligence-local-server.ts --dev --webpack --hostname 127.0.0.1 --port 3010" -WorkingDirectory $projectPath -WindowStyle Hidden

  for ($attempt = 0; $attempt -lt 40; $attempt += 1) {
    Start-Sleep -Seconds 1
    $listener = Get-NetTCPConnection -LocalPort 3010 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -ne $listener) {
      Start-Process $dashboardUrl
      exit 0
    }
  }

  Show-LauncherMessage "TraderLink Dashboard did not start on port 3010."
  exit 1
} catch {
  Show-LauncherMessage "TraderLink Dashboard could not start. $($_.Exception.Message)"
  exit 1
}
