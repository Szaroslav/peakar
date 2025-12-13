export type LatLng = { latitude: number; longitude: number };

export interface Bbox {
  min: LatLng;
  max: LatLng;
}
