export type LatLng = { latitude: number; longitude: number };

export interface MapPoint extends LatLng {
  elevation: number;
  isVisible: boolean;
}

export interface ElevationResponse {
  results: MapPoint[];
}
