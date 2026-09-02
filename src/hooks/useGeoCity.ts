import { useQuery } from '@tanstack/react-query';

type GeoResult = { city: string | null; region: string | null };

/**
 * Detects the visitor's approximate city/region from their IP using the same
 * public providers already used for currency detection. City-level IP geo is
 * approximate — good enough for light content targeting, not identity.
 */
async function fetchGeoCity(): Promise<GeoResult> {
  const providers: Array<() => Promise<GeoResult | null>> = [
    async () => {
      const r = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
      if (!r.ok) return null;
      const d = await r.json();
      return { city: d?.city ?? null, region: d?.region ?? null };
    },
    async () => {
      const r = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(4000) });
      if (!r.ok) return null;
      const d = await r.json();
      return { city: d?.city ?? null, region: d?.region ?? null };
    },
    async () => {
      const r = await fetch('https://get.geojs.io/v1/ip/geo.json', { signal: AbortSignal.timeout(4000) });
      if (!r.ok) return null;
      const d = await r.json();
      return { city: d?.city ?? null, region: d?.region ?? null };
    },
  ];

  for (const provider of providers) {
    try {
      const res = await provider();
      if (res && (res.city || res.region)) return res;
    } catch {
      // try next provider
    }
  }
  return { city: null, region: null };
}

const normalize = (s: string | null | undefined) => (s || '').toLowerCase().replace(/[^a-z]/g, '');

export function useGeoCity() {
  const { data } = useQuery({
    queryKey: ['geo-city'],
    queryFn: fetchGeoCity,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const city = data?.city ?? null;
  const region = data?.region ?? null;

  // Manual override for testing/previewing: ?geo=portlaoise forces on, ?geo=other forces off.
  let override: boolean | null = null;
  if (typeof window !== 'undefined') {
    const g = new URLSearchParams(window.location.search).get('geo');
    if (g) override = normalize(g) === 'portlaoise';
  }

  // Portlaoise (also spelled "Port Laoise"), County Laois, Ireland.
  const normCity = normalize(city);
  const detected =
    normCity === 'portlaoise' || normCity === 'portlaois' || normCity === 'portlaoighise';

  const isPortlaoise = override ?? detected;

  return { city, region, isPortlaoise };
}
