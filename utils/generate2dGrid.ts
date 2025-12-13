import { bbox } from "@turf/bbox";
import { buffer } from "@turf/buffer";
import { point } from "@turf/helpers";
import { pointGrid } from "@turf/point-grid";

import { LatLng } from "@/models/map";

/**
 * Generate a 2D grid of geographical points around a center point.
 * @param center - center point
 * @param opts - optional options
 * @param opts.size - optional size of the grid in meters (default: 10000)
 * @param opts.density - optional number of points along one side (default: 50)
 * @returns grid of geographical points
 */
export function generate2dGrid(
  center: LatLng,
  opts: { size?: number; density?: number } = {},
): LatLng[] {
  const { latitude, longitude } = center;
  const { size = 10000, density = 50 } = opts;

  const c = point([longitude, latitude]);
  const area = buffer(c, size / 2, { units: "meters" })!;
  const bounds = bbox(area);
  const grid = pointGrid(bounds, size / density, { units: "meters" });

  return grid.features.map((f) => ({
    latitude: f.geometry.coordinates[1],
    longitude: f.geometry.coordinates[0],
  }));
}
