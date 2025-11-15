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
  points: MapPoint[][]
): MapPoint[][] {
  const result: MapPoint[][] = points.map(arc =>
    arc.map(p => ({ ...p, isVisible: false }))
  );

  const distance = (a: MapPoint, b: MapPoint): number => {
    return Math.sqrt((a.latitude - b.latitude) ** 2 + (a.longitude - b.longitude) ** 2);
  }

  const getLinearFunction = (pointA: MapPoint, pointB: MapPoint) => {
    let a = (pointB.latitude - pointA.latitude) / (pointB.longitude - pointA.longitude);
    let b = pointA.latitude - a * pointA.longitude;
    return [a, b];
  }

  const interpolateElevation = (
    a: MapPoint,
    b: MapPoint,
    c: MapPoint,
    d: MapPoint,
  ): MapPoint => {
    const [a1, b1] = getLinearFunction(a, b);
    const [a2, b2] = getLinearFunction(c, d);
    const x = (b2 - b1) / (a1 - a2);
    const y = a1 * x + b1;
    const t = (x - a.longitude) / (b.longitude - a.longitude)
    const elevation = a.elevation + t * (b.elevation - a.elevation)
    const result: MapPoint = { longitude: x, latitude: y, elevation: elevation, isVisible: false };
    return result;
  }

  const shadows = (    
    middle: MapPoint,
    dest: MapPoint,
    center: MapPoint,
    height: number = 0
  ): boolean => {
    const x1 = 0;
    const x2 = distance(center, dest);
    const b = center.elevation + height;
    const a = (dest.elevation - b) / x2;
    const distanceToMiddle = distance(center, middle);
    return a*distanceToMiddle + b < middle.elevation;
  };

  result[0].forEach(p => p.isVisible = true);
  for (let arcIndex = 1; arcIndex < result.length; arcIndex++) {
    let visibleCount = 0;
    for (let p of result[arcIndex]) {
        let skip = false
        for (let innerArc = 0; innerArc < arcIndex; innerArc++) {
            const sorted = [...result[innerArc]].sort(
                (a, b) => distance(p, a) - distance(p, b)
            );
            const pointA = sorted[0];
            const pointB = sorted[1] ?? sorted[0];
            if (!pointA.isVisible && !pointB.isVisible){
                skip = true;
                p.isVisible = false;
                continue;
            }
            let interpolatedPoint = interpolateElevation(pointA, pointB, p, center); 
            if (!shadows(interpolatedPoint, p, center, userHeight)) {
                visibleCount++;
                p.isVisible = true
            } else {
                p.isVisible = false;
                skip = true;
            }
        }
        if (skip) continue;
    }
    if (visibleCount === 0) break;
  }
  return result;
}
