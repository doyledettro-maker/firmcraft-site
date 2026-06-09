// Geometry helpers. PostgREST casts an EWKT string written into a geometry column
// via Postgres's text input for `geometry`, so we can denormalize a point by
// passing "SRID=4326;POINT(lng lat)" without a server-side ST_* call.

export function pointEwkt(lng: number, lat: number): string {
  return `SRID=4326;POINT(${lng} ${lat})`;
}

// Pulls lng/lat out of a customer/job address jsonb ({..., lat, lng}) and returns
// EWKT, or null if coordinates are absent.
export function ewktFromAddress(address: unknown): string | null {
  if (address && typeof address === "object") {
    const a = address as Record<string, unknown>;
    const lat = typeof a.lat === "number" ? a.lat : Number(a.lat);
    const lng = typeof a.lng === "number" ? a.lng : Number(a.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return pointEwkt(lng, lat);
    }
  }
  return null;
}

// Haversine distance in kilometers between two lat/lng points.
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
