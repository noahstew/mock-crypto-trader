export const CURRENCIES = ['USD', 'BTC-USD', 'ETH-USD'] as const;
export type Currency = (typeof CURRENCIES)[number];
export function isCurrency(v: unknown): v is Currency {
  return typeof v === 'string' && (CURRENCIES as readonly string[]).includes(v);
}
