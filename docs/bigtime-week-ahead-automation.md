# BigTime Week-Ahead Local Automation

## Recommended Production Flow

The weekly scraper should run from the Windows computer, not from the live Vercel site and not from GitHub-hosted runners.

Why:

- BigTime is less likely to block traffic from the user's normal connection than from GitHub datacenter IPs.
- The OpenAI API key stays local in `.env.press_release_v2`.
- The live website only receives committed generated content and renders it.

## What Runs Locally

Production tooling in this repo:

- Scraper: `tools/big-time-pennies/scrape-bigtime-weekly.js`
- Polling runner: `tools/big-time-pennies/run-weekly-scrape-until-new.js`
- Windows scheduled runner: `tools/big-time-pennies/run-weekly-local.ps1`
- Scheduled task installer: `tools/big-time-pennies/install-local-weekly-task.ps1`
- Last-run status viewer: `tools/big-time-pennies/show-local-weekly-status.ps1`
- Public content file: `src/content/big-time-pennies/articles.json`

The Playwright scratch folder can still be used for local experiments, but the scheduled automation should run from the website repo after this work is merged into the deploy branch.

## Schedule

The Windows Scheduled Task is:

- Name: `TradersLink BigTime Week-Ahead Scraper`
- Time: Sunday at 5:00 PM local computer time
- Runner: `tools/big-time-pennies/run-weekly-local.ps1`

Install or update it with:

```powershell
npm run bigtime:local:install-task
```

By default the task requires the website repo to be on `main`. This prevents accidental publishing from a feature branch.

## Polling Behavior

The local runner:

- loads the OpenAI key from `C:\Users\jerac\Documents\TraderLink\playwright\projects\press_release_levels_v2\.env.press_release_v2`
- checks the BigTime articles index with Playwright
- compares the newest article URL against the already published website JSON
- if no new article exists, waits 5 minutes and checks again
- keeps polling for up to 72 attempts, which is about 6 hours
- retries temporary scrape/index failures up to 3 times
- retries OpenAI rewrite calls up to 3 times
- when a new article appears, scrapes it, sends it to OpenAI, writes structured TradersLink JSON, commits `src/content/big-time-pennies/articles.json`, and tries to push the current branch
- if GitHub blocks direct `main` pushes because the repo requires pull requests, it pushes a PR branch, creates a GitHub pull request, polls until checks pass, merges the PR, and pulls `main`
- after the content is on `main`, it runs a production Vercel deploy
- if the main checkout has unrelated dirty work, it deploys from a clean temporary worktree created from `origin/main` so unrelated local files are not uploaded
- keeps only the newest 8 published weekly articles in `articles.json` by default

After the production deploy finishes, the generated live URL should return the new page.

## Completion Notification

When the scheduled run finishes:

- successful production deploys open the generated live article URL in the default browser
- failures open the local status text file so the failure reason and log file are visible

Use `-SkipNotification` only for manual test runs where no browser/status window should open.

## How To Check The Last Run

The local runner writes a human-readable status file after every run:

```text
%LOCALAPPDATA%\TradersLink\bigtime-week-ahead\last-run-status.txt
```

It also writes machine-readable JSON:

```text
%LOCALAPPDATA%\TradersLink\bigtime-week-ahead\last-run-status.json
```

From the website repo, print the status with:

```powershell
npm run bigtime:local:status
```

The status includes:

- whether the run is `running`, `success`, `failed`, or `no_content_change`
- the generated live URL, such as `https://traderslink.pro/small-cap-stocks/week-ahead/...`
- the public path added to `articles.json`
- the article title
- the generated commit hash
- whether the commit was pushed
- the publish branch and pull request URL, if GitHub required a PR
- the Vercel deployment URL, if production was deployed
- the timestamped log file path

If the status is `production_deployed`, the URL shown in the status file is the public TradersLink URL for the new page. If the status is `pull_request_created` or `pull_request_merged`, the URL may not be live yet.

## Output Guardrails

Before the JSON is saved, the scraper normalizes OpenAI output:

- company catalysts are grouped by date/date range
- duplicate company-catalyst tickers are removed
- duplicate date groups are merged
- date groups are sorted from the start of the week down
- generic group notes are discarded
- source/provider/AI wording is blocked from public-facing fields

## Requirements

- The computer must be awake, online, and logged in at Sunday 5:00 PM.
- Git must be authenticated and able to push to the deploy branch.
- GitHub CLI must be authenticated if the repo requires pull requests.
- Vercel CLI must be authenticated for production deployment.
- The website repo should be on the deploy branch, usually `main`.
- The env file must contain `OPENAI_API_KEY`.
- Optional: set `BIGTIME_MAX_PUBLISHED_ARTICLES` to change the rolling archive size. Default is `8`.

Do not deploy from `playwright/big-time-pennies`.
