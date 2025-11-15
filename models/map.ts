export type LatLng = { latitude: number; longitude: number };

export interface MapPoint extends LatLng {
  elevation: number;
  isVisible?: boolean | undefined;
}

export interface ElevationResponse {
  results: MapPoint[];
}
