import { distance } from "@turf/distance";
import { lineString } from "@turf/helpers";
import { lineChunk } from "@turf/line-chunk";

import { LatLng, MapPoint, Peak, RenderablePeak } from "@/models/map";
import { getElevations } from "@/services/elevationApi";

const MAX_ELEVATION_API_POINTS_PER_REQUEST = 15000;
const ELEVATION_API_RATE_LIMIT_MS = 1000;

interface Opts {
  observerHeight?: number;
  lineSegmentLength?: number;
}

/**
 * Check if peak is visible from center point given, taking into account
 * intermediate points.
 *
 * @param peak - peak to check visibility for
 * @param intermediatePoints - points between center and peak (inclusive)
 * @param center - center point
 * @param opts - options
 * @param opts.observerHeight
 *  height of observer above center elevation in meters
 * @param opts.lineSegmentLength
 *  length of line segments connecting center and peaks in meters
 * @returns true if the peak is visible from the center point, false otherwise
 */
function isPeakVisible(
  peak: Peak,
  intermediatePoints: MapPoint[],
  center: MapPoint,
  opts: Required<Opts>,
): boolean {
  const { observerHeight, lineSegmentLength } = opts;
  const c = [center.longitude, center.latitude];

  const distanceToPeak = distance(c, [peak.longitude, peak.latitude], {
    units: "meters",
  });
  const relativePeakElevation =
    peak.elevation - (center.elevation + observerHeight);

  const a = relativePeakElevation / distanceToPeak;
  const b = center.elevation + observerHeight;

  const f = (x: number) => a * x + b;

  for (let i = 0; i < intermediatePoints.length; i++) {
    const { elevation } = intermediatePoints[i];
    const distanceToIntermediate = (i + 1) * lineSegmentLength;
    if (elevation >= f(distanceToIntermediate)) return false;
  }

  return true;
}

/**
 * Calculate visibility from center, interpolating along lines to each point
 *
 * @param center - center point
 * @param peaks - list of peaks
 * @param opts - options
 * @param opts.observerHeight
 *  height of observer above center elevation in meters (default: 0.0)
 * @param opts.lineSegmentLength
 *  length of line segments connecting center and peaks in meters (default: 500)
 * @returns list of renderable peaks with visibility info
 */
export async function transformToRenderablePeaks(
  center: MapPoint,
  peaks: Peak[],
  opts: Opts = {},
): Promise<RenderablePeak[]> {
  const { observerHeight = 0.0, lineSegmentLength = 500 } = opts;

  const lines: LatLng[][] = peaks.map((p) => {
    const centerPos = [center.longitude, center.latitude];
    const peakPos = [p.longitude, p.latitude];

    const line = lineString([centerPos, peakPos]);
    const segmentedLine = lineChunk(line, lineSegmentLength, {
      units: "meters",
    });

    return segmentedLine.features.slice(1, -1).map((segment) => ({
      latitude: segment.geometry.coordinates[0][1],
      longitude: segment.geometry.coordinates[0][0],
    }));
  });

  const nPoints = lines.reduce((sum, line) => sum + line.length, 0);

  // Chunk lines to avoid too many points in one request
  const chunkedLines: LatLng[][] = [];
  let nProcessedPoints = 0;
  let nProcessedLines = 0;
  while (nProcessedPoints < nPoints) {
    const chunk: LatLng[] = [];
    let chunkPoints = 0;

    while (
      chunkPoints < MAX_ELEVATION_API_POINTS_PER_REQUEST &&
      lines[nProcessedLines]
    ) {
      const line = lines[nProcessedLines];
      if (chunkPoints + line.length > MAX_ELEVATION_API_POINTS_PER_REQUEST)
        break;
      chunk.push(...line);
      chunkPoints += line.length;
      nProcessedLines++;
    }

    chunkedLines.push(chunk);
    nProcessedPoints += chunkPoints;
  }

  const elevs: MapPoint[] = [];
  for (const chunk of chunkedLines) {
    const es = await getElevations(chunk);
    elevs.push(...es);
    await new Promise((resolve) =>
      setTimeout(resolve, ELEVATION_API_RATE_LIMIT_MS),
    ); // Force rate limit
  }

  let elevIndex = 0;
  const elevations: MapPoint[][] = lines.map((line) => {
    const lineElevs = elevs.slice(elevIndex, elevIndex + line.length);
    elevIndex += line.length;
    return lineElevs;
  });

  return peaks.map((peak, i) => {
    const isVisible = isPeakVisible(peak, elevations[i], center, {
      observerHeight,
      lineSegmentLength,
    });
    return { ...peak, isVisible };
  });
}
