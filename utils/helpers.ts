import { bearing as bearingBetween } from "@turf/bearing";
import { point } from "@turf/helpers";

import { MapPoint, RenderablePeak } from "@/models/map";

export const toRad = (deg: number) => (deg * Math.PI) / 180;
export const toDeg = (rad: number) => (rad * 180) / Math.PI;

export function mod(x: number, m: number): number {
  return ((x % m) + m) % m;
}

export function smallestAngleDiff(angle1: number, angle2: number): number {
  return mod(angle2 - angle1 + 180, 360) - 180;
}

export function getBearingDifference(
  location: MapPoint | null,
  heading: number,
  peak: RenderablePeak,
): number {
  if (!location) return 0;

  const userPoint = point([location.longitude, location.latitude]);
  const peakPoint = point([peak.longitude, peak.latitude]);
  const rawBearing = bearingBetween(userPoint, peakPoint);
  const bearing = (rawBearing + 360) % 360;
  const smallestDiff = smallestAngleDiff(heading, bearing);

  console.log(
    `Raw bearing to peak ${peak.name}: ${bearing} diff: ${smallestDiff}`,
  );

  return smallestDiff;
}
