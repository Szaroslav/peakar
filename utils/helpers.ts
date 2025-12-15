import bearing from "@turf/bearing";
import { point } from "@turf/helpers";
import { MapPoint, RenderablePeak } from "@/models/map";

export const toRad = (deg: number) => (deg * Math.PI) / 180;
export const toDeg = (rad: number) => (rad * 180) / Math.PI;

export function getBearingDifference(
  location: MapPoint | null,
  heading: number,
  peak: RenderablePeak,
): number {
  if (!location) return 0;

  const userPoint = point([location.longitude, location.latitude]);
  const peakPoint = point([peak.longitude, peak.latitude]);
  const rawBearing = bearing(userPoint, peakPoint);
  let diff = rawBearing - heading;
  const normalizedDiff = ((diff + 540) % 360) - 180;
  console.log(
    `Raw bearing to peak ${peak.name}: ${rawBearing} diff: ${diff} normalizedDiff: ${normalizedDiff}`,
  );
  return Math.abs(normalizedDiff);
}
