import { ElevationResponse, LatLng } from "@/models/map";

const BASE_URL = "https://api.open-elevation.com/api/v1/lookup";

async function fetchElevationData(
  locations: LatLng[],
): Promise<ElevationResponse> {
  const body = { locations };

  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error("Failed to fetch elevation");

  return response.json();
}

// Fetch elevation for one location
export async function getElevation(lat: number, lng: number): Promise<number> {
  const data = await fetchElevationData([{ latitude: lat, longitude: lng }]);
  return data.results[0].elevation ?? -1;
}

// Fetch elevation for many locations
export async function getElevations(points: LatLng[]) {
  const data = await fetchElevationData(points);
  return data.results;
}
