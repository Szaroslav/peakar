import { ElevationResponse } from "../models/elevation";

const BASE_URL = "https://api.open-elevation.com/api/v1";

export async function getElevation(lat: number, lng: number): Promise<number> {
  const url = `${BASE_URL}/lookups?locations=${lat},${lng}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch elevation");
  }

  const data: ElevationResponse = await response.json();
  return data.results[0].elevation;
}

export async function getElevationPath(points: { latitude: number; longitude: number }[]) {
  const locations = points
    .map((p) => `${p.latitude},${p.longitude}`)
    .join("|");

  const url = `${BASE_URL}/lookups?locations=${locations}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch elevation");

  const data: ElevationResponse = await response.json();
  return data.results;
}
