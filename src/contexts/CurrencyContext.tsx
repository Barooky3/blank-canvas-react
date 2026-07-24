import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export type Currency = 
  | 'EUR' | 'GBP' | 'USD' | 'CHF' | 'SEK' | 'DKK' | 'NOK' | 'ISK'
  | 'PLN' | 'CZK' | 'HUF' | 'RON' | 'HRK' | 'TRY' | 'RUB' | 'UAH'
  | 'CAD' | 'MXN' | 'BRL' | 'ARS' | 'CLP' | 'COP' | 'PEN'
  | 'JPY' | 'KRW' | 'CNY' | 'INR' | 'THB' | 'VND' | 'IDR' | 'MYR' | 'SGD' | 'PHP' | 'AED' | 'SAR'
  | 'AUD' | 'NZD' | 'ZAR' | 'EGP' | 'MAD' | 'NGN';

interface CurrencyInfo {
  code: Currency;
  symbol: string;
  rate: number; // relative to EUR
  locale: string;
}

// All currencies mapped to checkout countries
// Rates are EUR -> currency (i.e. 1 EUR = rate units of currency). Updated 2026-05-26.
export const CURRENCIES: CurrencyInfo[] = [
  // Europe
  { code: 'EUR', symbol: '€', rate: 1, locale: 'nl-NL' },
  { code: 'GBP', symbol: '£', rate: 0.864, locale: 'en-GB' },
  { code: 'CHF', symbol: 'CHF', rate: 0.914, locale: 'de-CH' },
  { code: 'SEK', symbol: 'kr', rate: 10.82, locale: 'sv-SE' },
  { code: 'DKK', symbol: 'kr', rate: 7.47, locale: 'da-DK' },
  { code: 'NOK', symbol: 'kr', rate: 10.77, locale: 'nb-NO' },
  { code: 'PLN', symbol: 'zł', rate: 4.23, locale: 'pl-PL' },
  { code: 'CZK', symbol: 'Kč', rate: 24.26, locale: 'cs-CZ' },
  { code: 'HUF', symbol: 'Ft', rate: 355, locale: 'hu-HU' },
  { code: 'RON', symbol: 'lei', rate: 5.24, locale: 'ro-RO' },

  { code: 'HRK', symbol: 'kn', rate: 7.53, locale: 'hr-HR' },
  { code: 'ISK', symbol: 'kr', rate: 143.6, locale: 'is-IS' },
  { code: 'TRY', symbol: '₺', rate: 53.4, locale: 'tr-TR' },
  { code: 'RUB', symbol: '₽', rate: 83.7, locale: 'ru-RU' },
  { code: 'UAH', symbol: '₴', rate: 51.5, locale: 'uk-UA' },
  // North America
  { code: 'USD', symbol: '$', rate: 1.163, locale: 'en-US' },
  { code: 'CAD', symbol: 'C$', rate: 1.607, locale: 'en-CA' },
  { code: 'MXN', symbol: 'MX$', rate: 20.11, locale: 'es-MX' },
  // South America
  { code: 'BRL', symbol: 'R$', rate: 5.84, locale: 'pt-BR' },
  { code: 'ARS', symbol: 'ARS', rate: 1638, locale: 'es-AR' },
  { code: 'CLP', symbol: 'CLP', rate: 1043, locale: 'es-CL' },
  { code: 'COP', symbol: 'COP', rate: 4244, locale: 'es-CO' },
  { code: 'PEN', symbol: 'S/', rate: 3.96, locale: 'es-PE' },
  // Asia
  { code: 'JPY', symbol: '¥', rate: 185, locale: 'ja-JP' },
  { code: 'KRW', symbol: '₩', rate: 1751, locale: 'ko-KR' },
  { code: 'CNY', symbol: '¥', rate: 7.89, locale: 'zh-CN' },
  { code: 'INR', symbol: '₹', rate: 111.3, locale: 'en-IN' },
  { code: 'THB', symbol: '฿', rate: 38.0, locale: 'th-TH' },
  { code: 'VND', symbol: '₫', rate: 30416, locale: 'vi-VN' },
  { code: 'IDR', symbol: 'Rp', rate: 20749, locale: 'id-ID' },
  { code: 'MYR', symbol: 'RM', rate: 4.61, locale: 'ms-MY' },
  { code: 'SGD', symbol: 'S$', rate: 1.49, locale: 'en-SG' },
  { code: 'PHP', symbol: '₱', rate: 71.6, locale: 'en-PH' },
  { code: 'AED', symbol: 'د.إ', rate: 4.27, locale: 'ar-AE' },
  { code: 'SAR', symbol: 'ر.س', rate: 4.36, locale: 'ar-SA' },
  // Oceania
  { code: 'AUD', symbol: 'A$', rate: 1.624, locale: 'en-AU' },
  { code: 'NZD', symbol: 'NZ$', rate: 1.99, locale: 'en-NZ' },
  // Africa
  { code: 'ZAR', symbol: 'R', rate: 19.03, locale: 'en-ZA' },
  { code: 'EGP', symbol: 'E£', rate: 60.8, locale: 'ar-EG' },
  { code: 'MAD', symbol: 'MAD', rate: 10.69, locale: 'ar-MA' },
  { code: 'NGN', symbol: '₦', rate: 1582, locale: 'en-NG' },
];

