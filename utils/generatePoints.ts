import { LatLng } from "@/models/map";

/**
 * Generate points in forward cone with uniform density
 * @param center center location
 * @param heading heading in degrees (0 = North, 90 = East, 180 = South, 270 = West)
 * @param maxPoints total number of points
 * @param maxDistance max radius in meters
 * @param angle forward cone angle in degrees
 */
export function generateNearbyPoints(
  center: LatLng,
  heading: number = 0,
  maxPoints: number = 100,
  maxDistance: number = 5000,
  angle: number = 180,
): LatLng[][] {
  const arcs: LatLng[][] = [];
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = (lat: number) => {
    const R = 6371000;
    const latRad = (lat * Math.PI) / 180;
    return (Math.PI / 180) * R * Math.cos(latRad);
  };

  const sectorArea = (angle / 360) * Math.PI * maxDistance * maxDistance;
  const d = Math.sqrt(sectorArea / maxPoints);
  const arcCount = Math.max(1, Math.ceil(maxDistance / d));
  const radiusStep = maxDistance / arcCount;

  for (let arc = 1; arc <= arcCount; arc++) {
    const radius = radiusStep * arc;
    const arcLength = (angle / 360) * 2 * Math.PI * radius;
    const pointsInArc = Math.max(1, Math.round(arcLength / d));

    const startAngle = heading - angle / 2;
    const step = pointsInArc > 1 ? angle / (pointsInArc - 1) : 0;
    const arcPoints: LatLng[] = [];

    for (let i = 0; i < pointsInArc; i++) {
      const pointAngle = startAngle + step * i;
      const rad = (pointAngle * Math.PI) / 180;
      const deltaLat = (radius * Math.cos(rad)) / metersPerDegreeLat;
      const deltaLng =
        (radius * Math.sin(rad)) / metersPerDegreeLng(center.latitude);

      arcPoints.push({
        latitude: center.latitude + deltaLat,
        longitude: center.longitude + deltaLng,
      });
    }
    arcs.push(arcPoints);
  }

  return arcs;
}
