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
- Public content file: `src/content/big-time-pennies/articles.json`

The Playwright scratch folder can still be used for local experiments, but the scheduled automation should run from the website repo after this work is merged into the deploy branch.

## Schedule

The Windows Scheduled Task is:

- Name: `TradersLink BigTime Week-Ahead Scraper`
- Time: Sunday at 8:00 PM local computer time
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
- when a new article appears, scrapes it, sends it to OpenAI, writes structured TradersLink JSON, commits `src/content/big-time-pennies/articles.json`, and pushes the current branch
- keeps only the newest 8 published weekly articles in `articles.json` by default

After the push, the normal Vercel/GitHub integration should deploy the updated live page.

## Output Guardrails

Before the JSON is saved, the scraper normalizes OpenAI output:

- company catalysts are grouped by date/date range
- duplicate company-catalyst tickers are removed
- duplicate date groups are merged
- date groups are sorted from the start of the week down
- generic group notes are discarded
- source/provider/AI wording is blocked from public-facing fields

## Requirements

- The computer must be awake, online, and logged in at Sunday 8:00 PM.
- Git must be authenticated and able to push to the deploy branch.
- The website repo should be on the deploy branch, usually `main`.
- The env file must contain `OPENAI_API_KEY`.
- Vercel should be connected to the GitHub repo so the pushed content commit triggers a deploy.
- Optional: set `BIGTIME_MAX_PUBLISHED_ARTICLES` to change the rolling archive size. Default is `8`.

Do not deploy from `playwright/big-time-pennies`.
