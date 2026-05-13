/**
 * Zero-dependency Haversine utility for nearest-ward lookup.
 * Returns the ward ID closest to the given lat/lng.
 */

type WardWithCenter = {
  id: string;
  centerLat: number | null;
  centerLng: number | null;
};

/** Haversine distance in km between two points */
function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth radius in km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Find the closest ward to the given coordinates.
 * Wards missing centerLat/centerLng are skipped.
 * Returns the ward ID or null if no valid wards exist.
 */
export function findNearestWardId(
  lat: number,
  lng: number,
  wards: WardWithCenter[]
): string | null {
  let bestId: string | null = null;
  let bestDist = Infinity;

  for (const w of wards) {
    if (w.centerLat == null || w.centerLng == null) continue;
    const d = haversineKm(lat, lng, Number(w.centerLat), Number(w.centerLng));
    if (d < bestDist) {
      bestDist = d;
      bestId = w.id;
    }
  }

  return bestId;
}
