export interface ElevationPoint {
  latitude: number;
  longitude: number;
  elevation: number;
}

export interface ElevationResponse {
  results: ElevationPoint[];
}
