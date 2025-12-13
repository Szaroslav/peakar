import { bbox } from "@turf/bbox";
import { buffer } from "@turf/buffer";
import { distance } from "@turf/distance";
import { point } from "@turf/helpers";

import type { LatLng, Peak } from "@/models/map";
import { OverpassResponse } from "@/validators/map";

const BASE_URL = "https://overpass-api.de/api/interpreter";

async function fetchOpenStreetMapData(query: string) {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) throw new Error("Failed to fetch Overpass Turbo data");

  const responseData = await response.json();
  const data = OverpassResponse.parse(responseData);

  return data;
}

/**
 * Get peaks in area around center point.
 * @param center - center point to get peaks around
 * @param radius - radius in meters
 * @returns list of peaks within the given area
 */
export async function getPeaksInArea(
  center: LatLng,
  radius: number = 10000,
): Promise<Peak[]> {
  const { latitude, longitude } = center;

  const c = point([longitude, latitude]);
  const circleArea = buffer(c, radius, { units: "meters", steps: 2 })!;
  const bounds = bbox(circleArea);

  const query = `
    [out:json][timeout:25];

    (
      node["natural"="peak"]($area);
      way["natural"="peak"]($area);
      relation["natural"="peak"]($area);
    );

    out body;
    >;
    out skel qt;
  `.replaceAll("$area", `${bounds[1]},${bounds[0]},${bounds[3]},${bounds[2]}`);

  const { elements: peaks } = await fetchOpenStreetMapData(query);

  return peaks
    .filter(
      (peak) =>
        peak.tags.ele &&
        peak.tags.name &&
        distance(c, [peak.lon, peak.lat]) <= radius,
    )
    .map(({ lat: latitude, lon: longitude, tags }) => ({
      name: tags.name!,
      latitude,
      longitude,
      elevation: tags.ele!,
    }));
}
