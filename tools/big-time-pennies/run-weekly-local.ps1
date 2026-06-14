param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$EnvFile = "C:\Users\jerac\Documents\TraderLink\playwright\projects\press_release_levels_v2\.env.press_release_v2",
  [string]$Branch = "main",
  [string]$VercelScope = "team_D1yNeyNl1qTvK0pAWMu5nTWY",
  [switch]$SkipDeploy,
  [switch]$SkipMerge,
  [switch]$SkipNotification,
  [switch]$SkipPush
)

$ErrorActionPreference = "Stop"

$logRoot = Join-Path $env:LOCALAPPDATA "TradersLink\bigtime-week-ahead\logs"
$lockRoot = Join-Path $env:LOCALAPPDATA "TradersLink\bigtime-week-ahead"
$lockFile = Join-Path $lockRoot "weekly-scraper.lock"
$statusFile = Join-Path $lockRoot "last-run-status.json"
$statusTextFile = Join-Path $lockRoot "last-run-status.txt"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logFile = Join-Path $logRoot "weekly-scraper-$timestamp.log"
$contentFile = Join-Path $RepoRoot "src\content\big-time-pennies\articles.json"
$transcriptStarted = $false

New-Item -ItemType Directory -Force -Path $logRoot | Out-Null
New-Item -ItemType Directory -Force -Path $lockRoot | Out-Null

function Write-RunStatus {
  param(
    [Parameter(Mandatory = $true)]
    [hashtable]$Status
  )

  $Status.updatedAt = (Get-Date).ToString("o")
  $Status | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $statusFile -Encoding UTF8

  $lines = @(
    "TradersLink BigTime Week-Ahead Scraper",
    "Status: $($Status.status)",
    "Updated: $($Status.updatedAt)",
    "Started: $($Status.startedAt)",
    "Finished: $($Status.finishedAt)",
    "Live URL: $($Status.liveUrl)",
    "Article title: $($Status.articleTitle)",
    "Public path: $($Status.publicPath)",
    "Commit: $($Status.commit)",
    "Pushed: $($Status.pushed)",
    "Publish branch: $($Status.publishBranch)",
    "Pull request: $($Status.pullRequestUrl)",
    "Deployment URL: $($Status.deploymentUrl)",
    "Log file: $($Status.logFile)",
    "Message: $($Status.message)"
  )

  $lines | Set-Content -LiteralPath $statusTextFile -Encoding UTF8
}

function Get-LatestPublishedArticleStatus {
  if (!(Test-Path -LiteralPath $contentFile)) {
    return @{}
  }

  $articles = Get-Content -Raw -LiteralPath $contentFile | ConvertFrom-Json
  $article = @($articles)[0]

  if (!$article) {
    return @{}
  }

  $publicPath = [string]$article.publicPath
  if (!$publicPath -and $article.publicSlug) {
    $publicPath = "/small-cap-stocks/week-ahead/$($article.publicSlug)"
  }

  $liveUrl = ""
  if ($publicPath) {
    $liveUrl = "https://traderslink.pro$publicPath"
  }

  return @{
    articleTitle = [string]$article.rewrittenTitle
    liveUrl = $liveUrl
    publicPath = $publicPath
  }
}

function Invoke-NativeCapture {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,
    [string[]]$Arguments = @()
  )

  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"

  try {
    $output = & $FilePath @Arguments 2>&1
    $exitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }

  return @{
    ExitCode = $exitCode
    Output = $output
  }
}

function Open-CompletionResult {
  param(
    [Parameter(Mandatory = $true)]
    [hashtable]$Status
  )

  if ($SkipNotification) {
    return
  }

  try {
    if ($Status.status -eq "production_deployed" -and $Status.liveUrl) {
      Start-Process $Status.liveUrl
      return
    }

    if (Test-Path -LiteralPath $statusTextFile) {
      Start-Process $statusTextFile
    }
  } catch {
    Write-Warning "Could not open completion notification: $($_.Exception.Message)"
  }
}

function Assert-CleanGitWorktree {
  $dirty = & git status --porcelain

  if ($dirty) {
    throw "Refusing to deploy from a dirty worktree. Commit, merge, or remove unrelated local changes first."
  }
}

function New-CleanDeployWorktree {
  param(
    [Parameter(Mandatory = $true)]
    [string]$CurrentBranch
  )

  $deployRoot = Join-Path $env:TEMP "traderslink-weekahead-deploy-$timestamp"

  if (Test-Path -LiteralPath $deployRoot) {
    Remove-Item -LiteralPath $deployRoot -Recurse -Force
  }

  & git fetch origin $CurrentBranch
  if ($LASTEXITCODE -ne 0) {
    throw "git fetch before clean deploy worktree failed."
  }

  & git worktree add --detach $deployRoot "origin/$CurrentBranch"
  if ($LASTEXITCODE -ne 0) {
    throw "Could not create clean deploy worktree."
  }

  $sourceProjectFile = Join-Path $RepoRoot ".vercel\project.json"
  if (Test-Path -LiteralPath $sourceProjectFile) {
    $targetVercelDir = Join-Path $deployRoot ".vercel"
    New-Item -ItemType Directory -Force -Path $targetVercelDir | Out-Null
    Copy-Item -LiteralPath $sourceProjectFile -Destination (Join-Path $targetVercelDir "project.json")
  }

  return $deployRoot
}

