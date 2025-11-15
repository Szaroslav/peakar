export type LatLng = { latitude: number; longitude: number };

export function generateNearbyPoints(
  center: LatLng,
  heading: number = 0,
  count: number = 4,
  maxOffset: number = 0.006
): LatLng[] {
    // Heading values
    // 0 = North
    // 90 = East
    // 180 = South
    // 270 = West
  const points: LatLng[] = [
    { latitude: center.latitude + 0.006, longitude: center.longitude + 0.001 },
    { latitude: center.latitude - 0.001, longitude: center.longitude - 0.001 },
    { latitude: center.latitude + 0.002, longitude: center.longitude - 0.001 },
    { latitude: center.latitude - 0.002, longitude: center.longitude + 0.002 },
    { latitude: center.latitude - 0.002, longitude: center.longitude + 0.006 },
  ];

  return points;
}
