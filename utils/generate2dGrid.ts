import { bbox } from "@turf/bbox";
import { buffer } from "@turf/buffer";
import { point } from "@turf/helpers";
import { pointGrid } from "@turf/point-grid";

import { LatLng } from "@/models/coordinates";

export function generate2dGrid(
  { latitude, longitude }: LatLng,
  { radius = 5000, nPoints = 100 }: { radius?: number; nPoints?: number } = {},
): LatLng[] {
  const center = point([longitude, latitude]);
  const area = buffer(center, radius, { units: "meters" })!;
  const bounds = bbox(area);
  const grid = pointGrid(bounds, radius / nPoints, { units: "meters" });

  return grid.features.map((f) => ({
    latitude: f.geometry.coordinates[1],
    longitude: f.geometry.coordinates[0],
  }));
}