function Deploy-ProductionFromCleanMain {
  param(
    [Parameter(Mandatory = $true)]
    [string]$CurrentBranch
  )

  if ($CurrentBranch -ne "main") {
    throw "Refusing production deploy from branch '$CurrentBranch'."
  }

  if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
    throw "Vercel CLI was not found; production deploy cannot run."
  }

  $deployRoot = $RepoRoot
  $createdDeployWorktree = $false
  $dirty = & git status --porcelain

  if ($dirty) {
    Write-Warning "Main checkout has unrelated local changes. Deploying from a clean temporary worktree."
    $deployRoot = New-CleanDeployWorktree -CurrentBranch $CurrentBranch
    $createdDeployWorktree = $true
  } else {
    Assert-CleanGitWorktree
  }

  $deployArgs = @("deploy", "--prod", "--yes")
  if ($VercelScope) {
    $deployArgs += @("--scope", $VercelScope)
  }

  try {
    Push-Location -LiteralPath $deployRoot
    $deployResult = Invoke-NativeCapture -FilePath "vercel" -Arguments $deployArgs
    if ($deployResult.ExitCode -ne 0) {
      throw "Vercel production deploy failed. $($deployResult.Output | Out-String)"
    }

    return ($deployResult.Output | Select-Object -Last 1).ToString().Trim()
  } finally {
    Pop-Location

    if ($createdDeployWorktree -and (Test-Path -LiteralPath $deployRoot)) {
      & git worktree remove --force $deployRoot | Out-Null
    }
  }
}

function Wait-ForPullRequestChecks {
  param(
    [Parameter(Mandatory = $true)]
    [string]$PullRequestUrl
  )

  $maxAttempts = 80
  $delaySeconds = 15

  for ($attempt = 1; $attempt -le $maxAttempts; $attempt += 1) {
    $checkResult = Invoke-NativeCapture -FilePath "gh" -Arguments @(
      "pr",
      "checks",
      $PullRequestUrl,
      "--json",
      "bucket,name,state"
    )

    if ($checkResult.ExitCode -ne 0) {
      Write-Warning "Could not read PR checks yet. Attempt $attempt/$maxAttempts."
      Start-Sleep -Seconds $delaySeconds
      continue
    }

    $checks = ($checkResult.Output | Out-String) | ConvertFrom-Json
    $buckets = @($checks | ForEach-Object { $_.bucket })

    if ($buckets.Count -eq 0) {
      Write-Host "No PR checks reported yet. Attempt $attempt/$maxAttempts."
      Start-Sleep -Seconds $delaySeconds
      continue
    }

    if ($buckets -contains "fail" -or $buckets -contains "cancel") {
      throw "Pull request checks failed or were cancelled."
    }

    if (!($buckets -contains "pending" -or $buckets -contains "skipping")) {
      return
    }

    Write-Host "PR checks still pending. Attempt $attempt/$maxAttempts."
    Start-Sleep -Seconds $delaySeconds
  }

  throw "Timed out waiting for pull request checks to pass."
}

function Merge-PullRequestAndPullMain {
  param(
    [Parameter(Mandatory = $true)]
    [string]$PullRequestUrl,
    [Parameter(Mandatory = $true)]
    [string]$CurrentBranch
  )

  if ($SkipMerge) {
    return $false
  }

  if (!(Get-Command gh -ErrorAction SilentlyContinue)) {
    throw "GitHub CLI was not found; pull request cannot be merged automatically."
  }

  Wait-ForPullRequestChecks -PullRequestUrl $PullRequestUrl

  & gh pr merge $PullRequestUrl --merge --delete-branch
  if ($LASTEXITCODE -ne 0) {
    throw "Pull request merge failed."
  }

  & git pull --ff-only origin $CurrentBranch
  if ($LASTEXITCODE -ne 0) {
    throw "git pull after pull request merge failed."
  }

  return $true
}

$runStatus = @{
  articleTitle = ""
  commit = ""
  deploymentUrl = ""
  finishedAt = ""
  liveUrl = ""
  logFile = $logFile
  message = "Run started."
  publishBranch = ""
  publicPath = ""
  pullRequestUrl = ""
  pushed = $false
  startedAt = (Get-Date).ToString("o")
  status = "running"
}

if (Test-Path -LiteralPath $lockFile) {
  $runStatus.finishedAt = (Get-Date).ToString("o")
  $runStatus.message = "Weekly scraper lock exists: $lockFile"
  $runStatus.status = "failed"
  Write-RunStatus -Status $runStatus
  throw "Weekly scraper lock exists: $lockFile"
}

