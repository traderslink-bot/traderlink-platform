# Community Profile Plan

**Status:** Owner-authorized minimal implementation in progress

**Parent feature:** [Community Watchlists Plan](community-watchlists-plan.md)

## Outcome

Give every trader a small, optional Community profile that gives published
watchlists a recognizable owner and establishes the durable base for later
Community discovery.

## Current slice

1. Let a signed-in trader save a Community profile from `/account/profile`.
2. Use their Discord username as the displayed Community identity; the existing
   stable Community handle remains the URL identifier.
3. Let the trader add an optional 180-character description, select up to six
   profile tags, and choose whether their Community profile is visible.
4. Show a visible author's description in the compact watchlist profile area.
   Profile tags remain search data and do not appear on a watchlist card.
5. Store profile follows separately from watchlist follows. A viewer can follow
   or unfollow a visible profile, and both the owner account page and public
   Community profile show follower/following totals.

## Boundaries

- A profile follow is not a watchlist follow. No profile-follow notification is
  sent in this slice.
- No Journal, broker, account, performance, subscriber ranking, or private
  Discord data is exposed.
- The profile page remains inside the signed-in dashboard boundary. Search,
  public indexing, recommended people, and follower notifications are later
  work.
- The actual list of followers/following can grow into dedicated Community
  profile sections later. This first slice records truthful counts and the
  durable relationship without inventing social activity.
