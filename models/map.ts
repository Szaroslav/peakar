export type LatLng = { latitude: number; longitude: number };

export interface MapPoint extends LatLng {
  elevation: number;
}

export interface Peak extends MapPoint {
  name: string;
}

export interface RenderablePeak extends Peak {
  isVisible: boolean;
}

export interface ElevationResponse {
  results: MapPoint[];
}
