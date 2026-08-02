export const syntheticIbkrStatement = [
  "Statement,Header,Field Name,Field Value",
  'Statement,Data,Period,"January 1, 2026 - January 31, 2026"',
  "Account Information,Header,Field Name,Field Value",
  "Account Information,Data,Account,SYNTH-ACCOUNT",
  "Trades,Header,DataDiscriminator,Asset Category,Currency,Symbol,Date/Time,Quantity,T. Price,Comm/Fee,TradeID",
  'Trades,Data,Order,Stocks,USD,ALPHA,"2026-01-05, 09:30:00",100,10.0000,-1.25,SYNTH-FILL-1',
  'Trades,Data,Order,Stocks,USD,ALPHA,"2026-01-05, 10:30:00",-100,10.5,,SYNTH-FILL-2',
  'Trades,Data,Order,Forex,USD,EUR.USD,"2026-01-06, 11:00:00",1000,1.1,,SYNTH-FX-1',
  "Mark-to-Market Performance Summary,Header,Asset Category,Currency,Symbol,Prior Quantity,Current Quantity",
  "Mark-to-Market Performance Summary,Data,Stocks,USD,ALPHA,0,0",
  "Open Positions,Header,DataDiscriminator,Asset Category,Currency,Symbol,Quantity",
  "Open Positions,Data,Summary,Stocks,USD,BETA,25",
].join("\r\n");
