export type MembershipFeatureCopy = Readonly<{ brief: string; details: string }>;

const COPY: Readonly<Record<string, readonly [string, string]>> = {
  "watchlist.levels": ["Read Watchlist support, resistance and the full ladder.", "Access the Potential Path levels included by this plan. Ticker-specific restrictions still apply; this permission does not expose otherwise restricted tickers or analysis."],
  "private_watchlist.access": ["Keep your own private ticker list.", "Add and organize tickers in your personal Watchlist, separate from the shared group list. Analysis, indicators, levels and generation allowances can be included independently."],
  "private_watchlist.analysis": ["Read analysis generated for your private tickers.", "Use the private analysis card where your plan permits it. Generation limits and budgets apply separately; generated content supports research and can be incorrect."],
  "private_watchlist.indicators": ["Read indicator cards for your private tickers.", "Review available trend, momentum, volume and volatility context. Indicator access does not grant analysis access or remove generation allowances."],
  "private_watchlist.levels": ["Read levels generated for your private tickers.", "View the available support, resistance and ladder for your personal tickers. This does not grant access to restricted levels on the shared Watchlist."],
  "private_watchlist.ticker_additions": ["Add tickers within your plan's allowance.", "The displayed allowance applies to additions and reactivations during its configured period. Adding an already active ticker does not consume another addition."],
  "private_watchlist.active_tickers": ["Keep up to your allowance of active tickers.", "This limit applies to tickers currently active in your private Watchlist. Archiving frees an active slot without deleting saved results."],
  "private_watchlist.generations": ["Generate cards within your plan's allowance.", "Generation requests reserve allowance before work begins. In-flight or uncertain requests remain reserved so retries cannot silently create duplicate usage."],
  "private_watchlist.cost_microusd": ["Keep private generation within your plan's budget.", "A verified maximum cost is reserved before provider work. Confirmed usage replaces that reservation; uncertain work stays reserved until reconciled. Budget periods are set by the owner."],
  "dashboard.access": ["Your home for trading review and account tools.", "Open the dashboard and the tools included in your plan. Individual modules and usage allowances are listed separately."],
  "journal.access": ["Keep your trading records and review your trades.", "Organize your recorded executions, trades, notes and reviews. Your private trading data stays separate from other members."],
  "journal.accounts": ["Organize trading activity into separate accounts.", "Use separate Journal accounts for the trading records you want to keep apart. The allowance shown on this plan controls how many you can create."],
  "journal.imports": ["Bring supported broker statements into your Journal.", "Upload a supported statement to import execution records. Review any Data Decisions that need your confirmation; unsupported formats are not silently treated as valid trades."],
  "journal.manual_entry": ["Record trades you enter yourself.", "Capture executions with their actual date, time, quantity and price. Manual entries and supported imports belong to the same Journal ledger."],
  "analytics.access": ["Explore patterns in your recorded trading results.", "Review performance across the available dates, tickers and trading groupings. Analytics reflects your recorded data and its coverage, not a promise of future results."],
  "analytics.trade_explorer": ["Look closely at individual completed trades.", "Open a trade to review its executions, result, notes and associated analysis where included. Separate feature permissions still apply."],
  "analytics.exports": ["Take supported reports out of the app.", "Use the reporting and export options available for your account. Available content depends on your recorded data and the supported export formats."],
  "ai.reviews": ["Use AI-assisted reviews of your trading activity.", "Review generated observations alongside your own records. AI output can be incomplete or incorrect and is not investment advice; verify important details yourself."],
  "ai.chat": ["Discuss your trading review with an AI assistant.", "Ask questions and explore the information available to the assistant. Review suggested changes before confirming them; chat access does not grant access to other members' private records."],
  "academy.access": ["Explore trading education at your own pace.", "Work through the available Academy lessons and track your progress. Educational material is for learning, not personalized investment advice."],
  "watchlist.access": ["Browse the shared Watchlist.", "View the main Watchlist and its available ticker summaries. Ticker detail pages and trade analysis are separate features that a plan can include independently."],
  "watchlist.ticker_details": ["Open detailed pages for Watchlist tickers.", "Go beyond the main list to the ticker's available detail view. Trade analysis and preparation require their own included feature."],
  "watchlist.trade_analysis": ["Read trade analysis and preparation cards.", "Review the available setup context, levels and preparation notes on Watchlist tickers. This material supports your own research and is not a recommendation to trade."],
  "trade_analyzer.analyses": ["Generate analysis for your recorded trades.", "Use the Trade Analyzer allowance shown on this plan. The displayed allowance and reset period determine how many analyses are available."],
  "levels.generations": ["Generate price-level maps for your research.", "Use the Levels Generator up to the allowance shown on this plan. Generated levels are research tools, not guaranteed price outcomes."],
  "community.access": ["Use the community features included in your plan.", "Access eligible community areas. Individual server and role requirements can still apply, and community membership never automatically shares your private Journal."],
  "coaching.access": ["Access the coaching features included in your offer.", "Review the offer for the coaching services, scheduling and availability provided. Access alone does not promise a particular number of sessions; Journal sharing remains your choice."],
  "broker.connections": ["Connect supported broker accounts.", "Use supported broker connections up to the allowance shown. Provider availability and authorization requirements still apply."],
  "news.access": ["Read news in your dashboard.", "Browse the available dashboard news without needing notification access. Your plan's news visibility delay determines when newly received articles become available."],
  "news.visibility_delay_seconds": ["See when dashboard news becomes available to you.", "The displayed delay starts at the later of app ingestion and publication. Immediate means no plan-imposed delay. This setting does not change public website news."],
  "news.notification_delay_seconds": ["Choose a plan with the news-alert timing you need.", "The displayed delay applies to press-release notifications, independently of dashboard visibility. Delivery also depends on your notification preferences, device and delivery service."],
  "notifications.access": ["Enable notification categories included in your plan.", "This is the overall notification permission. Individual categories can be included separately, and you choose which available notifications to turn on."],
  "notifications.watchlist": ["Receive eligible shared Watchlist updates.", "Choose available Watchlist email and push notifications. Ticker access is checked before queueing and sending; private or restricted tickers are not revealed by notifications. This does not enable notifications for your personal private Watchlist."],
  "notifications.market_halt": ["Receive eligible market-halt notifications.", "Enable halt alerts on a supported subscribed device. Availability depends on the incoming halt feed and your saved preferences; delivery is not guaranteed to be instantaneous."],
  "notifications.press_release": ["Receive notifications for selected news channels.", "Choose your available press-release channels in notification settings. Your plan's notification delay applies; Dashboard news reading is a separate feature."],
  "notifications.ai_review": ["Get updates about your AI Reviews.", "Enable the available AI Review notifications through supported delivery channels. This notification permission does not itself include AI Review generation."],
  "notifications.broker_connection": ["Know when a broker connection needs attention.", "Receive supported connection-status notifications for your account, according to your saved delivery preferences."],
  "notifications.broker_import": ["Follow updates about broker imports.", "Receive supported broker-import status notifications. Import access and the broker data itself are controlled separately."],
  "notifications.chart_update": ["Get notified about available chart updates.", "Receive supported chart-update notifications related to your account. Separate chart and data-access permissions still apply."],
  "notifications.data_decision": ["Know when trading data needs your review.", "Receive supported Data Decision notifications. You remain responsible for confirming factual corrections from your trading records."],
  "notifications.market_news": ["Receive Week Ahead news notifications.", "Get supported Week Ahead updates through the delivery channels you enable. These updates are informational and do not provide personalized investment advice."],
  "notifications.statement_import": ["Get updates about uploaded statements.", "Receive supported statement-import notifications, including updates that help you follow processing or review work."],
};

export function defaultMembershipFeatureCopy(key: string, label: string): MembershipFeatureCopy {
  const copy = Object.hasOwn(COPY, key) ? COPY[key] : undefined;
  return copy ? { brief: copy[0], details: copy[1] } : {
    brief: `${label} is included with this plan.`,
    details: "The plan's displayed permissions and allowances apply. Contact the owner for more information about this feature.",
  };
}