// Map country codes (ISO 3166-1 alpha-2) to currency codes for geolocation
const COUNTRY_CODE_CURRENCY_MAP: Record<string, Currency> = {
  // Europe - EUR
  NL: 'EUR', BE: 'EUR', DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR',
  AT: 'EUR', PT: 'EUR', FI: 'EUR', IE: 'EUR', LU: 'EUR', GR: 'EUR',
  SK: 'EUR', SI: 'EUR', EE: 'EUR', LV: 'EUR', LT: 'EUR', HR: 'EUR',
  RS: 'EUR', XK: 'EUR', ME: 'EUR', BA: 'EUR', AD: 'EUR', MC: 'EUR', SM: 'EUR',
  // Europe - other currencies
  GB: 'GBP', CH: 'CHF', SE: 'SEK', DK: 'DKK', NO: 'NOK', IS: 'ISK',
  PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON', BG: 'EUR',
  TR: 'TRY', RU: 'RUB', UA: 'UAH',
  // North America
  US: 'USD', CA: 'CAD', MX: 'MXN',
  // South America
  BR: 'BRL', AR: 'ARS', CL: 'CLP', CO: 'COP', PE: 'PEN',
  // Asia
  JP: 'JPY', KR: 'KRW', CN: 'CNY', IN: 'INR', TH: 'THB',
  VN: 'VND', ID: 'IDR', MY: 'MYR', SG: 'SGD', PH: 'PHP',
  AE: 'AED', SA: 'SAR', IQ: 'USD',
  // Oceania
  AU: 'AUD', NZ: 'NZD', FJ: 'USD',
  // Africa
  ZA: 'ZAR', EG: 'EGP', MA: 'MAD', NG: 'NGN',
  ZW: 'USD',
};

