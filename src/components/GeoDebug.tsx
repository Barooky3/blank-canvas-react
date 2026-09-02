import { useGeoCity } from '@/hooks/useGeoCity';

/**
 * Diagnostic overlay for location targeting. Only renders when the URL contains
 * ?geodebug=1 — shows what the IP-geo providers report for this visitor so we
 * can tune the Portlaoise match. Not shown to normal visitors.
 */
export function GeoDebug() {
  const { city, region, isPortlaoise } = useGeoCity();

  const show =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('geodebug') === '1';

  if (!show) return null;

  return (
    <div
      className="fixed bottom-3 left-3 z-[9999] rounded-md border border-border bg-background/95 px-3 py-2 text-xs shadow-lg backdrop-blur"
      role="status"
    >
      <div className="font-mono">
        <div>city: <span className="font-semibold">{city ?? '—'}</span></div>
        <div>region: <span className="font-semibold">{region ?? '—'}</span></div>
        <div>
          isPortlaoise:{' '}
          <span className={isPortlaoise ? 'text-green-500 font-semibold' : 'text-red-500 font-semibold'}>
            {String(isPortlaoise)}
          </span>
        </div>
      </div>
    </div>
  );
}
