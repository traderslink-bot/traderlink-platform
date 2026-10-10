/** This component receives only an already-filtered public destination, never
 * private offer data. Undefined preserves the old Premium offer verbatim.
 */
export function WatchlistPlanUpgrade({ href, feature }: { href: string | null | undefined; feature: string }) {
  if (href === undefined) return <p>{feature} is reserved for Premium members.{" "}
    <a href="https://whop.com/traderslink-1049/premium-access-2026">Access Premium</a></p>;
  return <p>Your current plans do not include this {feature.toLowerCase()}.{" "}
    {href ? <a href={href}>View plans with this feature</a> : "Contact the owner about access."}</p>;
}
