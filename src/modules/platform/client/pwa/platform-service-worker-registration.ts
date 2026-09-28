"use client";

// Registration is device-wide, not account data. Share only this initialization;
// subscription status, permission changes and subscription writes remain fresh.
let preparation: Promise<ServiceWorkerRegistration> | null = null;

async function initialize(): Promise<ServiceWorkerRegistration> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      (async () => {
        await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
        return await navigator.serviceWorker.ready;
      })(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("The app could not connect to notifications. Try again.")), 15_000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export function preparePlatformServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!preparation) {
    preparation = initialize().catch((error: unknown) => {
      preparation = null;
      throw error;
    });
  }
  return preparation;
}