Write-RunStatus -Status $runStatus
New-Item -ItemType File -Force -Path $lockFile | Out-Null

try {
  Start-Transcript -Path $logFile -Append | Out-Null
  $transcriptStarted = $true

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
    $articleStatus = Get-LatestPublishedArticleStatus
    foreach ($key in $articleStatus.Keys) {
      $runStatus[$key] = $articleStatus[$key]
    }
    $runStatus.finishedAt = (Get-Date).ToString("o")
    $runStatus.message = "Scraper completed, but articles.json did not change."
    $runStatus.status = "no_content_change"
    Write-RunStatus -Status $runStatus
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
  $runStatus.commit = (& git rev-parse --short HEAD).Trim()
  $articleStatus = Get-LatestPublishedArticleStatus
  foreach ($key in $articleStatus.Keys) {
    $runStatus[$key] = $articleStatus[$key]
  }

  if (!$SkipPush) {
    $pushResult = Invoke-NativeCapture -FilePath "git" -Arguments @("push", "origin", $currentBranch)
    if ($pushResult.ExitCode -ne 0) {
      Write-Warning "Direct push to $currentBranch failed. Creating a pull-request branch instead."
      Write-Warning ($pushResult.Output | Out-String)

      $publishBranch = "codex/bigtime-week-ahead-$timestamp"
      & git push origin "HEAD:refs/heads/$publishBranch"
      if ($LASTEXITCODE -ne 0) {
        throw "git push failed for main and pull-request branch."
      }

      $runStatus.pushed = $true
      $runStatus.publishBranch = $publishBranch
      $runStatus.status = "pull_request_branch_pushed"
      $runStatus.message = "Direct push to $currentBranch was blocked. Generated content was pushed to $publishBranch."

      if (Get-Command gh -ErrorAction SilentlyContinue) {
        $prTitle = "Update small-cap week-ahead catalysts"
        if ($runStatus.articleTitle) {
          $prTitle = $runStatus.articleTitle
        }
        $prBody = @(
          "## Summary",
          "- Adds the generated week-ahead catalyst article data.",
          "- Route after merge/deploy: $($runStatus.liveUrl)",
          "",
          "## Notes",
          "- Generated by the local BigTime week-ahead scraper.",
          "- Direct push to main was blocked by repository rules, so this PR carries the generated content commit."
        ) -join "`n"
        $prResult = Invoke-NativeCapture -FilePath "gh" -Arguments @(
          "pr",
          "create",
          "--base",
          $currentBranch,
          "--head",
          $publishBranch,
          "--title",
          $prTitle,
          "--body",
          $prBody
        )

        if ($prResult.ExitCode -eq 0) {
          $runStatus.pullRequestUrl = ($prResult.Output | Select-Object -Last 1).ToString().Trim()
          $runStatus.status = "pull_request_created"
          $runStatus.message = "Generated content was pushed to $publishBranch and a pull request was created."

          if (Merge-PullRequestAndPullMain -PullRequestUrl $runStatus.pullRequestUrl -CurrentBranch $currentBranch) {
            $runStatus.publishBranch = $currentBranch
            $runStatus.status = "pull_request_merged"
            $runStatus.message = "Generated content pull request was merged into $currentBranch."
          }
        } else {
          Write-Warning ($prResult.Output | Out-String)
          $runStatus.message = "Generated content was pushed to $publishBranch, but pull request creation failed."
        }
      }
    } else {
      $runStatus.pushed = $true
      $runStatus.publishBranch = $currentBranch
    }
  } else {
    Write-Host "SkipPush was provided; commit created but not pushed."
  }

  $runStatus.finishedAt = (Get-Date).ToString("o")
  if ($runStatus.status -eq "running") {
    $runStatus.message = "Weekly article automation completed successfully."
    $runStatus.status = "success"
  }

  if (
    !$SkipDeploy -and
    !$SkipPush -and
    ($runStatus.status -eq "success" -or $runStatus.status -eq "pull_request_merged")
  ) {
    $runStatus.deploymentUrl = Deploy-ProductionFromCleanMain -CurrentBranch $currentBranch
    $runStatus.status = "production_deployed"
    $runStatus.message = "Weekly article automation completed successfully and production was deployed."
  } elseif ($SkipDeploy) {
    Write-Host "SkipDeploy was provided; production deploy was not run."
  }

  Write-RunStatus -Status $runStatus
  Open-CompletionResult -Status $runStatus
  Write-Host "Weekly article automation completed successfully."
} catch {
  $runStatus.finishedAt = (Get-Date).ToString("o")
  $runStatus.message = $_.Exception.Message
  $runStatus.status = "failed"
  Write-RunStatus -Status $runStatus
  Open-CompletionResult -Status $runStatus
  throw
} finally {
  if ($transcriptStarted) {
    Stop-Transcript | Out-Null
  }
  Remove-Item -LiteralPath $lockFile -Force -ErrorAction SilentlyContinue
}
