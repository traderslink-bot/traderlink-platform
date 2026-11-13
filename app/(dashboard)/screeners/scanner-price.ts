const subDollar = new Intl.NumberFormat("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const dollars = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });

export function scannerPriceNumber(price: number) {
  return (Math.abs(price) < 1 ? subDollar : dollars).format(price);
}

export function scannerPrice(price: number) {
  return `$${scannerPriceNumber(price)}`;
}
