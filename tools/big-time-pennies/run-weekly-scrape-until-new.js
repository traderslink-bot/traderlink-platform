/* eslint-disable @typescript-eslint/no-require-imports */

const { spawn } = require("child_process");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");
const scraperPath = path.join(__dirname, "scrape-bigtime-weekly.js");
const intervalMs = Number(process.env.BIGTIME_POLL_INTERVAL_MS || 5 * 60 * 1000);
const maxAttempts = Number(process.env.BIGTIME_POLL_MAX_ATTEMPTS || 72);
const maxTransientFailures = Number(process.env.BIGTIME_POLL_MAX_TRANSIENT_FAILURES || 3);

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function runScraperOnce() {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [
        scraperPath,
        "--publish-to-site",
        "--site-dir",
        repoRoot,
      ],
      {
        cwd: repoRoot,
        env: {
          ...process.env,
          TRADERSLINK_SITE_DIR: repoRoot,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on("close", (code) => {
      resolve({ code, output: `${stdout}\n${stderr}` });
    });
  });
}

async function main() {
  let transientFailures = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    console.log(`BigTime weekly scrape attempt ${attempt}/${maxAttempts}`);
    const result = await runScraperOnce();

    if (
      result.code === 0 &&
      result.output.includes("Scrape complete.") &&
      result.output.includes("Published website content store:")
    ) {
      console.log("New article found, rewritten, and published to the website content store.");
      return;
    }

    if (result.code !== 0) {
      transientFailures += 1;

      if (isFatalScraperFailure(result.output) || transientFailures > maxTransientFailures) {
        throw new Error("Scraper failed before finding a publishable article.");
      }

      console.warn(
        `Scraper attempt failed (${transientFailures}/${maxTransientFailures}). Retrying in ${Math.round(
          intervalMs / 1000,
        )} seconds.`,
      );
      await wait(intervalMs);
      continue;
    }

    transientFailures = 0;

    if (!result.output.includes("No new article to scrape.")) {
      throw new Error("Scraper finished without publishing and without a duplicate signal.");
    }

    if (attempt < maxAttempts) {
      console.log(`No new article yet. Checking again in ${Math.round(intervalMs / 1000)} seconds.`);
      await wait(intervalMs);
    }
  }

  throw new Error(`No new BigTime weekly article was found after ${maxAttempts} attempts.`);
}

function isFatalScraperFailure(output) {
  return [
    "OPENAI_API_KEY is not set",
    "AI rewrite response did not include",
    "AI rewrite included public source/AI wording",
    "Structured company catalysts still contain duplicate tickers",
    "Only rewritten articles can be published",
  ].some((message) => output.includes(message));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
