import { ElevationResponse, LatLng, MapPoint } from "../models/map";

const BASE_URL = "https://api.open-elevation.com/api/v1/lookup";

// Fetch elevation for one location
export async function getElevation(lat: number, lng: number): Promise<number> {
  const body = {
    locations: [{ latitude: lat, longitude: lng }],
  };

  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error("Failed to fetch elevation");

  const data: ElevationResponse = await response.json();
  return data.results[0].elevation ?? -1;
}

// Fetch elevation for many locations
export async function getElevations(points: LatLng[]): Promise<MapPoint[]> {
  const body = {
    locations: points,
  };

  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error("Failed to fetch elevation");

  const data: ElevationResponse = await response.json();
  return data.results;
}
