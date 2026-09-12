export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
  { code: "AED", name: "UAE Dirham", symbol: "AED", flag: "🇦🇪" },
  { code: "THB", name: "Thai Baht", symbol: "฿", flag: "🇹🇭" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$", flag: "🇨🇦" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", flag: "🇮🇩" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", flag: "🇲🇾" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫", flag: "🇻🇳" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", flag: "🇨🇭" },
  { code: "SAR", name: "Saudi Riyal", symbol: "SAR", flag: "🇸🇦" },
];

// Offline fallback rates relative to USD
const FALLBACK_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  INR: 86.50,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
  THB: 34.50,
  SGD: 1.34,
  JPY: 152.0,
  CAD: 1.39,
  AUD: 1.54,
  IDR: 15800.0,
  MYR: 4.45,
  VND: 25400.0,
  CHF: 0.88,
  SAR: 3.75,
};

class CurrencyService {
  private ratesCache: Record<string, Record<string, number>> = {};
  private lastFetchTime: number = 0;

  public async getExchangeRate(from: string, to: string): Promise<number> {
    const fromClean = from.toUpperCase();
    const toClean = to.toUpperCase();

    if (fromClean === toClean) return 1.0;

    try {
      const rates = await this.getRates(fromClean);
      if (rates && rates[toClean]) {
        return rates[toClean];
      }
    } catch {
      // Fallback
    }

    const fromRate = FALLBACK_RATES_TO_USD[fromClean] || 1.0;
    const toRate = FALLBACK_RATES_TO_USD[toClean] || 1.0;
    return toRate / fromRate;
  }

  public async convert(amount: number, from: string, to: string): Promise<number> {
    const rate = await this.getExchangeRate(from, to);
    return Number((amount * rate).toFixed(2));
  }

  public convertSync(amount: number, from: string, to: string): number {
    const fromClean = from.toUpperCase();
    const toClean = to.toUpperCase();
    if (fromClean === toClean) return amount;

    if (this.ratesCache[fromClean]?.[toClean]) {
      return Number((amount * this.ratesCache[fromClean][toClean]).toFixed(2));
    }

    const fromRate = FALLBACK_RATES_TO_USD[fromClean] || 1.0;
    const toRate = FALLBACK_RATES_TO_USD[toClean] || 1.0;
    return Number(((amount / fromRate) * toRate).toFixed(2));
  }

  public getSymbol(code: string): string {
    const found = SUPPORTED_CURRENCIES.find(c => c.code.toUpperCase() === code.toUpperCase());
    return found ? found.symbol : code;
  }

  public getFlag(code: string): string {
    const found = SUPPORTED_CURRENCIES.find(c => c.code.toUpperCase() === code.toUpperCase());
    return found ? found.flag : "🌐";
  }

  private async getRates(base: string): Promise<Record<string, number>> {
    const now = Date.now();
    if (this.ratesCache[base] && (now - this.lastFetchTime < 2 * 60 * 60 * 1000)) {
      return this.ratesCache[base];
    }

    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`, {
      next: { revalidate: 3600 },
    });
    
    if (!res.ok) throw new Error(`FX fetch failed with status ${res.status}`);
    const data = await res.json();
    const rates = data.rates || data.conversion_rates || {};
    this.ratesCache[base] = rates;
    this.lastFetchTime = now;
    return rates;
  }
}

export const currencyService = new CurrencyService();
