export const CURRENCY = {
  USD: 'USD',
  BTC_USD: 'BTC-USD',
  ETH_USD: 'ETH-USD',
} as const;
export type CurrencyKey = keyof typeof CURRENCY;
export type CurrencyValue = (typeof CURRENCY)[CurrencyKey];
