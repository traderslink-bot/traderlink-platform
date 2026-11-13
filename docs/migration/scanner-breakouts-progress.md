# Scanner Breakouts

Breakouts occupies the open slot beside Market Events. It uses existing scanner
snapshots and the current trading date's premarket high. The first qualifying
regular-hours observation above that level adds one row. Further observations
update the same row and preserve its original level and detection time. The
card keeps the 30 most recent detections for the trading date. The feed
enriches Breakouts with the same country and recent news data as other cards.

QA passed on desktop and mobile stacked and tabbed layouts using fixture data.
All three display modes showed the level and status and could open the chart
drawer. Browser QA verified that a move below the level updated the existing
table row. The focused engine tests also covered a reclaim, a missing level,
out-of-order prices and the date rollover. Production deployment is pending.
