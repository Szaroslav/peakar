import { LatLng, MapPoint } from "@/models/map";

/**
 * Calculate visibility from center, interpolating along lines to each point
 * @param center center MapPoint
 * @param userHeight height of observer above center elevation
 * @param points list of MapPoints
 */
export function calculateVisibilityLineOfSight(
  center: MapPoint,
  userHeight: number,
  points: MapPoint[]
): MapPoint[] {
    // This function would contain the logic to calculate visibility from center
    // Arc points are not alingned so this would interpolate along lines to each point
    return points;
}