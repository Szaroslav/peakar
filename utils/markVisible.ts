import { MapPoint } from "@/models/map";

/**
 * Calculate visibility from center, interpolating along lines to each point
 * @param center center MapPoint
 * @param userHeight height of observer above center elevation
 * @param points list of MapPoints
 */
export function calculateVisibilityLineOfSight(
  center: MapPoint,
  userHeight: number,
  points: MapPoint[][],
): MapPoint[][] {
  const result: MapPoint[][] = points.map((arc) =>
    arc.map((p) => ({ ...p, isVisible: false })),
  );

  const distance = (a: MapPoint, b: MapPoint): number => {
    return Math.sqrt(
      (a.latitude - b.latitude) ** 2 + (a.longitude - b.longitude) ** 2,
    );
  };

  type LinearFunction =
    | { vertical: true; x: number }
    | { vertical: false; a: number; b: number };

  const getLinearFunction = (
    pointA: MapPoint,
    pointB: MapPoint,
  ): LinearFunction => {
    const dx = pointB.longitude - pointA.longitude;
    if (dx === 0) {
      return { vertical: true, x: pointA.longitude };
    }
    let a = (pointB.latitude - pointA.latitude) / dx;
    let b = pointA.latitude - a * pointA.longitude;
    return { vertical: false, a, b };
  };

  const interpolateElevation = (
    a: MapPoint,
    b: MapPoint,
    c: MapPoint,
    d: MapPoint,
  ): MapPoint => {
    const lf1 = getLinearFunction(a, b);
    const lf2 = getLinearFunction(c, d);

    let x: number;
    let y: number;
    if (lf1.vertical) {
      x = lf1.x;
      if (lf2.vertical) throw new Error("Both lines vertical.");
      y = lf2.a * x + lf2.b;
    } else if (lf2.vertical) {
      x = lf2.x;
      y = lf1.a * x + lf1.b;
    } else {
      const { a: a1, b: b1 } = lf1;
      const { a: a2, b: b2 } = lf2;

      if (a1 === a2) throw new Error("Parallel lines — no intersection.");

      x = (b2 - b1) / (a1 - a2);
      y = a1 * x + b1;
    }
    const result = {
      latitude: y,
      longitude: x,
      elevation: 0,
      isVisible: false,
    };
    let abDistance = distance(a, b);
    let aResultDistance = distance(a, result);
    let t: number = abDistance === 0 ? 0 : aResultDistance / abDistance;
    const elevation = a.elevation + t * (b.elevation - a.elevation);
    result.elevation = elevation;
    return result;
  };

  const shadows = (
    middle: MapPoint,
    dest: MapPoint,
    center: MapPoint,
    height: number = 0,
  ): boolean => {
    const x2 = distance(center, dest);
    const b = center.elevation + height;
    const a = (dest.elevation - b) / x2;
    const distanceToMiddle = distance(center, middle);
    return a * distanceToMiddle + b < middle.elevation;
  };

  const findNearestPoints = (
    point: MapPoint,
    arcs: MapPoint[],
  ): [MapPoint, MapPoint] => {
    if (arcs.length === 0) {
      throw new Error("No points in arcs");
    }

    let nearest: MapPoint | null = null;
    let secondNearest: MapPoint | null = null;
    let nearestDist = Infinity;
    let secondNearestDist = Infinity;

    for (const p of arcs) {
      const d = distance(point, p);

      if (d < nearestDist) {
        secondNearest = nearest;
        secondNearestDist = nearestDist;
        nearest = p;
        nearestDist = d;
      } else if (d < secondNearestDist) {
        secondNearest = p;
        secondNearestDist = d;
      }
    }

    if (!secondNearest) {
      secondNearest = nearest!;
    }

    return [nearest!, secondNearest!];
  };

  result[0].forEach((p) => (p.isVisible = true));
  for (let arcIndex = 1; arcIndex < result.length; arcIndex++) {
    let visibleCount = 0;
    for (let p of result[arcIndex]) {
      for (let innerArc = 0; innerArc < arcIndex; innerArc++) {
        const [pointA, pointB] = findNearestPoints(p, result[innerArc]);
        let interpolatedPoint = interpolateElevation(pointA, pointB, p, center);
        if (!shadows(interpolatedPoint, p, center, userHeight)) {
          visibleCount++;
          p.isVisible = true;
        } else {
          p.isVisible = false;
          break;
        }
      }
    }
    if (visibleCount === 0) break;
  }
  return result;
}
