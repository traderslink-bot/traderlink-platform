param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$EnvFile = "C:\Users\jerac\Documents\TraderLink\playwright\projects\press_release_levels_v2\.env.press_release_v2",
  [string]$Branch = "main",
  [switch]$SkipPush
)

$ErrorActionPreference = "Stop"

$logRoot = Join-Path $env:LOCALAPPDATA "TradersLink\bigtime-week-ahead\logs"
$lockRoot = Join-Path $env:LOCALAPPDATA "TradersLink\bigtime-week-ahead"
$lockFile = Join-Path $lockRoot "weekly-scraper.lock"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logFile = Join-Path $logRoot "weekly-scraper-$timestamp.log"
$contentFile = Join-Path $RepoRoot "src\content\big-time-pennies\articles.json"

New-Item -ItemType Directory -Force -Path $logRoot | Out-Null

if (Test-Path -LiteralPath $lockFile) {
  throw "Weekly scraper lock exists: $lockFile"
}

New-Item -ItemType File -Force -Path $lockFile | Out-Null

try {
  Start-Transcript -Path $logFile -Append | Out-Null

  Write-Host "Starting TradersLink BigTime week-ahead local automation."
  Write-Host "Repo: $RepoRoot"
  Write-Host "Env file: $EnvFile"
  Write-Host "Branch requirement: $Branch"

  if (!(Test-Path -LiteralPath $RepoRoot)) {
    throw "Repo root not found: $RepoRoot"
  }

  if (!(Test-Path -LiteralPath $EnvFile)) {
    throw "Env file not found: $EnvFile"
  }

  Set-Location -LiteralPath $RepoRoot

  $currentBranch = (& git branch --show-current).Trim()
  if ($Branch -and $currentBranch -ne $Branch) {
    throw "Refusing to run on branch '$currentBranch'. Switch this repo to '$Branch' before Sunday automation runs."
  }

  Write-Host "Pulling latest $currentBranch with --ff-only."
  & git pull --ff-only origin $currentBranch
  if ($LASTEXITCODE -ne 0) {
    throw "git pull failed."
  }

  $env:BIGTIME_ENV_FILE = $EnvFile
  $env:TRADERSLINK_SITE_DIR = $RepoRoot
  if (!$env:BIGTIME_POLL_INTERVAL_MS) {
    $env:BIGTIME_POLL_INTERVAL_MS = "300000"
  }
  if (!$env:BIGTIME_POLL_MAX_ATTEMPTS) {
    $env:BIGTIME_POLL_MAX_ATTEMPTS = "72"
  }
  if (!$env:BIGTIME_POLL_MAX_TRANSIENT_FAILURES) {
    $env:BIGTIME_POLL_MAX_TRANSIENT_FAILURES = "3"
  }
  if (!$env:BIGTIME_OPENAI_MAX_ATTEMPTS) {
    $env:BIGTIME_OPENAI_MAX_ATTEMPTS = "3"
  }
  if (!$env:OPENAI_TIMEOUT_MS) {
    $env:OPENAI_TIMEOUT_MS = "300000"
  }

  & node "tools\big-time-pennies\run-weekly-scrape-until-new.js"
  if ($LASTEXITCODE -ne 0) {
    throw "BigTime polling scraper failed."
  }

  & node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')); console.log('articles.json is valid JSON')" $contentFile
  if ($LASTEXITCODE -ne 0) {
    throw "Generated articles.json is not valid JSON."
  }

  & git diff --quiet -- $contentFile
  if ($LASTEXITCODE -eq 0) {
    Write-Host "No article content changes to commit."
    return
  }

  & git add -- $contentFile
  if ($LASTEXITCODE -ne 0) {
    throw "git add failed."
  }

  & git commit -m "Update small-cap week-ahead catalysts"
  if ($LASTEXITCODE -ne 0) {
    throw "git commit failed."
  }

  if (!$SkipPush) {
    & git push origin $currentBranch
    if ($LASTEXITCODE -ne 0) {
      throw "git push failed."
    }
  } else {
    Write-Host "SkipPush was provided; commit created but not pushed."
  }

  Write-Host "Weekly article automation completed successfully."
} finally {
  Stop-Transcript | Out-Null
  Remove-Item -LiteralPath $lockFile -Force -ErrorAction SilentlyContinue
}
