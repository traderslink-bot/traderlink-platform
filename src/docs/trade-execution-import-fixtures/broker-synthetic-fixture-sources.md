# Broker Synthetic Fixture Sources

These CSVs are synthetic and contain no user data. They are based on public
broker export/help references and generic order-history concepts.

- `webull-partial-cancel-synthetic.csv`: inferred from Webull public help that
  order records can be exported as CSV plus Webull API fields for order id,
  status, filled quantity, filled price, and filled time.
- `moomoo-partial-fills-synthetic.csv`: inferred from public Moomoo trade-history
  descriptions and conservative columns already accepted by the app:
  `Date of Trade`, `Instrument Code`, `Transaction Type`, `Filled Quantity`,
  and `Average Price`.
- `schwab-mixed-activity-synthetic.csv`: inferred from Schwab transaction export
  column descriptions and public parser references using `Date`, `Action`,
  `Symbol`, `Description`, `Quantity`, `Price`, `Fees & Comm`, and `Amount`.
