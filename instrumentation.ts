export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { registerTraderLinkHostedNodeRuntime } = await import(
    "./instrumentation-node"
  );
  await registerTraderLinkHostedNodeRuntime();
}