// Map country names to their currency codes
export const COUNTRY_CURRENCY_MAP: Record<string, Currency> = {
  'Netherlands': 'EUR', 'Belgium': 'EUR', 'Germany': 'EUR', 'France': 'EUR',
  'Spain': 'EUR', 'Italy': 'EUR', 'Austria': 'EUR', 'Portugal': 'EUR',
  'Finland': 'EUR', 'Ireland': 'EUR', 'Luxembourg': 'EUR', 'Greece': 'EUR',
  'Slovakia': 'EUR', 'Slovenia': 'EUR', 'Estonia': 'EUR', 'Latvia': 'EUR', 'Lithuania': 'EUR',
  'Croatia': 'EUR',
  'United Kingdom': 'GBP',
  'Switzerland': 'CHF',
  'Sweden': 'SEK', 'Denmark': 'DKK', 'Norway': 'NOK', 'Iceland': 'ISK',
  'Poland': 'PLN', 'Czech Republic': 'CZK', 'Hungary': 'HUF',
  'Romania': 'RON', 'Bulgaria': 'EUR',
  'Serbia': 'EUR',
  'Kosovo': 'EUR', 'Belarus': 'EUR', 'Georgia': 'EUR', 'Armenia': 'EUR', 'Azerbaijan': 'EUR', 'San Marino': 'EUR',
  'Turkey': 'TRY', 'Russia': 'RUB', 'Ukraine': 'UAH',
  'United States': 'USD', 'Canada': 'CAD', 'Mexico': 'MXN',
  'Brazil': 'BRL', 'Argentina': 'ARS', 'Chile': 'CLP', 'Colombia': 'COP', 'Peru': 'PEN',
  'Paraguay': 'USD', 'Bolivia': 'USD', 'Venezuela': 'USD',
  'Dominican Republic': 'USD', 'Jamaica': 'USD', 'Trinidad and Tobago': 'USD', 'Barbados': 'USD',
  'Curaçao': 'EUR', 'Suriname': 'EUR',
  'Japan': 'JPY', 'South Korea': 'KRW', 'China': 'CNY', 'India': 'INR',
  'Thailand': 'THB', 'Vietnam': 'VND', 'Indonesia': 'IDR', 'Malaysia': 'MYR',
  'Singapore': 'SGD', 'Philippines': 'PHP',
  'United Arab Emirates': 'AED', 'Saudi Arabia': 'SAR', 'Iraq': 'USD',
  'Sri Lanka': 'USD', 'Nepal': 'USD', 'Cambodia': 'USD', 'Myanmar': 'USD', 'Macao': 'USD',
  'Australia': 'AUD', 'New Zealand': 'NZD', 'Fiji': 'USD',
  'South Africa': 'ZAR', 'Egypt': 'EGP', 'Morocco': 'MAD', 'Nigeria': 'NGN',
  'Zimbabwe': 'USD',
  'Algeria': 'EUR', 'Senegal': 'EUR', 'Ivory Coast': 'EUR', 'Cameroon': 'EUR',
  'Tanzania': 'USD', 'Ethiopia': 'USD', 'Mauritius': 'USD',
};

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (priceInEur: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const stored = localStorage.getItem('profparfums-currency');
    return (stored as Currency) || 'EUR';
  });

  // Auto-detect currency based on user's location (only on first visit)
  useEffect(() => {
    const stored = localStorage.getItem('profparfums-currency');
    if (stored) return; // User already has a preference

    const applyCountry = (countryCode?: string | null) => {
      if (!countryCode) return false;
      const cc = countryCode.toUpperCase();
      if (COUNTRY_CODE_CURRENCY_MAP[cc]) {
        const detected = COUNTRY_CODE_CURRENCY_MAP[cc];
        setCurrencyState(detected);
        localStorage.setItem('profparfums-currency', detected);
        return true;
      }
      return false;
    };

    // Multi-provider geo lookup with timezone fallback for maximum accuracy
    const detectCurrency = async () => {
      // Provider list — each returns an ISO alpha-2 country code
      const providers: Array<() => Promise<string | null>> = [
        async () => {
          const r = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
          if (!r.ok) return null;
          const d = await r.json();
          return d?.country_code || null;
        },
        async () => {
          const r = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(4000) });
          if (!r.ok) return null;
          const d = await r.json();
          return d?.country_code || null;
        },
        async () => {
          const r = await fetch('https://get.geojs.io/v1/ip/country.json', { signal: AbortSignal.timeout(4000) });
          if (!r.ok) return null;
          const d = await r.json();
          return d?.country || null;
        },
        async () => {
          const r = await fetch('https://api.country.is/', { signal: AbortSignal.timeout(4000) });
          if (!r.ok) return null;
          const d = await r.json();
          return d?.country || null;
        },
      ];

      for (const provider of providers) {
        try {
          const cc = await provider();
          if (applyCountry(cc)) return;
        } catch {
          // try next provider
        }
      }

      // Final fallback: derive country from browser timezone
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        const tzCountry: Record<string, string> = {
          'Europe/Sofia': 'BG', 'Europe/Berlin': 'DE', 'Europe/Paris': 'FR',
          'Europe/London': 'GB', 'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE',
          'Europe/Madrid': 'ES', 'Europe/Rome': 'IT', 'Europe/Vienna': 'AT',
          'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ', 'Europe/Budapest': 'HU',
          'Europe/Bucharest': 'RO', 'Europe/Athens': 'GR', 'Europe/Helsinki': 'FI',
          'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO', 'Europe/Copenhagen': 'DK',
          'Europe/Dublin': 'IE', 'Europe/Lisbon': 'PT', 'Europe/Zurich': 'CH',
          'Europe/Zagreb': 'HR', 'Europe/Ljubljana': 'SI', 'Europe/Bratislava': 'SK',
          'Europe/Tallinn': 'EE', 'Europe/Riga': 'LV', 'Europe/Vilnius': 'LT',
          'Europe/Belgrade': 'RS', 'Europe/Sarajevo': 'BA', 'Europe/Skopje': 'MK',
          'Europe/Podgorica': 'ME', 'Europe/Tirane': 'AL', 'Europe/Chisinau': 'MD',
          'Europe/Kiev': 'UA', 'Europe/Kyiv': 'UA', 'Europe/Istanbul': 'TR',
          'Europe/Moscow': 'RU', 'America/New_York': 'US', 'America/Chicago': 'US',
          'America/Denver': 'US', 'America/Los_Angeles': 'US', 'America/Phoenix': 'US',
          'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Mexico_City': 'MX',
          'America/Sao_Paulo': 'BR', 'America/Argentina/Buenos_Aires': 'AR',
          'America/Bogota': 'CO', 'America/Lima': 'PE', 'America/Santiago': 'CL',
          'Asia/Tokyo': 'JP', 'Asia/Shanghai': 'CN', 'Asia/Seoul': 'KR',
          'Asia/Dubai': 'AE', 'Asia/Riyadh': 'SA', 'Asia/Kolkata': 'IN',
          'Asia/Singapore': 'SG', 'Asia/Bangkok': 'TH', 'Asia/Jakarta': 'ID',
          'Asia/Manila': 'PH', 'Africa/Cairo': 'EG', 'Africa/Johannesburg': 'ZA',
          'Africa/Lagos': 'NG', 'Africa/Casablanca': 'MA',
          'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Pacific/Auckland': 'NZ',
        };
        applyCountry(tzCountry[tz]);
      } catch {
        // keep EUR default
      }
    };

    detectCurrency();
  }, []);


  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('profparfums-currency', c);
  };

  const formatPrice = useCallback((priceInEur: number) => {
    const info = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
    const converted = priceInEur * info.rate;
    const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND', 'IDR', 'CLP', 'COP', 'HUF', 'ISK'];
    const isZeroDecimal = zeroDecimalCurrencies.includes(info.code);
    const finalPrice = priceInEur === 0 ? 0 : (isZeroDecimal ? converted : Math.floor(converted) + 0.99);
    return new Intl.NumberFormat(info.locale, {
      style: 'currency',
      currency: info.code,
      minimumFractionDigits: isZeroDecimal ? 0 : 2,
      maximumFractionDigits: isZeroDecimal ? 0 : 2,
    }).format(finalPrice);
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
