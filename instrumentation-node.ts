export async function registerTraderLinkHostedNodeRuntime(): Promise<void> {
  if (process.env.NODE_ENV !== "production") return;

  try {
    const { verifyPlatformHostedRuntimeReadiness } = await import(
      "./src/modules/platform/server/readiness/platform-hosted-runtime-readiness"
    );
    const readiness = verifyPlatformHostedRuntimeReadiness();
    console.info(
      `TraderLink hosted runtime verified ${readiness.migrationCount} migrations on ${readiness.storage}.`,
    );
  } catch {
    console.error("TraderLink hosted runtime readiness failed.");
    process.exit(1);
  }
}
