export const PROGRAMMATIC_NAVIGATION_EVENT =
  "traderlink:confirm-programmatic-navigation";
export const PROGRAMMATIC_NAVIGATION_CANCELLED_EVENT =
  "traderlink:cancel-programmatic-navigation";

export function confirmTradeTrackerProgrammaticNavigation(): boolean {
  return window.dispatchEvent(new Event(PROGRAMMATIC_NAVIGATION_EVENT, {
    cancelable: true,
  }));
}

export function cancelTradeTrackerProgrammaticNavigation(): void {
  window.dispatchEvent(new Event(PROGRAMMATIC_NAVIGATION_CANCELLED_EVENT));
}
